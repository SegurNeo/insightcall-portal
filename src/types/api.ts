// Tipos para la API de llamadas
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

export interface TranscriptMessage {
  role: 'agent' | 'user';
  message: string;
  time_in_call_secs: number;
  metadata: {
    is_agent: boolean;
    confidence?: number;
    language?: string;
    [key: string]: any;
  };
}

export interface CallListResponse {
  calls: Call[];
  total: number;
  page: number;
  per_page: number;
}

// Status types for our UI
export type CallStatus = 'completed' | 'processing' | 'failed' | 'all';

// Analysis types
export interface CallAnalysis {
  analysis_id: string;
  conversation_id: string;
  action_id: string;
  status: 'success' | 'error' | 'pending';
  details: string;
  metadata?: {
    confidence: number;
    priority: 'low' | 'medium' | 'high';
    context: string;
    requiredData: string[];
  } | null;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export type Conversation = Call; 