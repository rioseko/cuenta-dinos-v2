export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { text } = JSON.parse(event.body)
    const format = event.queryStringParameters?.format || 'json'

    if (!text || text.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: 'Text is required' })
      }
    }

    if (!process.env.CLARIFAI_API_KEY) {
      console.error('Missing CLARIFAI_API_KEY environment variable')
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Configuration Error',
          details: 'Missing Clarifai API key. Please check environment variables.',
          missing: {
            CLARIFAI_API_KEY: !process.env.CLARIFAI_API_KEY
          }
        })
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
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Clarifai API Error',
          details: `HTTP ${clarifaiResponse.status}: ${clarifaiResponse.statusText}`,
          clarifaiError: errorDetails,
          url: clarifaiUrl
        })
      }
    }

    const clarifaiData = await clarifaiResponse.json()
    
    if (!clarifaiData.outputs || !clarifaiData.outputs[0] || !clarifaiData.outputs[0].data || !clarifaiData.outputs[0].data.audio) {
      console.error('Unexpected Clarifai response structure:', JSON.stringify(clarifaiData, null, 2))
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Invalid Clarifai Response',
          details: 'The response structure from Clarifai was unexpected',
          response: clarifaiData
        })
      }
    }

    const audioBase64 = clarifaiData.outputs[0].data.audio.base64
    
    if (!audioBase64) {
      console.error('No audio base64 in response:', clarifaiData)
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'No Audio Data',
          details: 'Clarifai response did not contain audio base64 data',
          response: clarifaiData
        })
      }
    }

    console.log('Audio generated successfully, size:', (audioBase64.length / 1024).toFixed(2), 'KB')

    if (format === 'binary') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600'
        },
        body: audioBase64,
        isBase64Encoded: true
      }
    }

    const audioSizeKB = audioBase64.length / 1024

    if (audioSizeKB > 5000) {
      return {
        statusCode: 413,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Payload Too Large',
          message: 'Audio file exceeds size limit. Please use chunk mode.',
          sizeKB: audioSizeKB.toFixed(2)
        })
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        audioBase64: audioBase64,
        audioUrl: `data:audio/mpeg;base64,${audioBase64}`
      })
    }
  } catch (error) {
    console.error('Error in generate-audio:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Error generating audio',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}
