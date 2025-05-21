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

### 2. Tareas (Tasks)

#### 2.1 Sincronizar Conversación Específica de ElevenLabs

*   **Método:** `POST`
*   **Ruta:** `/tasks/elevenlabs/conversations/sync`
*   **Autenticación:** Requerida.
*   **Descripción:** Dispara la obtención y almacenamiento de los detalles de una conversación específica desde la API de ElevenLabs hacia la base de datos del Gateway.
*   **Cuerpo de la Solicitud (Request Body - `application/json`):**
    ```json
    {
      "conversation_id": "string (ID de la conversación en ElevenLabs)"
    }
    ```
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "message": "ElevenLabs conversation data synchronized successfully.",
      "conversation_id": "ID_DE_ELEVENLABS_PROCESADO",
      "details": { /* Objeto ElevenLabsConversationDetail completo */ }
    }
    ```
*   **Errores Comunes:**
    *   `400 Bad Request`: Si `conversation_id` falta o es inválido (ver cuerpo de error para detalles de Zod).
    *   `401 Unauthorized` / `403 Forbidden`: Problemas de API Key.
    *   `500 Internal Server Error`: Si hay problemas obteniendo datos de ElevenLabs o guardando en la base de datos.

### 3. Llamadas (Calls)

#### 3.1 Listar Llamadas Almacenadas

*   **Método:** `GET`
*   **Ruta:** `/calls`
*   **Autenticación:** Requerida.
*   **Descripción:** Obtiene una lista paginada de todas las llamadas almacenadas en el Gateway.
*   **Parámetros de Consulta (Query Parameters):**
    *   `page` (opcional, número): Número de página. Default: `1`.
    *   `pageSize` (opcional, número): Tamaño de la página. Default: `20`.
    *   `status` (opcional, string): Filtra llamadas por su estado (ej. `completed`, `done`, `processing`).
    *   `startDate` (opcional, string): Filtra llamadas que comenzaron en o después de esta fecha (formato `YYYY-MM-DD`).
    *   `endDate` (opcional, string): Filtra llamadas que comenzaron en o antes de esta fecha (formato `YYYY-MM-DD`).
    *   `agentId` (opcional, string): Filtra llamadas por el `agent_id` de ElevenLabs.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "message": "Calls retrieved successfully.",
      "data": [
        { /* Objeto StoredCall */ },
        { /* Objeto StoredCall */ }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 20,
        "totalItems": 100,
        "totalPages": 5
      }
    }
    ```
    (Ver `src/services/call.service.ts` para la estructura de `StoredCall`)
*   **Errores Comunes:**
    *   `400 Bad Request`: Parámetros de paginación o filtro inválidos.
    *   `401 Unauthorized` / `403 Forbidden`: Problemas de API Key.
    *   `500 Internal Server Error`: Error al consultar la base de datos.

#### 3.2 Obtener Detalles de una Llamada Específica

*   **Método:** `GET`
*   **Ruta:** `/calls/:externalCallId`
*   **Autenticación:** Requerida.
*   **Descripción:** Obtiene los detalles de una llamada específica almacenada, usando su `external_call_id` (el ID de la conversación de ElevenLabs).
*   **Parámetros de Ruta:**
    *   `externalCallId` (string, requerido): El ID externo de la llamada.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "message": "Call details retrieved successfully.",
      "data": { /* Objeto StoredCall completo */ }
    }
    ```
*   **Errores Comunes:**
    *   `401 Unauthorized` / `403 Forbidden`: Problemas de API Key.
    *   `404 Not Found`: Si no se encuentra una llamada con el `externalCallId` proporcionado.
    *   `500 Internal Server Error`.

#### 3.3 Obtener Transcripciones de una Llamada Específica

*   **Método:** `GET`
*   **Ruta:** `/calls/:externalCallId/transcripts`
*   **Autenticación:** Requerida.
*   **Descripción:** Obtiene todas las entradas de transcripción para una llamada específica.
*   **Parámetros de Ruta:**
    *   `externalCallId` (string, requerido): El ID externo de la llamada.
*   **Respuesta Exitosa (200 OK):**
    ```json
    {
      "message": "Transcripts retrieved successfully.",
      "externalCallId": "ID_DE_LA_LLAMADA",
      "data": [
        { /* Objeto StoredTranscript */ },
        { /* Objeto StoredTranscript */ }
      ]
    }
    ```
    (Ver `src/services/call.service.ts` para la estructura de `StoredTranscript`)
*   **Errores Comunes:**
    *   `401 Unauthorized` / `403 Forbidden`: Problemas de API Key.
    *   `404 Not Found`: Si la llamada principal con `externalCallId` no existe.
    *   `500 Internal Server Error`.

---

## Tipos de Datos Relevantes (Referencia)

Estos tipos están definidos en el código fuente y pueden ser útiles para entender los payloads.

### `StoredCall` (en `src/services/call.service.ts`)

```typescript
export interface StoredCall {
  id: string; // UUID interno de Supabase
  external_call_id: string; // ID de ElevenLabs
  agent_id?: string | null; // ID del agente de ElevenLabs
  status?: string | null;
  start_time?: string | null; // ISO Date string
  end_time?: string | null; // ISO Date string
  duration_seconds?: number | null;
  created_at: string; // ISO Date string (creación en nuestra BD)
  updated_at: string; // ISO Date string (actualización en nuestra BD)
  last_event_at?: string | null; // ISO Date string (último evento procesado)
  metadata?: any | null; // Metadatos originales de ElevenLabs
}
```

### `StoredTranscript` (en `src/services/call.service.ts`)

```typescript
export interface StoredTranscript {
  id: string; // UUID interno de Supabase
  external_call_id: string; // ID de ElevenLabs de la llamada padre
  speaker?: string | null; // 'user' o 'agent' (mapeado desde 'role')
  text?: string | null; // Contenido del mensaje
  event_type?: string | null; // Ej. 'transcript.entry'
  segment_start_time?: number | null; // Segundos desde el inicio de la llamada
  received_at: string; // ISO Date string (cuando se guardó este segmento)
}
```

### `ElevenLabsConversationDetail` (en `src/types/elevenlabs.types.ts`)

Este es el tipo de objeto que `elevenLabsService.getConversationDetails()` devuelve y que se usa para poblar `StoredCall` y `StoredTranscript`. También es lo que se devuelve en el endpoint `/tasks/elevenlabs/conversations/sync` bajo la clave `details`.

```typescript
export interface ElevenLabsConversationDetail {
  agent_id: string;
  conversation_id: string;
  status: string;
  transcript: ElevenLabsTranscriptEntry[];
  metadata: ElevenLabsConversationMetadata;
}

export interface ElevenLabsTranscriptEntry {
  role: 'user' | 'agent' | string;
  time_in_call_secs: number;
  message: string;
}

export interface ElevenLabsConversationMetadata {
  start_time_unix_secs: number;
  call_duration_secs: number;
}
``` 