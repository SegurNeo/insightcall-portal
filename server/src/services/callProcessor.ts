// 🎯 PROCESADOR PRINCIPAL DE LLAMADAS - VERSIÓN OPTIMIZADA
// Flujo simple: Recibir → Crear → Procesar → Finalizar

import { supabase } from '../lib/supabase';
import { translationService } from './translationService';
import { nogalAnalysisService } from './nogalAnalysisService';
import { 
  Call, 
  SegurneoWebhookPayload, 
  CallTranscript, 
  CallAnalysis,
  CreateCallData,
  UpdateCallAnalysis,
  CallStats
} from '../types/call.types';

/**
 * 🎯 Procesador principal de llamadas
 * Responsabilidad única: convertir webhook de Segurneo en registro completo
 */
export class CallProcessor {
  
  /**
   * 🚀 MÉTODO PRINCIPAL - Procesa una llamada completa en 4 pasos
   * @param payload - Datos del webhook de Segurneo
   * @returns Llamada completamente procesada
   */
  async processCall(payload: SegurneoWebhookPayload): Promise<Call> {
    const startTime = Date.now();
    console.log(`🔄 [PROCESSOR] Iniciando procesamiento: ${payload.conversation_id}`);
    
    try {
      // PASO 1: Crear registro inicial
      const call = await this.createCall(payload);
      console.log(`✅ [PROCESSOR] Registro creado: ${call.id}`);

      // PASO 2: Procesar contenido (traducción + análisis)
      const analysis = await this.processContent(call);
      console.log(`🧠 [PROCESSOR] Análisis completado: ${analysis ? 'exitoso' : 'fallido'}`);

      // PASO 3: Crear tickets automáticos
      const ticketIds = await this.createAutoTickets(call, analysis);
      console.log(`🎫 [PROCESSOR] Tickets creados: ${ticketIds.length}`);

      // PASO 4: Finalizar y actualizar
      const finalCall = await this.finalizeCall(call.id, analysis, ticketIds);
      
      const duration = Date.now() - startTime;
      console.log(`🎉 [PROCESSOR] Completado en ${duration}ms: ${finalCall.id}`);
      
      return finalCall;
      
    } catch (error) {
      console.error(`❌ [PROCESSOR] Error procesando llamada:`, error);
      throw new Error(`Error processing call ${payload.conversation_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 📝 PASO 1: Crear registro inicial en la base de datos
   */
  private async createCall(payload: SegurneoWebhookPayload): Promise<Call> {
    const now = new Date().toISOString();
    
    const callData: CreateCallData = {
      segurneo_call_id: payload.call_id,
      conversation_id: payload.conversation_id,
      agent_id: payload.agent_id,
      start_time: payload.start_time,
      end_time: payload.end_time,
      duration_seconds: payload.duration_seconds,
      status: this.normalizeStatus(payload.status),
      call_successful: payload.call_successful,
      termination_reason: payload.termination_reason || null,
      cost_cents: payload.cost,
      agent_messages: payload.participant_count.agent_messages,
      user_messages: payload.participant_count.user_messages,
      total_messages: payload.participant_count.total_messages,
      transcript_summary: payload.transcript_summary, // Se traducirá en siguiente paso
      transcripts: this.normalizeTranscripts(payload.transcripts),
      analysis_completed: false,
      ai_analysis: null,
      tickets_created: 0,
      ticket_ids: [],
      received_at: now
    };

    const { data, error } = await supabase
      .from('calls')
      .insert([callData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create call record: ${error.message}`);
    }

    return data as Call;
  }

  /**
   * 🧠 PASO 2: Procesar contenido (traducción + análisis IA)
   */
  private async processContent(call: Call): Promise<CallAnalysis | null> {
    // 🌐 Traducir resumen si está en inglés
    const translatedSummary = await this.translateSummary(call.transcript_summary);
    
    // 🧠 Realizar análisis IA si hay transcripts
    const analysis = await this.performAIAnalysis(call.transcripts, call.conversation_id);
    
    // 💾 Actualizar registro con resumen traducido (análisis se guarda en paso 4)
    if (translatedSummary !== call.transcript_summary) {
      await supabase
        .from('calls')
        .update({ 
          transcript_summary: translatedSummary,
          updated_at: new Date().toISOString()
        })
        .eq('id', call.id);
    }
    
    return analysis;
  }

  /**
   * 🎫 PASO 3: Crear tickets automáticos si cumple criterios
   */
  private async createAutoTickets(call: Call, analysis: CallAnalysis | null): Promise<string[]> {
    // Solo crear tickets si hay análisis y confianza alta
    if (!analysis || analysis.confidence < 0.7) {
      console.log(`⏭️ [PROCESSOR] No auto-tickets: confianza ${analysis?.confidence || 0}`);
      return [];
    }

    try {
      const ticketData = {
        call_id: call.id, // Actualizado para usar call_id en lugar de conversation_id
        tipo_incidencia: analysis.incident_type,
        motivo_incidencia: analysis.management_reason,
        status: 'pending',
        priority: analysis.priority,
        description: this.generateTicketDescription(call, analysis),
        metadata: {
          source: 'ai-auto-generated',
          confidence: analysis.confidence,
          created_at: new Date().toISOString(),
          extracted_data: analysis.extracted_data
        }
      };

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select('id')
        .single();

      if (error) {
        console.error(`❌ [PROCESSOR] Error creating ticket:`, error);
        return [];
      }

      console.log(`🎫 [PROCESSOR] Auto-ticket created: ${ticket.id}`);
      return [ticket.id];
      
    } catch (error) {
      console.error(`❌ [PROCESSOR] Ticket creation failed:`, error);
      return [];
    }
  }

