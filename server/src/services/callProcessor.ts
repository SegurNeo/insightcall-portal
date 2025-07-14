// 🎯 PROCESADOR PRINCIPAL DE LLAMADAS - VERSIÓN OPTIMIZADA
// Flujo simple: Recibir → Crear → Procesar → Finalizar

import { supabase } from '../lib/supabase';
import { translationService } from './translationService';
import { nogalAnalysisService } from './nogalAnalysisService';
import { clientDataExtractor } from './clientDataExtractor';
import { nogalTicketService } from './nogalTicketService';
import { 
  Call, 
  SegurneoWebhookPayload, 
  CallTranscript, 
  CallAnalysis,
  CreateCallData,
  UpdateCallAnalysis,
  CallStats,
  Speaker,
  CallStatus
} from '../types/call.types';
import { NogalTicketPayload } from '../types/calls.types';

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
   * 🔧 PASO 1: Crear registro inicial desde webhook
   */
  private async createCall(payload: SegurneoWebhookPayload): Promise<Call> {
    // Traducir resumen si viene en inglés
    const translationResult = await translationService.translateToSpanish(
      payload.transcript_summary
    );

    // Mapear transcripts del payload al formato interno
    const transcripts: CallTranscript[] = payload.transcripts.map(t => ({
      sequence: t.sequence,
      speaker: t.speaker as Speaker,
      message: t.message,
      start_time: t.segment_start_time,
      end_time: t.segment_end_time,
      confidence: t.confidence,
      tool_calls: t.tool_calls || [],
      tool_results: t.tool_results || [],
      feedback: t.feedback || null
    }));

    const callData: CreateCallData = {
      segurneo_call_id: payload.call_id,
      conversation_id: payload.conversation_id,
      agent_id: payload.agent_id,
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
      transcript_summary: translationResult.translatedText,
      transcripts,
      
      // 🎵 Incluir campos de audio desde el payload
      audio_download_url: payload.audio_download_url || null,
      audio_file_size: payload.audio_file_size || null,
      fichero_llamada: payload.ficheroLlamada || payload.audio_download_url || null,
      
      // Inicializar campos de análisis
      analysis_completed: false,
      ai_analysis: null,
      tickets_created: 0,
      ticket_ids: [],
      received_at: new Date().toISOString()
    };

    // Insertar en base de datos
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
      // 🔍 EXTRAER DATOS DE CLIENTE de los transcripts estructurados
      // Adaptar formato para compatibilidad con clientDataExtractor
      const adaptedTranscripts = call.transcripts.map(t => ({
        sequence: t.sequence,
        speaker: t.speaker,
        message: t.message,
        segment_start_time: t.start_time,
        segment_end_time: t.end_time,
        tool_calls: t.tool_calls,
        tool_results: t.tool_results,
        feedback: t.feedback
      }));
      
      // 🧠 NUEVO: Usar extracción inteligente con contexto IA para matching
      const clientData = clientDataExtractor.extractClientDataWithAIContext(
        adaptedTranscripts as any,
        {
          datosExtraidos: {
            nombreCliente: (analysis.extracted_data as any)?.nombreCliente
          }
        }
      );
      
      console.log(`🔍 [PROCESSOR] Datos de cliente extraídos con IA:`, {
        idCliente: clientData.idCliente,
        nombre: clientData.nombre,
        confidence: clientData.confidence,
        source: clientData.extractionSource,
        toolsUsed: clientData.toolsUsed,
        aiMatchingInfo: clientData.clientMatchingInfo
      });

      // 🎯 Generar ID de cliente si no se encontró
      const idCliente = clientData.idCliente || 
        clientDataExtractor.generateFallbackClientId(call.conversation_id, clientData.telefono);

      // 📋 Log detallado del ID de cliente final
      if (clientData.idCliente) {
        console.log(`✅ [PROCESSOR] Usando idCliente de herramientas: ${idCliente}`);
      } else {
        console.log(`🔄 [PROCESSOR] Generando idCliente fallback: ${idCliente} (sin datos de herramientas)`);
      }

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
          extracted_data: analysis.extracted_data,
          // 🚀 AÑADIR DATOS DE CLIENTE EXTRAÍDOS CON MATCHING INTELIGENTE
          client_data: clientData,
          id_cliente: idCliente,
          // 🧠 Información de matching para debugging
          client_matching_debug: clientData.clientMatchingInfo
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

      // 📤 ENVIAR TICKET A SEGURNEO/NOGAL según el tipo de incidencia
      const shouldSend = this.shouldSendToNogal(analysis, clientData, idCliente);
      
      if (shouldSend) {
        console.log(`📤 [PROCESSOR] Enviando ticket a Segurneo/Nogal: ${ticket.id}`);
        console.log(`📊 [PROCESSOR] Criterios: tipo="${analysis.incident_type}", confianza=${clientData.confidence}, cliente=${!!idCliente}`);
        
        // 🧠 Log adicional de matching para debugging
        if (clientData.clientMatchingInfo) {
          console.log(`🧠 [PROCESSOR] Info matching: método=${clientData.clientMatchingInfo.matchingMethod}, score=${clientData.clientMatchingInfo.matchingScore}, IA="${clientData.clientMatchingInfo.aiDetectedName}"`);
        }
        
        try {
          // Preparar payload para Segurneo Voice
          const nogalPayload: Omit<NogalTicketPayload, 'IdTicket'> = {
            IdCliente: idCliente,
            IdLlamada: call.conversation_id,
            TipoIncidencia: analysis.incident_type,
            MotivoIncidencia: analysis.management_reason,
            NumeroPoliza: (analysis.extracted_data?.numeroPoliza as string) || '', // ✅ SOLO desde análisis IA
            Notas: ticketData.description,
            FicheroLlamada: call.audio_download_url || call.fichero_llamada || '' // 🎵 NUEVO: URL del audio
          };

          const nogalResult = await nogalTicketService.createAndSendTicket(nogalPayload);

          // Actualizar estado del ticket según resultado
          let finalStatus: string;
          const updatedMetadata = { ...ticketData.metadata } as any;

          if (nogalResult.success) {
            console.log(`✅ [PROCESSOR] Ticket enviado a Segurneo/Nogal: ${nogalResult.ticket_id}`);
            finalStatus = 'completed'; // ✅ Estado válido en BD
            updatedMetadata.ticket_id = nogalResult.ticket_id;
            updatedMetadata.nogal_ticket_id = nogalResult.ticket_id;
            updatedMetadata.nogal_sent_at = new Date().toISOString();
            updatedMetadata.segurneo_voice_response = nogalResult.message;
            updatedMetadata.nogal_status = 'sent_to_nogal';
          } else {
            console.error(`❌ [PROCESSOR] Error enviando a Segurneo/Nogal: ${nogalResult.error}`);
            finalStatus = 'pending'; // ✅ Estado válido en BD - mantener pendiente para reintento
            updatedMetadata.nogal_error = nogalResult.error;
            updatedMetadata.nogal_failed_at = new Date().toISOString();
            updatedMetadata.nogal_status = 'failed_send';
          }

          // Actualizar ticket con resultado del envío
          await supabase
            .from('tickets')
            .update({
              status: finalStatus,
              metadata: updatedMetadata
            })
            .eq('id', ticket.id);

          console.log(`🎉 [PROCESSOR] Ticket ${ticket.id} finalizado con estado: ${finalStatus}`);

        } catch (error) {
          console.error(`❌ [PROCESSOR] Error en envío a Segurneo/Nogal:`, error);
          
          // Marcar como fallido pero mantener pendiente para reintento
          await supabase
            .from('tickets')
            .update({
              status: 'pending', // ✅ Estado válido en BD
              metadata: {
                ...ticketData.metadata,
                nogal_error: error instanceof Error ? error.message : 'Error desconocido',
                nogal_failed_at: new Date().toISOString(),
                nogal_status: 'failed_send'
              }
            })
            .eq('id', ticket.id);
        }
      } else {
        console.log(`⏭️ [PROCESSOR] No se envía a Segurneo/Nogal: idCliente=${!!idCliente}, confidence=${clientData.confidence}`);
      }

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

  /**
   * 🔄 Mapear estado de Segurneo a tipo interno
   */
  private mapStatus(status: string): CallStatus {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'in_progress':
      case 'processing':
        return 'in_progress';
      default:
        return 'completed'; // Fallback por defecto
    }
  }

  private normalizeTranscripts(transcripts: readonly any[]): CallTranscript[] {
    return transcripts.map(t => ({
      sequence: t.sequence,
      speaker: t.speaker as 'agent' | 'user',
      message: t.message,
      start_time: t.segment_start_time,
      end_time: t.segment_end_time,
      confidence: t.confidence,
      // 🚀 PRESERVAR DATOS ESTRUCTURADOS PARA EXTRACCIÓN DE CLIENTE
      tool_calls: t.tool_calls || [],
      tool_results: t.tool_results || [],
      feedback: t.feedback || null
    }));
  }

  private generateTicketDescription(call: Call, analysis: CallAnalysis): string {
    const sections: string[] = [];

    // 1. Resumen principal
    if (analysis.summary) {
      sections.push(analysis.summary.trim());
    }

    // 2. Datos extraídos si los hay
    if (analysis.extracted_data && Object.keys(analysis.extracted_data).length > 0) {
      const datosRelevantes: string[] = [];
      
      if (analysis.extracted_data.numeroPoliza) {
        datosRelevantes.push(`• Póliza: ${analysis.extracted_data.numeroPoliza}`);
      }
      if (analysis.extracted_data.cuentaBancaria) {
        datosRelevantes.push(`• Nueva cuenta: ${analysis.extracted_data.cuentaBancaria}`);
      }
      if (analysis.extracted_data.direccion) {
        datosRelevantes.push(`• Nueva dirección: ${analysis.extracted_data.direccion}`);
      }

      if (datosRelevantes.length > 0) {
        sections.push(`\nDatos relevantes:\n${datosRelevantes.join('\n')}`);
      }
    }

    // 3. Footer discreto con confianza
    if (analysis.confidence >= 0.9) {
      // sections.push(`\n[Generado automáticamente - Alta confianza]`);
    } else if (analysis.confidence >= 0.7) {
      // sections.push(`\n[Generado automáticamente - Requiere revisión]`);
    }

    return sections.join('\n').trim();
  }

  private shouldSendToNogal(analysis: CallAnalysis, clientData: any, idCliente: string | null): boolean {
    // Si el tipo de incidencia es "Nueva contratación de seguros" o "Nueva renovación de seguros",
    // o si la confianza del extractor es alta, siempre enviar.
    // En caso contrario, solo enviar si el cliente tiene un ID.
    const isNewContractOrRenewal = 
      analysis.incident_type === 'Nueva contratación de seguros' || 
      analysis.incident_type === 'Nueva renovación de seguros';

    const isHighConfidence = clientData.confidence >= 0.7;

    if (isNewContractOrRenewal || isHighConfidence) {
      return true;
    }

    return !!idCliente;
  }
}

// 🚀 Exportar instancia única
export const callProcessor = new CallProcessor(); 