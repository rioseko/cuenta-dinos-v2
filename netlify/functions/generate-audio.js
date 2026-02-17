const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:8888']
const AUDIO_RATE_LIMIT_STORE_KEY = '__audioRateLimitStore'

const audioRateLimitStore = globalThis[AUDIO_RATE_LIMIT_STORE_KEY] || new Map()
globalThis[AUDIO_RATE_LIMIT_STORE_KEY] = audioRateLimitStore

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

const buildAudioHeaders = ({ origin, strict, originAllowed }) => {
  const headers = {
    'Content-Type': 'audio/mpeg',
    'Cache-Control': 'public, max-age=3600'
  }

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

  const maxRequestsPerMinute = Number.parseInt(process.env.RATE_LIMIT_AUDIO_PER_MIN || '20', 10)
  const rateLimit = checkRateLimit({
    store: audioRateLimitStore,
    key: getClientIp(event),
    limit: Number.isFinite(maxRequestsPerMinute) ? maxRequestsPerMinute : 20,
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
    const { text } = JSON.parse(event.body || '{}')
    const format = event.queryStringParameters?.format || 'json'

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Text is required' })
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

    const userId = 'eleven-labs'
    const appId = 'audio-generation'
    const modelId = 'speech-synthesis'
    const versionId = 'f2cead3a965f4c419a61a4a9b501095c'
    
    const clarifaiUrl = `https://api.clarifai.com/v2/users/${userId}/apps/${appId}/models/${modelId}/versions/${versionId}/outputs`
    
    console.log('Calling Clarifai (ElevenLabs) API:', clarifaiUrl)
    console.log('Text length:', text.length, 'chars')

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
              raw: text 
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
      
      console.error('Clarifai (ElevenLabs) API error:', {
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
    
    if (!clarifaiData.outputs || !clarifaiData.outputs[0] || !clarifaiData.outputs[0].data || !clarifaiData.outputs[0].data.audio) {
      console.error('Unexpected Clarifai response structure:', JSON.stringify(clarifaiData, null, 2))
      return {
        statusCode: 502,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'Invalid upstream response' })
      }
    }

    const audioBase64 = clarifaiData.outputs[0].data.audio.base64
    
    if (!audioBase64) {
      console.error('No audio base64 in response:', clarifaiData)
      return {
        statusCode: 502,
        headers: jsonHeaders,
        body: JSON.stringify({ error: 'No audio data available' })
      }
    }

    console.log('Audio generated successfully, size:', (audioBase64.length / 1024).toFixed(2), 'KB')

    if (format === 'binary') {
      return {
        statusCode: 200,
        headers: buildAudioHeaders({
          origin: requestOrigin,
          strict: strictSecurity,
          originAllowed
        }),
        body: audioBase64,
        isBase64Encoded: true
      }
    }

    const audioSizeKB = audioBase64.length / 1024

    if (audioSizeKB > 5000) {
      return {
        statusCode: 413,
        headers: jsonHeaders,
        body: JSON.stringify({ 
          error: 'Payload Too Large',
          message: 'Audio file exceeds size limit. Please use chunk mode.',
          sizeKB: audioSizeKB.toFixed(2)
        })
      }
    }

    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        audioBase64: audioBase64,
        audioUrl: `data:audio/mpeg;base64,${audioBase64}`
      })
    }
  } catch (error) {
    console.error('Error in generate-audio:', error)
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: 'Error generating audio' })
    }
  }
}