  /**
   * ✅ PASO 4: Finalizar procesamiento y actualizar registro
   */
  private async finalizeCall(
    callId: string, 
    analysis: CallAnalysis | null, 
    ticketIds: string[]
  ): Promise<Call> {
    const updateData: UpdateCallAnalysis = {
      ai_analysis: analysis,
      analysis_completed: !!analysis,
      tickets_created: ticketIds.length,
      ticket_ids: ticketIds,
      processed_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('calls')
      .update(updateData)
      .eq('id', callId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to finalize call: ${error.message}`);
    }

    return data as Call;
  }

  /**
   * 🌐 Traducir resumen al español si está en inglés
   */
  private async translateSummary(summary: string): Promise<string> {
    if (!summary?.trim()) return summary;
    
    try {
      const result = await translationService.translateToSpanish(summary);
      
      if (result.detectedLanguage === 'en' && result.translatedText !== summary) {
        console.log(`🌐 [PROCESSOR] Summary translated from English`);
        return result.translatedText;
      }
      
      return summary;
    } catch (error) {
      console.warn(`⚠️ [PROCESSOR] Translation failed, using original:`, error);
      return summary;
    }
  }

  /**
   * 🧠 Realizar análisis de IA usando Nogal
   */
  private async performAIAnalysis(
    transcripts: CallTranscript[], 
    conversationId: string
  ): Promise<CallAnalysis | null> {
    if (!transcripts?.length) {
      console.log(`⚠️ [PROCESSOR] No transcripts for analysis`);
      return null;
    }

    try {
      // Convertir formato para el analizador
      const messages = transcripts.map(t => ({
        role: t.speaker === 'agent' ? 'agent' : 'user',
        message: t.message
      }));

      const nogalResult = await nogalAnalysisService.analyzeCallForNogal(messages, conversationId);

      return {
        incident_type: nogalResult.incidenciaPrincipal.tipo,
        management_reason: nogalResult.incidenciaPrincipal.motivo,
        confidence: nogalResult.confidence,
        priority: nogalResult.prioridad as 'low' | 'medium' | 'high',
        summary: nogalResult.resumenLlamada,
        extracted_data: nogalResult.datosExtraidos
      };
      
    } catch (error) {
      console.error(`❌ [PROCESSOR] AI analysis failed:`, error);
      return null;
    }
  }

  /**
   * 📊 Obtener estadísticas del sistema
   */
  async getStats(): Promise<CallStats> {
    const { data, error } = await supabase
      .from('calls')
      .select('duration_seconds, cost_cents, analysis_completed');

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const totalCalls = data.length;
    const analyzedCalls = data.filter(call => call.analysis_completed).length;
    const totalDuration = data.reduce((sum, call) => sum + call.duration_seconds, 0);
    const totalCostCents = data.reduce((sum, call) => sum + call.cost_cents, 0);

    return {
      total_calls: totalCalls,
      analyzed_calls: analyzedCalls,
      average_duration: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
      total_cost_euros: Math.round(totalCostCents / 100 * 100) / 100, // Redondear a 2 decimales
      analysis_success_rate: totalCalls > 0 ? Math.round((analyzedCalls / totalCalls) * 100) : 0
    };
  }

  // 🔧 MÉTODOS AUXILIARES PRIVADOS

  private normalizeStatus(status: string): 'completed' | 'failed' | 'in_progress' {
    const normalized = status.toLowerCase();
    if (normalized === 'completed') return 'completed';
    if (normalized === 'failed') return 'failed';
    return 'in_progress';
  }

  private normalizeTranscripts(transcripts: readonly any[]): CallTranscript[] {
    return transcripts.map(t => ({
      sequence: t.sequence,
      speaker: t.speaker as 'agent' | 'user',
      message: t.message,
      start_time: t.segment_start_time,
      end_time: t.segment_end_time,
      confidence: t.confidence
    }));
  }

  private generateTicketDescription(call: Call, analysis: CallAnalysis): string {
    return `Ticket automático generado por IA

📞 Llamada: ${call.conversation_id}
🕐 Duración: ${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s
👤 Agente: ${call.agent_id}

🧠 Análisis IA:
• Tipo: ${analysis.incident_type}
• Motivo: ${analysis.management_reason}
• Confianza: ${Math.round(analysis.confidence * 100)}%
• Prioridad: ${analysis.priority}

📝 Resumen: ${analysis.summary}`;
  }
}

// 🚀 Exportar instancia única
export const callProcessor = new CallProcessor(); 