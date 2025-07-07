export interface Database {
  public: {
    Tables: {
      voice_calls: {
        Row: {
          id: string;
          segurneo_call_id: string;
          conversation_id: string;
          agent_id: string;
          start_time: string;
          end_time: string;
          duration_seconds: number;
          status: string;
          cost_cents: number;
          call_successful: boolean;
          termination_reason: string | null;
          transcript_summary: string | null;
          agent_messages: number;
          user_messages: number;
          total_messages: number;
          audio_available: boolean;
          received_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['voice_calls']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['voice_calls']['Insert']>;
      };
      processed_calls: {
        Row: {
          id: string;
          segurneo_external_call_id: string;
          status: string;
          segurneo_call_details: any;
          segurneo_transcripts: any;
          analysis_results: any;
          ai_intent: any;
          ticket_suggestions: any;
          ticket_ids: string[];
          ticket_id: string | null;
          processing_error: string | null;
          processing_log: string[];
          created_at: string;
          updated_at: string;
          processed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['processed_calls']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['processed_calls']['Insert']>;
      };
      tickets: {
        Row: {
          id: string;
          type: string;
          status: string;
          priority: string;
          description: string;
          conversation_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
      };
      call_analysis: {
        Row: {
          id: string;
          conversation_id: string;
          analysis_id: string;
          action_id: string;
          status: string;
          details: string;
          metadata: {
            confidence: number;
            priority: string;
            context: string;
            requiredData: string[];
          } | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['call_analysis']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['call_analysis']['Insert']>;
      };
    };
  };
} 