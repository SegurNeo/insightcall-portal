// Voice Calls Types - Copied from shared types for server use

export interface VoiceCallPayload {
  call_id: string;
  conversation_id: string;
  agent_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  status: 'completed' | 'failed' | 'abandoned';
  cost: number;
  termination_reason?: string;
  transcript_summary?: string;
  call_successful: boolean;
  participant_count: {
    agent_messages: number;
    user_messages: number;
    total_messages: number;
  };
  audio_available: boolean;
  created_at: string;
}

export interface VoiceCallResponse {
  success: boolean;
  message: string;
  call_id?: string;
  nogal_internal_id?: string;
  data?: any;
  errors?: string[];
}

export interface TestScenario {
  name: string;
  description: string;
  payload: VoiceCallPayload;
  expectedStatus: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const VOICE_CALL_STATUSES = ['completed', 'failed', 'abandoned'] as const; 