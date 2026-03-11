const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:8888']
const STORY_RATE_LIMIT_STORE_KEY = '__storyRateLimitStore'

const storyRateLimitStore = globalThis[STORY_RATE_LIMIT_STORE_KEY] || new Map()
globalThis[STORY_RATE_LIMIT_STORE_KEY] = storyRateLimitStore

const STORY_WORD_COUNT_MIN = 250
const STORY_WORD_COUNT_MAX = 300
const FORBIDDEN_STORY_START = 'había una vez'
const FORBIDDEN_NAMES = ['tito', 'pipo', 'dino', 'lolo']

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

const normalizeStory = (value) => value.replace(/\r\n/g, '\n').trim()

const countWords = (value) => {
  const matches = value.match(/\S+/g)
  return matches ? matches.length : 0
}

const hasHeadingLikeFirstLine = (value) => {
  const [firstLine = ''] = value.split('\n')
  const trimmedFirstLine = firstLine.trim()

  if (!trimmedFirstLine) return false
  if (trimmedFirstLine.endsWith(':')) return true
  if (trimmedFirstLine.startsWith('#')) return true

  return value.includes('\n') && trimmedFirstLine.length <= 80
}

const getFirstSentence = (value) => {
  const match = value.match(/(.+?[.!?])(?:\s|$)/)
  return match ? match[1].trim() : value.trim()
}

const validateStory = (story) => {
  const normalizedStory = normalizeStory(story)

  if (!normalizedStory) {
    return { valid: false, reason: 'empty_story' }
  }

  const lowerCaseStory = normalizedStory.toLowerCase()

  if (lowerCaseStory.startsWith(FORBIDDEN_STORY_START)) {
    return { valid: false, reason: 'forbidden_start' }
  }

  if (hasHeadingLikeFirstLine(normalizedStory)) {
    return { valid: false, reason: 'heading_detected' }
  }

  const wordCount = countWords(normalizedStory)

  if (wordCount < STORY_WORD_COUNT_MIN || wordCount > STORY_WORD_COUNT_MAX) {
    return { valid: false, reason: 'invalid_length', wordCount }
  }

  const firstSentence = getFirstSentence(normalizedStory).toLowerCase()

  if (FORBIDDEN_NAMES.some((name) => firstSentence.includes(name))) {
    return { valid: false, reason: 'forbidden_name_in_intro' }
  }

  return { valid: true, story: normalizedStory, wordCount }
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

  const maxRequestsPerMinute = Number.parseInt(process.env.RATE_LIMIT_STORY_PER_MIN || '10', 10)
  const rateLimit = checkRateLimit({
    store: storyRateLimitStore,
    key: getClientIp(event),
    limit: Number.isFinite(maxRequestsPerMinute) ? maxRequestsPerMinute : 10,
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
    const { dinosaur, style, lesson } = JSON.parse(event.body || '{}')

    if (!dinosaur || !style || !lesson) {
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    if (!process.env.CLARIFAI_API_KEY || !process.env.CLARIFAI_USER_ID || !process.env.CLARIFAI_APP_ID) {
      console.error('Missing Clarifai environment variables')
      return {
        statusCode: 500,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Service unavailable' })
      }
    }

    const prompt = `Escribe un cuento corto para niños de entre ${STORY_WORD_COUNT_MIN} y ${STORY_WORD_COUNT_MAX} palabras en español sobre un dinosaurio ${dinosaur}. El cuento debe ser de estilo ${style} y enseñar la lección de ${lesson}.

Debe ser apropiado para niños de 3 a 8 años:
- Usa oraciones cortas y vocabulario simple.
- Evita palabras difíciles o técnicas.
- Incluye algunos diálogos.
- Describe las emociones del dinosaurio.
- Muestra cómo aprende la lección.

El dinosaurio debe tener un nombre creativo o inventado, diferente en cada cuento.
Evita nombres comunes como Tito, Pipo, Dino o Lolo.
El nombre del dinosaurio debe aparecer en la primera oración del cuento.

El cuento debe seguir esta estructura:
- Inicio con presentación del dinosaurio.
- Un pequeño problema o desafío.
- Una búsqueda o intento de solución.
- Resolución del problema.
- Final feliz con una lección aprendida.

Evita comenzar el cuento con "Había una vez".
NO incluyas títulos, encabezados ni separadores. Devuelve únicamente el texto del cuento.`

    const modelId = process.env.CLARIFAI_MODEL_ID || 'GPT-4'
    const modelVersionId = process.env.CLARIFAI_MODEL_VERSION_ID || ''
    const generationParams = {
      temperature: 0.95,
      top_p: 0.95,
      max_tokens: 420
    }
    
    const baseUrl = `https://api.clarifai.com/v2/users/${encodeURIComponent(process.env.CLARIFAI_USER_ID)}/apps/${encodeURIComponent(process.env.CLARIFAI_APP_ID)}/models/${encodeURIComponent(modelId)}`
    const clarifaiUrl = modelVersionId 
      ? `${baseUrl}/versions/${encodeURIComponent(modelVersionId)}/outputs`
      : `${baseUrl}/outputs`
    
    console.log('Calling Clarifai API:', clarifaiUrl)

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
      } catch (e) {
        errorDetails = await clarifaiResponse.text()
      }
      
      console.error('Clarifai API error:', {
        status: clarifaiResponse.status,
        statusText: clarifaiResponse.statusText,
        details: errorDetails
      })

      return {
        statusCode: 502,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Upstream service error' })
      }
    }

    const clarifaiData = await clarifaiResponse.json()
    
    if (!clarifaiData.outputs || !clarifaiData.outputs[0] || !clarifaiData.outputs[0].data || !clarifaiData.outputs[0].data.text) {
      console.error('Unexpected Clarifai response structure:', clarifaiData)
      return {
        statusCode: 502,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Invalid upstream response' })
      }
    }

    const story = clarifaiData.outputs[0].data.text.raw
    const validation = validateStory(story)

    if (!validation.valid) {
      console.error('Generated story failed validation:', {
        reason: validation.reason,
        wordCount: validation.wordCount
      })
    }

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ story: validation.valid ? validation.story : normalizeStory(story) })
    }
  } catch (error) {
    console.error('Error in generate-story:', error)
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Error generating story' })
    }
  }
}
