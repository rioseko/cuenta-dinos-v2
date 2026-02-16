import { useState, useRef, useEffect } from 'react'
import { Sparkles, BookOpen, Heart, Lightbulb, Play, Square, ArrowRight, ArrowLeft, Volume2, Loader } from 'lucide-react'

const DINOSAURS = [
  { id: 'argentinosaur', name: 'Argentinosaurio', image: '/images/argentinosaurio.png', description: 'El gigante gentil' },
  { id: 'carnotaurus', name: 'Carnotaurus', image: '/images/carnotaurus.png', description: 'El cazador con cuernos' },
  { id: 'stegosaurus', name: 'Estegosaurio', image: '/images/estegosaurio.png', description: 'El de placas en la espalda' },
  { id: 'mosasaurus', name: 'Mosasaurio', image: '/images/mosasaurus.png', description: 'El reptil marino' },
  { id: 'pterodactyl', name: 'Pterodáctilo', image: '/images/pterodactilo.png', description: 'El que vuela' },
  { id: 'spinosaurus', name: 'Espinosaurio', image: '/images/spinosaurus.png', description: 'El con vela en la espalda' },
  { id: 'trex', name: 'T-Rex', image: '/images/t-rex.png', description: 'El rey de los dinosaurios' },
  { id: 'triceratops', name: 'Triceratops', image: '/images/triceratops.png', description: 'El de tres cuernos' },
  { id: 'velociraptor', name: 'Velociraptor', image: '/images/velociraptor.png', description: 'El más rápido' }
]

const STYLES = [
  { id: 'adventure', name: 'Aventura', icon: Sparkles, description: 'Emocionante y lleno de acción' },
  { id: 'friendship', name: 'Amistad', icon: Heart, description: 'Historias de compañerismo' },
  { id: 'mystery', name: 'Misterio', icon: BookOpen, description: 'Intriga y descubrimientos' }
]

const LESSONS = [
  { id: 'sharing', name: 'Compartir', icon: Heart, description: 'La importancia de compartir' },
  { id: 'courage', name: 'Valentía', icon: Sparkles, description: 'Ser valiente ante los miedos' },
  { id: 'kindness', name: 'Amabilidad', icon: Heart, description: 'Ser amable con los demás' },
  { id: 'perseverance', name: 'Perseverancia', icon: Lightbulb, description: 'No rendirse nunca' }
]

