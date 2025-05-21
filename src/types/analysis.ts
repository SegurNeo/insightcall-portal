export type TicketActionType = 
  | 'DEVOLUCION_RECIBOS'
  | 'ANULACION_POLIZA'
  | 'REGULARIZACION_POLIZA'
  | 'CAMBIO_MEDIADOR'
  | 'CONTRASEÑAS';

export type TicketPriority = 'low' | 'medium' | 'high';

export interface TicketActionDetails {
  context: string;
  priority: TicketPriority;
  requiredData?: string[];
}

export interface TicketAction {
  type: TicketActionType;
  confidence: number;
  summary: string;
  details: TicketActionDetails;
}

export interface TranscriptionAnalysisResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  action?: TicketAction;
  error?: string;
}

export type CallAnalysis = {
  analysis_id: string;
  conversation_id: string;
  action_id: string;
  status: 'success' | 'error';
  details: string;
  metadata?: {
    confidence: number;
    priority: 'low' | 'medium' | 'high';
    context: string;
    requiredData: string[];
  };
}; 