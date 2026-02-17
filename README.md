# 🦖 Cuentos de Lucas - Generador de Cuentos Mágicos

Aplicación React moderna para generar cuentos personalizados de dinosaurios para dormir, con narración de voz realista, imágenes personalizadas y diseño optimizado para dispositivos móviles (iOS/Android).

## ✨ Características

- **Generación de cuentos con IA**: Usa Clarifai API (GPT-4) para crear historias únicas
- **Narración de voz realista**: Integración con ElevenLabs para text-to-speech de alta calidad
- **Diseño Mobile-First**: Optimizado para smartphones y tablets
- **Reproducción por chunks**: Sistema avanzado de audio que divide el cuento en párrafos para evitar límites de payload
- **Compatible con iOS**: Soluciona las restricciones de autoplay de Safari
- **Interfaz moderna**: Diseño con Tailwind CSS y gradientes Emerald/Teal
- **Imágenes personalizadas**: Selección de dinosaurios con imágenes PNG personalizadas
- **UX mejorada**: Scroll automático, botones reposicionados y navegación fluida
- **Pausas narrativas**: 1 segundo entre párrafos para mejor experiencia de escucha

## 🚀 Stack Tecnológico

### Frontend
- React 18 + Vite
- Tailwind CSS
- Lucide React (iconos)
- Web Audio API

### Backend
- Netlify Functions (Serverless)
- Clarifai API (generación de texto)
- ElevenLabs API (text-to-speech)

## 📋 Requisitos Previos

