// Definiciones de tipos basadas en la documentación de segurneo_voice_api.md
// Estos tipos deben mantenerse sincronizados con los tipos reales en el proyecto segurneo-voice

export interface StoredCall {
  id: string; // UUID interno de Supabase en segurneo-voice
  external_call_id: string; // ID de ElevenLabs, usado como identificador principal para Nogal
  agent_id?: string | null;
  status?: string | null;
  start_time?: string | null; // ISO Date string
  end_time?: string | null; // ISO Date string
  duration_seconds?: number | null;
  created_at: string; // ISO Date string (creación en BD de segurneo-voice)
  updated_at: string; // ISO Date string (actualización en BD de segurneo-voice)
  last_event_at?: string | null; // ISO Date string (último evento procesado en segurneo-voice)
  metadata?: any | null; // Metadatos originales de ElevenLabs
}

export interface StoredTranscript {
  id: string; // UUID interno de Supabase en segurneo-voice
  external_call_id: string; // ID de ElevenLabs de la llamada padre
  speaker?: string | null; // 'user' o 'agent'
  text?: string | null;
  event_type?: string | null;
  segment_start_time?: number | null; // Segundos desde el inicio de la llamada
  received_at: string; // ISO Date string (cuando se guardó este segmento en segurneo-voice)
}

// Tipos de ElevenLabs (simplificados o según necesidad)
export interface ElevenLabsConversationDetail {
  agent_id: string;
  conversation_id: string;
  status: string;
  transcript: ElevenLabsTranscriptEntry[];
  metadata: ElevenLabsConversationMetadata;
  // Añadir más campos si son necesarios para Nogal
}

export interface ElevenLabsTranscriptEntry {
  role: 'user' | 'agent' | string;
  time_in_call_secs: number;
  message: string;
  // Añadir más campos si son necesarios
}

export interface ElevenLabsConversationMetadata {
  start_time_unix_secs: number;
  call_duration_secs: number;
  // Añadir más campos si son necesarios
} 