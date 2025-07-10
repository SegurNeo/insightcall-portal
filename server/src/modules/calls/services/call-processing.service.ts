import { v4 as uuidv4 } from 'uuid';
import { ProcessedCall, ProcessedCallInsert, Json } from '../../../types/supabase.types';
import { StoredTranscript } from '../../../types/segurneo_voice.types';
import { ProcessedCallsRepository } from '../repositories/processed-calls.repository';
import { segurneoVoiceClient, nogalApiClient } from '../../shared/infra';
import { analysisService } from '../../analysis/services/analysis.service';
import { ticketClassifierService } from '../../../services/ticketClassifierService';
import { ticketService } from '../../../services/ticketService';
import { ticketDefinitions } from '../../../utils/ticketDefinitions';
import type { NogalTicketPayload } from '../../../types/nogal_tickets.types';

interface TranscriptMessage {
  role: string;
  message: string;
}

interface TicketSuggestion {
  score: number;
  id_definicion: string;
  justification: string;
}

export class CallProcessingService {
  constructor(
    private readonly processedCallsRepository: ProcessedCallsRepository = new ProcessedCallsRepository()
  ) {}

  private mapSegurneoTranscriptToTranscriptMessages(transcripts: StoredTranscript[]): TranscriptMessage[] {
    return transcripts.map(t => ({
      role: t.speaker || 'unknown',
      message: t.text || '',
    }));
  }

  async processCallByExternalId(externalCallId: string): Promise<ProcessedCall> {
    let nogalCall: ProcessedCall | null = null;
    const processingLog: string[] = [`[${new Date().toISOString()}] Starting processing for externalCallId: ${externalCallId}`];

    try {
      // 1. Check if already processed
      nogalCall = await this.processedCallsRepository.findByExternalId(externalCallId);

      if (nogalCall?.status === 'completed') {
        processingLog.push(`[${new Date().toISOString()}] Call already processed with status 'completed'. Returning existing data.`);
        return nogalCall;
      }

      const nogalCallId = nogalCall?.id || uuidv4();
      const initialStatus = 'pending_sync' as const;

      if (nogalCall) {
        nogalCall.status = initialStatus;
        nogalCall.processing_log = [...(nogalCall.processing_log || []), ...processingLog];
      } else {
        const newCall: ProcessedCallInsert = {
          id: nogalCallId,
          segurneo_external_call_id: externalCallId,
          status: initialStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          processing_log: processingLog,
        };
        nogalCall = await this.processedCallsRepository.create(newCall);
      }

      // 2. Sync with Segurneo Voice Gateway
      processingLog.push(`[${new Date().toISOString()}] Syncing with Segurneo Voice Gateway`);
      await segurneoVoiceClient.syncElevenLabsConversation(externalCallId);

      // 3. Fetch data from Segurneo Voice Gateway
      const [callDetails, transcripts] = await Promise.all([
        segurneoVoiceClient.getCallDetails(externalCallId),
        segurneoVoiceClient.getCallTranscripts(externalCallId)
      ]);

      nogalCall = await this.processedCallsRepository.update(nogalCall.id, {
        segurneo_call_details: callDetails as unknown as Json,
        segurneo_transcripts: transcripts as unknown as Json,
        status: 'pending_analysis',
        updated_at: new Date().toISOString(),
        processing_log: [...(nogalCall.processing_log || []), `[${new Date().toISOString()}] Data fetched from Segurneo Voice Gateway`]
      });

      // 4. Analyze Transcripts
      if (!transcripts || transcripts.length === 0) {
        throw new Error('No transcripts available for analysis');
      }

      const messagesToAnalyze = this.mapSegurneoTranscriptToTranscriptMessages(transcripts);
      const [analysisResult, classification] = await Promise.all([
        analysisService.analyzeTranscript(messagesToAnalyze, externalCallId),
        ticketClassifierService.classifyTranscript(messagesToAnalyze)
      ]);

      // 5. Create tickets for high confidence suggestions
      const suggestionsToCreate = ((classification.suggestions || []) as TicketSuggestion[]).filter(s => s.score >= 0.5);
      const createdTicketIds: string[] = [];

      for (const suggestion of suggestionsToCreate) {
        const def = ticketDefinitions.find(d => d.id === suggestion.id_definicion);
        if (!def) continue;

        const now = new Date();
        const idTicket = uuidv4();
        const payload: NogalTicketPayload = {
          "Fecha envío": now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          "Hora envío": now.toLocaleTimeString('es-ES'),
          "IdCliente": (nogalCall.segurneo_call_details as any)?.customerId || 'UNKNOWN',
          "IdTicket": idTicket,
          "TipoIncidencia": def.tipoIncidencia,
          "MotivoIncidencia": def.motivoIncidencia,
          "Notas": `${suggestion.justification}`,
        };

        try {
          const { ticketId } = await nogalApiClient.createTicket(payload);
          const internalTicket = await ticketService.createTicket({
            conversation_id: nogalCall.id,
            description: suggestion.justification,
            tipo_incidencia: def.tipoIncidencia,
            motivo_incidencia: def.motivoIncidencia,
            priority: 'medium',
            status: 'created',
            metadata: { externalTicketId: ticketId, score: suggestion.score }
          });
          createdTicketIds.push(internalTicket.id);
        } catch (error: any) {
          processingLog.push(`[${new Date().toISOString()}] Error creating ticket: ${error.message}`);
        }
      }

      // 6. Update final status
      return await this.processedCallsRepository.update(nogalCall.id, {
        analysis_results: analysisResult as unknown as Json,
        ai_intent: classification.rawResponse as unknown as Json,
        ticket_suggestions: classification.suggestions as unknown as Json,
        ticket_ids: createdTicketIds,
        status: 'completed',
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        processing_error: null,
        processing_log: [...(nogalCall.processing_log || []), `[${new Date().toISOString()}] Processing completed successfully`]
      });

    } catch (error: any) {
      const errorMessage = `Processing error: ${error.message}`;
      if (nogalCall) {
        await this.processedCallsRepository.update(nogalCall.id, {
          status: 'failed',
          processing_error: errorMessage,
          updated_at: new Date().toISOString(),
          processing_log: [...(nogalCall.processing_log || []), `[${new Date().toISOString()}] ${errorMessage}`]
        });
      }
      throw error;
    }
  }
} 