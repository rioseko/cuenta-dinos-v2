const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:8888']
const IMAGE_RATE_LIMIT_STORE_KEY = '__imageRateLimitStore'

const imageRateLimitStore = globalThis[IMAGE_RATE_LIMIT_STORE_KEY] || new Map()
globalThis[IMAGE_RATE_LIMIT_STORE_KEY] = imageRateLimitStore

const getHeader = (event, headerName) => {
  const headers = event.headers || {}
  return headers[headerName] || headers[headerName.toLowerCase()] || headers[headerName.toUpperCase()] || ''
}

const normalizeOrigin = (origin) => {
  if (!origin) return ''

  try {
    return new URL(origin).origin
  } catch (_error) {
    return ''
  }
}

const parseAllowedOrigins = (value) => {
  if (!value) return []

  return value
    .split(',')
    .map((item) => normalizeOrigin(item.trim()))
    .filter(Boolean)
}

const buildAllowedOrigins = (event) => {
  const fromEnv = parseAllowedOrigins(process.env.ALLOWED_ORIGINS)
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host')
  const hostOrigins = host ? [normalizeOrigin(`https://${host}`), normalizeOrigin(`http://${host}`)] : []
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv, ...hostOrigins].filter(Boolean))]
}

const isNetlifyPreviewOrigin = (origin) => {
  if (!origin) return false

  try {
    const hostname = new URL(origin).hostname
    return hostname.endsWith('.netlify.app')
  } catch (_error) {
    return false
  }
}

const isOriginAllowed = ({ origin, strict, allowPreviews, allowedOrigins }) => {
  if (!strict) return true
  if (!origin) return false
  if (allowedOrigins.includes(origin)) return true
  if (allowPreviews && isNetlifyPreviewOrigin(origin)) return true
  return false
}

const buildJsonHeaders = ({ origin, strict, originAllowed }) => {
  const headers = { 'Content-Type': 'application/json' }

  if (!strict) {
    headers['Access-Control-Allow-Origin'] = origin || '*'
    headers.Vary = 'Origin'
    return headers
  }

  if (originAllowed && origin) {
    headers['Access-Control-Allow-Origin'] = origin
    headers.Vary = 'Origin'
  }

  return headers
}

const getClientIp = (event) => {
  const forwardedFor = getHeader(event, 'x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return getHeader(event, 'client-ip') || 'unknown'
}

const checkRateLimit = ({ store, key, limit, windowMs }) => {
  const now = Date.now()
  const current = store.get(key)

  if (!current || now > current.resetAt) {
    const next = { count: 1, resetAt: now + windowMs }
    store.set(key, next)
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
    }
  }

  current.count += 1
  return { allowed: true, remaining: Math.max(0, limit - current.count), retryAfterSeconds: 0 }
}

const buildImageSummaryPrompt = (story) => `Lee este cuento infantil en español y conviértelo en un prompt visual breve y específico para generar una sola ilustración relacionada con la escena principal del cuento.

Instrucciones:
- Devuelve solo un prompt visual final, sin explicaciones.
- Máximo 80 palabras.
- Describe únicamente una escena principal clara.
- Incluye el dinosaurio protagonista, su emoción principal, el entorno y la acción más importante.
- El resultado debe orientar una imagen con estilo de dibujo animado, infantil, colorido, agradable, tierno y apropiado para niños.
- Prioriza una estética cálida, expresiva, simpática y fácil de entender para un niño pequeño.
- No incluyas texto dentro de la imagen.
- No uses comillas, títulos ni encabezados.

Cuento:
${story}`

const buildFinalImagePrompt = (summaryPrompt) => `${summaryPrompt}. Estilo de ilustración infantil, cálido, colorido, mágico, amigable, muy expresivo, composición limpia, alta calidad, sin texto ni letras.`

const getImageUrlFromOutput = (output) => {
  const imageData = output?.data?.image || null

  if (!imageData) return ''
  if (imageData.url) return imageData.url
  if (imageData.base64) return `data:image/png;base64,${imageData.base64}`

  return ''
}

const getTextOutput = (clarifaiData) => clarifaiData?.outputs?.[0]?.data?.text?.raw?.trim() || ''

