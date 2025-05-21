import { Request, Response } from 'express';
import { supabase } from '../../lib/supabase';
import { SegurneoSyncService } from '../../services/segurneo-sync.service';
import config from '../../config';
import { StoredTranscript } from '../../types/segurneo_voice.types';

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
        .select('*, tickets(*)', { count: 'exact' })
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
        ticket: call.tickets ? {
          id: call.tickets.id,
          type: call.tickets.type,
          status: call.tickets.status
        } : null
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
          tickets(*)
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
        ticket: call.tickets ? {
          id: call.tickets.id,
          type: call.tickets.type,
          status: call.tickets.status
        } : null
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

      const { event_type, call_data } = req.body;

      if (event_type !== 'call.completed') {
        return res.status(200).json({ message: 'Evento ignorado' });
      }

      // Procesar la llamada
      await this.syncService.processCall(call_data);
      
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
} 