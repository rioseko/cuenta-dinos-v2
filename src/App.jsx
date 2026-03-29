import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Gift,
  Heart,
  Lightbulb,
  MoonStar,
  Play,
  Sparkles,
  Square,
  Star,
  Volume2,
  Wand2
} from 'lucide-react'

const DINOSAURS = [
  { id: 'argentinosaur', name: 'Argentinosaurio', image: '/images/argentinosaurio.png', description: 'El gigante gentil' },
  { id: 'carnotaurus', name: 'Carnotaurus', image: '/images/carnotaurus.png', description: 'El curioso con cuernos' },
  { id: 'stegosaurus', name: 'Estegosaurio', image: '/images/estegosaurio.png', description: 'El de placas brillantes' },
  { id: 'mosasaurus', name: 'Mosasaurio', image: '/images/mosasaurus.png', description: 'El aventurero del mar' },
  { id: 'pterodactyl', name: 'Pterodáctilo', image: '/images/pterodactilo.png', description: 'El viajero que vuela' },
  { id: 'spinosaurus', name: 'Espinosaurio', image: '/images/spinosaurus.png', description: 'El nadador valiente' },
  { id: 'trex', name: 'T-Rex', image: '/images/t-rex.png', description: 'El rey de las pisadas' },
  { id: 'triceratops', name: 'Triceratops', image: '/images/triceratops.png', description: 'El de tres cuernos' },
  { id: 'velociraptor', name: 'Velociraptor', image: '/images/velociraptor.png', description: 'El más rápido de todos' }
]

const STYLES = [
  { id: 'adventure', name: 'Aventura', icon: Sparkles, description: 'Un viaje emocionante con sorpresas y acción suave.' },
  { id: 'friendship', name: 'Amistad', icon: Heart, description: 'Una historia tierna para aprender a compartir y acompañar.' },
  { id: 'mystery', name: 'Misterio', icon: BookOpen, description: 'Pistas, curiosidad y descubrimientos para antes de dormir.' }
]

const LESSONS = [
  { id: 'overcome-shyness', name: 'Vencer la timidez', icon: Sparkles, description: 'Aprender a expresarse y dar el primer paso.', badge: 'Nuevo' },
  { id: 'sharing', name: 'Compartir', icon: Gift, description: 'Descubrir lo bonito de compartir con otros.' },
  { id: 'courage', name: 'Valentía', icon: Star, description: 'Encontrar fuerza cuando aparece el miedo.' },
  { id: 'kindness', name: 'Amabilidad', icon: Heart, description: 'Tratar a los demás con cariño y respeto.' },
  { id: 'perseverance', name: 'Perseverancia', icon: Lightbulb, description: 'Seguir intentando aunque cueste un poco.' }
]

const CREATION_STEPS = [
  { id: 1, label: 'Dino', title: 'Elige el protagonista', description: 'Escoge el dinosaurio que vivirá la aventura.' },
  { id: 2, label: 'Estilo', title: 'Elige el tono del cuento', description: 'Cada estilo cambia el ritmo y la emoción de la historia.' },
  { id: 3, label: 'Lección', title: 'Elige qué quieres enseñar', description: 'La historia ayudará a reforzar una idea importante.' },
  { id: 4, label: 'Crear', title: 'Estamos armando el cuento', description: 'La historia se genera con tus elecciones.' }
]

