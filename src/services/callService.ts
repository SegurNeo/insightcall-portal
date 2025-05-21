import { CallListResponse, ApiError, Call, CallStatus, TranscriptMessage } from '@/types/api';
import { supabase } from '../lib/supabase';

class CallService {
  async getCalls(
    page: number = 1, 
    per_page: number = 10, 
    filters?: { 
      status?: CallStatus;
      searchQuery?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<CallListResponse> {
    try {
      console.log('Obteniendo llamadas de Supabase...', { page, per_page, filters });
      const start = (page - 1) * per_page;
      const end = start + per_page - 1;

      let query = supabase
        .from('processed_calls')
        .select('*, tickets(*)', { count: 'exact' });

      // Aplicar filtros
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.searchQuery) {
        query = query.textSearch('segurneo_call_details', filters.searchQuery);
      }

      if (filters?.startDate) {
        query = query.gte('start_time', filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte('start_time', filters.endDate.toISOString());
      }

      // Ordenar por fecha de inicio descendente (más recientes primero)
      query = query
        .order('start_time', { ascending: false })
        .range(start, end);

      const { data: calls, count, error } = await query;

      if (error) {
        console.error('Error al obtener llamadas:', error);
        throw new Error(error.message);
      }

      console.log('Llamadas obtenidas:', {
        total: count,
        page,
        per_page,
        callsCount: calls?.length,
        firstCall: calls?.[0]?.start_time,
        lastCall: calls?.[calls.length - 1]?.start_time
      });

      return {
        calls: (calls || []).map(this.formatCallResponse),
        total: count || 0,
        page,
        per_page
      };
    } catch (error) {
      console.error('Error al obtener llamadas:', error);
      throw error;
    }
  }

  private formatCallResponse(call: any): Call {
    const startTime = call.start_time || call.created_at;
    const startTimeUnix = Math.floor(new Date(startTime).getTime() / 1000);

    // Formatear transcripción si existe
    const transcripts = Array.isArray(call.segurneo_transcripts) ? call.segurneo_transcripts
      .filter(msg => msg && msg.text && msg.speaker) // Filtrar entradas inválidas
      .map(msg => ({
        role: msg.speaker === 'agent' ? 'agent' : 'user',
        message: msg.text.trim(),
        time_in_call_secs: msg.timestamp || 0,
        metadata: {
          is_agent: msg.speaker === 'agent',
          confidence: msg.confidence || 1.0,
          language: call.transcript_metadata?.language,
          ...(msg.metadata || {})
        }
      }))
      .sort((a, b) => a.time_in_call_secs - b.time_in_call_secs) : [];

    console.log('Transcripción formateada:', {
      count: transcripts.length,
      sample: transcripts.slice(0, 2),
      originalTranscripts: call.segurneo_transcripts?.slice(0, 2)
    });

    return {
      call_id: call.id,
      conversation_id: call.segurneo_external_call_id,
      status: call.status === 'done' ? 'completed' : call.status,
      call_successful: (call.status === 'done' ? 'success' : 'failed') as 'success' | 'failed',
      call_duration_secs: call.duration_seconds || 0,
      start_time_unix_secs: startTimeUnix,
      metadata: {
        start_time_unix_secs: startTimeUnix,
        call_duration_secs: call.duration_seconds || 0,
        agent_name: call.agent_id ? `Agente ${call.agent_id}` : 'Asistente Virtual',
        agent_id: call.agent_id,
        audio_quality: call.transcript_metadata?.audio_quality,
        background_noise_level: call.transcript_metadata?.background_noise_level,
        language: call.transcript_metadata?.language,
        total_segments: call.transcript_metadata?.total_segments || transcripts.length,
        is_transcript_complete: call.transcript_metadata?.is_complete || false
      },
      ticket: call.tickets ? {
        id: call.tickets.id,
        type: call.tickets.type,
        status: call.tickets.status
      } : null,
      transcript: transcripts
    };
  }

  async searchCalls(query: string): Promise<CallListResponse> {
    try {
      const { data: calls, count, error } = await supabase
        .from('processed_calls')
        .select('*, tickets(*)', { count: 'exact' })
        .textSearch('segurneo_call_details', query)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw new Error(error.message);

      return {
        calls: (calls || []).map(this.formatCallResponse),
        total: count || 0,
        page: 1,
        per_page: 10
      };
    } catch (error) {
      console.error('Error al buscar llamadas:', error);
      throw error;
    }
  }

  async getConversationDetail(conversationId: string): Promise<Call> {
    try {
      console.log('Obteniendo detalles de la llamada:', conversationId);
      
      const { data, error } = await supabase
        .from('processed_calls')
        .select(`
          *,
          tickets(*)
        `)
        .eq('segurneo_external_call_id', conversationId)
        .single();

      if (error) {
        console.error('Error al obtener detalles de la llamada:', error);
        throw new Error('No se pudo obtener los detalles de la llamada');
      }

      if (!data) {
        throw new Error('No se encontró la llamada');
      }

      // Log detallado de la estructura de datos recibida
      console.log('Estructura de datos recibida:', {
        transcripts: data.segurneo_transcripts ? {
          count: data.segurneo_transcripts.length,
          sample: data.segurneo_transcripts.slice(0, 2).map(t => ({
            speaker: t.speaker,
            text: t.text,
            timestamp: t.timestamp,
            confidence: t.confidence
          }))
        } : 'No hay transcripciones',
        metadata: data.transcript_metadata,
        status: data.status,
        call_details: data.segurneo_call_details
      });

      // Formatear transcripción si existe
      let transcripts: TranscriptMessage[] = [];
      
      if (Array.isArray(data.segurneo_transcripts)) {
        transcripts = data.segurneo_transcripts
          .filter(msg => msg && msg.text && msg.speaker) // Filtrar entradas inválidas
          .map(msg => ({
            role: msg.speaker === 'agent' ? 'agent' : 'user',
            message: msg.text.trim(),
            time_in_call_secs: msg.timestamp || 0,
            metadata: {
              is_agent: msg.speaker === 'agent',
              confidence: msg.confidence || 1.0,
              language: data.transcript_metadata?.language,
              ...(msg.metadata || {})
            }
          }))
          .sort((a, b) => a.time_in_call_secs - b.time_in_call_secs);
      }

      console.log('Transcripción procesada:', {
        count: transcripts.length,
        messages: transcripts.map(t => ({
          role: t.role,
          time: t.time_in_call_secs,
          text: t.message.substring(0, 50) + (t.message.length > 50 ? '...' : ''),
          metadata: t.metadata
        }))
      });

      return {
        call_id: data.id,
        conversation_id: data.segurneo_external_call_id,
        status: data.status === 'done' ? 'completed' : data.status,
        call_successful: (data.status === 'done' ? 'success' : 'failed') as 'success' | 'failed',
        call_duration_secs: data.duration_seconds || 0,
        start_time_unix_secs: Math.floor(new Date(data.start_time || data.created_at).getTime() / 1000),
        metadata: {
          start_time_unix_secs: Math.floor(new Date(data.start_time || data.created_at).getTime() / 1000),
          call_duration_secs: data.duration_seconds || 0,
          agent_name: data.agent_id ? `Agente ${data.agent_id}` : 'Asistente Virtual',
          agent_id: data.agent_id,
          audio_quality: data.transcript_metadata?.audio_quality,
          background_noise_level: data.transcript_metadata?.background_noise_level,
          language: data.transcript_metadata?.language,
          total_segments: data.transcript_metadata?.total_segments || transcripts.length,
          is_transcript_complete: data.transcript_metadata?.is_complete || false
        },
        ticket: data.tickets ? {
          id: data.tickets.id,
          type: data.tickets.type,
          status: data.tickets.status
        } : null,
        transcript: transcripts
      };
    } catch (error) {
      console.error('Error al obtener detalles de la llamada:', error);
      throw error;
    }
  }

  async getConversationAudio(conversationId: string): Promise<Blob> {
    throw new Error('Audio no disponible temporalmente');
  }
}

export const callService = new CallService(); 