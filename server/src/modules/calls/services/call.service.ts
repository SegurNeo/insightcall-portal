// CallService – DESHABILITADO (sistema legacy eliminado)
import type { ProcessedCall } from '../../../types/supabase.types';
// import { callProcessingService } from '../../../services/call_processing_service'; // ELIMINADO

class CallService {
  async processByExternalId(externalCallId: string): Promise<ProcessedCall> {
    throw new Error('Legacy call processing discontinued. Use newCallProcessor instead.');
  }
}

export const callService = new CallService(); 