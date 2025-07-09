// 🎯 NUEVA ESTRUCTURA SIMPLE - TIPOS DE LLAMADAS
// Una sola interfaz clara para todo el sistema

export interface CallRecord {
  // 🆔 Identificadores
  id: string;                           // UUID interno de Nogal
  segurneo_call_id: string;            // call_id de Segurneo  
  conversation_id: string;             // conversation_id de ElevenLabs
  
  // 📞 Datos básicos de la llamada
  agent_id: string;
  start_time: string;                  // ISO timestamp
  end_time: string;                    // ISO timestamp  
  duration_seconds: number;
  status: 'completed' | 'failed' | 'in_progress';
  call_successful: boolean;
  termination_reason?: string;
  cost_cents: number;                  // Siempre en céntimos
  
  // 📊 Contadores de mensajes
  agent_messages: number;
  user_messages: number;
  total_messages: number;
  
  // 📝 Contenido
  transcript_summary: string;          // Siempre en español (traducido)
  transcripts: CallTranscript[];       // Array completo de mensajes
  
  // 🧠 Análisis IA (se rellena tras procesar)
  analysis_completed: boolean;
  ai_analysis: {
    tipo_incidencia: string;
    motivo_gestion: string; 
    confidence: number;
    prioridad: 'low' | 'medium' | 'high';
    resumen_analisis: string;
    datos_extraidos: Record<string, any>;
  } | null;
  
  // 🎫 Tickets generados
  tickets_created: number;
  ticket_ids: string[];
  
  // ⏰ Timestamps del sistema
  received_at: string;                 // Cuándo llegó el webhook
  processed_at?: string;               // Cuándo se completó el procesamiento
  created_at: string;
  updated_at: string;
}

export interface CallTranscript {
  sequence: number;
  speaker: 'agent' | 'user';
  message: string;
  segment_start_time: number;
  segment_end_time: number;
  confidence: number;
}

// 🎯 Payload que llega de Segurneo (según documentación)
export interface SegurneoWebhookPayload {
  call_id: string;
  conversation_id: string;
  agent_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  status: string;
  cost: number;                        // En céntimos
  termination_reason?: string;
  transcript_summary: string;          // Puede estar en inglés
  call_successful: boolean;
  participant_count: {
    agent_messages: number;
    user_messages: number;
    total_messages: number;
  };
  audio_available: boolean;
  created_at: string;
  transcripts: {
    sequence: number;
    speaker: 'agent' | 'user';
    message: string;
    segment_start_time: number;
    segment_end_time: number;
    confidence: number;
  }[];
} 