export interface TranscriptMessage {
  role: 'user' | 'agent' | string;
  message: string;
  timestamp?: number;
} 