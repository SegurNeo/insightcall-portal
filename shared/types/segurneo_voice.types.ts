export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp?: number;
  confidence?: number;
  language?: string;
  metadata?: {
    is_agent?: boolean;
    confidence?: number;
    language?: string;
    [key: string]: any;
  };
}

export interface TranscriptMetadata {
  language?: string;
  audio_quality?: number;
  background_noise_level?: number;
  total_segments: number;
  is_complete: boolean;
}

export interface StoredCall {
  id: string;
  external_call_id: string;
  status: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  agent_id?: string;
  transcript?: TranscriptEntry[];
  transcript_metadata?: {
    total_segments?: number;
    is_complete?: boolean;
    language?: string;
    [key: string]: any;
  };
  call_metadata?: any;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface StoredTranscript {
  speaker: string;
  text: string;
  segment_start_time: number;
  confidence?: number;
  metadata?: {
    is_agent: boolean;
    confidence?: number;
    language?: string;
    [key: string]: any;
  };
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

export interface ElevenLabsConversationDetail {
  agent_id: string;
  conversation_id: string;
  status: string;
  transcript: ElevenLabsTranscriptEntry[];
  metadata: ElevenLabsConversationMetadata;
}

export interface SegurneoApiResponse<T> {
  message: string;
  data: T;
  pagination?: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
  };
}

export interface SegurneoApiBaseResponse {
  message: string;
}

export interface SegurneoSyncResponse extends SegurneoApiBaseResponse {
  conversation_id: string;
  details: ElevenLabsConversationDetail;
}

export interface SegurneoListCallsResponse extends SegurneoApiBaseResponse {
  data: StoredCall[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface SegurneoGetCallResponse extends SegurneoApiBaseResponse {
  data: StoredCall;
}

export interface SegurneoGetTranscriptsResponse extends SegurneoApiBaseResponse {
  externalCallId: string;
  data: StoredTranscript[];
}

export interface SegurneoHealthResponse {
  status: string;
  message: string;
  timestamp: string;
} 