// 🎯 SERVICIO PRINCIPAL - TODO EL PROCESAMIENTO EN UNO
// Flujo simple: Recibir → Guardar → Procesar → Completar

import { supabase } from '../lib/supabase';
import { translationService } from './translationService';
import { nogalAnalysisService } from './nogalAnalysisService';
import { clientDataExtractor } from './clientDataExtractor';
import { nogalTicketService } from './nogalTicketService';
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
      transcripts: payload.transcripts, // Usar directamente el formato de Segurneo
      
      // 🎵 Información de audio desde payload
      audio_download_url: payload.audio_download_url || null,
      audio_file_size: payload.audio_file_size || null,
      fichero_llamada: payload.ficheroLlamada || payload.audio_download_url || null,
      
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
        
        // 🛡️ Fallback: Crear análisis básico para evitar bloqueo
        aiAnalysis = {
          tipo_incidencia: 'Llamada gestión comercial',
          motivo_gestion: 'Consulta cliente',
          confidence: 0.3, // Baja confianza por ser fallback
          prioridad: 'low',
          resumen_analisis: 'Error en análisis IA - requiere revisión manual',
          datos_extraidos: {},
          notas_para_nogal: 'Error en análisis automático. Revisar transcript manualmente.',
          requiere_ticket: false // No crear ticket automático en caso de error
        };
        
        console.log(`🛡️ [SIMPLE] Aplicado análisis de fallback para evitar bloqueo`);
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
   * 🎫 Crear tickets automáticos si cumple criterios INTELIGENTES y enviarlos a Nogal
   */
  private async createTicketsIfNeeded(callRecord: CallRecord): Promise<void> {
    // Solo crear tickets si hay análisis IA
    const aiAnalysis = callRecord.ai_analysis as any; // Cast to allow new fields
    
    // 🔍 Verificar formato y validez del análisis
    if (!aiAnalysis) {
      console.log(`⏭️ [SIMPLE] No se crean tickets: sin análisis IA`);
      return;
    }

    // 🧠 NUEVA LÓGICA INTELIGENTE: Evaluar si procesar basado en contexto
    const shouldProcessTicket = this.shouldProcessTicketIntelligently(aiAnalysis);
    
    if (!shouldProcessTicket.process) {
      console.log(`⏭️ [SIMPLE] No se crean tickets: ${shouldProcessTicket.reason}`);
      return;
    }
    
    console.log(`✅ [SIMPLE] Creando ticket automático con lógica inteligente: ${shouldProcessTicket.reason}`);
    

    try {
      // 1. 🔍 NUEVO: Extraer datos de cliente con contexto IA para matching inteligente
      const clientData = clientDataExtractor.extractClientDataWithAIContext(
        callRecord.transcripts,
        {
          datosExtraidos: {
            nombreCliente: aiAnalysis.datos_extraidos?.nombreCliente
          }
        }
      );
      
      console.log(`🔍 [SIMPLE] Datos de cliente extraídos con IA:`, {
        idCliente: clientData.idCliente,
        confidence: clientData.confidence,
        source: clientData.extractionSource,
        toolsUsed: clientData.toolsUsed,
        aiMatchingInfo: clientData.clientMatchingInfo
      });

      // 2. 🎯 Generar ID de cliente si no se encontró
      const idCliente = clientData.idCliente || 
        clientDataExtractor.generateFallbackClientId(callRecord.conversation_id, clientData.telefono);

      // 📋 Log detallado del ID de cliente final
      if (clientData.idCliente) {
        console.log(`✅ [SIMPLE] Usando idCliente de herramientas: ${idCliente}`);
      } else {
        console.log(`🔄 [SIMPLE] Generando idCliente fallback: ${idCliente} (sin datos de herramientas)`);
      }

      // 3. Generar descripción profesional y concisa
      const descripcionCompleta = this.generateProfessionalTicketDescription(
        aiAnalysis.notas_para_nogal || aiAnalysis.notes || '',
        aiAnalysis.datos_extraidos || aiAnalysis.extracted_data || {},
        aiAnalysis.resumen_analisis || aiAnalysis.summary || 'Análisis no disponible',
        aiAnalysis.confidence || 0
      );

      // 4. 📝 Crear ticket interno en Supabase
      const ticketData = {
        conversation_id: callRecord.id,
        tipo_incidencia: aiAnalysis.tipo_incidencia || aiAnalysis.incident_type || 'Consulta cliente',
        motivo_incidencia: aiAnalysis.motivo_gestion || aiAnalysis.management_reason || 'Consulta general',
        status: 'pending',
        priority: aiAnalysis.prioridad || aiAnalysis.priority || 'medium',
        description: descripcionCompleta.trim(),
        metadata: {
          source: 'ai-analysis-auto',
          confidence: aiAnalysis.confidence || 0,
          analysis_timestamp: new Date().toISOString(),
          datos_extraidos: aiAnalysis.datos_extraidos || aiAnalysis.extracted_data || {},
          notas_nogal_originales: aiAnalysis.notas_para_nogal || 'Generado automáticamente',
          client_data: clientData,
          id_cliente: idCliente,
          // 🧠 Información de matching para debugging
          client_matching_debug: clientData.clientMatchingInfo,
          // 🧠 NUEVA: Información de decisión inteligente
          intelligent_decision: {
            processed_reason: shouldProcessTicket.reason,
            original_confidence: aiAnalysis.confidence || 0,
            decision_score: shouldProcessTicket.score,
            decision_factors: shouldProcessTicket.factors
          }
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

      console.log(`🎫 [SIMPLE] Ticket interno creado: ${createdTicket.id}`);

      // 5. 📤 Enviar ticket a Nogal vía Segurneo Voice según criterios inteligentes
      const shouldSend = this.shouldSendToNogal(aiAnalysis, clientData, idCliente);
      
      if (shouldSend) {
        console.log(`📤 [SIMPLE] Enviando a Segurneo Voice: ${createdTicket.id}`);
        console.log(`📊 [SIMPLE] Criterios: tipo="${aiAnalysis.tipo_incidencia}", confianza=${clientData.confidence}, cliente=${!!idCliente}`);
        
        // 🧠 Log adicional de matching para debugging
        if (clientData.clientMatchingInfo) {
          console.log(`🧠 [SIMPLE] Info matching: método=${clientData.clientMatchingInfo.matchingMethod}, score=${clientData.clientMatchingInfo.matchingScore}, IA="${clientData.clientMatchingInfo.aiDetectedName}"`);
        }
        
        const nogalPayload = {
          IdCliente: idCliente,
          IdLlamada: callRecord.conversation_id,
          TipoIncidencia: aiAnalysis.tipo_incidencia || aiAnalysis.incident_type || 'Consulta cliente',
          MotivoIncidencia: aiAnalysis.motivo_gestion || aiAnalysis.management_reason || 'Consulta general',
          NumeroPoliza: aiAnalysis.datos_extraidos?.numeroPoliza || aiAnalysis.extracted_data?.numeroPoliza || '', // ✅ SOLO desde análisis IA
          Notas: aiAnalysis.notas_para_nogal || descripcionCompleta,
          FicheroLlamada: callRecord.audio_download_url || callRecord.fichero_llamada || '' // 🎵 NUEVO: URL del audio
        };

        console.log(`📤 [SIMPLE] Enviando a Segurneo Voice:`, {
          IdCliente: nogalPayload.IdCliente,
          IdLlamada: nogalPayload.IdLlamada,
          TipoIncidencia: nogalPayload.TipoIncidencia,
          hasPoliza: !!nogalPayload.NumeroPoliza
        });

        const nogalResult = await nogalTicketService.createAndSendTicket(nogalPayload);

        // 6. 📊 Actualizar ticket según resultado de Nogal
        let finalStatus: string;
        let updatedMetadata = { ...ticketData.metadata } as any;

        if (nogalResult.success) {
          finalStatus = 'sent_to_nogal';
          updatedMetadata.nogal_ticket_id = nogalResult.ticket_id;
          updatedMetadata.nogal_response = nogalResult.message;
          console.log(`✅ [SIMPLE] Ticket enviado exitosamente a Segurneo/Nogal: ${nogalResult.ticket_id}`);
        } else {
          finalStatus = 'failed_to_send';
          updatedMetadata.nogal_error = nogalResult.error;
          console.error(`❌ [SIMPLE] Error enviando ticket a Segurneo/Nogal: ${nogalResult.error}`);
        }

        // Actualizar el ticket con el resultado
        await supabase
          .from('tickets')
          .update({
            status: finalStatus,
            metadata: updatedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', createdTicket.id);

        // 7. 📊 Actualizar registro de llamada con el ticket creado
        await supabase
          .from('calls')
          .update({
            tickets_created: 1,
            ticket_ids: [createdTicket.id],
            updated_at: new Date().toISOString()
          })
          .eq('id', callRecord.id);

        console.log(`🎉 [SIMPLE] Flujo de tickets completado exitosamente: ${createdTicket.id} (${finalStatus})`);
        
      } else {
        console.log(`⏭️ [SIMPLE] No se envía a Segurneo Voice para este ticket: tipo=${aiAnalysis.tipo_incidencia}, confianza=${clientData.confidence}`);
        // Solo actualizar el estado del ticket si no se envía a Nogal
        await supabase
          .from('tickets')
          .update({
            status: 'pending', // Mantener como pendiente para posible reintento manual
            metadata: {
              ...ticketData.metadata,
              nogal_status: 'not_sent_low_confidence',
              decision_reason: `No enviado - Confianza: ${clientData.confidence}, Tipo: ${aiAnalysis.tipo_incidencia}`
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', createdTicket.id);

        // 7. 📊 Actualizar registro de llamada con el ticket creado
        await supabase
          .from('calls')
          .update({
            tickets_created: 1,
            ticket_ids: [createdTicket.id],
            updated_at: new Date().toISOString()
          })
          .eq('id', callRecord.id);

        console.log(`🎉 [SIMPLE] Flujo de tickets completado (no enviado a Nogal): ${createdTicket.id}`);
      }
      
    } catch (error) {
      console.error(`❌ [SIMPLE] Error en flujo de tickets:`, error);
    }
  }

  /**
   * 🧠 FUNCIÓN PÚBLICA: Lógica inteligente para decidir si procesar ticket
   * No se basa solo en confianza, sino en contexto y valor de la información
   */
  public shouldProcessTicketIntelligently(aiAnalysis: any): {
    process: boolean;
    reason: string;
    score: number;
    factors: string[];
  } {
    const factors: string[] = [];
    let score = 0;
    let reason = '';

    // 🔥 FACTOR 1: Tipos de incidencia críticos (SIEMPRE procesar)
    const criticalIncidents = [
      'Nueva contratación de seguros',
      'Contratación Póliza',
      'Retención cliente',
      'Retención de Cliente Cartera Llamada',
      'Siniestros'
    ];

    const isCriticalIncident = criticalIncidents.some(incident => 
      aiAnalysis.tipo_incidencia?.includes(incident) || 
      aiAnalysis.incident_type?.includes(incident)
    );

    if (isCriticalIncident) {
      score += 100; // Máxima puntuación
      factors.push(`Incidencia crítica: ${aiAnalysis.tipo_incidencia || aiAnalysis.incident_type}`);
      reason = `Incidencia crítica que requiere procesamiento: ${aiAnalysis.tipo_incidencia || aiAnalysis.incident_type}`;
    }

    // 🔥 FACTOR 2: Información valiosa del cliente detectada
    const hasClientName = aiAnalysis.datos_extraidos?.nombreCliente || aiAnalysis.extracted_data?.nombreCliente;
    const hasClientInfo = aiAnalysis.datos_extraidos?.telefono || aiAnalysis.extracted_data?.telefono || 
                         aiAnalysis.datos_extraidos?.email || aiAnalysis.extracted_data?.email;
    
    if (hasClientName) {
      score += 30;
      factors.push(`Nombre de cliente detectado: ${hasClientName}`);
    }
    
    if (hasClientInfo) {
      score += 20;
      factors.push('Información de contacto detectada');
    }

    // 🔥 FACTOR 3: Resumen de llamada coherente y útil
    const summary = aiAnalysis.resumen_analisis || aiAnalysis.summary || '';
    const hasMeaningfulSummary = summary && 
      summary.length > 50 && 
      !summary.includes('Error en análisis');
    
    if (hasMeaningfulSummary) {
      score += 25;
      factors.push('Resumen de llamada coherente');
    }

    // 🔥 FACTOR 4: Confianza alta (factor tradicional)
    const confidence = aiAnalysis.confidence || 0;
    if (confidence >= 0.7) {
      score += 40;
      factors.push(`Alta confianza: ${confidence}`);
    } else if (confidence >= 0.5) {
      score += 20;
      factors.push(`Confianza media: ${confidence}`);
    } else if (confidence >= 0.3) {
      score += 10;
      factors.push(`Confianza baja pero procesable: ${confidence}`);
    }

    // 🔥 FACTOR 5: Tipo de incidencia que requiere seguimiento
    const needsFollowUp = [
      'Consulta cliente',
      'Pago de Recibo',
      'Duplicado',
      'Cambio'
    ];

    const needsFollowUpDetected = needsFollowUp.some(type => 
      aiAnalysis.tipo_incidencia?.includes(type) || 
      aiAnalysis.incident_type?.includes(type) ||
      aiAnalysis.motivo_gestion?.includes(type) ||
      aiAnalysis.management_reason?.includes(type)
    );

    if (needsFollowUpDetected) {
      score += 15;
      factors.push('Incidencia que requiere seguimiento');
    }

    // 🚨 DECISIÓN FINAL
    const shouldProcess = score >= 30; // Umbral mucho más flexible

    if (!reason) {
      if (shouldProcess) {
        reason = `Procesamiento aprobado por múltiples factores (score: ${score})`;
      } else {
        reason = `Procesamiento rechazado por falta de información valiosa (score: ${score})`;
      }
    }

    console.log(`🧠 [SIMPLE] Evaluación inteligente:`, {
      score,
      shouldProcess,
      reason,
      factors,
      confidence: aiAnalysis.confidence || 0,
      incident_type: aiAnalysis.tipo_incidencia || aiAnalysis.incident_type
    });

    return {
      process: shouldProcess,
      reason,
      score,
      factors
    };
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
      // sections.push(`\n[Generado automáticamente - Alta confianza]`);
    } else if (confidence >= 0.7) {
      // sections.push(`\n[Generado automáticamente - Requiere revisión]`);
    }

    return sections.join('\n').trim();
  }

  /**
   * 🛠️ Determina si un ticket debe ser enviado a Nogal según criterios inteligentes
   */
  private shouldSendToNogal(
    aiAnalysis: any,
    clientData: { confidence: number; idCliente?: string },  // ❌ Removido numeroPoliza
    idCliente: string | null
  ): boolean {
    // 1. Para "Nueva contratación de seguros" - SIEMPRE enviar (cliente nuevo)
    const isNewContract = aiAnalysis.tipo_incidencia === 'Nueva contratación de seguros';
    
    // 2. Para alta confianza del extractor - SIEMPRE enviar (cliente identificado)
    const isHighConfidence = clientData.confidence >= 0.7;
    
    // 3. Para otros casos - Solo si tiene ID de cliente
    if (isNewContract) {
      console.log(`✅ [SIMPLE] Enviando por nueva contratación`);
      return true;
    }
    
    if (isHighConfidence) {
      console.log(`✅ [SIMPLE] Enviando por alta confianza (${clientData.confidence})`);
      return true;
    }
    
    if (idCliente) {
      console.log(`✅ [SIMPLE] Enviando por ID de cliente disponible`);
      return true;
    }
    
    console.log(`❌ [SIMPLE] No enviando: tipo=${aiAnalysis.tipo_incidencia}, confianza=${clientData.confidence}, cliente=${!!idCliente}`);
    return false;
  }
}

// Exportar instancia única
export const callProcessingService = new CallProcessingService(); 