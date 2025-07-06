export interface Database {
  public: {
    Tables: {
      processed_calls: {
        Row: {
          id: string
          segurneo_external_call_id: string
          status: string
          segurneo_call_details: Json | null
          segurneo_transcripts: Json | null
          analysis_results: Json | null
          ai_intent: Json | null
          ticket_suggestions: Json | null
          ticket_ids: string[] | null
          processing_error: string | null
          processing_log: string[] | null
          created_at: string
          updated_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          segurneo_external_call_id: string
          status: string
          segurneo_call_details?: Json | null
          segurneo_transcripts?: Json | null
          analysis_results?: Json | null
          ai_intent?: Json | null
          ticket_suggestions?: Json | null
          ticket_ids?: string[] | null
          processing_error?: string | null
          processing_log?: string[] | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          segurneo_external_call_id?: string
          status?: string
          segurneo_call_details?: Json | null
          segurneo_transcripts?: Json | null
          analysis_results?: Json | null
          ai_intent?: Json | null
          ticket_suggestions?: Json | null
          ticket_ids?: string[] | null
          processing_error?: string | null
          processing_log?: string[] | null
          created_at?: string
          updated_at?: string
          processed_at?: string | null
        }
      }
      voice_calls: {
        Row: {
          id: string
          segurneo_call_id: string
          conversation_id: string
          agent_id: string
          start_time: string
          end_time: string
          duration_seconds: number
          status: string
          call_successful: boolean
          termination_reason: string | null
          cost_cents: number
          transcript_summary: string | null
          agent_messages: number
          user_messages: number
          total_messages: number
          audio_available: boolean
          received_at: string
          created_at: string
        }
        Insert: {
          id?: string
          segurneo_call_id: string
          conversation_id: string
          agent_id: string
          start_time: string
          end_time: string
          duration_seconds: number
          status: string
          call_successful?: boolean
          termination_reason?: string | null
          cost_cents?: number
          transcript_summary?: string | null
          agent_messages?: number
          user_messages?: number
          total_messages?: number
          audio_available?: boolean
          received_at?: string
          created_at: string
        }
        Update: {
          id?: string
          segurneo_call_id?: string
          conversation_id?: string
          agent_id?: string
          start_time?: string
          end_time?: string
          duration_seconds?: number
          status?: string
          call_successful?: boolean
          termination_reason?: string | null
          cost_cents?: number
          transcript_summary?: string | null
          agent_messages?: number
          user_messages?: number
          total_messages?: number
          audio_available?: boolean
          received_at?: string
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          tipo_incidencia: string
          motivo_incidencia: string
          status: string
          priority: string
          description: string
          conversation_id: string
          assignee_id: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tipo_incidencia: string
          motivo_incidencia: string
          status?: string
          priority?: string
          description: string
          conversation_id: string
          assignee_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tipo_incidencia?: string
          motivo_incidencia?: string
          status?: string
          priority?: string
          description?: string
          conversation_id?: string
          assignee_id?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Tipos de ayuda para acceder a las tablas
export type ProcessedCall = Tables<'processed_calls'>
export type ProcessedCallInsert = TablesInsert<'processed_calls'>
export type ProcessedCallUpdate = TablesUpdate<'processed_calls'>

export type VoiceCall = Tables<'voice_calls'>
export type VoiceCallInsert = TablesInsert<'voice_calls'>
export type VoiceCallUpdate = TablesUpdate<'voice_calls'>

export type Ticket = Tables<'tickets'>
export type TicketInsert = TablesInsert<'tickets'>
export type TicketUpdate = TablesUpdate<'tickets'> 