// @ts-nocheck
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/supabase/client';
import { segurneoGatewayClient } from './gateway_client';
import { analysisService } from '@modules/analysis';
import { ticketService } from './ticketService';
import { ProcessedCall, ProcessedCallInsert, TicketInsert, Json } from '@/types/supabase.types';
import { StoredCall, StoredTranscript } from '@/types/segurneo_voice.types';
import { ticketClassifierService } from './ticketClassifierService';
import { ticketDefinitions } from '../utils/ticketDefinitions';
import { nogalApiService } from './nogalApiService';
import type { NogalTicketPayload } from '../types/nogal_tickets.types';

// Placeholder for TranscriptMessage type expected by AnalysisService
// TODO: Centralize this type definition (e.g., in src/types/index.ts or src/types/analysis.types.ts)
interface TranscriptMessage {
  role: string;
  message: string;
  // Potentially other fields if analysisService evolves
}

const PROCESSED_CALLS_TABLE = 'processed_calls';

class CallProcessingService {

  private mapSegurneoTranscriptToTranscriptMessages(transcripts: StoredTranscript[]): TranscriptMessage[] {
    return transcripts.map(t => ({
      role: t.speaker || 'unknown', // Map speaker to role, default if null
      message: t.text || '', // Map text to message, default if null
    }));
  }