function App() {
  const [step, setStep] = useState(1)
  const [selectedDino, setSelectedDino] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [story, setStory] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState(null)
  const [loadingMessage, setLoadingMessage] = useState('')
  
  const audioContextRef = useRef(null)
  const currentSourceRef = useRef(null)
  const abortControllerRef = useRef(null)
  const continueButtonRef = useRef(null)
  const isDebugMode = new URLSearchParams(window.location.search).has('audioDebug')

  const scrollToTop = () => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  const scrollToContinueButton = () => {
    if (continueButtonRef.current) {
      continueButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const updateLoadingMessage = () => {
    const messages = [
      'Estamos preparando todo...',
      'Afinando nuestra voz...',
      'Creando magia prehistórica...',
      'Despertando a los dinosaurios...',
      'Preparando el cuento perfecto...',
      'Casi listo para la aventura...'
    ]
    
    let index = 0
    const interval = setInterval(() => {
      setLoadingMessage(messages[index % messages.length])
      index++
    }, 3500)
    
    return interval
  }

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop()
        } catch (e) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const generateStory = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/.netlify/functions/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dinosaur: selectedDino.name,
          style: selectedStyle.name,
          lesson: selectedLesson.name
        })
      })

      if (!response.ok) {
        throw new Error('Error al generar el cuento')
      }

      const data = await response.json()
      setStory(data.story)
      setStep(5)
    } catch (err) {
      setError(err.message)
      console.error('Error generating story:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const splitTextIntoChunks = (text) => {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
    return paragraphs.map(p => p.trim())
  }

  const fetchAudioChunk = async (text, signal) => {
    const response = await fetch('/.netlify/functions/generate-audio?format=binary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal
    })

    if (!response.ok) {
      throw new Error(`Audio generation failed: ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return arrayBuffer
  }

  const playChunksSequence = async () => {
    if (isPlaying) {
      stopAudio()
      return
    }

    setIsPlaying(true)
    setError(null)

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }

      const ctx = audioContextRef.current

      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const oscillator = ctx.createOscillator()
      oscillator.frequency.value = 0
      const gainNode = ctx.createGain()
      gainNode.gain.value = 0.001
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.1)

      const chunks = splitTextIntoChunks(story)
      abortControllerRef.current = new AbortController()

      console.log(`Story split into ${chunks.length} paragraphs`)

      // Mostrar spinner y mensajes de carga
      setLoadingMessage('Estamos preparando todo...')
      const messageInterval = updateLoadingMessage()

      const audioBuffers = []
      const fetchPromises = []

      for (let i = 0; i < chunks.length; i++) {
        fetchPromises.push(
          fetchAudioChunk(chunks[i], abortControllerRef.current.signal)
            .then(audioData => ctx.decodeAudioData(audioData))
            .then(buffer => {
              audioBuffers[i] = buffer
              console.log(`Chunk ${i + 1}/${chunks.length} loaded`)
            })
        )
      }

      // Esperar a que todos los chunks se carguen
      await Promise.all(fetchPromises)
      
      // Ocultar spinner y limpiar intervalo
      clearInterval(messageInterval)
      setLoadingMessage('')

      for (let i = 0; i < chunks.length; i++) {
        if (abortControllerRef.current.signal.aborted) break

        const buffer = audioBuffers[i]

        await new Promise((resolve, reject) => {
          const source = ctx.createBufferSource()
          source.buffer = buffer
          source.connect(ctx.destination)
          currentSourceRef.current = source

          source.onended = () => {
            currentSourceRef.current = null
            setTimeout(resolve, 1000)
          }

          abortControllerRef.current.signal.addEventListener('abort', () => {
            try {
              source.stop()
            } catch (e) {}
            reject(new Error('Playback aborted'))
          })

          source.start(0)
          console.log(`Playing chunk ${i + 1}/${chunks.length}`)
        })
      }

      setIsPlaying(false)
    } catch (err) {
      if (err.name !== 'AbortError' && !err.message.includes('aborted')) {
        setError('Error al reproducir el audio')
        console.error('Audio playback error:', err)
      }
      setIsPlaying(false)
      setLoadingMessage('') // Ocultar spinner en caso de error
    }
  }

  const stopAudio = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop()
      } catch (e) {}
      currentSourceRef.current = null
    }
    setIsPlaying(false)
    setLoadingMessage('') // Ocultar spinner al detener
  }

  const resetApp = () => {
    stopAudio()
    setStep(1)
    setSelectedDino(null)
    setSelectedStyle(null)
    setSelectedLesson(null)
    setStory('')
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 mb-2">
            🦖 Cuentos de Lucas
          </h1>
          <p className="text-gray-600 text-sm md:text-base mb-6">Cuentos mágicos para dormir</p>
          <img 
            src="/images/header.png" 
            alt="Cuenta Dinos - Cuentos mágicos de dinosaurios" 
            className="w-full max-w-md mx-auto rounded-2xl object-contain bg-transparent h-56 md:h-64"
            style={{ 
              backgroundColor: 'transparent',
              mixBlendMode: 'multiply'
            }}
          />
        </header>

        {/* Spinner de carga */}
        {loadingMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm mx-4 flex flex-col items-center">
              <div className="animate-pulse mb-4">
                <Sparkles className="text-emerald-500" size={64} />
              </div>
              <p className="text-gray-800 text-center font-medium text-lg">{loadingMessage}</p>
              <p className="text-gray-500 text-center text-sm mt-2">Preparando tu cuento mágico...</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Sparkles className="text-emerald-500" />
              Elige tu dinosaurio
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {DINOSAURS.map(dino => (
                <button
                  key={dino.id}
                  onClick={() => {
                    setSelectedDino(dino)
                    setTimeout(scrollToContinueButton, 100)
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    selectedDino?.id === dino.id
                      ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                  }`}
                >
                  <img src={dino.image} alt={dino.name} className="w-16 h-16 mb-2 mx-auto object-contain" />
                  <div className="font-semibold text-gray-800 text-sm leading-tight break-words text-center">{dino.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{dino.description}</div>
                </button>
              ))}
            </div>
            {selectedDino && (
              <button
                ref={continueButtonRef}
                onClick={() => {
                  scrollToTop()
                  setStep(2)
                }}
                className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <BookOpen className="text-emerald-500" />
              Elige el estilo del cuento
            </h2>
            <div className="space-y-4">
              {STYLES.map(style => {
                const Icon = style.icon
                return (
                  <button
                    key={style.id}
                    onClick={() => {
                      setSelectedStyle(style)
                      setTimeout(scrollToContinueButton, 100)
                    }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                      selectedStyle?.id === style.id
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02]'
                        : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <Icon className="text-emerald-500" size={32} />
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">{style.name}</div>
                      <div className="text-sm text-gray-500">{style.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  scrollToTop()
                  setStep(1)
                }}
                className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Atrás
              </button>
              {selectedStyle && (
                <button
                  ref={continueButtonRef}
                  onClick={() => {
                    scrollToTop()
                    setStep(3)
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  Continuar
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Lightbulb className="text-emerald-500" />
              ¿Qué lección quieres enseñar?
            </h2>
            <div className="space-y-4">
              {LESSONS.map(lesson => {
                const Icon = lesson.icon
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLesson(lesson)
                      setTimeout(scrollToContinueButton, 100)
                    }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                      selectedLesson?.id === lesson.id
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02]'
                        : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <Icon className="text-emerald-500" size={32} />
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">{lesson.name}</div>
                      <div className="text-sm text-gray-500">{lesson.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  scrollToTop()
                  setStep(2)
                }}
                className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} />
                Atrás
              </button>
              {selectedLesson && (
                <button
                  ref={continueButtonRef}
                  onClick={() => {
                    scrollToTop()
                    setStep(4)
                    generateStory()
                  }}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  Crear cuento
                  <Sparkles size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 text-center">
            <div className="animate-pulse mb-6">
              <Sparkles className="text-emerald-500 mx-auto" size={64} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Creando tu cuento mágico...
            </h2>
            <p className="text-gray-600">
              {selectedDino?.emoji} {selectedDino?.name} está preparando una historia de {selectedStyle?.name.toLowerCase()} sobre {selectedLesson?.name.toLowerCase()}
            </p>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                {error}
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-4">
                <BookOpen className="text-emerald-500" />
                Tu cuento está listo
              </h2>
              
              <button
                onClick={playChunksSequence}
                disabled={isGenerating}
                className={`w-full py-4 font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${
                  isPlaying
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square size={20} />
                    Detener narración
                  </>
                ) : (
                  <>
                    <Volume2 size={20} />
                    Leer cuento
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 mb-6 border-l-4 border-emerald-600">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{story}</p>
            </div>

            <button
              onClick={() => {
                scrollToTop()
                resetApp()
              }}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Sparkles size={20} />
              Crear otro cuento
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {isDebugMode && (
              <div className="mt-4 p-4 bg-gray-100 rounded-xl text-xs text-gray-600">
                <div>AudioContext State: {audioContextRef.current?.state || 'not initialized'}</div>
                <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
                <div>Story Length: {story.length} chars</div>
              </div>
            )}
          </div>
        )}

        <footer className="text-center mt-8 text-gray-500 text-sm">
          <p>Hecho con 💚 para Lucas</p>
        </footer>
      </div>
    </div>
  )
}

export default App