const summarizeStoryToImagePrompt = async (story) => {
  const prompt = buildImageSummaryPrompt(story)
  const modelId = process.env.CLARIFAI_MODEL_ID || 'GPT-4'
  const modelVersionId = process.env.CLARIFAI_MODEL_VERSION_ID || ''
  const generationParams = {
    temperature: 0.4,
    top_p: 0.9,
    max_tokens: 180
  }

  const baseUrl = `https://api.clarifai.com/v2/users/${encodeURIComponent(process.env.CLARIFAI_USER_ID)}/apps/${encodeURIComponent(process.env.CLARIFAI_APP_ID)}/models/${encodeURIComponent(modelId)}`
  const clarifaiUrl = modelVersionId
    ? `${baseUrl}/versions/${encodeURIComponent(modelVersionId)}/outputs`
    : `${baseUrl}/outputs`

  console.log('Calling Clarifai summary API:', clarifaiUrl)

  const clarifaiResponse = await fetch(clarifaiUrl, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Key ${process.env.CLARIFAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_app_id: {
        user_id: process.env.CLARIFAI_USER_ID,
        app_id: process.env.CLARIFAI_APP_ID
      },
      model: {
        model_version: {
          output_info: {
            params: generationParams
          }
        }
      },
      inputs: [{
        data: {
          text: {
            raw: prompt
          }
        }
      }]
    })
  })

  if (!clarifaiResponse.ok) {
    let errorDetails
    try {
      errorDetails = await clarifaiResponse.json()
    } catch (_error) {
      errorDetails = await clarifaiResponse.text()
    }

    console.error('Clarifai summary API error:', {
      status: clarifaiResponse.status,
      statusText: clarifaiResponse.statusText,
      details: errorDetails
    })

    throw new Error('Failed to summarize story for image generation')
  }

  const clarifaiData = await clarifaiResponse.json()
  const summaryPrompt = getTextOutput(clarifaiData)

  if (!summaryPrompt) {
    console.error('Unexpected Clarifai summary response structure:', clarifaiData)
    throw new Error('Invalid summary response')
  }

  return buildFinalImagePrompt(summaryPrompt)
}

export const handler = async (event) => {
  const strictSecurity = process.env.SECURITY_STRICT === 'true'
  const allowNetlifyPreviews = process.env.ALLOW_NETLIFY_PREVIEWS !== 'false'
  const requestOrigin = normalizeOrigin(getHeader(event, 'origin'))
  const allowedOrigins = buildAllowedOrigins(event)
  const originAllowed = isOriginAllowed({
    origin: requestOrigin,
    strict: strictSecurity,
    allowPreviews: allowNetlifyPreviews,
    allowedOrigins
  })

  const jsonHeaders = buildJsonHeaders({
    origin: requestOrigin,
    strict: strictSecurity,
    originAllowed
  })

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        ...jsonHeaders,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    }
  }

  if (strictSecurity && !originAllowed) {
    return {
      statusCode: 403,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Forbidden origin' })
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  const maxRequestsPerMinute = Number.parseInt(process.env.RATE_LIMIT_IMAGE_PER_MIN || '5', 10)
  const rateLimit = checkRateLimit({
    store: imageRateLimitStore,
    key: getClientIp(event),
    limit: Number.isFinite(maxRequestsPerMinute) ? maxRequestsPerMinute : 5,
    windowMs: 60 * 1000
  })

  if (!rateLimit.allowed) {
    return {
      statusCode: 429,
      headers: {
        ...jsonHeaders,
        'Retry-After': String(rateLimit.retryAfterSeconds)
      },
      body: JSON.stringify({ error: 'Too many requests' })
    }
  }

  try {
    const { story } = JSON.parse(event.body || '{}')

    if (!story || story.trim().length === 0) {
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Story is required' })
      }
    }

    if (!process.env.CLARIFAI_API_KEY) {
      console.error('Missing CLARIFAI_API_KEY environment variable')
      return {
        statusCode: 500,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Service unavailable' })
      }
    }

    if (!process.env.CLARIFAI_USER_ID || !process.env.CLARIFAI_APP_ID) {
      console.error('Missing Clarifai user/app environment variables')
      return {
        statusCode: 500,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Service unavailable' })
      }
    }

    const imagePrompt = await summarizeStoryToImagePrompt(story.trim())
    const userId = 'qwen'
    const appId = 'image-model'
    const modelId = 'Qwen-Image-2512'
    const versionId = '46a7d258c23a43ba96fd8f9a94ad97c1'
    const clarifaiUrl = `https://api.clarifai.com/v2/models/${modelId}/versions/${versionId}/outputs`

    console.log('Calling Clarifai Qwen image API:', clarifaiUrl)
    console.log('Prompt length:', imagePrompt.length, 'chars')

    const clarifaiResponse = await fetch(clarifaiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Key ${process.env.CLARIFAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_app_id: {
          user_id: userId,
          app_id: appId
        },
        inputs: [{
          data: {
            text: {
              raw: imagePrompt
            }
          }
        }]
      })
    })

    if (!clarifaiResponse.ok) {
      let errorDetails
      try {
        errorDetails = await clarifaiResponse.json()
      } catch (_error) {
        errorDetails = await clarifaiResponse.text()
      }

      console.error('Clarifai image API error:', {
        status: clarifaiResponse.status,
        statusText: clarifaiResponse.statusText,
        details: errorDetails
      })

      return {
        statusCode: 502,
        headers: jsonHeaders,
        body: JSON.stringify({
          error: 'Upstream service error',
          details: errorDetails
        })
      }
    }

    const clarifaiData = await clarifaiResponse.json()
    const output = clarifaiData?.outputs?.[0] || null
    const imageUrl = getImageUrlFromOutput(output)

    if (!imageUrl) {
      console.error('Unexpected Clarifai image response structure:', clarifaiData)
      return {
        statusCode: 502,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Invalid upstream response' })
      }
    }

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        imageUrl
      })
    }
  } catch (error) {
    console.error('Error in generate-image:', error)
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Error generating image' })
    }
  }
}
