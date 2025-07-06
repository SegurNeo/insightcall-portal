import { supabase } from '../lib/supabase';
import config from '../config/index';
import { StoredCall, TranscriptEntry, SegurneoApiResponse } from '../types/segurneo_voice.types';

export class SegurneoSyncService {
  private readonly API_BASE = config.segurneoVoiceBaseUrl;
  private readonly API_KEY = config.segurneoVoiceApiKey;

  private async fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<SegurneoApiResponse<T>> {
    const url = `${this.API_BASE}${endpoint}`;
    console.log('URL de Segurneo:', url);
    console.log('API Key configurada:', this.API_KEY ? 'Sí' : 'No');

    try {
      console.log('Iniciando fetch a Segurneo...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

      const response = await fetch(url, {
        ...options,
        headers: {
          'X-API-Key': this.API_KEY,
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Status de la respuesta:', response.status);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('Error de Segurneo:', error);
        throw new Error(`Segurneo API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      console.log('Datos recibidos de Segurneo:', data);
      return data as SegurneoApiResponse<T>;
    } catch (error) {
      console.error('Error detallado en fetchWithAuth:', {
        error: error instanceof Error ? {
          message: error.message,
          name: error.name,
          cause: error.cause,
          stack: error.stack
        } : error
      });
      throw error;
    }
  }

  async syncCalls(options: { 
    startDate?: string; 
    endDate?: string; 
    status?: string;
    pageSize?: number;
  } = {}) {
    try {
      console.log('Iniciando sincronización de llamadas...', options);
      let totalProcessed = 0;
      let currentPage = 1;
      let totalPages = 1;

      const queryParams = new URLSearchParams({
        page: '1',
        pageSize: (options.pageSize || 20).toString()
      });

      if (options.startDate) queryParams.append('startDate', options.startDate);
      if (options.endDate) queryParams.append('endDate', options.endDate);
      if (options.status) queryParams.append('status', options.status);

      do {
        queryParams.set('page', currentPage.toString());
        console.log(`Procesando página ${currentPage}...`);
        
        const response = await this.fetchWithAuth<StoredCall[]>(`/calls?${queryParams.toString()}`);
        const calls = response.data;
        totalPages = response.pagination?.totalPages || 1;
        
        console.log(`Obtenidas ${calls.length} llamadas de Segurneo (Página ${currentPage} de ${totalPages})`);

        for (const call of calls) {
          await this.processCall(call);
        }

        totalProcessed += calls.length;
        currentPage++;
      } while (currentPage <= totalPages);

      console.log(`Sincronización completada con éxito. Total procesadas: ${totalProcessed}`);
      return { success: true, processed: totalProcessed };
    } catch (error) {
      console.error('Error en la sincronización:', error);
      throw error;
    }
  }

  async processCall(call: StoredCall) {
    try {
      const { data: existingCall } = await supabase
        .from('processed_calls')
        .select('id, status')
        .eq('segurneo_external_call_id', call.external_call_id)
        .single();

      if (existingCall && existingCall.status === 'completed') {
        console.log(`Llamada ${call.external_call_id} ya procesada, omitiendo...`);
        return;
      }

      // Obtener detalles completos de la llamada incluyendo transcripción
      const callResponse = await this.fetchWithAuth<StoredCall>(`/calls/${call.external_call_id}`);
      const callWithTranscript = callResponse.data;

      const callData = {
        segurneo_external_call_id: call.external_call_id,
        status: call.status,
        start_time: call.start_time,
        duration_seconds: call.duration_seconds,
        agent_id: call.agent_id,
        segurneo_call_details: {
          agent_id: call.agent_id,
          duration_seconds: call.duration_seconds,
          start_time: call.start_time,
          end_time: call.end_time,
          metadata: call.call_metadata
        },
        segurneo_transcripts: callWithTranscript.transcript?.map(t => ({
          speaker: t.speaker || 'user',
          text: t.text || '',
          segment_start_time: t.timestamp || 0,
          confidence: t.confidence || 1.0,
          metadata: {
            is_agent: t.speaker === 'agent',
            confidence: t.confidence || 1.0,
            language: t.metadata?.language,
            ...(t.metadata || {})
          }
        })) || [],
        transcript_metadata: {
          ...callWithTranscript.transcript_metadata,
          is_complete: true,
          total_segments: callWithTranscript.transcript?.length || 0
        },
        metadata: call.metadata || {},
        updated_at: new Date().toISOString(),
        processed_at: new Date().toISOString()
      };

      if (!existingCall) {
        const { error: insertError } = await supabase
          .from('processed_calls')
          .insert([callData]);

        if (insertError) throw insertError;
        console.log(`Nueva llamada ${call.external_call_id} procesada y guardada`);
      } else {
        const { error: updateError } = await supabase
          .from('processed_calls')
          .update(callData)
          .eq('segurneo_external_call_id', call.external_call_id);

        if (updateError) throw updateError;
        console.log(`Llamada ${call.external_call_id} actualizada`);
      }
    } catch (error) {
      console.error(`Error procesando llamada ${call.external_call_id}:`, error);
      throw error;
    }
  }
}