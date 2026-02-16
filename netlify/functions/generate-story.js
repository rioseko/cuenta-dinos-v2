export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { dinosaur, style, lesson } = JSON.parse(event.body)

    if (!process.env.CLARIFAI_API_KEY || !process.env.CLARIFAI_USER_ID || !process.env.CLARIFAI_APP_ID) {
      console.error('Missing Clarifai environment variables')
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Configuration Error',
          details: 'Missing Clarifai API credentials. Please check environment variables.',
          missing: {
            CLARIFAI_API_KEY: !process.env.CLARIFAI_API_KEY,
            CLARIFAI_USER_ID: !process.env.CLARIFAI_USER_ID,
            CLARIFAI_APP_ID: !process.env.CLARIFAI_APP_ID
          }
        })
      }
    }

    const prompt = `Escribe un cuento corto para niños (máximo 300 palabras) en español sobre un dinosaurio ${dinosaur}. 
El cuento debe ser de estilo ${style} y enseñar la lección de ${lesson}.
El cuento debe ser apropiado para niños de 3-8 años, con un lenguaje sencillo y una narrativa clara.
Incluye diálogos y describe las emociones del dinosaurio.
El cuento debe tener un inicio, desarrollo y final feliz.
NO incluyas títulos ni encabezados, solo el texto del cuento.`

    const modelId = process.env.CLARIFAI_MODEL_ID || 'GPT-4'
    const modelVersionId = process.env.CLARIFAI_MODEL_VERSION_ID || ''
    
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
    
    if (!clarifaiData.outputs || !clarifaiData.outputs[0] || !clarifaiData.outputs[0].data || !clarifaiData.outputs[0].data.text) {
      console.error('Unexpected Clarifai response structure:', clarifaiData)
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

    const story = clarifaiData.outputs[0].data.text.raw

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ story })
    }
  } catch (error) {
    console.error('Error in generate-story:', error)
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Error generating story',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}
