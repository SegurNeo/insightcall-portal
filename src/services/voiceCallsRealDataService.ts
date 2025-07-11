import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { translationService, TranslationResponse } from './translationService';

export interface VoiceCallReal {
  id: string;
  segurneo_call_id: string;
  conversation_id: string;
  agent_id: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  status: string;
  call_successful: boolean;
  agent_messages: number;
  user_messages: number;
  total_messages: number;
  audio_available: boolean;
  termination_reason: string | null;
  transcript_summary: string | null;
  created_at: string;
  received_at: string;
  // Nueva información de tickets
  tickets_count: number;
  tickets_sent: number;
  has_sent_tickets: boolean;
  ticket_status: 'none' | 'pending' | 'sent';
}

export interface VoiceCallsStats {
  total: number;
  totalDuration: number;
  avgDuration: number;
}

// Estructura de transcripción individual de Segurneo desde BD
export interface SegurneoTranscriptSegment {
  speaker: 'agent' | 'user';
  message: string;
  start_time: number;
  end_time: number;
  confidence: number;
  sequence?: number;
  metadata?: {
    is_agent: boolean;
    confidence: number;
  };
}

// Estructura procesada para el chat
export interface ChatMessage {
  id: string;
  speaker: 'agent' | 'user';
  text: string;
  timestamp: number;
  duration: number;
  confidence: number;
  formattedTime: string;
}

// Estructura de análisis de IA
export interface AnalysisResult {
  summary?: string;
  sentiment?: string;
  keyPoints?: string[];
  recommendations?: string[];
  score?: number;
  rawAnalysis?: any;
}

// Estructura de tickets
export interface TicketInfo {
  id: string;
  description: string;
  tipo_incidencia: string;
  motivo_incidencia: string;
  priority: string;
  status: string;
  created_at: string;
  metadata?: any;
}

export interface VoiceCallDetailsClean {
  // Identifiers
  id: string;
  segurneoCallId: string;
  conversationId: string;
  
  // Basic info
  agentId: string;
  status: string;
  callSuccessful: boolean;
  
  // Timing
  startTime: string;
  endTime: string;
  durationSeconds: number;
  formattedDuration: string;
  formattedStartTime: string;
  
  // Messages
  agentMessages: number;
  userMessages: number;
  totalMessages: number;
  
  // Content - DATOS REALES CON TRADUCCIÓN
  transcriptSummary: string | null;
  transcriptSummaryTranslated: string | null;
  translationInfo: TranslationResponse | null;
  hasTranscriptSummary: boolean;
  terminationReason: string | null;
  audioAvailable: boolean;
  
  // Transcripciones detalladas REALES
  chatMessages: ChatMessage[];
  hasChatMessages: boolean;
  transcriptSource: 'database' | 'none';
  
  // Análisis de IA REAL
  analysisResult: AnalysisResult | null;
  hasAnalysis: boolean;
  
  // Tickets REALES
  tickets: TicketInfo[];
  hasTickets: boolean;
  
  // Metadata
  createdAt: string;
  receivedAt: string;
}

class VoiceCallsRealDataService {

