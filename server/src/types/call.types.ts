// 🎯 ESTRUCTURA FINAL OPTIMIZADA - TIPOS DE LLAMADAS
// Siguiendo mejores prácticas: nomenclatura clara, tipos estrictos, documentación

/**
 * 📞 Registro completo de una llamada en el sistema
 * Esta es la ÚNICA estructura de datos que maneja el sistema
 */
export interface Call {
  // 🆔 Identificadores únicos
  readonly id: string;                    // UUID generado por la DB
  readonly segurneo_call_id: string;      // ID de Segurneo
  readonly conversation_id: string;       // ID único de ElevenLabs (clave natural)
  
  // 👤 Información del agente
  readonly agent_id: string;
  
  // ⏱️ Información temporal
  readonly start_time: string;            // ISO 8601 timestamp
  readonly end_time: string;              // ISO 8601 timestamp  
  readonly duration_seconds: number;
  
  // 📊 Estado y resultado de la llamada
  readonly status: CallStatus;
  readonly call_successful: boolean;
  readonly termination_reason: string | null;
  
  // 💰 Información económica
  readonly cost_cents: number;            // Siempre en céntimos (1€ = 100 cents)
  
  // 📈 Métricas de participación
  readonly agent_messages: number;
  readonly user_messages: number;
  readonly total_messages: number;
  
  // 📝 Contenido de la llamada
  readonly transcript_summary: string;    // Resumen SIEMPRE en español
  readonly transcripts: CallTranscript[]; // Conversación completa
  
  // 🎵 Información de audio
  readonly audio_download_url: string | null;
  readonly audio_file_size: number | null;
  readonly fichero_llamada: string | null;
  
  // 🧠 Análisis de IA
  readonly analysis_completed: boolean;
  readonly ai_analysis: CallAnalysis | null;
  
  // 🎫 Gestión de tickets
  readonly tickets_created: number;
  readonly ticket_ids: readonly string[];
  
  // 🕐 Timestamps del sistema
  readonly received_at: string;           // Cuándo llegó el webhook
  readonly processed_at: string | null;  // Cuándo se completó el procesamiento
  readonly created_at: string;           // Cuándo se creó en DB
  readonly updated_at: string;           // Última actualización
}

/**
 * 📝 Segmento individual de transcripción
 */
export interface CallTranscript {
  readonly sequence: number;              // Orden en la conversación
  readonly speaker: Speaker;              // Quién habló
  readonly message: string;               // Contenido del mensaje
  readonly start_time: number;            // Segundos desde inicio de llamada
  readonly end_time: number;              // Segundos desde inicio de llamada
  readonly confidence: number;            // Confianza de la transcripción (0-1)
  // 🚀 DATOS ESTRUCTURADOS DE HERRAMIENTAS (para extracción de cliente)
  readonly tool_calls: readonly ToolCall[];
  readonly tool_results: readonly ToolResult[];
  readonly feedback: unknown | null;
}

/**
 * 🛠️ Llamada a herramienta estructurada
 */
export interface ToolCall {
  readonly type: string;
  readonly tool_name: string;
  readonly request_id: string;
  readonly tool_details: {
    readonly url: string;
    readonly body: string;
    readonly type: string;
    readonly method: string;
    readonly headers: Record<string, string>;
    readonly path_params: Record<string, unknown>;
    readonly query_params: Record<string, unknown>;
  };
  readonly params_as_json: string;
  readonly tool_has_been_called: boolean;
}

/**
 * 🎯 Resultado de herramienta estructurado
 */
export interface ToolResult {
  readonly type: string;
  readonly is_error: boolean;
  readonly tool_name: string;
  readonly request_id: string;
  readonly result_value: string;           // JSON string que contiene los datos del cliente
  readonly tool_latency_secs: number;
  readonly tool_has_been_called: boolean;
}

/**
 * 🧠 Resultado del análisis de IA
 */
export interface CallAnalysis {
  readonly incident_type: string;         // Tipo de incidencia detectada
  readonly management_reason: string;     // Motivo de gestión
  readonly confidence: number;            // Confianza del análisis (0-1)
  readonly priority: Priority;            // Prioridad asignada
  readonly summary: string;               // Resumen del análisis
  readonly extracted_data: Record<string, unknown>; // Datos extraídos
}

/**
 * 📥 Payload que llega desde Segurneo Voice
 */
export interface SegurneoWebhookPayload {
  readonly call_id: string;
  readonly conversation_id: string;
  readonly agent_id: string;
  readonly start_time: string;
  readonly end_time: string;
  readonly duration_seconds: number;
  readonly status: string;
  readonly cost: number;                  // En céntimos
  readonly termination_reason?: string;
  readonly transcript_summary: string;    // Puede venir en inglés
  readonly call_successful: boolean;
  readonly participant_count: {
    readonly agent_messages: number;
    readonly user_messages: number;
    readonly total_messages: number;
  };
  readonly audio_available: boolean;
  readonly created_at: string;
  
  // 🎵 Nuevos campos de audio desde Segurneo
  readonly audio_download_url?: string;
  readonly audio_file_size?: number;
  readonly ficheroLlamada?: string;
  
  readonly transcripts: readonly {
    readonly sequence: number;
    readonly speaker: 'agent' | 'user';
    readonly message: string;
    readonly segment_start_time: number;
    readonly segment_end_time: number;
    readonly confidence: number;
    // 🚀 CAMPOS ESTRUCTURADOS QUE LLEGAN DE SEGURNEO
    readonly tool_calls?: readonly ToolCall[];
    readonly tool_results?: readonly ToolResult[];
    readonly feedback?: unknown;
  }[];
}

/**
 * 📊 Estadísticas del sistema de llamadas
 */
export interface CallStats {
  readonly total_calls: number;
  readonly analyzed_calls: number;
  readonly average_duration: number;      // En segundos
  readonly total_cost_euros: number;      // En euros (convertido de céntimos)
  readonly analysis_success_rate: number; // Porcentaje 0-100
}

// 🏷️ Tipos auxiliares con valores específicos
export type CallStatus = 'completed' | 'failed' | 'in_progress';
export type Speaker = 'agent' | 'user';
export type Priority = 'low' | 'medium' | 'high';

/**
 * 🔧 Tipo para crear una nueva llamada (sin campos autogenerados)
 */
export type CreateCallData = Omit<Call, 
  | 'id' 
  | 'processed_at'
  | 'created_at' 
  | 'updated_at'
>;

/**
 * 🔄 Tipo para actualizar análisis de una llamada
 */
export interface UpdateCallAnalysis {
  readonly ai_analysis: CallAnalysis | null;
  readonly analysis_completed: boolean;
  readonly tickets_created: number;
  readonly ticket_ids: readonly string[];
  readonly processed_at: string;
} 