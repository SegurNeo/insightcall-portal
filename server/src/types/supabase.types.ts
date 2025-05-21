export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      processed_calls: {
        Row: {
          analysis_results: Json | null
          created_at: string
          id: string
          processed_at: string | null
          processing_error: string | null
          processing_log: string[] | null
          segurneo_call_details: Json | null
          segurneo_external_call_id: string
          segurneo_transcripts: Json | null
          status: string
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          analysis_results?: Json | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_log?: string[] | null
          segurneo_call_details?: Json | null
          segurneo_external_call_id: string
          segurneo_transcripts?: Json | null
          status: string
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          analysis_results?: Json | null
          created_at?: string
          id?: string
          processed_at?: string | null
          processing_error?: string | null
          processing_log?: string[] | null
          segurneo_call_details?: Json | null
          segurneo_external_call_id?: string
          segurneo_transcripts?: Json | null
          status?: string
          ticket_id?: string | null
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          assignee_id: string | null
          conversation_id: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          priority: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          conversation_id: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          priority: string
          status: string
          type: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          conversation_id?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          priority?: string
          status?: string
          type?: string
          updated_at?: string
        }
      }
    }
  }
}

// Tipos de ayuda para acceder a las tablas
export type Tables = Database['public']['Tables']
export type ProcessedCall = Tables['processed_calls']['Row']
export type ProcessedCallInsert = Tables['processed_calls']['Insert']
export type ProcessedCallUpdate = Tables['processed_calls']['Update']
export type Ticket = Tables['tickets']['Row']
export type TicketInsert = Tables['tickets']['Insert']
export type TicketUpdate = Tables['tickets']['Update'] 