// Common types used across the application

export interface TranscriptMessage {
  role: string;
  message: string;
  time_in_call_secs?: number;
  metadata?: {
    is_agent?: boolean;
    confidence?: number;
    [key: string]: any;
  };
}

export interface BaseResponse {
  success: boolean;
  message: string;
  timestamp?: string;
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  errors: string[];
}

export interface SuccessResponse<T = any> extends BaseResponse {
  success: true;
  data?: T;
}

export interface CallAnalysis {
  sentiment: string;
  topics: string[];
  summary: string;
  confidence: number;
  status: string;
} 