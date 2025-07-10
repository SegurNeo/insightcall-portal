// 🎯 SERVICIO PRINCIPAL - TODO EL PROCESAMIENTO EN UNO
// Flujo simple: Recibir → Guardar → Procesar → Completar

import { supabase } from '../lib/supabase';
import { translationService } from './translationService';
import { nogalAnalysisService } from './nogalAnalysisService';
import { v4 as uuidv4 } from 'uuid';
import { CallRecord, SegurneoWebhookPayload, CallTranscript } from '../types/calls.types';

export class CallProcessingService {
  
  /**
   * 🎯 MÉTODO PRINCIPAL - Procesa una llamada completa
   * Este es el ÚNICO punto de entrada para todas las llamadas
   */
  async processIncomingCall(payload: SegurneoWebhookPayload): Promise<CallRecord> {
    console.log(`🔄 [SIMPLE] Procesando llamada: ${payload.conversation_id}`);
    
    try {
      // 1️⃣ PASO 1: Verificar si ya existe (evitar duplicados)
      const existing = await this.checkExistingCall(payload.conversation_id);
      if (existing) {
        console.log(`⚠️ [SIMPLE] Llamada ya existe: ${existing.id}`);
        return existing;
      }

      // 2️⃣ PASO 2: Crear registro inicial limpio
      const callRecord = await this.createInitialRecord(payload);
      console.log(`✅ [SIMPLE] Registro creado: ${callRecord.id}`);

      // 3️⃣ PASO 3: Procesar contenido (traducción + análisis)
      await this.processCallContent(callRecord);
      console.log(`🧠 [SIMPLE] Contenido procesado: ${callRecord.id}`);

      // 4️⃣ PASO 4: Crear tickets si necesario
      await this.createTicketsIfNeeded(callRecord);
      console.log(`🎫 [SIMPLE] Tickets procesados: ${callRecord.id}`);

      // 5️⃣ PASO 5: Marcar como completado
      await this.markAsCompleted(callRecord);
      console.log(`🎉 [SIMPLE] Llamada completada: ${callRecord.id}`);

      return callRecord;
      
    } catch (error) {
      console.error(`❌ [SIMPLE] Error procesando llamada:`, error);
      throw error;
    }
  }

  /**
   * ✅ Verificar si la llamada ya existe
   */
  private async checkExistingCall(conversationId: string): Promise<CallRecord | null> {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return data as CallRecord | null;
  }

