// Tipos para la API de llamadas
import { CallStatus as SharedCallStatus, TranscriptMessage, CallAnalysis } from '@shared/types/common.types';

// Expandimos el CallStatus para incluir la opción 'all' usada sólo en UI
export type CallStatus = SharedCallStatus | 'all';

export interface CallMetadata {
  start_time_unix_secs: number;
  call_duration_secs: number;
  agent_name: string;
  agent_id?: string;
  audio_quality?: number;
  background_noise_level?: number;
  language?: string;
  total_segments?: number;
  is_transcript_complete?: boolean;
}

export interface Call {
  call_id: string;
  conversation_id: string;
  status: CallStatus;
  call_successful: 'success' | 'failed';
  call_duration_secs: number;
  start_time_unix_secs: number;
  metadata: CallMetadata;
  ticket?: {
    id: string;
    type: string;
    status: string;
  } | null;
  transcript?: TranscriptMessage[];
}

export interface CallListResponse {
  calls: Call[];
  total: number;
  page: number;
  per_page: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export type Conversation = Call;

// Reexportamos para mantener compatibilidad con importaciones existentes
export type { TranscriptMessage, CallAnalysis }; 