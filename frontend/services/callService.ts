// 🚀 SERVICIO DE LLAMADAS MIGRADO AL NUEVO SISTEMA
// Usa los endpoints optimizados pero mantiene la interfaz del frontend

import { CallListResponse, ApiError, Call, CallStatus, TranscriptMessage } from '../types/api';

// Tipos internos para el nuevo backend
interface NewBackendCall {
  id: string;
  segurneo_call_id: string;
  conversation_id: string;
  agent_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  status: 'completed' | 'failed' | 'in_progress';
  call_successful: boolean;
  termination_reason?: string;
  cost_cents: number;
  agent_messages: number;
  user_messages: number;
  total_messages: number;
  transcript_summary: string;
  transcripts: Array<{
    sequence: number;
    speaker: 'agent' | 'user';
    message: string;
    start_time: number;
    end_time: number;
    confidence: number;
  }>;
  analysis_completed: boolean;
  ai_analysis?: {
    incident_type: string;
    management_reason: string;
    confidence: number;
    priority: 'low' | 'medium' | 'high';
    summary: string;
    extracted_data: Record<string, any>;
  };
  tickets_created: number;
  ticket_ids: string[];
  received_at: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

interface NewBackendListResponse {
  calls: NewBackendCall[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class CallService {
  private baseUrl = '/api/v1/calls';

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
      console.log('🚀 [MIGRATED] Obteniendo llamadas del sistema unificado...', { page, per_page, filters });

      // Usar el endpoint correcto para obtener la lista de llamadas
      const response = await fetch(`${this.baseUrl}?limit=${per_page}&offset=${(page - 1) * per_page}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener llamadas');
      }

      const data = await response.json();
      console.log('🚀 [MIGRATED] Respuesta del servidor:', data);

      // Adaptar formato de respuesta del backend unificado
      if (data.success && data.data) {
        const calls = data.data.map((call: any) => this.adaptCallToFrontendFormat(call));
        
        return {
          calls,
          total: data.count || calls.length,
          page: page,
          per_page: per_page
        };
      } else {
        return {
          calls: [],
          total: 0,
          page: page,
          per_page: per_page
        };
      }

    } catch (error) {
      console.error('❌ [MIGRATED] Error al obtener llamadas:', error);
      
      // Fallback: devolver lista vacía en lugar de fallar
      return {
        calls: [],
        total: 0,
        page: page,
        per_page: per_page
      };
    }
  }

  async getConversationDetail(conversationId: string): Promise<Call> {
    try {
      console.log('🚀 [MIGRATED] Obteniendo detalles de la llamada:', conversationId);
      
      const response = await fetch(`${this.baseUrl}/${conversationId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No se encontró la llamada');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al obtener detalles de la llamada');
      }

      const data = await response.json();
      console.log('🚀 [MIGRATED] Respuesta del servidor:', data);

      // Verificar que tenemos la estructura correcta
      if (data.success && data.data) {
        return this.adaptCallToFrontendFormat(data.data);
      } else {
        throw new Error('Formato de respuesta inválido');
      }

    } catch (error) {
      console.error('❌ [MIGRATED] Error al obtener detalles de la llamada:', error);
      throw error;
    }
  }

  async searchCalls(query: string): Promise<CallListResponse> {
    // Por ahora, usar filtro básico
    // TODO: Implementar búsqueda en el backend cuando sea necesario
    console.log('🔍 [MIGRATED] Búsqueda temporal:', query);
    return this.getCalls(1, 10);
  }

  async getConversationAudio(conversationId: string): Promise<Blob> {
    throw new Error('Audio no disponible temporalmente');
  }

  // 🔧 ADAPTADOR: Convierte datos del nuevo backend al formato del frontend
  private adaptCallToFrontendFormat(backendCall: NewBackendCall): Call {
    // Convertir estado
    const status: CallStatus = this.mapStatus(backendCall.status);
    const callSuccessful: 'success' | 'failed' = backendCall.call_successful ? 'success' : 'failed';

    // Convertir timestamp
    const startTimeUnix = Math.floor(new Date(backendCall.start_time).getTime() / 1000);

    // Adaptar transcripción al formato esperado
    const transcript: TranscriptMessage[] = backendCall.transcripts.map(t => ({
      role: t.speaker,
      message: t.message,
      time_in_call_secs: t.start_time,
      metadata: {
        is_agent: t.speaker === 'agent',
        confidence: t.confidence,
        sequence: t.sequence
      }
    }));

    // Simular ticket si hay análisis
    const ticket = backendCall.ai_analysis ? {
      id: `auto-${backendCall.id}`,
      type: backendCall.ai_analysis.incident_type,
      status: 'pending'
    } : null;

    console.log('🔧 [MIGRATED] Adaptando llamada:', {
      backend_id: backendCall.id,
      frontend_call_id: backendCall.id,
      conversation_id: backendCall.conversation_id,
      transcript_count: transcript.length,
      has_analysis: !!backendCall.ai_analysis,
      cost_euros: (backendCall.cost_cents / 100).toFixed(2)
    });

    return {
      call_id: backendCall.id,
      conversation_id: backendCall.conversation_id,
      status,
      call_successful: callSuccessful,
      call_duration_secs: backendCall.duration_seconds,
      start_time_unix_secs: startTimeUnix,
      metadata: {
        start_time_unix_secs: startTimeUnix,
        call_duration_secs: backendCall.duration_seconds,
        agent_name: `Agente ${backendCall.agent_id}`,
        agent_id: backendCall.agent_id,
        total_segments: backendCall.transcripts.length,
        is_transcript_complete: true
      },
      ticket,
      transcript
    };
  }

  // 🔧 HELPER: Mapear estados del backend al frontend
  private mapStatus(backendStatus: 'completed' | 'failed' | 'in_progress'): CallStatus {
    switch (backendStatus) {
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'in_progress': return 'processing';
      default: return 'failed';
    }
  }

  // 🔄 MÉTODO LEGACY: Mantener compatibilidad con código existente
  private formatCallResponse(call: any): Call {
    // Este método ya no se usa, pero lo mantenemos por compatibilidad
    console.warn('⚠️ [MIGRATED] Método legacy formatCallResponse llamado. Considera actualizar el código.');
    return this.adaptCallToFrontendFormat(call);
  }
}

export const callService = new CallService(); 