  /**
   * 📝 Crear registro inicial en la tabla calls
   */
  private async createInitialRecord(payload: SegurneoWebhookPayload): Promise<CallRecord> {
    const now = new Date().toISOString();
    
    const callRecord: Omit<CallRecord, 'id'> = {
      // Identificadores
      segurneo_call_id: payload.call_id,
      conversation_id: payload.conversation_id,
      
      // Datos básicos
      agent_id: payload.agent_id,
      start_time: payload.start_time,
      end_time: payload.end_time,
      duration_seconds: payload.duration_seconds,
      status: payload.status as CallRecord['status'],
      call_successful: payload.call_successful,
      termination_reason: payload.termination_reason,
      cost_cents: payload.cost,
      
      // Contadores
      agent_messages: payload.participant_count.agent_messages,
      user_messages: payload.participant_count.user_messages,
      total_messages: payload.participant_count.total_messages,
      
      // Contenido (transcript_summary se traducirá después)
      transcript_summary: payload.transcript_summary,
      transcripts: payload.transcripts.map(t => ({
        sequence: t.sequence,
        speaker: t.speaker,
        message: t.message,
        segment_start_time: t.segment_start_time,
        segment_end_time: t.segment_end_time,
        confidence: t.confidence
      })),
      
      // Estado inicial del análisis
      analysis_completed: false,
      ai_analysis: null,
      
      // Tickets inicial
      tickets_created: 0,
      ticket_ids: [],
      
      // Timestamps
      received_at: now,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('calls')
      .insert([callRecord])
      .select()
      .single();

    if (error) {
      throw new Error(`Error creando registro: ${error.message}`);
    }

    return data as CallRecord;
  }

  /**
   * 🌐 Procesar contenido: Traducción + Análisis IA
   */
  private async processCallContent(callRecord: CallRecord): Promise<void> {
    // 🌐 TRADUCIR RESUMEN si está en inglés
    let translatedSummary = callRecord.transcript_summary;
    
    if (callRecord.transcript_summary && callRecord.transcript_summary.trim().length > 0) {
      try {
        const translationResult = await translationService.translateToSpanish(callRecord.transcript_summary);
        
        if (translationResult.detectedLanguage === 'en' && 
            translationResult.translatedText !== callRecord.transcript_summary) {
          translatedSummary = translationResult.translatedText;
          console.log(`🌐 [SIMPLE] Resumen traducido del inglés`);
        }
      } catch (error) {
        console.warn(`⚠️ [SIMPLE] Error en traducción, usando original:`, error);
      }
    }

    // 🧠 ANÁLISIS IA si hay transcripts
    let aiAnalysis: {
      tipo_incidencia: string;
      motivo_gestion: string;
      confidence: number;
      prioridad: 'low' | 'medium' | 'high';
      resumen_analisis: string;
      datos_extraidos: Record<string, any>;
      notas_para_nogal?: string;
      requiere_ticket?: boolean;
    } | null = null;
    
    if (callRecord.transcripts && callRecord.transcripts.length > 0) {
      try {
        // Convertir transcripts a formato para análisis
        const transcriptMessages = callRecord.transcripts.map(t => ({
          role: t.speaker === 'agent' ? 'agent' : 'user',
          message: t.message
        }));

        // Ejecutar análisis de Nogal
        const nogalAnalysis = await nogalAnalysisService.analyzeCallForNogal(
          transcriptMessages, 
          callRecord.conversation_id
        );

        aiAnalysis = {
          tipo_incidencia: nogalAnalysis.incidenciaPrincipal.tipo,
          motivo_gestion: nogalAnalysis.incidenciaPrincipal.motivo,
          confidence: nogalAnalysis.confidence,
          prioridad: nogalAnalysis.prioridad as 'low' | 'medium' | 'high',
          resumen_analisis: nogalAnalysis.resumenLlamada,
          datos_extraidos: nogalAnalysis.datosExtraidos,
          notas_para_nogal: nogalAnalysis.notasParaNogal,
          requiere_ticket: nogalAnalysis.requiereTicket
        };

        console.log(`🧠 [SIMPLE] Análisis IA completado con confianza: ${nogalAnalysis.confidence}`);
        
      } catch (error) {
        console.error(`❌ [SIMPLE] Error en análisis IA:`, error);
      }
    }

    // 💾 ACTUALIZAR registro con el contenido procesado
    const { error } = await supabase
      .from('calls')
      .update({
        transcript_summary: translatedSummary,
        ai_analysis: aiAnalysis,
        analysis_completed: !!aiAnalysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', callRecord.id);

    if (error) {
      throw new Error(`Error actualizando contenido: ${error.message}`);
    }

    // Actualizar el objeto en memoria
    callRecord.transcript_summary = translatedSummary;
    callRecord.ai_analysis = aiAnalysis;
    callRecord.analysis_completed = !!aiAnalysis;
  }

  /**
   * 🎫 Crear tickets automáticos si cumple criterios
   */
  private async createTicketsIfNeeded(callRecord: CallRecord): Promise<void> {
    // Solo crear tickets si hay análisis IA, requiere ticket y confianza alta
    const aiAnalysis = callRecord.ai_analysis as any; // Cast to allow new fields
    if (!aiAnalysis || !aiAnalysis.requiere_ticket || aiAnalysis.confidence < 0.7) {
      console.log(`⏭️ [SIMPLE] No se crean tickets: requiere=${aiAnalysis?.requiere_ticket}, confianza=${aiAnalysis?.confidence || 0}`);
      return;
    }

    try {
      // Generar descripción profesional y concisa
      const descripcionCompleta = this.generateProfessionalTicketDescription(
        aiAnalysis.notas_para_nogal || '',
        aiAnalysis.datos_extraidos || {},
        aiAnalysis.resumen_analisis,
        aiAnalysis.confidence
      );

      const ticketData = {
        conversation_id: callRecord.id,
        tipo_incidencia: aiAnalysis.tipo_incidencia,
        motivo_incidencia: aiAnalysis.motivo_gestion,
        status: 'created',
        priority: aiAnalysis.prioridad,
        description: descripcionCompleta.trim(),
        metadata: {
          source: 'ai-analysis-auto',
          confidence: aiAnalysis.confidence,
          analysis_timestamp: new Date().toISOString(),
          datos_extraidos: aiAnalysis.datos_extraidos,
          notas_nogal_originales: aiAnalysis.notas_para_nogal
        }
      };

      const { data: createdTicket, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Actualizar registro con el ticket creado
      await supabase
        .from('calls')
        .update({
          tickets_created: 1,
          ticket_ids: [createdTicket.id],
          updated_at: new Date().toISOString()
        })
        .eq('id', callRecord.id);

      console.log(`🎫 [SIMPLE] Ticket automático creado: ${createdTicket.id}`);
      
    } catch (error) {
      console.error(`❌ [SIMPLE] Error creando ticket:`, error);
    }
  }

  /**
   * ✅ Marcar llamada como completamente procesada
   */
  private async markAsCompleted(callRecord: CallRecord): Promise<void> {
    const { error } = await supabase
      .from('calls')
      .update({
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', callRecord.id);

    if (error) {
      throw new Error(`Error marcando como completado: ${error.message}`);
    }
  }

  /**
   * 📊 Obtener estadísticas simples
   */
  async getCallsStats() {
    const { data, error } = await supabase
      .from('calls')
      .select('duration_seconds, cost_cents, analysis_completed')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const total = data.length;
    const totalDuration = data.reduce((sum, call) => sum + call.duration_seconds, 0);
    const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;
    const totalCost = data.reduce((sum, call) => sum + call.cost_cents, 0);
    const analyzed = data.filter(call => call.analysis_completed).length;

    return {
      total,
      analyzed,
      avgDuration,
      totalCost: Math.round(totalCost / 100), // Convertir a euros
      analysisRate: total > 0 ? Math.round((analyzed / total) * 100) : 0
    };
  }

  /**
   * 📝 Genera una descripción profesional y concisa para tickets
   */
  private generateProfessionalTicketDescription(
    notasNogal: string,
    datosExtraidos: Record<string, any>,
    resumen: string,
    confidence: number
  ): string {
    const sections: string[] = [];

    // 1. Resumen principal (limpio y profesional)
    if (resumen) {
      sections.push(resumen.trim());
    }

    // 2. Datos específicos extraídos (solo los relevantes)
    const datosRelevantes: string[] = [];
    
    if (datosExtraidos.numeroPoliza) {
      datosRelevantes.push(`• Póliza: ${datosExtraidos.numeroPoliza}`);
    }
    if (datosExtraidos.cuentaBancaria) {
      datosRelevantes.push(`• Nueva cuenta: ${datosExtraidos.cuentaBancaria}`);
    }
    if (datosExtraidos.direccion) {
      datosRelevantes.push(`• Nueva dirección: ${datosExtraidos.direccion}`);
    }
    if (datosExtraidos.fechaEfecto) {
      datosRelevantes.push(`• Fecha efectiva: ${datosExtraidos.fechaEfecto}`);
    }
    if (datosExtraidos.asegurados && Array.isArray(datosExtraidos.asegurados)) {
      datosRelevantes.push(`• Asegurados: ${datosExtraidos.asegurados.join(', ')}`);
    }
    if (datosExtraidos.prestamo) {
      const p = datosExtraidos.prestamo;
      datosRelevantes.push(`• Préstamo: ${p.numero} (${p.banco})`);
    }

    if (datosRelevantes.length > 0) {
      sections.push(`\nDatos relevantes:\n${datosRelevantes.join('\n')}`);
    }

    // 3. Notas específicas de Nogal (si las hay)
    if (notasNogal && notasNogal.trim()) {
      sections.push(`\nIndicaciones:\n${notasNogal.trim()}`);
    }

    // 4. Footer discreto con confianza (solo si es relevante)
    if (confidence >= 0.9) {
      sections.push(`\n[Generado automáticamente - Alta confianza]`);
    } else if (confidence >= 0.7) {
      sections.push(`\n[Generado automáticamente - Requiere revisión]`);
    }

    return sections.join('\n').trim();
  }
}

// Exportar instancia única
export const callProcessingService = new CallProcessingService(); 