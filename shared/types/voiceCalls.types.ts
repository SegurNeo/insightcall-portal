/**
 * Tipos compartidos para el sistema de Voice Calls
 * Usados tanto en frontend como backend
 */

// Payload que recibe el endpoint /api/calls
export interface VoiceCallPayload {
  call_id: string; // UUID de Segurneo
  conversation_id: string; // ID de ElevenLabs
  agent_id: string;
  start_time: string; // ISO8601
  end_time: string; // ISO8601
  duration_seconds: number;
  status: 'completed' | 'failed' | 'abandoned';
  cost: number; // en céntimos
  termination_reason?: string;
  transcript_summary?: string;
  call_successful: boolean;
  participant_count: {
    agent_messages: number;
    user_messages: number;
    total_messages: number;
  };
  audio_available: boolean;
  created_at: string; // ISO8601
}

// Respuesta del endpoint
export interface VoiceCallResponse {
  success: boolean;
  message: string;
  call_id?: string;
  nogal_internal_id?: string;
  errors?: string[];
}

// Para testing - diferentes escenarios
export interface TestScenario {
  name: string;
  description: string;
  payload: VoiceCallPayload;
  expectedStatus: number;
  expectedResponse?: Partial<VoiceCallResponse>;
}

// Estados válidos
export const VOICE_CALL_STATUSES = ['completed', 'failed', 'abandoned'] as const;
export type VoiceCallStatus = typeof VOICE_CALL_STATUSES[number];

// Validation helpers
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Para el frontend - estado de la llamada en la UI
export interface VoiceCallUIState {
  isLoading: boolean;
  error: string | null;
  lastResponse: VoiceCallResponse | null;
  testResults: Array<{
    scenario: string;
    status: 'pending' | 'success' | 'error';
    response?: VoiceCallResponse;
    error?: string;
  }>;
} 