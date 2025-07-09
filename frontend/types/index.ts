export interface Action {
  id: string;
  name: string;
  description?: string;
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

export interface CallAnalysis {
  analysis_id: string;
  conversation_id: string;
  action_id: string;
  status: 'success' | 'error';
  details: string;
  metadata?: {
    confidence?: number;
    priority?: string;
    context?: string;
    requiredData?: string[];
  };
} 