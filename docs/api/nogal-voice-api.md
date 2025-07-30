# Nogal Voice - Sistema de Procesamiento de Llamadas

Sistema completo para procesar, analizar y gestionar llamadas de ElevenLabs, incluyendo backend API y frontend dashboard.

## Estructura del Proyecto

```
insightcall-portal/
├── server/          # Backend API
│   ├── src/
│   │   ├── services/      # Servicios de procesamiento
│   │   ├── types/        # Definiciones de tipos
│   │   └── config/       # Configuración
│   └── README.md         # Documentación del backend
└── client/          # Frontend Dashboard
    ├── src/
    │   ├── components/   # Componentes React
    │   ├── services/     # Servicios y API
    │   └── types/       # Tipos TypeScript
    └── README.md         # Documentación del frontend
```

## Componentes del Sistema

### Backend API

- **Procesamiento de Llamadas**
  - Integración con Segurneo Voice Gateway
  - Análisis de transcripciones con Gemini AI
  - Generación automática de tickets

- **Base de Datos**
  - Supabase para almacenamiento
  - Tablas:
    - `processed_calls`: Llamadas procesadas
    - `tickets`: Tickets generados

- **API Endpoints**
  - `POST /api/calls/process/:externalCallId`
  - `GET /api/calls/:externalCallId`
  - `GET /api/calls/:externalCallId/tickets`

### Frontend Dashboard

- **Características**
  - Lista de llamadas con filtros
  - Visor de transcripciones
  - Gestión de tickets
  - Análisis en tiempo real

## Requisitos

### Backend
- Node.js >= 18
- npm >= 9
- Cuenta de Supabase
- API Key de Segurneo Voice Gateway
- API Key de Google Gemini

### Frontend
- Node.js >= 18
- npm >= 9
- Acceso a la API del backend

## Configuración

### Backend

1. Configurar variables de entorno:
```bash
cd server
cp .env.example .env
```

```env
PORT=3000
NODE_ENV=development

# Supabase
NOGAL_SUPABASE_URL=<url>
NOGAL_SUPABASE_SERVICE_KEY=<key>

# Segurneo Voice Gateway
SEGURNEO_VOICE_API_KEY=<key>
SEGURNEO_VOICE_BASE_URL=https://segurneo-voice.onrender.com/api/v1

# Gemini
GEMINI_API_KEY=<key>
```

2. Instalar y ejecutar:
```bash
npm install
npm run dev
```

### Frontend

1. Configurar variables de entorno:
```bash
cd client
cp .env.example .env
```

```env
NEXT_PUBLIC_SUPABASE_URL=<url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<key>
NEXT_PUBLIC_API_URL=<backend-url>
```

2. Instalar y ejecutar:
```bash
npm install
npm run dev
```

## Desarrollo

### Backend
```bash
cd server
npm run dev     # Desarrollo
npm run build   # Construir
npm start       # Producción
```

### Frontend
```bash
cd client
npm run dev     # Desarrollo
npm run build   # Construir
npm start       # Producción
```

## Base de Datos

### Tabla: processed_calls
- `id`: UUID
- `segurneo_external_call_id`: ID externo
- `status`: Estado del procesamiento
- `segurneo_call_details`: Detalles de la llamada
- `segurneo_transcripts`: Transcripciones
- `analysis_results`: Resultados del análisis
- `ticket_id`: ID del ticket generado

### Tabla: tickets
- `id`: UUID
- `conversation_id`: ID de la llamada
- `type`: Tipo de ticket
- `status`: Estado del ticket
- `priority`: Prioridad
- `description`: Descripción
- `metadata`: Metadatos adicionales

## Despliegue

### Backend
- Recomendado: Render.com
- Requisitos:
  - Variables de entorno configuradas
  - Node.js >= 18

### Frontend
- Recomendado: Vercel
- Requisitos:
  - Variables de entorno configuradas
  - Next.js compatible

### Base de Datos
- Supabase (ya configurado)
- Proyecto: nogal-voice

## Contribuir

1. Crear rama feature
2. Implementar cambios
3. Pruebas
4. Pull request

## Licencia

Privado y confidencial. Todos los derechos reservados. 