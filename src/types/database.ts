export interface Database {
  public: {
    Tables: {
      processed_calls: {
        Row: {
          id: string;
          conversation_id: string;
          start_time_unix_secs: number;
          call_duration_secs: number;
          segurneo_call_details: any;
          segurneo_transcripts: any;
          created_at: string;
          updated_at: string;
          status: string;
          ticket?: {
            id: string;
            type: string;
            status: string;
            priority: string;
            description: string;
          } | null;
        };
        Insert: Omit<Database['public']['Tables']['processed_calls']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['processed_calls']['Insert']>;
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