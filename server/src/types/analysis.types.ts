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