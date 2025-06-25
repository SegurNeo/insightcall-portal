export type CallStatus = 'completed' | 'processing' | 'failed' | 'error';

export interface TranscriptMessage {
  role: 'agent' | 'user' | string;
  message: string;
  /**
   * Marca temporal en la llamada (segundos desde el inicio).
   */
  time_in_call_secs?: number;
  /** timestamp absoluto (fallback) */
  timestamp?: number;
  metadata?: {
    is_agent?: boolean;
    confidence?: number;
    language?: string;
    [key: string]: any;
  };
}

export interface CallAnalysis {
  analysis_id: string;
  conversation_id: string;
  action_id: string;
  status: 'success' | 'error' | 'pending';
  details: string;
  metadata?: {
    confidence?: number;
    priority?: 'low' | 'medium' | 'high';
    context?: string;
    requiredActions?: string[];
    [key: string]: any;
  } | null;
}

// Otros tipos compartidos se pueden ir añadiendo aquí a medida que sea necesario.