- Node.js 18 o superior
- Cuenta en [Clarifai](https://clarifai.com/) (incluye acceso a GPT-4 y ElevenLabs)
- Cuenta en [Netlify](https://www.netlify.com/) (para deployment)

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <tu-repositorio>
cd dinos-windsurf
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto (copia de `.env.example`):

```bash
cp .env.example .env
```

Edita el archivo `.env` y añade tus claves API:

```env
CLARIFAI_API_KEY=tu_clave_real_aqui
CLARIFAI_USER_ID=tu_user_id_aqui
CLARIFAI_APP_ID=tu_app_id_aqui
CLARIFAI_MODEL_ID=GPT-4
```

### Obtener las credenciales de Clarifai:

1. Regístrate en [clarifai.com](https://clarifai.com/)
2. Crea una aplicación
3. Ve a Settings → Security para obtener tu API Key
4. Tu User ID y App ID están en la URL de tu aplicación

**Nota:** Clarifai proporciona acceso tanto a modelos de texto (GPT-4) como a text-to-speech (ElevenLabs) con una sola API key. No necesitas una cuenta separada de ElevenLabs.

## 🏃 Desarrollo Local

### Configuración Inicial

El proyecto ya incluye `netlify-cli` como dependencia de desarrollo, por lo que **NO necesitas instalarlo globalmente**.

### Ejecutar el Proyecto

Para ejecutar el proyecto con el frontend React + Netlify Functions:

```bash
npm run dev
```

Esto ejecutará `netlify dev`, que:
- ✅ Levanta el servidor de Vite (React)
- ✅ Ejecuta las Netlify Functions localmente
- ✅ Configura el proxy automático para las funciones
- ✅ Lee las variables de entorno desde `.env`

La aplicación estará disponible en `http://localhost:8888` (puerto por defecto de Netlify Dev)

### Solo Frontend (sin Functions)

Si solo quieres ejecutar el frontend sin las funciones:

```bash
npm run dev:vite
```

Esto levantará solo Vite en `http://localhost:5173`, pero las llamadas a las funciones fallarán.

## 🏗️ Build

Para crear una versión de producción:

```bash
npm run build
```

Los archivos compilados estarán en la carpeta `dist/`.

## 🚀 Deployment en Netlify

### Opción 1: Deployment desde Git (Recomendado)

1. Sube tu código a GitHub/GitLab/Bitbucket
2. Ve a [Netlify](https://app.netlify.com/)
3. Click en "Add new site" → "Import an existing project"
4. Conecta tu repositorio
5. Netlify detectará automáticamente la configuración desde `netlify.toml`
6. Añade las variables de entorno en Site Settings → Environment Variables:
   - `CLARIFAI_API_KEY`
   - `CLARIFAI_USER_ID`
   - `CLARIFAI_APP_ID`
   - `ELEVENLABS_API_KEY`
7. Click en "Deploy site"

### Opción 2: Deployment Manual

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

No olvides configurar las variables de entorno en el dashboard de Netlify.

## 📱 Uso de la Aplicación

1. **Selecciona un dinosaurio**: Elige entre Argentinosaurio, Carnotaurus, Estegosaurio, Mosasaurio, Pterodáctilo, Espinosaurio, T-Rex, Triceratops o Velociraptor (con imágenes personalizadas)
2. **Elige el estilo**: Aventura, Amistad o Misterio
3. **Selecciona una lección**: Compartir, Valentía, Amabilidad o Perseverancia
4. **Espera la generación**: La IA creará un cuento único
5. **Escucha la narración**: Presiona "Leer cuento" para escuchar la historia con voz realista y pausas naturales
6. **Crea más cuentos**: Usa el botón "Crear otro cuento" para generar nuevas historias

## 🔊 Arquitectura de Audio

La aplicación implementa un sistema avanzado de reproducción de audio:

- **División en chunks**: El cuento se divide por párrafos (doble salto de línea) para evitar el límite de 6MB de Netlify
- **Precarga paralela**: Todos los chunks de audio se descargan en paralelo al inicio para evitar retrasos
- **Compatibilidad iOS**: Pre-warming del AudioContext para desbloquear el audio en Safari
- **Pausas narrativas**: 1 segundo entre párrafos para mejorar la experiencia de escucha
- **Control de reproducción**: Botón de play/stop con íconos de bocina y cuadrado

## 🐛 Debug en iOS

Si necesitas depurar el audio en dispositivos iOS, añade `?audioDebug` a la URL:

```
https://tu-app.netlify.app/?audioDebug
```

Esto mostrará información de debug del AudioContext en la interfaz.

## 📁 Estructura del Proyecto

```
dinos-windsurf/
├── src/
│   ├── App.jsx           # Componente principal con lógica de audio y UI
│   ├── main.jsx          # Entry point
│   └── index.css         # Estilos globales con Tailwind
├── public/
│   └── images/           # Imágenes de dinosaurios y header
│       ├── header.png    # Imagen principal de la aplicación
│       ├── argentinosaurio.png
│       ├── carnotaurus.png
│       ├── estegosaurio.png
│       ├── mosasaurus.png
│       ├── pterodactilo.png
│       ├── spinosaurus.png
│       ├── t-rex.png
│       ├── triceratops.png
│       └── velociraptor.png
├── netlify/
│   └── functions/
│       ├── generate-story.js   # Función para generar cuentos (Clarifai)
│       └── generate-audio.js   # Función para generar audio (Clarifai/ElevenLabs)
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── netlify.toml          # Configuración de Netlify
├── .env.example          # Plantilla de variables de entorno
└── README.md
```

## 🎨 Personalización

### Colores

Los colores principales están definidos en `src/App.jsx` usando clases de Tailwind:

- Gradiente principal: `from-emerald-500 to-teal-500`
- Botón de stop: `from-rose-500 to-pink-500`
- Fondo: `from-green-100 via-emerald-50 to-teal-100`

### Dinosaurios y Opciones

Puedes añadir más dinosaurios, estilos o lecciones editando las constantes en `src/App.jsx`:

```javascript
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
const STYLES = [...]
const LESSONS = [...]
```

### Imágenes

Las imágenes de dinosaurios deben estar en formato PNG con fondo transparente y colocarse en `public/images/`. Se recomienda un tamaño de 64x64px para los iconos de selección.

## 🔒 Seguridad

El proyecto incluye múltiples capas de seguridad para proteger las APIs y controlar el acceso:

### Protección de API Keys
- Las API keys nunca se exponen al frontend
- Todas las llamadas a APIs externas se hacen desde Netlify Functions
- Las variables de entorno están protegidas en el servidor

### Control de Acceso
- **Validación de Origen (CORS)**: Configurable para restringir solicitudes a dominios autorizados
- **Rate Limiting**: Límites de solicitudes por IP para prevenir abuso
- **Sanitización de Errores**: Respuestas genéricas para evitar fuga de información interna

### Variables de Entorno de Seguridad
Puedes configurar el comportamiento de seguridad con las siguientes variables:

```env
# Activar modo estricto de seguridad (default: false)
SECURITY_STRICT=true

# Orígenes permitidos (separados por comas)
ALLOWED_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com

# Permitir deploy previews de Netlify (default: true)
ALLOW_NETLIFY_PREVIEWS=true

# Rate limiting por IP (solicitudes por minuto)
RATE_LIMIT_STORY_PER_MIN=10
RATE_LIMIT_AUDIO_PER_MIN=20
```

### Recomendaciones de Deploy
1. **Desarrollo**: Usa `SECURITY_STRICT=false` o no definas la variable
2. **Producción**: Activa `SECURITY_STRICT=true` con tus dominios configurados
3. **Previews**: Mantén `ALLOW_NETLIFY_PREVIEWS=true` para que funcionen los deploy previews

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 💡 Soporte

Si encuentras algún problema o tienes preguntas:

1. Verifica que todas las variables de entorno estén configuradas correctamente
2. Comprueba los logs de Netlify Functions en el dashboard
3. Para depurar audio en iOS, añade `?audioDebug` a la URL
4. Asegúrate que las imágenes PNG tengan fondo transparente

## 🌟 Créditos

- Diseño y desarrollo: Aplicación React moderna con UX optimizada
- IA de texto: Clarifai (GPT-4)
- IA de voz: ElevenLabs (acceso vía Clarifai)
- Framework: React + Vite
- Hosting: Netlify
- Iconos: Lucide React
- Estilos: Tailwind CSS

---

Hecho con 💚 para Lucas