  async processCallByExternalId(externalCallId: string): Promise<ProcessedCall> {
    let nogalCall: ProcessedCall | null = null;
    const processingLog: string[] = [`[${new Date().toISOString()}] Starting processing for externalCallId: ${externalCallId}`];

    try {
      // 1. Check if already processed in Nogal's DB
      const { data: existingCall, error: fetchError } = await supabase
        .from(PROCESSED_CALLS_TABLE)
        .select('*')
        .eq('segurneo_external_call_id', externalCallId)
        .maybeSingle();

      if (fetchError) {
        processingLog.push(`[${new Date().toISOString()}] Error fetching existing call: ${fetchError.message}`);
        throw new Error(`DB error checking existing call: ${fetchError.message}`);
      }

      if (existingCall && existingCall.status === 'completed') {
        processingLog.push(`[${new Date().toISOString()}] Call already processed with status 'completed'. Returning existing data.`);
        return existingCall as ProcessedCall;
      }
      
      const nogalCallId = existingCall?.id || uuidv4();
      const initialStatus = 'pending_sync' as const;

      if (existingCall) {
        nogalCall = existingCall as ProcessedCall;
        nogalCall.status = initialStatus; // Reset status for reprocessing if needed
        nogalCall.processing_log = [...(nogalCall.processing_log || []), ...processingLog, `[${new Date().toISOString()}] Resuming processing for existing Nogal call ID: ${nogalCallId}`];
      } else {
        const newCall: ProcessedCallInsert = {
          id: nogalCallId,
          segurneo_external_call_id: externalCallId,
          status: initialStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          processing_log: processingLog,
        };
        const { error: insertError } = await supabase.from(PROCESSED_CALLS_TABLE).insert(newCall);
        if (insertError) {
          processingLog.push(`[${new Date().toISOString()}] Error inserting initial Nogal call record: ${insertError.message}`);
          throw new Error(`DB error inserting initial record: ${insertError.message}`);
        }

        // Fetch the newly created record
        const { data: createdCall, error: fetchNewError } = await supabase
          .from(PROCESSED_CALLS_TABLE)
          .select('*')
          .eq('id', nogalCallId)
          .single();

        if (fetchNewError || !createdCall) {
          throw new Error('Failed to fetch newly created call record');
        }

        nogalCall = createdCall as ProcessedCall;
      }
      processingLog.push(`[${new Date().toISOString()}] Nogal call record ensured with ID: ${nogalCallId} and status: ${initialStatus}`);

      // 2. Sync with Segurneo Voice Gateway
      processingLog.push(`[${new Date().toISOString()}] Attempting to sync conversation with Segurneo Voice Gateway.`);
      await segurneoGatewayClient.syncElevenLabsConversation(externalCallId);
      processingLog.push(`[${new Date().toISOString()}] Sync request sent.`);
      
      // 3. Fetch data from Segurneo Voice Gateway
      processingLog.push(`[${new Date().toISOString()}] Fetching call details from Segurneo Voice Gateway.`);
      const segurneoCallDetails = await segurneoGatewayClient.getCallDetails(externalCallId);
      nogalCall.segurneo_call_details = segurneoCallDetails.data as unknown as Json;
      processingLog.push(`[${new Date().toISOString()}] Fetched call details.`);

      processingLog.push(`[${new Date().toISOString()}] Fetching call transcripts from Segurneo Voice Gateway.`);
      const segurneoTranscripts = await segurneoGatewayClient.getCallTranscripts(externalCallId);
      nogalCall.segurneo_transcripts = segurneoTranscripts.data as unknown as Json;
      const transcripts = segurneoTranscripts.data;
      processingLog.push(`[${new Date().toISOString()}] Fetched call transcripts.`);

      nogalCall.status = 'pending_analysis';
      nogalCall.updated_at = new Date().toISOString();
      await supabase.from(PROCESSED_CALLS_TABLE).update({ segurneo_call_details: nogalCall.segurneo_call_details, segurneo_transcripts: nogalCall.segurneo_transcripts, status: nogalCall.status, updated_at: nogalCall.updated_at, processing_log: nogalCall.processing_log }).eq('id', nogalCall.id);

      // 4. Analyze Transcripts
      if (!transcripts || transcripts.length === 0) {
        processingLog.push(`[${new Date().toISOString()}] No transcripts found to analyze.`);
        throw new Error('No transcripts available for analysis');
      }
      const messagesToAnalyze = this.mapSegurneoTranscriptToTranscriptMessages(transcripts);
      processingLog.push(`[${new Date().toISOString()}] Analyzing ${messagesToAnalyze.length} transcript entries.`);
      const analysisResult = await analysisService.analyzeTranscript(messagesToAnalyze, externalCallId);
      nogalCall.analysis_results = analysisResult as unknown as Json;
      processingLog.push(`[${new Date().toISOString()}] Analysis completed with status: ${analysisResult.status}.`);

      // 4b. Clasificación de la llamada para generar tickets (IA)
      processingLog.push(`[${new Date().toISOString()}] Clasificando transcripción para detección de incidencias.`);
      const classification = await ticketClassifierService.classifyTranscript(messagesToAnalyze);
      nogalCall.ai_intent = classification.rawResponse as unknown as Json;
      nogalCall.ticket_suggestions = classification.suggestions as unknown as Json;
      processingLog.push(`[${new Date().toISOString()}] Se detectaron ${classification.suggestions.length} posibles incidencias.`);

      // Filtrar sugerencias con score >= 0.5
      const suggestionsToCreate = classification.suggestions.filter(s => s.score >= 0.5);
      processingLog.push(`[${new Date().toISOString()}] ${suggestionsToCreate.length} incidencias cumplen el umbral de 0.5 de confianza.`);

      const createdTicketIds: string[] = []; // Array para almacenar todos los ticket IDs creados

      for (const suggestion of suggestionsToCreate) {
        const def = ticketDefinitions.find(d => d.id === suggestion.id_definicion);
        if (!def) {
          processingLog.push(`[${new Date().toISOString()}] Advertencia: definición ${suggestion.id_definicion} no encontrada en memoria.`);
          continue;
        }

        // Construir payload para Nogal
        const now = new Date();
        const idTicket = uuidv4();
        const payload: NogalTicketPayload = {
          "Fecha envío": now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          "Hora envío": now.toLocaleTimeString('es-ES'),
          "IdCliente": (nogalCall.segurneo_call_details as any)?.customerId || 'UNKNOWN', // TODO: mapear cliente real
          "IdTicket": idTicket,
          "TipoIncidencia": def.tipoIncidencia,
          "MotivoIncidencia": def.motivoIncidencia,
          "Notas": `IA (${(suggestion.score*100).toFixed(0)}%): ${suggestion.justification}.`,
        };

        try {
          await nogalApiService.crearTicket(payload);
          processingLog.push(`[${new Date().toISOString()}] Ticket Nogal creado (${idTicket}) para definición ${def.id}.`);

          // Crear ticket interno para dashboard
          const internalTicket = await ticketService.createTicket({
            conversation_id: nogalCall.id,
            description: payload.Notas,
            type: `${def.tipoIncidencia} / ${def.motivoIncidencia}`,
            priority: 'medium',
            status: 'created',
            metadata: { externalTicketId: idTicket, score: suggestion.score }
          });
          processingLog.push(`[${new Date().toISOString()}] Ticket interno creado con ID: ${internalTicket.id}.`);

          // Agregar el ID del ticket creado al array
          createdTicketIds.push(internalTicket.id);
        } catch (err:any) {
          console.error(`[${new Date().toISOString()}] Error creando ticket:`, err);
          processingLog.push(`[${new Date().toISOString()}] Error creando ticket: ${err.message}`);
        }
      }

      // Asignar el array de tickets creados
      nogalCall.ticket_ids = createdTicketIds;

      // Guardar resultados intermedios en DB tras clasificación
      await supabase.from(PROCESSED_CALLS_TABLE).update({
        ai_intent: nogalCall.ai_intent,
        ticket_suggestions: nogalCall.ticket_suggestions,
        ticket_ids: nogalCall.ticket_ids, // Usar ticket_ids en lugar de ticket_id
        processing_log: processingLog,
        updated_at: new Date().toISOString(),
      }).eq('id', nogalCall.id);

      nogalCall.status = 'completed';
      nogalCall.processed_at = new Date().toISOString();
      nogalCall.updated_at = nogalCall.processed_at;
      nogalCall.processing_error = null;
      
      const { error: finalUpdateError } = await supabase
        .from(PROCESSED_CALLS_TABLE)
        .update({
          status: nogalCall.status,
          processed_at: nogalCall.processed_at,
          updated_at: nogalCall.updated_at,
          ticket_ids: nogalCall.ticket_ids, // Usar ticket_ids en lugar de ticket_id
          processing_log: nogalCall.processing_log,
          processing_error: null,
        })
        .eq('id', nogalCall.id);

      if (finalUpdateError) {
         processingLog.push(`[${new Date().toISOString()}] Error in final update of Nogal call: ${finalUpdateError.message}`);
         // Log but don't necessarily throw, as core processing might be done
         console.error("Error in final update:", finalUpdateError);
      }
      
      processingLog.push(`[${new Date().toISOString()}] Processing completed successfully for Nogal call ID: ${nogalCall.id}.`);
      nogalCall.processing_log = processingLog; // ensure final log is on the returned object
      return nogalCall;

    } catch (error: any) {
      console.error(`Error processing call ${externalCallId}:`, error);
      processingLog.push(`[${new Date().toISOString()}] CRITICAL ERROR: ${error.message}`);
      if (nogalCall) {
        nogalCall.status = 'error';
        nogalCall.processing_error = error.message;
        nogalCall.updated_at = new Date().toISOString();
        nogalCall.processing_log = processingLog;
        try {
          await supabase
            .from(PROCESSED_CALLS_TABLE)
            .update({ 
                status: 'error', 
                processing_error: error.message, 
                updated_at: new Date().toISOString(),
                processing_log: processingLog 
            })
            .eq('id', nogalCall.id);
        } catch (dbError) {
          console.error(`Failed to update call status to error in DB for ${nogalCall.id}:`, dbError);
        }
        return nogalCall;
      }
      // If nogalCall was never initialized (e.g. error in very first DB insert)
      throw new Error(`Failed to process call ${externalCallId}: ${error.message}. Initial record might not exist or is incomplete.`);
    }
  }
}

export const callProcessingService = new CallProcessingService(); 