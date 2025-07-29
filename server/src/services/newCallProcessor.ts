// 🚀 NUEVO CALL PROCESSOR - Sistema completo con LLM
// Reemplaza callProcessor.ts con arquitectura moderna

import { callDecisionEngine } from './callDecisionEngine';
import { callExecutor } from './callExecutor';
import { supabase } from '../lib/supabase';
import { translationService } from './translationService';
import { SegurneoWebhookPayload, CallTranscript } from '../types/calls.types';
import { Call } from '../types/call.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 🎯 NUEVO PROCESADOR PRINCIPAL - Arquitectura LLM-First
 * 
 * Flujo simplificado:
 * 1. Crear registro inicial
 * 2. Traducir si es necesario  
 * 3. Analizar con LLM (CallDecisionEngine)
 * 4. Ejecutar decisiones (CallExecutor)
 * 5. Finalizar
 */
export class NewCallProcessor {

  /**
   * 🚀 MÉTODO PRINCIPAL - Procesar llamada completa
   */
  async processCall(payload: SegurneoWebhookPayload): Promise<Call> {
    const startTime = Date.now();
    console.log(`🚀 [NEW PROCESSOR] Iniciando procesamiento: ${payload.conversation_id}`);
    
    try {
      // PASO 1: Crear registro inicial en BD
      const call = await this.createCallRecord(payload);
      console.log(`✅ [NEW PROCESSOR] Registro creado: ${call.id}`);

      // PASO 2: Procesar transcripts (traducir si es necesario)
      const processedTranscripts = await this.processTranscripts(payload.transcripts);
      console.log(`🌐 [NEW PROCESSOR] Transcripts procesados: ${processedTranscripts.length}`);

      // PASO 3: Análisis con LLM
      console.log(`🧠 [NEW PROCESSOR] Iniciando análisis con LLM...`);
      const decision = await callDecisionEngine.analyzeCall(
        processedTranscripts,
        payload.conversation_id
      );
      console.log(`✅ [NEW PROCESSOR] Análisis LLM completado: ${decision.incidentAnalysis.primaryIncident.type}`);

      // PASO 4: Ejecutar decisiones
      console.log(`🚀 [NEW PROCESSOR] Ejecutando decisiones...`);
      const executionResult = await callExecutor.executeDecision(
        decision,
        call,
        processedTranscripts
      );
      console.log(`✅ [NEW PROCESSOR] Decisiones ejecutadas: ${executionResult.success ? 'ÉXITO' : 'CON ERRORES'}`);

      // PASO 5: Obtener registro actualizado
      const finalCall = await this.getFinalCallRecord(call.id);
      
      const duration = Date.now() - startTime;
      console.log(`🎉 [NEW PROCESSOR] Procesamiento completado en ${duration}ms`);
      
      return finalCall;

    } catch (error) {
      console.error(`❌ [NEW PROCESSOR] Error en procesamiento:`, error);
      throw new Error(`Error processing call ${payload.conversation_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 📝 Crear registro inicial en base de datos
   */
  private async createCallRecord(payload: SegurneoWebhookPayload): Promise<Call> {
    // Extraer caller_id del teléfono si está disponible
    const callerId = this.extractCallerId(payload);

    // Traducir resumen si no está en español
    const translatedSummary = await this.translateSummaryIfNeeded(payload.transcript_summary);

    const callData = {
      segurneo_call_id: payload.call_id,
      conversation_id: payload.conversation_id,
      agent_id: payload.agent_id,
      caller_id: callerId,
      start_time: payload.start_time,
      end_time: payload.end_time,
      duration_seconds: payload.duration_seconds,
      status: this.mapStatus(payload.status),
      call_successful: payload.call_successful,
      termination_reason: payload.termination_reason || null,
      cost_cents: payload.cost,
      agent_messages: payload.participant_count.agent_messages,
      user_messages: payload.participant_count.user_messages,
      total_messages: payload.participant_count.total_messages,
      transcript_summary: translatedSummary,
      transcripts: payload.transcripts,
      
      // Audio fields
      audio_download_url: payload.audio_download_url || null,
      audio_file_size: payload.audio_file_size || null,
      fichero_llamada: payload.ficheroLlamada || payload.audio_download_url || null,
      
      // Analysis fields (se llenan después)
      analysis_completed: false,
      ai_analysis: null,
      tickets_created: 0,
      ticket_ids: [],
      
      received_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('calls')
      .insert([callData])
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create call record: ${error.message}`);
    }

    return data as Call;
  }

  /**
   * 🌐 Procesar transcripts (traducir si es necesario)
   */
  private async processTranscripts(transcripts: CallTranscript[]): Promise<CallTranscript[]> {
    // Por ahora, asumir que los transcripts ya vienen en español
    // En el futuro se puede agregar lógica de traducción si es necesario
    return transcripts;
  }

  /**
   * 🌐 Traducir resumen si no está en español
   */
  private async translateSummaryIfNeeded(summary: string): Promise<string> {
    try {
      // Detectar si necesita traducción (heurística simple)
      const needsTranslation = this.detectNeedsTranslation(summary);
      
      if (needsTranslation) {
        console.log(`🌐 [NEW PROCESSOR] Traduciendo resumen...`);
        const result = await translationService.translateToSpanish(summary);
        return result.translatedText;
      }
      
      return summary;
    } catch (error) {
      console.error(`❌ [NEW PROCESSOR] Error en traducción, usando original:`, error);
      return summary;
    }
  }

  /**
   * 📞 Extraer caller_id del payload
   */
  private extractCallerId(payload: SegurneoWebhookPayload): string | null {
    // Buscar en transcripts por información de teléfono
    for (const transcript of payload.transcripts) {
      if (transcript.speaker === 'user') {
        // Buscar patrones de teléfono en el mensaje
        const phoneMatch = transcript.message.match(/(\+34)?[6-9][0-9]{8}/);
        if (phoneMatch) {
          return phoneMatch[0];
        }
      }
      
      // También revisar tool_results por si hay información de teléfono
      for (const toolResult of transcript.tool_results) {
        if (toolResult.tool_name === 'identificar_cliente' && !toolResult.is_error) {
          try {
            const data = JSON.parse(toolResult.result_value);
            if (data.data?.clientes?.[0]?.telefono_1) {
              return data.data.clientes[0].telefono_1;
            }
          } catch (e) {
            // Continuar buscando
          }
        }
      }
    }
    
    return null;
  }

  /**
   * 📊 Mapear status de Segurneo a nuestro formato
   */
  private mapStatus(status: string): 'completed' | 'failed' | 'in_progress' {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'in_progress';
    }
  }

  /**
   * 🌐 Detectar si el texto necesita traducción (heurística simple)
   */
  private detectNeedsTranslation(text: string): boolean {
    // Palabras comunes en inglés que no están en español
    const englishWords = ['the', 'and', 'is', 'to', 'in', 'you', 'that', 'it', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'what', 'some', 'we', 'can', 'out', 'other', 'were', 'all', 'there', 'when', 'up', 'use'];
    
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter(word => englishWords.includes(word)).length;
    
    // Si más del 20% son palabras en inglés, probablemente necesita traducción
    return (englishWordCount / words.length) > 0.2;
  }

  /**
   * 📋 Obtener registro final actualizado
   */
  private async getFinalCallRecord(callId: string): Promise<Call> {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (error) {
      throw new Error(`Failed to get final call record: ${error.message}`);
    }

    return data as Call;
  }
}

// Exportar instancia singleton
export const newCallProcessor = new NewCallProcessor(); 