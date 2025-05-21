import { StoredCall as SegurneoStoredCall, StoredTranscript as SegurneoStoredTranscript } from './segurneo_voice.types';

// TODO: Refactor CallAnalysis and Ticket to be imported from their own type definition files
// For now, using 'any' as a placeholder.
// import { CallAnalysis } from './analysis.types'; 
// import { Ticket } from './ticket.types';

export interface NogalProcessedCall {
  id: string; // UUID interno de Nogal, primary key
  segurneo_external_call_id: string; // El external_call_id de Segurneo Voice (ElevenLabs conversation_id)
  
  status: 'pending_sync' | 'pending_analysis' | 'processing' | 'completed' | 'error'; // Estado del procesamiento en Nogal
  
  // Datos obtenidos de Segurneo Voice API
  segurneo_call_details?: SegurneoStoredCall | null; 
  segurneo_transcripts?: SegurneoStoredTranscript[] | null;

  // Resultados del análisis de Gemini
  // TODO: Replace 'any' with a proper CallAnalysis type once it's centralized
  analysis_results?: any | null; 

  // Información del ticket creado en el sistema de Nogal
  // TODO: Replace 'any' with a proper Ticket type or Ticket ID reference once Ticket type is centralized
  ticket_id?: string | null; 

  processing_error?: string | null; // Para almacenar mensajes de error si el status es 'error'
  processing_log?: string[]; // Log de eventos durante el procesamiento en Nogal
  
  created_at: string; // ISO Date string (creación en BD de Nogal)
  updated_at: string; // ISO Date string (actualización en BD de Nogal)
  processed_at?: string | null; // ISO Date string (cuando se completó el procesamiento)
} 