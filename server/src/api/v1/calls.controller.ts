import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../lib/supabase';
import { SegurneoSyncService } from '../../services/segurneo-sync.service';
import config from '../../config';
import { StoredTranscript, StoredCall } from '../../types/segurneo_voice.types';
import { analysisService } from '../../modules/analysis';
import { ticketClassifierService } from '../../services/ticketClassifierService';
import { ticketService } from '../../services/ticketService';
import { nogalApiService } from '../../services/nogalApiService';
import { ticketDefinitions } from '../../utils/ticketDefinitions';
import { v4 as uuidv4 } from 'uuid';
import { callService } from '../../modules/calls';

interface TranscriptMessage {
  role: string;
  message: string;
  time_in_call_secs: number;
  metadata: {
    is_agent: boolean;
  };
}

export class CallsController {
  private syncService: SegurneoSyncService;

  constructor() {
    this.syncService = new SegurneoSyncService();
  }

  private validateApiKey(req: Request): boolean {
    const providedApiKey = req.headers['x-api-key'];
    return providedApiKey === config.segurneoVoiceApiKey;
  }

  async getCalls(req: Request, res: Response) {
    try {
      console.log('Recibida petición GET /calls con query params:', req.query);
      
      const page = parseInt(req.query.page as string) || 1;
      const per_page = parseInt(req.query.per_page as string) || 10;
      const offset = (page - 1) * per_page;

      console.log('Consultando Supabase con parámetros:', { page, per_page, offset });

      const { data: calls, count, error } = await supabase
        .from('processed_calls')
        .select('*, tickets!tickets_conversation_id_fkey(*)', { count: 'exact' })
        .range(offset, offset + per_page - 1)
        .order('created_at', { ascending: false });

      console.log('Respuesta de Supabase:', { 
        success: !error, 
        count, 
        callsCount: calls?.length,
        error: error?.message 
      });

      if (error) throw error;

      const formattedCalls = calls?.map(call => ({
        call_id: call.id,
        conversation_id: call.segurneo_external_call_id,
        status: call.status,
        call_successful: call.segurneo_call_details?.status === 'completed' ? 'success' : 'failed',
        call_duration_secs: call.segurneo_call_details?.duration_seconds || 0,
        start_time_unix_secs: call.created_at ? Math.floor(new Date(call.created_at).getTime() / 1000) : 0,
        metadata: {
          start_time_unix_secs: call.created_at ? Math.floor(new Date(call.created_at).getTime() / 1000) : 0,
          call_duration_secs: call.segurneo_call_details?.duration_seconds || 0
        },
        tickets: call.tickets || [],
        ticket_count: call.tickets?.length || 0,
        ai_intent: call.ai_intent,
        ticket_suggestions: call.ticket_suggestions
      }));

      console.log('Enviando respuesta con', formattedCalls?.length || 0, 'llamadas');

      return res.json({
        calls: formattedCalls || [],
        total: count || 0,
        page,
        per_page
      });
    } catch (error) {
      console.error('Error detallado al obtener llamadas:', {
        error: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error
      });
      return res.status(500).json({ 
        error: 'Error getting calls',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCallById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log('Buscando llamada con ID:', id);

      const { data: call, error } = await supabase
        .from('processed_calls')
        .select(`
          *,
          tickets!tickets_conversation_id_fkey(*)
        `)
        .eq('segurneo_external_call_id', id)
        .single();

      if (error) {
        console.error('Error al obtener la llamada de Supabase:', error);
        throw error;
      }
      
      if (!call) {
        console.log('No se encontró la llamada con ID:', id);
        return res.status(404).json({ error: 'Call not found' });
      }

      console.log('Llamada encontrada:', {
        id: call.id,
        external_id: call.segurneo_external_call_id,
        status: call.status,
        details: call.segurneo_call_details,
        transcriptCount: Array.isArray(call.segurneo_transcripts) ? call.segurneo_transcripts.length : 0
      });

      // Extraer datos del segurneo_call_details de manera segura
      const callDetails = call.segurneo_call_details || {};
      const startTime = callDetails.start_time || call.created_at;
      const startTimeUnix = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : 0;

      // Formatear transcripción
      let formattedTranscripts: TranscriptMessage[] = [];
      if (Array.isArray(call.segurneo_transcripts)) {
        formattedTranscripts = (call.segurneo_transcripts as StoredTranscript[]).map(t => ({
          role: t.speaker || 'user',
          message: t.text || '',
          time_in_call_secs: t.segment_start_time || 0,
          metadata: {
            is_agent: t.speaker === 'agent'
          }
        }));
      }

      console.log('Transcripción formateada:', {
        count: formattedTranscripts.length,
        sample: formattedTranscripts.slice(0, 2)
      });

      const formattedCall = {
        call_id: call.id,
        conversation_id: call.segurneo_external_call_id,
        status: call.status,
        call_successful: call.status === 'completed' ? 'success' : 'failed',
        call_duration_secs: callDetails.duration_seconds || 0,
        start_time_unix_secs: startTimeUnix,
        transcript: formattedTranscripts,
        metadata: {
          start_time_unix_secs: startTimeUnix,
          call_duration_secs: callDetails.duration_seconds || 0,
          agent_name: callDetails.agent_name || 'Asistente Virtual'
        },
        tickets: call.tickets || [],
        ticket_count: call.tickets?.length || 0,
        ai_intent: call.ai_intent,
        ticket_suggestions: call.ticket_suggestions
      };

      console.log('Enviando respuesta formateada:', {
        id: formattedCall.call_id,
        status: formattedCall.status,
        call_successful: formattedCall.call_successful,
        transcriptCount: formattedCall.transcript.length
      });

      return res.json(formattedCall);
    } catch (error) {
      console.error('Error detallado al obtener la llamada:', {
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : error,
        params: req.params
      });
      return res.status(500).json({ 
        error: 'Error getting call',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getCallAudio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // TODO: Implementar la obtención del audio desde el bucket de storage
      return res.status(501).json({ 
        error: 'Audio retrieval not implemented yet',
        details: 'La funcionalidad de audio aún no está disponible en Segurneo Voice. Se implementará en futuras versiones.'
      });
    } catch (error) {
      console.error('Error getting call audio:', error);
      return res.status(500).json({ 
        error: 'Error getting call audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async syncCalls(req: Request, res: Response) {
    try {
      console.log('Iniciando sincronización manual de llamadas...');
      const result = await this.syncService.syncCalls();
      return res.json({
        message: 'Sincronización completada',
        ...result
      });
    } catch (error) {
      console.error('Error en sincronización manual:', error);
      return res.status(500).json({ 
        error: 'Error syncing calls',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async webhookHandler(req: Request, res: Response) {
    try {
      // Validar la API key
      if (!this.validateApiKey(req)) {
        console.error('API key inválida');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('🎯 Webhook recibido de Segurneo:', JSON.stringify(req.body, null, 2));

      // Detectar formato: ¿es el formato viejo con event_type o el formato real de Segurneo?
      const isLegacyFormat = req.body.event_type && req.body.call_data;
      const isSegurneoFormat = req.body.call_id || req.body.conversation_id;

      if (isLegacyFormat) {
        // Formato viejo para retrocompatibilidad
        const { event_type, call_data } = req.body;
        
        if (event_type !== 'call.completed') {
          return res.status(200).json({ message: 'Evento ignorado - formato legacy' });
        }

        // Detectar si es un formato de prueba (desde MP3)
        if (call_data.metadata?.source === 'mp3-test') {
          console.log('Procesando llamada de prueba desde MP3...');
          await this.processTestCall(call_data);
          return res.json({
            message: 'Llamada de prueba procesada correctamente',
            externalCallId: call_data.externalCallId
          });
        }

        await this.syncService.processCall(call_data);
      } else if (isSegurneoFormat) {
        // Formato real de Segurneo Voice
        console.log('✅ Procesando llamada real de Segurneo Voice...');
        await this.processSegurneoCall(req.body);
      } else {
        console.warn('❌ Formato de webhook no reconocido:', req.body);
        return res.status(400).json({ 
          message: 'Formato de webhook no válido',
          expected: 'call_id o conversation_id requeridos'
        });
      }
      
      return res.json({
        message: 'Webhook procesado correctamente'
      });
    } catch (error) {
      console.error('Error procesando webhook:', error);
      return res.status(500).json({ 
        error: 'Error processing webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async processSegurneoCall(segurneoData: any) {
    try {
      console.log(`🔄 Procesando llamada real de Segurneo: ${segurneoData.conversation_id}`);
      
      // Mapear formato de Segurneo a nuestro formato voice_calls
      const voiceCallData = {
        segurneo_call_id: segurneoData.call_id,
        conversation_id: segurneoData.conversation_id,
        agent_id: segurneoData.agent_id,
        start_time: segurneoData.start_time,
        end_time: segurneoData.end_time,
        duration_seconds: segurneoData.duration_seconds,
        status: segurneoData.status,
        call_successful: segurneoData.call_successful || false,
        termination_reason: segurneoData.termination_reason,
        cost_cents: segurneoData.cost || 0,
        transcript_summary: segurneoData.transcript_summary,
        agent_messages: segurneoData.participant_count?.agent_messages || 0,
        user_messages: segurneoData.participant_count?.user_messages || 0,
        total_messages: segurneoData.participant_count?.total_messages || 0,
        audio_available: segurneoData.audio_available || false,
        received_at: new Date().toISOString(),
        created_at: segurneoData.created_at || new Date().toISOString()
      };

      // Verificar si ya existe la llamada
      const { data: existingCall } = await supabase
        .from('voice_calls')
        .select('id, segurneo_call_id')
        .eq('segurneo_call_id', segurneoData.call_id)
        .single();

      if (existingCall) {
        console.log(`⚠️ Llamada ${segurneoData.call_id} ya existe en voice_calls, actualizando...`);
        
        const { error: updateError } = await supabase
          .from('voice_calls')
          .update(voiceCallData)
          .eq('segurneo_call_id', segurneoData.call_id);

        if (updateError) {
          console.error('Error actualizando voice_call:', updateError);
          throw updateError;
        }
      } else {
        console.log(`✅ Insertando nueva llamada ${segurneoData.call_id} en voice_calls...`);
        
        const { error: insertError } = await supabase
          .from('voice_calls')
          .insert([voiceCallData]);

        if (insertError) {
          console.error('Error insertando voice_call:', insertError);
          throw insertError;
        }
      }

      // Si hay transcripts, procesar también para análisis completo
      if (segurneoData.transcripts && segurneoData.transcripts.length > 0) {
        console.log(`📝 Procesando ${segurneoData.transcripts.length} transcripts para análisis...`);
        
        // Crear registro en processed_calls para análisis
        const processedCallData = {
          segurneo_external_call_id: segurneoData.conversation_id,
          status: 'completed',
          segurneo_call_details: {
            call_id: segurneoData.call_id,
            conversation_id: segurneoData.conversation_id,
            agent_id: segurneoData.agent_id,
            duration_seconds: segurneoData.duration_seconds,
            cost: segurneoData.cost,
            metadata: {
              source: 'segurneo-voice-real',
              processed_at: new Date().toISOString()
            }
          },
          segurneo_transcripts: segurneoData.transcripts.map((t: any) => ({
            speaker: t.speaker,
            text: t.message,
            segment_start_time: t.segment_start_time,
            segment_end_time: t.segment_end_time,
            confidence: t.confidence,
            sequence: t.sequence,
            metadata: {
              is_agent: t.speaker === 'agent',
              confidence: t.confidence
            }
          })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        };

        // Verificar si ya existe en processed_calls
        const { data: existingProcessed } = await supabase
          .from('processed_calls')
          .select('id')
          .eq('segurneo_external_call_id', segurneoData.conversation_id)
          .single();

        if (!existingProcessed) {
          const { error: processedError } = await supabase
            .from('processed_calls')
            .insert([processedCallData]);

          if (processedError) {
            console.error('Error insertando processed_call:', processedError);
            // No lanzar error aquí, la llamada principal ya se guardó
          } else {
            console.log(`✅ Llamada ${segurneoData.conversation_id} guardada en processed_calls para análisis`);
          }
        }
      }

      console.log(`🎉 Llamada ${segurneoData.conversation_id} procesada exitosamente`);
      
    } catch (error) {
      console.error(`❌ Error procesando llamada de Segurneo:`, error);
      throw error;
    }
  }

  private async processTestCall(call_data: any) {
    try {
      console.log(`Procesando llamada de prueba ${call_data.externalCallId} con pipeline completo...`);
      
      const { data: existingCall } = await supabase
        .from('processed_calls')
        .select('id, status')
        .eq('segurneo_external_call_id', call_data.externalCallId)
        .single();

      if (existingCall && existingCall.status === 'completed') {
        console.log(`Llamada de prueba ${call_data.externalCallId} ya procesada completamente, omitiendo...`);
        return;
      }

      // Crear o actualizar el registro inicial
      const callId = existingCall?.id || uuidv4();
      const processingLog: string[] = [`[${new Date().toISOString()}] Iniciando procesamiento de llamada de prueba`];
      
      const callData = {
        id: callId,
        segurneo_external_call_id: call_data.externalCallId,
        status: 'pending_analysis',
        start_time: new Date(call_data.startTime * 1000).toISOString(),
        duration_seconds: call_data.duration,
        agent_id: 'test-agent',
        segurneo_call_details: {
          agent_id: 'test-agent',
          duration_seconds: call_data.duration,
          start_time: new Date(call_data.startTime * 1000).toISOString(),
          end_time: new Date((call_data.startTime + call_data.duration) * 1000).toISOString(),
          metadata: call_data.metadata,
          clientData: call_data.clientData
        },
        segurneo_transcripts: call_data.transcripts.map((t: any) => ({
          speaker: t.speaker,
          text: t.text,
          segment_start_time: t.segment_start_time,
          segment_end_time: t.segment_end_time,
          confidence: t.confidence,
          metadata: {
            is_agent: t.speaker === 'agent',
            confidence: t.confidence
          }
        })),
        transcript_metadata: {
          is_complete: true,
          total_segments: call_data.transcripts.length,
          language: 'es'
        },
        metadata: call_data.metadata,
        processing_log: processingLog,
        updated_at: new Date().toISOString()
      };

      if (!existingCall) {
        const { error: insertError } = await supabase
          .from('processed_calls')
          .insert([callData]);
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabase
          .from('processed_calls')
          .update(callData)
          .eq('id', callId);
        if (updateError) throw updateError;
      }

      try {
        // 1. Análisis con Gemini
        processingLog.push(`[${new Date().toISOString()}] Analizando transcripción con Gemini...`);
        const transcriptMessages = call_data.transcripts.map((t: any) => ({
          role: t.speaker || 'user',
          message: t.text || ''
        }));
        
        const analysisResult = await analysisService.analyzeTranscript(transcriptMessages, call_data.externalCallId);
        processingLog.push(`[${new Date().toISOString()}] Análisis completado: ${analysisResult.status}`);

        // 2. Clasificación de tickets
        processingLog.push(`[${new Date().toISOString()}] Clasificando para detección de incidencias...`);
        const classification = await ticketClassifierService.classifyTranscript(transcriptMessages);
        processingLog.push(`[${new Date().toISOString()}] Se detectaron ${classification.suggestions.length} posibles incidencias`);

        // 3. Crear tickets con score >= 0.5
        const suggestionsToCreate = classification.suggestions.filter((s: any) => s.score >= 0.5);
        processingLog.push(`[${new Date().toISOString()}] ${suggestionsToCreate.length} incidencias cumplen el umbral de 0.5`);

        const createdTicketIds: string[] = [];
        
        for (const suggestion of suggestionsToCreate) {
          const def = ticketDefinitions.find((d: any) => d.id === suggestion.id_definicion);
          if (!def) {
            processingLog.push(`[${new Date().toISOString()}] Definición ${suggestion.id_definicion} no encontrada`);
            continue;
          }

          try {
            // Crear ticket en Nogal (si está configurado)
            const now = new Date();
            const idTicket = uuidv4();
            const payload = {
              "Fecha envío": now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              "Hora envío": now.toLocaleTimeString('es-ES'),
              "IdCliente": call_data.clientData?.dni || 'TEST-CLIENT',
              "IdTicket": idTicket,
              "TipoIncidencia": def.tipoIncidencia,
              "MotivoIncidencia": def.motivoIncidencia,
              "Notas": `${suggestion.justification}`,
            };

            // Intentar crear en Nogal (puede fallar si no está configurado)
            try {
              await nogalApiService.crearTicket(payload);
              processingLog.push(`[${new Date().toISOString()}] Ticket Nogal creado: ${idTicket}`);
            } catch (nogalError: any) {
              processingLog.push(`[${new Date().toISOString()}] No se pudo crear en Nogal: ${nogalError.message}`);
            }

            // Crear ticket interno siempre
            const internalTicket = await ticketService.createTicket({
              conversation_id: callId,
              description: suggestion.justification,
              tipo_incidencia: def.tipoIncidencia,
              motivo_incidencia: def.motivoIncidencia,
              priority: 'medium',
              status: 'created',
              metadata: { externalTicketId: idTicket, score: suggestion.score }
            });
            
            createdTicketIds.push(internalTicket.id);
            processingLog.push(`[${new Date().toISOString()}] Ticket interno creado: ${internalTicket.id}`);
            
          } catch (error: any) {
            processingLog.push(`[${new Date().toISOString()}] Error creando ticket: ${error.message}`);
          }
        }

        // Actualizar el registro con los resultados
        await supabase
          .from('processed_calls')
          .update({
            status: 'completed',
            analysis_results: analysisResult,
            ai_intent: classification.rawResponse,
            ticket_suggestions: classification.suggestions,
            ticket_id: createdTicketIds.length > 0 ? createdTicketIds[0] : null,
            processing_log: processingLog,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', callId);

        console.log(`Procesamiento completo finalizado para ${call_data.externalCallId}:`, {
          ticketsCreated: createdTicketIds.length,
          analysisStatus: analysisResult.status,
          suggestions: classification.suggestions.length
        });

      } catch (analysisError: any) {
        console.error(`Error en análisis/tickets para ${call_data.externalCallId}:`, analysisError);
        processingLog.push(`[${new Date().toISOString()}] Error en análisis: ${analysisError.message}`);
        
        // Actualizar el estado a completado pero sin análisis
        await supabase
          .from('processed_calls')
          .update({
            status: 'completed',
            processing_log: processingLog,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: {
              ...call_data.metadata,
              analysis_error: analysisError.message
            }
          })
          .eq('id', callId);
      }

    } catch (error) {
      console.error(`Error procesando llamada de prueba ${call_data.externalCallId}:`, error);
      throw error;
    }
  }

  /**
   * Sincronización masiva de llamadas de Eleven Labs
   * Obtiene todas las llamadas, las analiza y crea tickets automáticamente
   */
  async syncElevenLabsCalls(req: Request, res: Response, next: NextFunction) {
    try {
      const { 
        startDate, 
        endDate, 
        forceReprocess = false,
        pageSize = 50 
      } = req.body;

      console.log('🚀 Iniciando sincronización masiva de Eleven Labs...');
      
      // Usar el servicio de sincronización existente
      const syncService = new SegurneoSyncService();
      
      // 1. Sincronizar todas las llamadas de SegurneoVoice
      const syncResult = await syncService.syncCalls({
        startDate,
        endDate,
        pageSize
      });

      // 2. Obtener todas las llamadas sincronizadas
      const { data: processedCalls, error: fetchError } = await supabase
        .from('processed_calls')
        .select('*')
        .gte('created_at', startDate || '2024-01-01')
        .lte('created_at', endDate || new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Error obteniendo llamadas procesadas: ${fetchError.message}`);
      }

      let ticketsCreated = 0;
      let callsReprocessed = 0;
      const errors: any[] = [];

      // 3. Procesar cada llamada para análisis y creación de tickets
      for (const call of processedCalls || []) {
        try {
          // Si ya tiene tickets y no forzamos reprocesamiento, saltamos
          if (call.ticket_id && !forceReprocess) {
            console.log(`⏭️ Llamada ${call.segurneo_external_call_id} ya tiene tickets, saltando...`);
            continue;
          }

          // Si no tiene análisis o forzamos reprocesamiento
          if (!call.analysis_results || forceReprocess) {
            console.log(`🔄 Reprocesando llamada ${call.segurneo_external_call_id}...`);
            
            // Usar el servicio de procesamiento existente
            const processedCall = await callService.processCallByExternalId(
              call.segurneo_external_call_id
            );
            
            if (processedCall.ticket_ids?.length) {
              ticketsCreated += processedCall.ticket_ids.length;
            }
            callsReprocessed++;
          }
        } catch (error) {
          console.error(`❌ Error procesando llamada ${call.segurneo_external_call_id}:`, error);
          errors.push({
            callId: call.segurneo_external_call_id,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
        }
      }

      // 4. Generar estadísticas
      const stats = {
        totalCalls: processedCalls?.length || 0,
        callsSynced: syncResult.processed,
        callsReprocessed,
        ticketsCreated,
        errors: errors.length,
        errorDetails: errors
      };

      console.log('✅ Sincronización completada:', stats);

      return res.json({
        success: true,
        message: 'Sincronización masiva de Eleven Labs completada',
        stats,
        syncResult
      });

    } catch (error) {
      console.error('Error en sincronización masiva:', error);
      next(error);
    }
  }
} 