  async getRecentVoiceCalls(limit: number = 10): Promise<VoiceCallReal[]> {
    try {
      console.log(`🔍 Obteniendo ${limit} llamadas recientes de calls con información de tickets...`);
      
      // Consulta optimizada con información de tickets
      const { data, error } = await supabase
        .from('calls')
        .select(`
          *,
          tickets_info:tickets(
            id,
            status,
            metadata
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error obteniendo llamadas:', error);
        throw new Error(`Error obteniendo llamadas: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('⚠️ No se encontraron llamadas en calls');
        return [];
      }

      const calls: VoiceCallReal[] = data.map(call => {
        // Procesar información de tickets
        const tickets = call.tickets_info || [];
        const ticketsCount = tickets.length;
        const ticketsSent = tickets.filter((ticket: any) => 
          ticket.metadata?.nogal_ticket_id || 
          ticket.metadata?.ticket_id ||
          ticket.status === 'sent'
        ).length;
        
        // Determinar estado de tickets
        let ticketStatus: 'none' | 'pending' | 'sent' = 'none';
        if (ticketsCount > 0) {
          ticketStatus = ticketsSent > 0 ? 'sent' : 'pending';
        }

        return {
          id: call.id,
          segurneo_call_id: call.segurneo_call_id,
          conversation_id: call.conversation_id,
          agent_id: call.agent_id,
          start_time: call.start_time,
          end_time: call.end_time,
          duration_seconds: call.duration_seconds,
          status: call.status,
          call_successful: call.call_successful,
          agent_messages: call.agent_messages,
          user_messages: call.user_messages,
          total_messages: call.total_messages,
          audio_available: false, // La tabla calls no tiene esta columna, defaulteamos a false
          termination_reason: call.termination_reason,
          transcript_summary: call.transcript_summary,
          created_at: call.created_at,
          received_at: call.received_at,
          // Nueva información de tickets
          tickets_count: ticketsCount,
          tickets_sent: ticketsSent,
          has_sent_tickets: ticketsSent > 0,
          ticket_status: ticketStatus
        };
      });

      console.log(`✅ ${calls.length} llamadas obtenidas exitosamente con información de tickets`);
      console.log('📊 Resumen de tickets:', {
        total_calls: calls.length,
        calls_with_tickets: calls.filter(c => c.tickets_count > 0).length,
        calls_with_sent_tickets: calls.filter(c => c.has_sent_tickets).length
      });
      
      return calls;
      
    } catch (error) {
      console.error('❌ Error en getRecentVoiceCalls:', error);
      throw error;
    }
  }

  async getVoiceCallsStats(): Promise<VoiceCallsStats> {
    try {
      console.log('📊 Calculando estadísticas de calls...');
      
      const { data, error } = await supabase
        .from('calls')
        .select('duration_seconds');

      if (error) {
        console.error('Error obteniendo estadísticas:', error);
        throw new Error(`Error obteniendo estadísticas: ${error.message}`);
      }

      const total = data?.length || 0;
      const totalDuration = data?.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) || 0;
      const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

      const stats: VoiceCallsStats = {
        total,
        totalDuration,
        avgDuration
      };

      console.log('✅ Estadísticas calculadas:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
      throw error;
    }
  }

  /**
   * 🔄 NUEVA FUNCIONALIDAD - Obtener transcripciones REALES de la base de datos
   */
  private async loadRealTranscriptionsFromDB(conversationId: string): Promise<ChatMessage[]> {
    try {
      console.log(`🔍 Buscando transcripciones REALES para conversationId: ${conversationId}`);
      
      // Buscar en la tabla calls por conversation_id
      const { data: call, error } = await supabase
        .from('calls')
        .select('transcripts')
        .eq('conversation_id', conversationId)
        .single();

      if (error || !call) {
        console.log(`⚠️ No se encontraron transcripciones en calls para ${conversationId}`);
        return [];
      }

      const transcripts = call.transcripts as SegurneoTranscriptSegment[];
      
      if (!Array.isArray(transcripts) || transcripts.length === 0) {
        console.log(`⚠️ Transcripciones vacías para ${conversationId}`);
        return [];
      }

      console.log(`✅ Encontradas ${transcripts.length} transcripciones en BD`);

      // Convertir a formato ChatMessage
      const chatMessages: ChatMessage[] = transcripts.map((transcript, index) => ({
        id: `msg_${index + 1}`,
        speaker: transcript.speaker || 'user',
        text: transcript.message || '',
        timestamp: transcript.start_time || 0,
        duration: (transcript.end_time || 0) - (transcript.start_time || 0),
        confidence: transcript.confidence || 0.95,
        formattedTime: this.formatTime(transcript.start_time || 0)
      }));

      console.log(`✅ ${chatMessages.length} mensajes de chat procesados desde BD`);
      return chatMessages;
      
    } catch (error) {
      console.error('❌ Error cargando transcripciones desde BD:', error);
      return [];
    }
  }

