# Segurneo Voice Gateway - API Documentation

## Base URL

La URL base para todos los endpoints de la API v1 es:
`https://segurneo-voice.onrender.com/api/v1`

## Autenticación

Todas las rutas, excepto `/health`, requieren autenticación mediante una API Key.
La API Key debe ser enviada en la cabecera HTTP `X-API-Key`.

**Ejemplo de Cabecera:**
`X-API-Key: tu-api-key-secreta`

Si la API Key falta o es inválida, la API devolverá:
*   `401 Unauthorized`: Si falta la cabecera `X-API-Key`.
*   `403 Forbidden`: Si la API Key proporcionada es inválida.

---

## Endpoints

### 1. Health Check

*   **Método:** `GET`
*   **Ruta:** `/health`
*   **Descripción:** Verifica el estado de salud de la API. No requiere autenticación.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "status": "OK",
      "message": "API v1 is healthy.",
      "timestamp": "2023-10-27T10:00:00.000Z"
    }
    ```

### 2. Llamadas (Calls)

#### 2.1 Listar Llamadas

*   **Método:** `GET`
*   **Ruta:** `/calls`
*   **Autenticación:** Requerida
*   **Parámetros de Consulta:**
    *   `page` (opcional, número): Número de página. Default: `1`
    *   `pageSize` (opcional, número): Tamaño de página. Default: `20`
    *   `status` (opcional, string): Filtro por estado
    *   `startDate` (opcional, string): Fecha inicio (YYYY-MM-DD)
    *   `endDate` (opcional, string): Fecha fin (YYYY-MM-DD)
    *   `agentId` (opcional, string): ID del agente
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "message": "Calls retrieved successfully.",
      "data": [
        {
          "id": "uuid",
          "external_call_id": "call-123",
          "agent_id": "agent-456",
          "status": "completed",
          "start_time": "2024-05-20T10:00:00Z",
          "end_time": "2024-05-20T10:05:00Z",
          "duration_seconds": 300,
          "created_at": "2024-05-20T10:00:00Z",
          "updated_at": "2024-05-20T10:05:00Z"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 100,
        "totalPages": 5
      }
    }
    ```

#### 2.2 Obtener Detalles de Llamada con Transcripción

*   **Método:** `GET`
*   **Ruta:** `/calls/:externalCallId`
*   **Autenticación:** Requerida
*   **Descripción:** Obtiene todos los detalles de una llamada, incluyendo su transcripción completa.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "message": "Call details and transcript retrieved successfully.",
      "data": {
        "id": "uuid",
        "external_call_id": "call-123",
        "agent_id": "agent-456",
        "status": "completed",
        "start_time": "2024-05-20T10:00:00Z",
        "end_time": "2024-05-20T10:05:00Z",
        "duration_seconds": 300,
        "created_at": "2024-05-20T10:00:00Z",
        "updated_at": "2024-05-20T10:05:00Z",
        "last_event_at": "2024-05-20T10:05:00Z",
        
        "transcript": [
          {
            "speaker": "agent",
            "text": "Buenos días, ¿en qué puedo ayudarle?",
            "timestamp": 0,
            "confidence": 0.98
          },
          {
            "speaker": "user",
            "text": "Hola, quería consultar sobre mi póliza",
            "timestamp": 3.5,
            "confidence": 0.95
          }
        ],
        
        "transcript_metadata": {
          "language": "es",
          "audio_quality": 0.92,
          "background_noise_level": 0.05,
          "total_segments": 2,
          "is_complete": true
        },
        
        "call_metadata": {
          // Metadatos adicionales específicos de la llamada
        }
      }
    }
    ```

#### 2.3 Buscar en Transcripciones

*   **Método:** `GET`
*   **Ruta:** `/calls/transcripts/search`
*   **Autenticación:** Requerida
*   **Parámetros de Consulta:**
    *   `term` (requerido, string): Término a buscar
    *   `page` (opcional, número): Número de página. Default: `1`
    *   `pageSize` (opcional, número): Tamaño de página. Default: `20`
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "message": "Search results retrieved successfully.",
      "data": [
        {
          "external_call_id": "call-123",
          "speaker": "user",
          "text": "quería consultar sobre mi póliza",
          "timestamp": 3.5
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 1,
        "totalPages": 1
      }
    }
    ```

## Guía de Integración

### 1. Verificación Inicial

```bash
curl https://segurneo-voice.onrender.com/api/v1/health
```

### 2. Autenticación

```bash
curl -H "X-API-Key: tu-api-key" https://segurneo-voice.onrender.com/api/v1/calls
```

### 3. Ejemplo de Integración en TypeScript

```typescript
interface TranscriptEntry {
  speaker: 'user' | 'agent';
  text: string;
  timestamp: number;
  confidence?: number;
}

interface CallWithTranscript {
  // Detalles básicos de la llamada
  id: string;
  external_call_id: string;
  agent_id: string;
  status: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  
  // Transcripción
  transcript: TranscriptEntry[];
  transcript_metadata: {
    language?: string;
    audio_quality?: number;
    background_noise_level?: number;
    total_segments: number;
    is_complete: boolean;
  };
  
  // Metadatos
  call_metadata: any;
}

class SegurneoVoiceAPI {
  private baseUrl = 'https://segurneo-voice.onrender.com/api/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCall(externalCallId: string): Promise<CallWithTranscript> {
    return this.fetch<CallWithTranscript>(`/calls/${externalCallId}`);
  }

  async searchTranscripts(term: string, page = 1, pageSize = 20) {
    return this.fetch(`/calls/transcripts/search?term=${encodeURIComponent(term)}&page=${page}&pageSize=${pageSize}`);
  }
}

// Ejemplo de uso
const api = new SegurneoVoiceAPI('tu-api-key');

// Obtener detalles completos de una llamada
const call = await api.getCall('call-123');
console.log('Detalles de la llamada:', call);
console.log('Transcripción completa:', call.transcript);
console.log('Duración:', call.duration_seconds, 'segundos');
console.log('Calidad de audio:', call.transcript_metadata.audio_quality);

// Buscar en transcripciones
const searchResults = await api.searchTranscripts('póliza');
console.log('Resultados de búsqueda:', searchResults);
```

### 4. Manejo de Errores

La API utiliza códigos de estado HTTP estándar:

- `200`: Éxito
- `400`: Error en la petición (parámetros inválidos)
- `401`: Falta la API Key
- `403`: API Key inválida
- `404`: Recurso no encontrado
- `500`: Error interno del servidor

### 5. Recomendaciones

1. **Almacenamiento de API Key:**
   - Usar variables de entorno
   - No hardcodear en el código
   - Rotar periódicamente

2. **Manejo de Errores:**
   - Implementar retry con backoff exponencial
   - Loguear errores para debugging
   - Monitorizar códigos de respuesta

3. **Optimización:**
   - Cachear resultados frecuentes
   - Usar paginación adecuadamente
   - Implementar rate limiting en el cliente

4. **Seguridad:**
   - Usar HTTPS siempre
   - Validar certificados SSL
   - No loguear API Keys ni datos sensibles 