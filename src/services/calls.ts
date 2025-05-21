import { supabase } from './supabase';
import { Database } from '@/types/database';

type ProcessedCall = Database['public']['Tables']['processed_calls']['Row'];
type CallAnalysis = Database['public']['Tables']['call_analysis']['Row'];

interface PaginatedResponse<T> {
  data: T[];
  count: number;
}

export const callsService = {
  async listCalls(page = 1, limit = 10): Promise<PaginatedResponse<ProcessedCall>> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const [countResult, callsResult] = await Promise.all([
      supabase
        .from('processed_calls')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('processed_calls')
        .select(`
          *,
          ticket:tickets(*)
        `)
        .order('created_at', { ascending: false })
        .range(from, to)
    ]);

    if (callsResult.error || countResult.error) {
      console.error('Error fetching calls:', callsResult.error || countResult.error);
      throw new Error('Error al cargar las llamadas');
    }

    return {
      data: (callsResult.data || []) as ProcessedCall[],
      count: countResult.count || 0
    };
  },

  async getCallDetails(callId: string): Promise<ProcessedCall> {
    const { data, error } = await supabase
      .from('processed_calls')
      .select(`
        *,
        ticket:tickets(*)
      `)
      .eq('conversation_id', callId)
      .single();

    if (error) throw new Error('Error al cargar los detalles de la llamada');
    return data as ProcessedCall;
  },

  async getAnalysis(callId: string): Promise<CallAnalysis> {
    const { data, error } = await supabase
      .from('call_analysis')
      .select('*')
      .eq('conversation_id', callId)
      .single();

    if (error) throw new Error('Error al cargar el análisis de la llamada');
    return data as CallAnalysis;
  },

  async searchCalls(query: string): Promise<PaginatedResponse<ProcessedCall>> {
    const [countResult, callsResult] = await Promise.all([
      supabase
        .from('processed_calls')
        .select('*', { count: 'exact', head: true })
        .textSearch('segurneo_call_details', query),
      supabase
        .from('processed_calls')
        .select(`
          *,
          ticket:tickets(*)
        `)
        .textSearch('segurneo_call_details', query)
        .order('created_at', { ascending: false })
    ]);

    if (callsResult.error || countResult.error) {
      console.error('Error searching calls:', callsResult.error || countResult.error);
      throw new Error('Error al buscar llamadas');
    }

    return {
      data: (callsResult.data || []) as ProcessedCall[],
      count: countResult.count || 0
    };
  }
}; 