  /**
   * 🧠 Obtener análisis REAL de IA desde la base de datos
   */
  private async loadRealAnalysisFromDB(conversationId: string): Promise<AnalysisResult | null> {
    try {
      console.log(`🧠 Buscando análisis REAL de IA para: ${conversationId}`);
      
      const { data: call, error } = await supabase
        .from('calls')
        .select('ai_analysis')
        .eq('conversation_id', conversationId)
        .single();

      if (error || !call) {
        console.log(`⚠️ No se encontró análisis para ${conversationId}`);
        return null;
      }

      const aiAnalysis = call.ai_analysis as any;

      if (!aiAnalysis) {
        return null;
      }

      // Procesar el análisis real
      const analysis: AnalysisResult = {
        summary: aiAnalysis?.summary || '',
        sentiment: aiAnalysis?.sentiment || '',
        keyPoints: aiAnalysis?.keyPoints || [],
        recommendations: aiAnalysis?.recommendations || [],
        score: aiAnalysis?.score || 0,
        rawAnalysis: aiAnalysis
      };

      console.log(`✅ Análisis de IA encontrado:`, {
        hasSummary: !!analysis.summary,
        sentiment: analysis.sentiment,
        keyPointsCount: analysis.keyPoints?.length || 0
      });

      return analysis;
      
    } catch (error) {
      console.error('❌ Error cargando análisis desde BD:', error);
      return null;
    }
  }

  /**
   * 🎫 Obtener tickets REALES asociados a la llamada
   */
  private async loadRealTicketsFromDB(conversationId: string): Promise<TicketInfo[]> {
    try {
      console.log(`🎫 Buscando tickets REALES para: ${conversationId}`);
      
      // Primero obtener el ID de la llamada desde calls
      const { data: call, error: callError } = await supabase
        .from('calls')
        .select('id')
        .eq('conversation_id', conversationId)
        .single();

      if (callError || !call) {
        console.log(`⚠️ No se encontró la llamada para ${conversationId}`);
        return [];
      }

      // Buscar tickets relacionados usando call_id
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('call_id', call.id);

      if (ticketsError) {
        console.error('Error obteniendo tickets:', ticketsError);
        return [];
      }

      if (!tickets || tickets.length === 0) {
        console.log(`⚠️ No se encontraron tickets para ${conversationId}`);
        return [];
      }

      const ticketInfos: TicketInfo[] = tickets.map(ticket => ({
        id: ticket.id,
        description: ticket.description || '',
        tipo_incidencia: ticket.tipo_incidencia || '',
        motivo_incidencia: ticket.motivo_incidencia || '',
        priority: ticket.priority || 'medium',
        status: ticket.status || 'created',
        created_at: ticket.created_at,
        metadata: ticket.metadata
      }));

      console.log(`✅ ${ticketInfos.length} tickets encontrados para ${conversationId}`);
      return ticketInfos;
      
    } catch (error) {
      console.error('❌ Error cargando tickets desde BD:', error);
      return [];
    }
  }

  /**
   * 🌍 Traducir resumen automáticamente a español
   */
  private async translateSummaryIfNeeded(summary: string | null): Promise<{
    translated: string | null;
    translationInfo: TranslationResponse | null;
  }> {
    if (!summary || summary.trim().length === 0) {
      return { translated: null, translationInfo: null };
    }

         try {
       console.log('🌍 Traduciendo resumen a español...');
       const translationInfo = await translationService.translateToSpanish(summary);
      
      console.log('✅ Resumen traducido exitosamente');
      return { 
        translated: translationInfo.translatedText, 
        translationInfo 
      };
      
    } catch (error) {
      console.error('❌ Error en traducción, usando original:', error);
      return { translated: summary, translationInfo: null };
    }
  }

