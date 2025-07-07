import { createClient } from '@supabase/supabase-js';
import config from '../../../../config';
import { VoiceCallPayload } from '../../../../types/voiceCalls.types';
import { Tables } from '../../../../types/supabase.types';

// Create Supabase client
const supabase = createClient(
  config.nogalSupabaseUrl,
  config.nogalSupabaseServiceKey
);

export class DatabaseService {
  
  /**
   * Save voice call to database
   */
  async saveVoiceCall(payload: VoiceCallPayload): Promise<{ success: boolean; nogalInternalId?: string; error?: string }> {
    try {
      console.log('[DatabaseService] Saving voice call:', payload.call_id);
      
      // Map payload to database schema
      const voiceCallData = {
        segurneo_call_id: payload.call_id,
        conversation_id: payload.conversation_id,
        agent_id: payload.agent_id,
        start_time: payload.start_time,
        end_time: payload.end_time,
        duration_seconds: payload.duration_seconds,
        status: payload.status,
        cost_cents: payload.cost,
        termination_reason: payload.termination_reason || null,
        transcript_summary: payload.transcript_summary || null,
        call_successful: payload.call_successful,
        agent_messages: payload.participant_count.agent_messages,
        user_messages: payload.participant_count.user_messages,
        total_messages: payload.participant_count.total_messages,
        audio_available: payload.audio_available,
        received_at: payload.created_at,
        // created_at and updated_at are handled by the database
      };
      
      // Insert into voice_calls table
      const { data, error } = await supabase
        .from('voice_calls')
        .insert(voiceCallData)
        .select('id')
        .single();
      
      if (error) {
        console.error('[DatabaseService] Error saving voice call:', error);
        
        // Check for duplicate key error
        if (error.code === '23505' && error.message.includes('segurneo_call_id')) {
          return { success: false, error: 'Voice call with this call_id already exists' };
        }
        
        return { success: false, error: `Database error: ${error.message}` };
      }
      
      if (!data) {
        return { success: false, error: 'No data returned from database' };
      }
      
      console.log('[DatabaseService] Voice call saved successfully:', data.id);
      
      return { 
        success: true, 
        nogalInternalId: data.id.toString() 
      };
      
    } catch (error) {
      console.error('[DatabaseService] Unexpected error saving voice call:', error);
      return { 
        success: false, 
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
  
  /**
   * Check if voice call already exists
   */
  async voiceCallExists(callId: string): Promise<{ exists: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('voice_calls')
        .select('id')
        .eq('segurneo_call_id', callId)
        .single();
      
      if (error) {
        // If no rows found, that's not an error for this function
        if (error.code === 'PGRST116') {
          return { exists: false };
        }
        
        console.error('[DatabaseService] Error checking voice call existence:', error);
        return { exists: false, error: error.message };
      }
      
      return { exists: !!data };
      
    } catch (error) {
      console.error('[DatabaseService] Unexpected error checking voice call existence:', error);
      return { exists: false, error: 'Unexpected error' };
    }
  }
  
  /**
   * Get voice call by Segurneo call ID
   */
  async getVoiceCallBySegurneoId(callId: string): Promise<{ data?: Tables<'voice_calls'>; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('voice_calls')
        .select('*')
        .eq('segurneo_call_id', callId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { error: 'Voice call not found' };
        }
        
        console.error('[DatabaseService] Error getting voice call:', error);
        return { error: error.message };
      }
      
      return { data };
      
    } catch (error) {
      console.error('[DatabaseService] Unexpected error getting voice call:', error);
      return { error: 'Unexpected error' };
    }
  }
  
  /**
   * Get recent voice calls for monitoring
   */
  async getRecentVoiceCalls(limit: number = 10): Promise<{ data?: Tables<'voice_calls'>[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('voice_calls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('[DatabaseService] Error getting recent voice calls:', error);
        return { error: error.message };
      }
      
      return { data: data || [] };
      
    } catch (error) {
      console.error('[DatabaseService] Unexpected error getting recent voice calls:', error);
      return { error: 'Unexpected error' };
    }
  }
  
  /**
   * Get voice call statistics
   */
  async getVoiceCallStats(): Promise<{ 
    data?: { 
      total: number; 
      completed: number; 
      failed: number; 
      abandoned: number; 
      totalCost: number; 
    }; 
    error?: string 
  }> {
    try {
      const { data, error } = await supabase
        .from('voice_calls')
        .select('status, cost_cents');
      
      if (error) {
        console.error('[DatabaseService] Error getting voice call stats:', error);
        return { error: error.message };
      }
      
      if (!data) {
        return { data: { total: 0, completed: 0, failed: 0, abandoned: 0, totalCost: 0 } };
      }
      
      const stats = data.reduce((acc, call) => {
        acc.total++;
        acc.totalCost += call.cost_cents || 0;
        
        switch (call.status) {
          case 'completed':
            acc.completed++;
            break;
          case 'failed':
            acc.failed++;
            break;
          case 'abandoned':
            acc.abandoned++;
            break;
        }
        
        return acc;
      }, { total: 0, completed: 0, failed: 0, abandoned: 0, totalCost: 0 });
      
      return { data: stats };
      
    } catch (error) {
      console.error('[DatabaseService] Unexpected error getting voice call stats:', error);
      return { error: 'Unexpected error' };
    }
  }
  
  /**
   * Test database connection
   */
  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('voice_calls')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('[DatabaseService] Database connection test failed:', error);
        return { connected: false, error: error.message };
      }
      
      return { connected: true };
      
    } catch (error) {
      console.error('[DatabaseService] Unexpected error testing database connection:', error);
      return { connected: false, error: 'Unexpected error' };
    }
  }
}

export const databaseService = new DatabaseService(); 