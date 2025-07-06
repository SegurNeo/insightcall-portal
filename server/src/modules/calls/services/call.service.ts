// CallService – thin wrapper around legacy callProcessingService
import type { ProcessedCall } from '@/types/supabase.types';
import { callProcessingService } from '@/services/call_processing_service';

class CallService {
  async processByExternalId(externalCallId: string): Promise<ProcessedCall> {
    return callProcessingService.processCallByExternalId(externalCallId);
  }
}

export const callService = new CallService(); 