  /**
   * 🎯 MÉTODO PRINCIPAL MEJORADO - Con datos REALES de la base de datos
   */
  async getVoiceCallDetailsClean(segurneoCallId: string): Promise<VoiceCallDetailsClean> {
    try {
      console.log(`🔍 Obteniendo detalles REALES para: ${segurneoCallId}`);
      
      // 1. Obtener datos básicos de calls
      const { data: voiceCallData, error: voiceCallError } = await supabase
        .from('calls')
        .select('*')
        .eq('segurneo_call_id', segurneoCallId)
        .single();

      if (voiceCallError || !voiceCallData) {
        console.error(`❌ No se encontró la llamada:`, voiceCallError);
        throw new Error('Llamada no encontrada');
      }

      // 2. Obtener datos detallados de forma paralela
      const [chatMessages, analysisResult, tickets] = await Promise.all([
        this.loadRealTranscriptionsFromDB(voiceCallData.conversation_id),
        this.loadRealAnalysisFromDB(voiceCallData.conversation_id),
        this.loadRealTicketsFromDB(voiceCallData.conversation_id)
      ]);

      // 3. Traducir resumen si está disponible
      const { translated: translatedSummary, translationInfo } = await this.translateSummaryIfNeeded(
        voiceCallData.transcript_summary
      );

      console.log(`✅ Llamada procesada completamente:`, {
        id: voiceCallData.segurneo_call_id,
        conversation_id: voiceCallData.conversation_id,
        transcript_summary: voiceCallData.transcript_summary ? `${voiceCallData.transcript_summary.length} chars` : 'NO',
        translated_summary: translatedSummary ? `${translatedSummary.length} chars` : 'NO',
        chat_messages: chatMessages.length,
        has_analysis: !!analysisResult,
        tickets_count: tickets.length,
        total_messages: voiceCallData.total_messages
      });

      const details: VoiceCallDetailsClean = {
        // Identifiers
        id: voiceCallData.id,
        segurneoCallId: voiceCallData.segurneo_call_id,
        conversationId: voiceCallData.conversation_id,
        
        // Basic info
        agentId: voiceCallData.agent_id,
        status: voiceCallData.status,
        callSuccessful: voiceCallData.call_successful,
        
        // Timing
        startTime: voiceCallData.start_time,
        endTime: voiceCallData.end_time,
        durationSeconds: voiceCallData.duration_seconds,
        formattedDuration: this.formatDuration(voiceCallData.duration_seconds),
        formattedStartTime: this.formatDateTime(voiceCallData.start_time),
        
        // Messages
        agentMessages: voiceCallData.agent_messages,
        userMessages: voiceCallData.user_messages,
        totalMessages: voiceCallData.total_messages,
        
        // Content con traducción
        transcriptSummary: voiceCallData.transcript_summary,
        transcriptSummaryTranslated: translatedSummary,
        translationInfo,
        hasTranscriptSummary: !!voiceCallData.transcript_summary && voiceCallData.transcript_summary.trim().length > 0,
        terminationReason: voiceCallData.termination_reason,
        audioAvailable: false, // La tabla calls no tiene esta columna, defaulteamos a false
        
        // Transcripciones REALES
        chatMessages,
        hasChatMessages: chatMessages.length > 0,
        transcriptSource: chatMessages.length > 0 ? 'database' : 'none',
        
        // Análisis REAL
        analysisResult,
        hasAnalysis: !!analysisResult,
        
        // Tickets REALES
        tickets,
        hasTickets: tickets.length > 0,
        
        // Metadata
        createdAt: voiceCallData.created_at,
        receivedAt: voiceCallData.received_at
      };

      console.log(`✅ Detalles REALES procesados:`, {
        id: details.segurneoCallId,
        duration: details.formattedDuration,
        hasTranscriptSummary: details.hasTranscriptSummary,
        hasChatMessages: details.hasChatMessages,
        hasAnalysis: details.hasAnalysis,
        hasTickets: details.hasTickets,
        chatMessages: details.chatMessages.length,
        tickets: details.tickets.length
      });

      return details;
      
    } catch (error) {
      console.error('❌ Error obteniendo detalles REALES:', error);
      throw error;
    }
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return `Hoy, ${format(date, 'HH:mm')}`;
    } else if (diffInDays === 1) {
      return `Ayer, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'dd MMM yyyy, HH:mm', { locale: es });
    }
  }
}

export const voiceCallsRealDataService = new VoiceCallsRealDataService(); 