function StepProgress({ step }) {
  const currentStep = Math.min(step, 4)

  return (
    <div className="section-card fade-up">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Progreso</p>
          <h2 className="mt-1 text-lg font-heading text-slate-900">Crea un cuento en pocos pasos</h2>
        </div>
        <div className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-700 shadow-soft">
          Paso {currentStep} de 4
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {CREATION_STEPS.map((item) => {
          const isComplete = step > item.id || step === 5
          const isCurrent = currentStep === item.id && step !== 5

          return (
            <div key={item.id} className="flex flex-col items-center gap-2 text-center">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all ${
                  isComplete
                    ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                    : isCurrent
                      ? 'border-sky-200 bg-sky-100 text-sky-700 shadow-soft'
                      : 'border-white/70 bg-white/70 text-slate-400'
                }`}
              >
                {isComplete ? <Check size={18} /> : <span className="text-sm font-bold">{item.id}</span>}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SectionIntro({ icon: Icon, eyebrow, title, description }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-soft">
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{eyebrow}</p>
        <h3 className="mt-1 text-2xl font-heading text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  )
}

function SelectionSummary({ selectedDino, selectedStyle, selectedLesson }) {
  const items = [
    selectedDino ? `Dino: ${selectedDino.name}` : null,
    selectedStyle ? `Estilo: ${selectedStyle.name}` : null,
    selectedLesson ? `Lección: ${selectedLesson.name}` : null
  ].filter(Boolean)

  if (items.length === 0) {
    return null
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="pill-badge">
          {item}
        </span>
      ))}
    </div>
  )
}

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
  const stepsViewportRef = useRef(null)
  const resultCardRef = useRef(null)
  const hasMountedRef = useRef(false)
  const isDebugMode = new URLSearchParams(window.location.search).has('audioDebug')

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      if (currentSourceRef.current) {
        try {
          currentSourceRef.current.stop()
        } catch (_error) {
          // Ignored: the source may have already stopped.
        }
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    if (step === 1) {
      return
    }

    const target = step === 5 ? resultCardRef.current : stepsViewportRef.current

    if (!target) {
      return
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: 'smooth',
        block: step === 5 ? 'start' : 'start'
      })
    })
  }, [step])

  const goToStep = (nextStep) => {
    setStep(nextStep)
  }

  const updateLoadingMessage = () => {
    const messages = [
      'Estamos preparando todo...',
      'Afinando una voz suave...',
      'Llenando el cielo de colores pastel...',
      'Despertando a los dinosaurios...',
      'Armando una aventura muy especial...',
      'Casi listo para comenzar...'
    ]

    let index = 0
    const interval = setInterval(() => {
      setLoadingMessage(messages[index % messages.length])
      index += 1
    }, 3200)

    return interval
  }

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

      let data = null

      try {
        data = await response.json()
      } catch (_error) {
        data = null
      }

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(data?.error || 'Solicitud no permitida desde este origen.')
        }

        if (response.status === 429) {
          throw new Error(data?.error || 'Demasiadas solicitudes. Inténtalo nuevamente en unos segundos.')
        }

        throw new Error(data?.error || 'No se pudo generar el cuento.')
      }

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
    const paragraphs = text.split(/\n\n+/).filter((paragraph) => paragraph.trim().length > 0)
    const chunks = paragraphs.map((paragraph) => paragraph.trim())
    
    // ElevenLabs free tier only allows 2 concurrent requests
    // Group into max 2 chunks for sequential/semi-parallel fetching
    if (chunks.length <= 2) {
      return chunks
    }
    
    const midpoint = Math.ceil(chunks.length / 2)
    return [
      chunks.slice(0, midpoint).join('\n\n'),
      chunks.slice(midpoint).join('\n\n')
    ]
  }

  const fetchAudioChunk = async (text, signal) => {
    const response = await fetch('/.netlify/functions/generate-audio?format=binary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal
    })

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Solicitud no permitida desde este origen.')
      }

      if (response.status === 429) {
        throw new Error('Demasiadas solicitudes de audio. Inténtalo nuevamente en unos segundos.')
      }

      throw new Error(`Audio generation failed: ${response.status}`)
    }

    return response.arrayBuffer()
  }

  const stopAudio = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop()
      } catch (_error) {
        // Ignored: the source may have already stopped.
      }
      currentSourceRef.current = null
    }

    setIsPlaying(false)
    setLoadingMessage('')
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

      setLoadingMessage('Estamos preparando todo...')
      const messageInterval = updateLoadingMessage()

      // Playback helper - plays a buffer and returns when done
      const playBuffer = (buffer) => {
        return new Promise((resolve, reject) => {
          if (abortControllerRef.current.signal.aborted) {
            reject(new Error('Playback aborted'))
            return
          }

          const source = ctx.createBufferSource()
          source.buffer = buffer
          source.connect(ctx.destination)
          currentSourceRef.current = source

          source.onended = () => {
            currentSourceRef.current = null
            // Small pause between chunks
            setTimeout(resolve, 500)
          }

          abortControllerRef.current.signal.addEventListener('abort', () => {
            try {
              source.stop()
            } catch (_error) {
              // Ignored: the source may have already stopped.
            }
            reject(new Error('Playback aborted'))
          })

          source.start(0)
        })
      }

      // Fetch and decode helper
      const fetchAndDecode = async (chunkIndex) => {
        const audioData = await fetchAudioChunk(chunks[chunkIndex], abortControllerRef.current.signal)
        return ctx.decodeAudioData(audioData)
      }

      // With max 2 chunks, we use sequential fetch with immediate playback:
      // 1. Fetch chunk 0 → start playing immediately
      // 2. While playing chunk 0, fetch chunk 1 in background
      // 3. When chunk 0 ends, play chunk 1 (if ready) or wait for it

      const audioBuffers = []
      
      if (chunks.length >= 1) {
        // Fetch first chunk
        audioBuffers[0] = await fetchAndDecode(0)
      }

      // Start playing first chunk immediately
      clearInterval(messageInterval)
      setLoadingMessage('')

      if (chunks.length >= 1) {
        await playBuffer(audioBuffers[0])
      }

      // If aborted, stop here
      if (abortControllerRef.current.signal.aborted) {
        setIsPlaying(false)
        return
      }

      // Fetch remaining chunks if any (should only be 1 more max with our split logic)
      if (chunks.length >= 2) {
        audioBuffers[1] = await fetchAndDecode(1)
        await playBuffer(audioBuffers[1])
      }

      setIsPlaying(false)
    } catch (err) {
      if (err.name !== 'AbortError' && !err.message.includes('aborted')) {
        setError('Error al reproducir el audio.')
        console.error('Audio playback error:', err)
      }

      setIsPlaying(false)
      setLoadingMessage('')
    }
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

  const canContinue =
    (step === 1 && selectedDino) ||
    (step === 2 && selectedStyle) ||
    (step === 3 && selectedLesson)

  const renderStepContent = () => {
    if (step === 1) {
      return (
        <div className="section-card fade-up">
          <SectionIntro
            icon={Sparkles}
            eyebrow="Paso 1"
            title="¿Qué dinosaurio será el protagonista?"
          />

          <div className="grid grid-cols-2 gap-3">
            {DINOSAURS.map((dino) => (
              <button
                key={dino.id}
                type="button"
                onClick={() => setSelectedDino(dino)}
                className={`choice-card min-h-[208px] text-left ${selectedDino?.id === dino.id ? 'choice-card-active' : ''}`}
              >
                <div className="relative mb-4 flex justify-center">
                  <div className="flex h-28 w-full max-w-[9rem] items-center justify-center rounded-[1.75rem] bg-white/85 p-3 shadow-soft">
                    <img src={dino.image} alt={dino.name} className="h-24 w-24 object-contain" />
                  </div>
                  {selectedDino?.id === dino.id && (
                    <span className="absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check size={16} />
                    </span>
                  )}
                </div>
                <p className="text-base font-bold text-slate-900">{dino.name}</p>
                <p className="mt-1 text-sm leading-5 text-slate-600">{dino.description}</p>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (step === 2) {
      return (
        <div className="section-card fade-up">
          <SectionIntro
            icon={BookOpen}
            eyebrow="Paso 2"
            title="Elige cómo sonará el cuento"
            description="Un estilo más claro hace que la historia se sienta mejor y sea más fácil de seguir."
          />

          <SelectionSummary selectedDino={selectedDino} selectedStyle={selectedStyle} selectedLesson={selectedLesson} />

          <div className="space-y-3">
            {STYLES.map((style) => {
              const Icon = style.icon

              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSelectedStyle(style)}
                  className={`choice-row ${selectedStyle?.id === style.id ? 'choice-card-active' : ''}`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-soft">
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-base font-bold text-slate-900">{style.name}</p>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{style.description}</p>
                  </div>
                  {selectedStyle?.id === style.id && (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (step === 3) {
      return (
        <div className="section-card fade-up">
          <SectionIntro
            icon={Lightbulb}
            eyebrow="Paso 3"
            title="Elige la enseñanza del cuento"
            description="Así la experiencia no solo entretiene: también acompaña con una idea simple y valiosa."
          />

          <SelectionSummary selectedDino={selectedDino} selectedStyle={selectedStyle} selectedLesson={selectedLesson} />

          <div className="space-y-3">
            {LESSONS.map((lesson) => {
              const Icon = lesson.icon

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => setSelectedLesson(lesson)}
                  className={`choice-row ${selectedLesson?.id === lesson.id ? 'choice-card-active' : ''}`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-soft">
                    <Icon size={22} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-900">{lesson.name}</p>
                      {lesson.badge && <span className="soft-badge">{lesson.badge}</span>}
                    </div>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{lesson.description}</p>
                  </div>
                  {selectedLesson?.id === lesson.id && (
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check size={16} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )
    }

    if (step === 4) {
      return (
        <div className="section-card fade-up text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-sky-100 via-rose-50 to-amber-100 shadow-soft">
            <Wand2 className="animate-gentle-float text-sky-700" size={34} />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Paso 4</p>
          <h3 className="mt-2 text-3xl font-heading text-slate-900">Creando el cuento perfecto</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
            {selectedDino?.name} está preparando una historia de {selectedStyle?.name.toLowerCase()} con una lección sobre{' '}
            {selectedLesson?.name.toLowerCase()}.
          </p>

          <div className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-3 text-left">
            <div className="rounded-3xl bg-sky-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dino</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{selectedDino?.name}</p>
            </div>
            <div className="rounded-3xl bg-rose-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estilo</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{selectedStyle?.name}</p>
            </div>
            <div className="rounded-3xl bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Lección</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{selectedLesson?.name}</p>
            </div>
          </div>

          {error && <div className="error-banner mx-auto mt-6 max-w-md">{error}</div>}
        </div>
      )
    }

    return (
      <div ref={resultCardRef} className="section-card fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Listo</p>
            <h3 className="mt-1 text-3xl font-heading text-slate-900">Tu cuento ya está listo</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Puedes leerlo en pantalla o reproducir la narración con una voz más suave para el momento de dormir.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            <MoonStar size={16} />
            Experiencia tranquila
          </div>
        </div>

        <SelectionSummary selectedDino={selectedDino} selectedStyle={selectedStyle} selectedLesson={selectedLesson} />

        <div className="grid gap-4">
          <button
            type="button"
            onClick={playChunksSequence}
            disabled={isGenerating}
            className={`primary-button ${isPlaying ? 'primary-button-stop' : ''}`}
          >
            {isPlaying ? (
              <>
                <Square size={18} />
                Detener narración
              </>
            ) : (
              <>
                <Volume2 size={18} />
                Reproducir cuento
              </>
            )}
          </button>

          <div className="story-paper">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
              <BookOpen size={16} />
              Lectura del cuento
            </div>
            <p className="whitespace-pre-wrap text-[15px] leading-8 text-slate-700">{story}</p>
          </div>

          <button type="button" onClick={resetApp} className="secondary-button">
            <Play size={18} />
            Crear otro cuento
          </button>
        </div>

        {error && <div className="error-banner mt-4">{error}</div>}

        {isDebugMode && (
          <div className="mt-4 rounded-3xl bg-slate-100 p-4 text-xs text-slate-600">
            <div>AudioContext State: {audioContextRef.current?.state || 'not initialized'}</div>
            <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
            <div>Story Length: {story.length} chars</div>
          </div>
        )}
      </div>
    )
  }

  const renderBottomActionBar = () => {
    if (step === 4 || step === 5) {
      return null
    }

    return (
      <div className="mobile-action-bar">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          {step > 1 && (
            <button type="button" onClick={() => goToStep(step - 1)} className="secondary-button compact-button">
              <ArrowLeft size={18} />
              Atrás
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (step === 1 && selectedDino) {
                goToStep(2)
              }

              if (step === 2 && selectedStyle) {
                goToStep(3)
              }

              if (step === 3 && selectedLesson) {
                goToStep(4)
                generateStory()
              }
            }}
            disabled={!canContinue}
            className="primary-button flex-1"
          >
            {step === 3 ? 'Crear cuento' : 'Continuar'}
            {step === 3 ? <Sparkles size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-shell ${step < 4 ? 'pb-32' : 'pb-10'}`}>
      <div className="floating-orb floating-orb-left" />
      <div className="floating-orb floating-orb-right" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pt-4 sm:px-5 sm:pt-6">
        <section className="hero-card fade-up">
          <div className="flex flex-col gap-6">
            <div className="grid items-center gap-5 sm:grid-cols-[1.15fr_0.85fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Cuentos de Lucas</p>
                <h1 className="mt-3 text-4xl font-heading leading-tight text-slate-900 sm:text-5xl">
                  Una experiencia dulce para escuchar antes de dormir
                </h1>
              </div>

              <div className="relative">
                <div className="absolute -left-3 top-8 h-16 w-16 rounded-full bg-white/60 blur-xl" />
                <div className="absolute -right-1 bottom-4 h-20 w-20 rounded-full bg-rose-200/50 blur-2xl" />
                <img
                  src="/images/header.png"
                  alt="Ilustración principal de cuentos de dinosaurios"
                  className="relative mx-auto w-full max-w-xs rounded-[32px] object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        <div ref={stepsViewportRef} className="mt-4">
          <StepProgress step={step} />
        </div>

        <div className="mt-4 flex-1">{renderStepContent()}</div>

        <footer className="pb-8 pt-6 text-center text-sm text-slate-500">
          Hecho con cariño para Lucas
        </footer>
      </main>

      {renderBottomActionBar()}

      {loadingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[32px] bg-white/90 p-8 text-center shadow-soft-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-sky-100 via-rose-50 to-amber-100">
              <Sparkles className="animate-gentle-float text-sky-700" size={34} />
            </div>
            <h3 className="mt-5 text-2xl font-heading text-slate-900">Preparando la narración</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{loadingMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
