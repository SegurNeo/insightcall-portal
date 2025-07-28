// 🎯 PROCESADOR PRINCIPAL DE LLAMADAS - VERSIÓN OPTIMIZADA
// Flujo simple: Recibir → Crear → Procesar → Finalizar

import { supabase } from '../lib/supabase';
import { translationService } from './translationService';
import { nogalAnalysisService } from './nogalAnalysisService';
import { clientDataExtractor } from './clientDataExtractor';
import { nogalTicketService } from './nogalTicketService';
import { nogalRellamadaService } from './nogalRellamadaService'; // NUEVO: Servicio de rellamadas
import { nogalClientService } from './nogalClientService';
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

    // 📞 NUEVO: Extraer caller ID de los transcripts
    // Usar la interface correcta de types/calls.types.ts
    const callerIdTranscripts = transcripts.map(t => ({
      ...t,
      segment_start_time: t.start_time,
      segment_end_time: t.end_time
    }));
    const callerId = clientDataExtractor.extractCallerIdFromTranscripts(callerIdTranscripts as any);
    console.log(`📞 [PROCESSOR] Caller ID extraído: ${callerId || 'No encontrado'}`);

    const callData: CreateCallData = {
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
   * 🎫 PASO 3: Crear tickets automáticos si cumple criterios INTELIGENTES
   */
  private async createAutoTickets(call: Call, analysis: CallAnalysis | null): Promise<string[]> {
    // Verificar que tenemos análisis básico
    if (!analysis) {
      console.log(`⏭️ [PROCESSOR] No auto-tickets: sin análisis`);
      return [];
    }

    // 🧠 NUEVA LÓGICA INTELIGENTE: Evaluar si procesar basado en contexto
    const shouldProcessTicket = this.shouldProcessTicketIntelligently(analysis);
    
    if (!shouldProcessTicket.process) {
      console.log(`⏭️ [PROCESSOR] No auto-tickets: ${shouldProcessTicket.reason}`);
      return [];
    }

    console.log(`✅ [PROCESSOR] Procesando ticket con lógica inteligente: ${shouldProcessTicket.reason}`);

    try {
      // 🧠 NUEVO: Usar directamente los datos extraídos por la IA
      const extractedData = analysis.extracted_data as any;
      
      console.log(`🧠 [PROCESSOR] Datos extraídos por IA:`, {
        nombreCliente: extractedData?.nombreCliente,
        telefono: extractedData?.telefono,
        email: extractedData?.email,
        numeroPoliza: extractedData?.numeroPoliza,
        leadInfo: extractedData?.leadInfo
      });

      // 🎯 FLUJO SIMPLIFICADO: Decidir según datos extraídos por IA
      let idCliente: string;
      let clientCreated = false;
      
      // Verificar si es un lead
      const isLead = extractedData?.leadInfo?.isLead;
      const hasClientName = !!extractedData?.nombreCliente;
      const hasContactInfo = !!(extractedData?.telefono || extractedData?.email);
      const isNewContract = analysis.incident_type === 'Nueva contratación de seguros';
      
      console.log(`🔍 [PROCESSOR] shouldCreateClientFromScratch: {
        isNewContract: ${isNewContract},
        hasClientName: ${hasClientName},
        nombreCliente: ${extractedData?.nombreCliente},
        telefono: ${extractedData?.telefono},
        email: ${extractedData?.email}
      }`);
      
      if (isLead && hasClientName) {
        // 🚨 CASO 1: LEAD DETECTADO - Crear cliente con idLead
        console.log(`🚨 [PROCESSOR] LEAD DETECTADO: ${extractedData.nombreCliente}`);
        console.log(`📋 [PROCESSOR] Lead ID: ${extractedData.leadInfo.idLead}`);
        
        const clientCreationResult = await this.createClientFromLeadData(
          extractedData,
          call.conversation_id
        );
        
        if (clientCreationResult.success && clientCreationResult.clientId) {
          idCliente = clientCreationResult.clientId;
          clientCreated = true;
          console.log(`✅ [PROCESSOR] Cliente creado desde lead: ${idCliente}`);
        } else {
          throw new Error(`Error crítico creando cliente desde lead: ${clientCreationResult.error}`);
        }
        
      } else if (isNewContract) {
        // 🆕 CASO 2: NUEVA CONTRATACIÓN - SIEMPRE crear cliente (datos mínimos)
        console.log(`🆕 [PROCESSOR] NUEVA CONTRATACIÓN DE SEGUROS - Creando cliente obligatorio`);
        console.log(`📋 [PROCESSOR] Datos disponibles: nombre=${extractedData?.nombreCliente}, tel=${extractedData?.telefono}, email=${extractedData?.email}`);
        
        const clientCreationResult = await this.createClientForNewContract(
          extractedData,
          call.conversation_id,
          analysis
        );
        
        if (clientCreationResult.success && clientCreationResult.clientId) {
          idCliente = clientCreationResult.clientId;
          clientCreated = true;
          console.log(`✅ [PROCESSOR] Cliente creado para nueva contratación: ${idCliente}`);
        } else {
          console.error(`❌ [PROCESSOR] Error creando cliente para nueva contratación: ${clientCreationResult.error}`);
          console.log(`🔄 [PROCESSOR] Usando fallback para nueva contratación`);
          idCliente = this.generateFallbackClientId(call.conversation_id, extractedData?.telefono);
        }
        
      } else if (hasClientName && hasContactInfo && this.shouldCreateNewClient(analysis)) {
        // 🆕 CASO 3: CLIENTE NUEVO CON DATOS - Crear cliente sin idLead
        console.log(`🆕 [PROCESSOR] CLIENTE NUEVO CON DATOS: ${extractedData.nombreCliente}`);
        
        const clientCreationResult = await this.createClientFromExtractedData(
          extractedData,
          call.conversation_id
        );
        
        if (clientCreationResult.success && clientCreationResult.clientId) {
          idCliente = clientCreationResult.clientId;
          clientCreated = true;
          console.log(`✅ [PROCESSOR] Cliente creado desde cero: ${idCliente}`);
        } else {
          console.error(`❌ [PROCESSOR] Error creando cliente: ${clientCreationResult.error}`);
          idCliente = this.generateFallbackClientId(call.conversation_id, extractedData?.telefono);
        }
        
      } else {
        // 🔄 CASO 4: FALLBACK - No crear cliente, usar ID generado
        idCliente = this.generateFallbackClientId(call.conversation_id, extractedData?.telefono);
        console.log(`🔄 [PROCESSOR] Usando ID fallback: ${idCliente}`);
      }

      // 🚨 VALIDACIÓN CRÍTICA: Asegurar que tenemos ID válido antes de crear ticket
      if (!idCliente || idCliente.trim() === '') {
        throw new Error('ERROR CRÍTICO: No se pudo obtener ID de cliente válido para crear ticket');
      }

      console.log(`🔑 [PROCESSOR] FLUJO CORRECTO: Cliente procesado - ID: ${idCliente}`);
      console.log(`🎫 [PROCESSOR] Procediendo a crear ticket con ID de cliente: ${idCliente}`);
      console.log(`📊 [PROCESSOR] Estado: clientCreated=${clientCreated}, isLead=${isLead || false}`);

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
          // 🚀 DATOS EXTRAÍDOS POR IA
          client_data: extractedData,
          id_cliente: idCliente,
          // 🚨 INFORMACIÓN DEL FLUJO DE CREACIÓN
          client_creation_flow: {
            was_lead: isLead || false,
            client_created_new: clientCreated,
            lead_id: extractedData?.leadInfo?.idLead,
            client_source: clientCreated ? 'newly_created' : 'fallback',
            flow_timestamp: new Date().toISOString()
          },
          // 🧠 NUEVA: Información de decisión inteligente
          intelligent_decision: {
            processed_reason: shouldProcessTicket.reason,
            original_confidence: analysis.confidence,
            decision_score: shouldProcessTicket.score,
            decision_factors: shouldProcessTicket.factors
          }
        }
      };

      console.log(`🎫 [PROCESSOR] Creando ticket con datos:`, {
        call_id: ticketData.call_id,
        id_cliente: idCliente,
        tipo_incidencia: ticketData.tipo_incidencia,
        client_source: ticketData.metadata.client_creation_flow.client_source,
        was_lead: ticketData.metadata.client_creation_flow.was_lead,
        client_created_new: ticketData.metadata.client_creation_flow.client_created_new,
        decision_reason: shouldProcessTicket.reason
      });

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select('id')
        .single();

      if (error) {
        console.error(`❌ [PROCESSOR] Error creating ticket:`, error);
        return [];
      }

      // 🚨 VALIDACIÓN FINAL: Confirmar que el flujo se completó correctamente
      console.log(`✅ [PROCESSOR] TICKET CREADO EXITOSAMENTE: ${ticket.id}`);
      
      if (isLead && clientCreated) {
        console.log(`🎉 [PROCESSOR] ¡FLUJO CRÍTICO COMPLETADO EXITOSAMENTE!`);
        console.log(`🔑 [PROCESSOR] Cliente creado desde lead: ${idCliente}`);
        console.log(`🎫 [PROCESSOR] Ticket creado con ID de cliente: ${ticket.id}`);
        console.log(`📊 [PROCESSOR] Lead ID: ${extractedData?.leadInfo?.idLead}`);
        console.log(`📊 [PROCESSOR] Campaña: ${extractedData?.leadInfo?.campaña}`);
      } else if (clientCreated) {
        console.log(`🎉 [PROCESSOR] Cliente nuevo creado y ticket generado: ${ticket.id}`);
      } else {
        console.log(`🎫 [PROCESSOR] Ticket creado con cliente existente: ${ticket.id}`);
      }

      // 🔥 VERIFICAR MÚLTIPLES GESTIONES DESDE EL ANÁLISIS IA
      console.log(`🔍 [PROCESSOR] Verificando si hay múltiples gestiones detectadas por la IA...`);
      
      // 🚀 MEJORADO: Detectar múltiples gestiones incluso sin datos completos del cliente
      const aiAnalysisData = analysis.extracted_data || {};
      const hasMultipleGestiones = (aiAnalysisData as any).multipleGestiones || ((aiAnalysisData as any).totalGestiones > 1);
      
      // 🔍 DETECTAR MÚLTIPLES GESTIONES POR CONTENIDO DE NOTAS
      const notas = ticketData.description || '';
      const hasMultipleIndicators = (
        notas.includes('Además') || 
        notas.includes('También') || 
        notas.includes('Por otro lado') ||
        notas.includes('Ya aprovechando') ||
        (notas.includes('seguimiento') && notas.includes('duplicado')) ||
        (notas.includes('rellamada') && notas.includes('solicita'))
      );
      
      if (hasMultipleGestiones || hasMultipleIndicators) {
        console.log(`🔥 [PROCESSOR] ¡MÚLTIPLES GESTIONES DETECTADAS!`);
        console.log(`📊 [PROCESSOR] Método detección: ${hasMultipleGestiones ? 'IA directa' : 'indicadores en texto'}`);
        console.log(`📝 [PROCESSOR] Contenido: ${notas.substring(0, 100)}...`);
        
        // 🎯 TODO: Implementar procesamiento de múltiples gestiones
        // Por ahora, procesar como gestión única pero con mejor logging
        console.log(`⚠️ [PROCESSOR] Múltiples gestiones detectadas pero procesando como única (temporal)`);
      }
      
      // FLUJO TRADICIONAL: UNA SOLA GESTIÓN
      console.log(`📝 [PROCESSOR] Procesando gestión única tradicional`);
      
      // 🔥 VERIFICAR MÚLTIPLES GESTIONES Y RELLAMADAS
      const incidenciaPrincipal = (aiAnalysisData as any)?.incidenciaPrincipal;
      const incidenciasSecundarias = (aiAnalysisData as any)?.incidenciasSecundarias || [];
      const createdIds: string[] = [];

      // ✅ PROCESAR INCIDENCIA PRINCIPAL
      if (incidenciaPrincipal?.esRellamada && incidenciaPrincipal.incidenciaRelacionada) {
        console.log(`📞 [PROCESSOR] ¡RELLAMADA DETECTADA EN INCIDENCIA PRINCIPAL!`);
        
        const rellamadaId = await this.crearRellamada(
          incidenciaPrincipal,
          call,
          idCliente,
          ticketData
        );
        
        if (rellamadaId) createdIds.push(rellamadaId);
      } else if (incidenciaPrincipal) {
        console.log(`🎫 [PROCESSOR] Creando ticket para incidencia principal`);
        
        const ticketId = await this.crearTicketNormal(
          incidenciaPrincipal,
          call,
          idCliente,
          ticketData
        );
        
        if (ticketId) createdIds.push(ticketId);
      }

      // ✅ PROCESAR INCIDENCIAS SECUNDARIAS
      for (let i = 0; i < incidenciasSecundarias.length; i++) {
        const incidencia = incidenciasSecundarias[i];
        
        if (incidencia.esRellamada && incidencia.incidenciaRelacionada) {
          console.log(`📞 [PROCESSOR] Creando rellamada secundaria ${i + 1}`);
          
          const rellamadaId = await this.crearRellamada(
            incidencia,
            call,
            idCliente,
            ticketData
          );
          
          if (rellamadaId) createdIds.push(rellamadaId);
        } else {
          console.log(`🎫 [PROCESSOR] Creando ticket secundario ${i + 1}`);
          
          const ticketId = await this.crearTicketNormal(
            incidencia,
            call,
            idCliente,
            ticketData
          );
          
          if (ticketId) createdIds.push(ticketId);
        }
      }

      if (createdIds.length > 0) {
        console.log(`✅ [PROCESSOR] Múltiples gestiones procesadas: ${createdIds.length}`);
        return createdIds;
      }

      // 📤 FLUJO NORMAL: ENVIAR TICKET A SEGURNEO/NOGAL según el tipo de incidencia
      const shouldSend = this.shouldSendToNogal(analysis, { confidence: analysis.confidence }, idCliente);
      
      if (shouldSend) {
        console.log(`📤 [PROCESSOR] Enviando ticket a Segurneo/Nogal: ${ticket.id}`);
        console.log(`📊 [PROCESSOR] Criterios: tipo="${analysis.incident_type}", confianza=${analysis.confidence}, cliente=${!!idCliente}`);
        
        // 🧠 Log usando datos extraídos por IA
        console.log(`🧠 [PROCESSOR] Datos IA: nombre=${extractedData?.nombreCliente}, teléfono=${extractedData?.telefono}, email=${extractedData?.email}`);
        
        try {
          // Preparar payload para Segurneo Voice
          const nogalPayload: Omit<NogalTicketPayload, 'IdTicket'> = {
            IdCliente: idCliente,
            IdLlamada: call.conversation_id,
            TipoIncidencia: analysis.incident_type,
            MotivoIncidencia: analysis.management_reason,
            Ramo: (analysis.extracted_data?.ramo as string) || (analysis as any).ramo || '', // ✅ NUEVO - ramo desde análisis IA
            NumeroPoliza: (analysis.extracted_data?.numeroPoliza as string) || '', // ✅ SOLO desde análisis IA
            Notas: ticketData.description,
            FicheroLlamada: call.audio_download_url || call.fichero_llamada || '' // 🎵 NUEVO: URL del audio
          };

          const nogalResult = await nogalTicketService.createAndSendTicket(nogalPayload);

          // Actualizar estado del ticket según resultado
          let finalStatus: string;
          const updatedMetadata = { ...ticketData.metadata } as any;

          if (nogalResult.success) {
            finalStatus = 'completed'; // ✅ ARREGLO: Usar valor permitido por constraint
            updatedMetadata.nogal_ticket_id = nogalResult.ticket_id;
            updatedMetadata.nogal_response = nogalResult.message;
            updatedMetadata.nogal_status = 'sent_to_nogal'; // Info específica en metadata
            console.log(`✅ [PROCESSOR] Ticket enviado exitosamente a Segurneo/Nogal: ${nogalResult.ticket_id}`);
          } else {
            finalStatus = 'pending'; // ✅ ARREGLO: Usar valor permitido por constraint
            updatedMetadata.nogal_error = nogalResult.error;
            updatedMetadata.nogal_status = 'failed_to_send'; // Info específica en metadata
            console.error(`❌ [PROCESSOR] Error enviando ticket a Segurneo/Nogal: ${nogalResult.error}`);
          }

          // Actualizar el ticket con el resultado
          console.log(`🔄 [PROCESSOR] Actualizando ticket ${ticket.id} a estado: ${finalStatus} (${updatedMetadata.nogal_status || 'sin estado específico'})`);
          
          const { error: updateError } = await supabase
            .from('tickets')
            .update({
              status: finalStatus,
              metadata: updatedMetadata,
              updated_at: new Date().toISOString()
            })
            .eq('id', ticket.id);

          if (updateError) {
            console.error(`❌ [PROCESSOR] Error actualizando estado del ticket:`, updateError);
          } else {
            console.log(`✅ [PROCESSOR] Ticket actualizado exitosamente a estado: ${finalStatus} (${updatedMetadata.nogal_status || 'sin estado específico'})`);
          }

        } catch (nogalError) {
          console.error(`❌ [PROCESSOR] Error en envío a Segurneo/Nogal:`, nogalError);
          
          // Actualizar ticket con error
          console.log(`🔄 [PROCESSOR] Actualizando ticket ${ticket.id} a estado: pending (por error)`);
          
          const { error: updateError } = await supabase
            .from('tickets')
            .update({
              status: 'pending', // ✅ ARREGLO: Usar valor permitido por constraint
              metadata: {
                ...ticketData.metadata,
                nogal_error: nogalError instanceof Error ? nogalError.message : 'Error desconocido',
                nogal_status: 'failed_to_send' // Info específica en metadata
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', ticket.id);

          if (updateError) {
            console.error(`❌ [PROCESSOR] Error actualizando estado del ticket (catch):`, updateError);
          } else {
            console.log(`✅ [PROCESSOR] Ticket actualizado exitosamente a estado: pending (con error)`);
          }
        }
      } else {
        console.log(`⏭️ [PROCESSOR] No se envía a Segurneo/Nogal: idCliente=${!!idCliente}, confidence=${analysis.confidence}`);
      }

      return [ticket.id];
      
    } catch (error) {
      console.error(`❌ [PROCESSOR] Ticket creation failed:`, error);
      return [];
    }
  }

  /**
   * 🧠 FUNCIÓN PÚBLICA: Lógica inteligente para decidir si procesar ticket
   * No se basa solo en confianza, sino en contexto y valor de la información
   */
  public shouldProcessTicketIntelligently(analysis: CallAnalysis): {
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
      analysis.incident_type?.includes(incident)
    );

    if (isCriticalIncident) {
      score += 100; // Máxima puntuación
      factors.push(`Incidencia crítica: ${analysis.incident_type}`);
      reason = `Incidencia crítica que requiere procesamiento: ${analysis.incident_type}`;
    }

    // 🔥 FACTOR 2: Información valiosa del cliente detectada
    const hasClientName = analysis.extracted_data?.nombreCliente;
    const hasClientInfo = analysis.extracted_data?.telefono || analysis.extracted_data?.email;
    
    if (hasClientName) {
      score += 30;
      factors.push(`Nombre de cliente detectado: ${hasClientName}`);
    }
    
    if (hasClientInfo) {
      score += 20;
      factors.push('Información de contacto detectada');
    }

    // 🔥 FACTOR 3: Resumen de llamada coherente y útil
    const hasMeaningfulSummary = analysis.summary && 
      analysis.summary.length > 50 && 
      !analysis.summary.includes('Error en análisis');
    
    if (hasMeaningfulSummary) {
      score += 25;
      factors.push('Resumen de llamada coherente');
    }

    // 🔥 FACTOR 4: Confianza alta (factor tradicional)
    if (analysis.confidence >= 0.7) {
      score += 40;
      factors.push(`Alta confianza: ${analysis.confidence}`);
    } else if (analysis.confidence >= 0.5) {
      score += 20;
      factors.push(`Confianza media: ${analysis.confidence}`);
    } else if (analysis.confidence >= 0.3) {
      score += 10;
      factors.push(`Confianza baja pero procesable: ${analysis.confidence}`);
    }

    // 🔥 FACTOR 5: Tipo de incidencia que requiere seguimiento
    const needsFollowUp = [
      'Consulta cliente',
      'Pago de Recibo',
      'Duplicado',
      'Cambio'
    ];

    const needsFollowUpDetected = needsFollowUp.some(type => 
      analysis.incident_type?.includes(type) || 
      analysis.management_reason?.includes(type)
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

    console.log(`🧠 [PROCESSOR] Evaluación inteligente:`, {
      score,
      shouldProcess,
      reason,
      factors,
      confidence: analysis.confidence,
      incident_type: analysis.incident_type
    });

    return {
      process: shouldProcess,
      reason,
      score,
      factors
    };
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

            // 🚀 SIMPLE: La IA analizará la transcripción completa autónomamente
      console.log(`🚀 [PROCESSOR] Confiando en análisis autónomo de la IA - transcripción completa disponible`);
      
      // Solo pasamos la conversación - la IA extraerá TODO lo que necesite
      const nogalResult = await nogalAnalysisService.analyzeCallForNogal(messages, conversationId, undefined);

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

  // �� MÉTODOS AUXILIARES PRIVADOS

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

  /**
   * 🚨 CRÍTICO: Crear cliente desde lead
   * 
   * ⚠️ FLUJO OBLIGATORIO PARA LEADS:
   * 1. PRIMERO: Crear cliente en Nogal
   * 2. DESPUÉS: Usar el ID devuelto para crear ticket
   * 
   * Este método es CRÍTICO porque si falla, el ticket no se puede crear correctamente
   */
  private async createClientFromLead(
    clientData: any, 
    conversationId: string, 
    analysis: any
  ): Promise<{ success: boolean; clientId?: string; error?: string }> {
    console.log(`🚨 [PROCESSOR] INICIANDO CREACIÓN DE CLIENTE DESDE LEAD`);
    console.log(`🔄 [PROCESSOR] Conversation ID: ${conversationId}`);
    
    try {
      const leadInfo = clientData.leadInfo;
      const selectedLead = leadInfo.selectedLead;
      
      if (!selectedLead) {
        const error = 'ERROR CRÍTICO: No hay lead seleccionado para crear cliente';
        console.error(`❌ [PROCESSOR] ${error}`);
        throw new Error(error);
      }

      console.log(`🔍 [PROCESSOR] Lead seleccionado:`, {
        nombre: selectedLead.nombre,
        telefono: selectedLead.telefono,
        email: selectedLead.email,
        idLead: leadInfo.leadId,
        campaña: leadInfo.campaña
      });

      // Extraer nombre y apellidos del lead
      const fullName = selectedLead.nombre || '';
      const nameParts = fullName.trim().split(' ');
      const nombre = nameParts[0] || '';
      const primerApellido = nameParts[1] || '';
      const segundoApellido = nameParts.slice(2).join(' ') || '';

      console.log(`📝 [PROCESSOR] Datos procesados:`, {
        nombre,
        primerApellido,
        segundoApellido,
        telefono: selectedLead.telefono || clientData.telefono,
        email: selectedLead.email || clientData.email
      });

      // Preparar datos para crear cliente
      const clientDataFromCall = {
        nombre: nombre,
        primerApellido: primerApellido,
        segundoApellido: segundoApellido,
        telefono: selectedLead.telefono || clientData.telefono || '',
        email: selectedLead.email || clientData.email || '',
        idLead: leadInfo.leadId,
        campaña: leadInfo.campaña,
        // Extraer información adicional del análisis si está disponible
        telefono2: analysis.extracted_data?.telefono2,
        recomendadoPor: analysis.extracted_data?.recomendadoPor
      };

      console.log(`📤 [PROCESSOR] Enviando datos a Nogal para crear cliente...`);
      
      const result = await nogalClientService.createClientFromCall(
        clientDataFromCall,
        conversationId
      );

      console.log(`📥 [PROCESSOR] Respuesta de Nogal:`, {
        success: result.success,
        client_id: result.client_id,
        message: result.message
      });

      if (result.success && result.client_id) {
        console.log(`✅ [PROCESSOR] ¡CLIENTE CREADO EXITOSAMENTE EN NOGAL!`);
        console.log(`🔑 [PROCESSOR] ID del cliente nuevo: ${result.client_id}`);
        console.log(`🎫 [PROCESSOR] Este ID se usará para crear el ticket`);
        
        return {
          success: true,
          clientId: result.client_id as string
        };
      } else {
        const error = result.message || 'Error creando cliente desde lead';
        console.error(`❌ [PROCESSOR] Error en creación de cliente: ${error}`);
        
        return {
          success: false,
          error: error
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`❌ [PROCESSOR] Excepción en creación de cliente desde lead: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * 🆕 NUEVO: Crear cliente desde cero
   */
  private async createClientFromScratch(
    clientData: any, 
    conversationId: string, 
    analysis: any
  ): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      // Extraer datos del análisis de IA
      const extractedData = analysis.extracted_data || {};
      const nombreCliente = extractedData.nombreCliente || '';
      
      if (!nombreCliente) {
        throw new Error('No se puede crear cliente sin nombre');
      }

      // Separar nombre y apellidos
      const nameParts = nombreCliente.trim().split(' ');
      const nombre = nameParts[0] || '';
      const primerApellido = nameParts[1] || '';
      const segundoApellido = nameParts.slice(2).join(' ') || '';

      // Preparar datos para crear cliente
      const clientDataFromCall = {
        nombre: nombre,
        primerApellido: primerApellido,
        segundoApellido: segundoApellido,
        telefono: clientData.telefono || extractedData.telefono || '',
        email: clientData.email || extractedData.email || '',
        // Campos opcionales desde análisis
        telefono2: extractedData.telefono2,
        recomendadoPor: extractedData.recomendadoPor,
        campaña: extractedData.campaña
      };

      const result = await nogalClientService.createClientFromCall(
        clientDataFromCall,
        conversationId
      );

      if (result.success) {
        return {
          success: true,
          clientId: result.client_id
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error creando cliente desde cero'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 🆕 NUEVO: Crear cliente específicamente para nuevas contrataciones
   */
  private async createClientForNewContract(
    extractedData: any,
    conversationId: string,
    analysis: any
  ): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      console.log(`🆕 [PROCESSOR] Creando cliente para nueva contratación`);
      
      // Intentar usar datos extraídos, si no generar mínimos
      let nombreCliente = extractedData?.nombreCliente;
      let telefono = extractedData?.telefono;
      let email = extractedData?.email;
      
      // Si no tenemos nombre, usar datos básicos de la conversación
      if (!nombreCliente) {
        console.log(`⚠️ [PROCESSOR] No hay nombre del cliente - generando nombre temporal`);
        nombreCliente = `Cliente Nuevo ${conversationId.slice(-8)}`;
      }
      
      // Si no tenemos teléfono, intentar extraer del conversation_id o usar genérico
      if (!telefono) {
        console.log(`⚠️ [PROCESSOR] No hay teléfono - usando genérico temporal`);
        telefono = `+34000000000`; // Teléfono temporal que deberá actualizarse
      }
      
      // Separar nombre y apellidos
      const nameParts = nombreCliente.trim().split(' ');
      const nombre = nameParts[0] || 'Cliente';
      const primerApellido = nameParts[1] || 'Nuevo';
      const segundoApellido = nameParts.slice(2).join(' ') || '';

      // Preparar datos mínimos para crear cliente
      const clientDataFromCall = {
        nombre: nombre,
        primerApellido: primerApellido,
        segundoApellido: segundoApellido,
        telefono: telefono,
        email: email || '', // Email opcional
        // Datos específicos de nueva contratación
        ramo: analysis.ramo || 'No especificado',
        tipoIncidencia: analysis.incident_type,
        // Marcar como cliente temporal que necesita completar datos
        esClienteTemporal: true,
        origenCreacion: 'nueva_contratacion',
        conversationId: conversationId
      };

      console.log(`📋 [PROCESSOR] Datos para crear cliente:`, {
        nombre: clientDataFromCall.nombre,
        primerApellido: clientDataFromCall.primerApellido,
        telefono: clientDataFromCall.telefono,
        email: clientDataFromCall.email,
        ramo: clientDataFromCall.ramo
      });

      const result = await nogalClientService.createClientFromCall(
        clientDataFromCall,
        conversationId
      );

      if (result.success) {
        console.log(`✅ [PROCESSOR] Cliente creado exitosamente para nueva contratación: ${result.client_id}`);
        return {
          success: true,
          clientId: result.client_id
        };
      } else {
        console.error(`❌ [PROCESSOR] Error del servicio Nogal:`, result.message);
        return {
          success: false,
          error: result.message || 'Error creando cliente para nueva contratación'
        };
      }
    } catch (error) {
      console.error(`❌ [PROCESSOR] Excepción creando cliente para nueva contratación:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 🆕 NUEVO: Determinar si se debe crear cliente nuevo
   */
  private shouldCreateNewClient(analysis: any): boolean {
    // Crear cliente para nuevas contrataciones o casos específicos
    const isNewContract = analysis.incident_type === 'Nueva contratación de seguros';
    
    console.log(`🔍 [PROCESSOR] shouldCreateNewClient:`, {
      isNewContract,
      incident_type: analysis.incident_type
    });
    
    return isNewContract;
  }

  /**
   * 🔧 NUEVO: Crear cliente desde datos de Lead
   */
  private async createClientFromLeadData(
    extractedData: any,
    conversationId: string
  ): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      console.log(`🚨 [PROCESSOR] Creando cliente desde lead data`);
      
      const leadInfo = extractedData.leadInfo;
      const nombreCompleto = extractedData.nombreCliente || '';
      
      // Separar nombre y apellidos
      const nameParts = nombreCompleto.trim().split(' ');
      const nombre = nameParts[0] || '';
      const primerApellido = nameParts[1] || '';
      const segundoApellido = nameParts.slice(2).join(' ') || '';

      const clientDataFromCall = {
        nombre: nombre,
        primerApellido: primerApellido,
        segundoApellido: segundoApellido,
        telefono: extractedData.telefono || '',
        email: extractedData.email || '',
        idLead: leadInfo.idLead,
        campaña: leadInfo.campaña,
        // Campos adicionales
        telefono2: extractedData.telefono2,
        recomendadoPor: extractedData.recomendadoPor
      };

      const result = await nogalClientService.createClientFromCall(
        clientDataFromCall,
        conversationId
      );

      if (result.success) {
        return {
          success: true,
          clientId: result.client_id
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error creando cliente desde lead'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 🔧 NUEVO: Crear cliente desde datos extraídos
   */
  private async createClientFromExtractedData(
    extractedData: any,
    conversationId: string
  ): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      console.log(`🆕 [PROCESSOR] Creando cliente desde datos extraídos`);
      
      const nombreCompleto = extractedData.nombreCliente || '';
      
      if (!nombreCompleto) {
        throw new Error('No se puede crear cliente sin nombre');
      }

      // Separar nombre y apellidos
      const nameParts = nombreCompleto.trim().split(' ');
      const nombre = nameParts[0] || '';
      const primerApellido = nameParts[1] || '';
      const segundoApellido = nameParts.slice(2).join(' ') || '';

      const clientDataFromCall = {
        nombre: nombre,
        primerApellido: primerApellido,
        segundoApellido: segundoApellido,
        telefono: extractedData.telefono || '',
        email: extractedData.email || '',
        // Campos opcionales
        telefono2: extractedData.telefono2,
        recomendadoPor: extractedData.recomendadoPor,
        campaña: extractedData.campaña
      };

      const result = await nogalClientService.createClientFromCall(
        clientDataFromCall,
        conversationId
      );

      if (result.success) {
        return {
          success: true,
          clientId: result.client_id
        };
      } else {
        return {
          success: false,
          error: result.message || 'Error creando cliente'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 🔧 NUEVO: Generar ID de cliente fallback
   */
  private generateFallbackClientId(conversationId: string, telefono?: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const phoneDigits = telefono ? telefono.slice(-4) : '0000';
    return `FALL${phoneDigits}${timestamp}`;
  }

  /**
   * 🎯 NUEVO: Procesar una incidencia individual (puede ser ticket o rellamada)
   */
  private async procesarIncidenciaIndividual(
    incidencia: any,
    call: Call,
    idCliente: string,
    baseTicketData: any,
    tipo: string
  ): Promise<string | null> {
    try {
      console.log(`🎯 [PROCESSOR] Procesando incidencia ${tipo}:`, {
        tipoIncidencia: incidencia.tipo,
        esRellamada: incidencia.esRellamada,
        incidenciaRelacionada: incidencia.incidenciaRelacionada
      });

      // Crear ticket específico para esta incidencia
      const ticketData = {
        ...baseTicketData,
        tipo_incidencia: incidencia.tipo,
        motivo_incidencia: incidencia.motivo,
        description: this.generateTicketDescriptionFromIncidencia(incidencia),
        metadata: {
          ...baseTicketData.metadata,
          incidencia_tipo: tipo,
          incidencia_data: incidencia
        }
      };

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select('id')
        .single();

      if (error) {
        console.error(`❌ [PROCESSOR] Error creating ticket para ${tipo}:`, error);
        return null;
      }

      console.log(`✅ [PROCESSOR] Ticket creado para ${tipo}: ${ticket.id}`);

      // Si es rellamada, usar el servicio de rellamadas
      if (incidencia.esRellamada && incidencia.incidenciaRelacionada) {
        console.log(`📞 [PROCESSOR] Procesando como rellamada: ${incidencia.incidenciaRelacionada}`);
        
        const rellamadaResult = await nogalRellamadaService.crearRellamadaDesdeAnalisis(
          idCliente,
          call.conversation_id,
          incidencia.incidenciaRelacionada,
          ticketData.description,
          call.audio_download_url || call.fichero_llamada || undefined
        );

        // Actualizar metadatos según resultado de rellamada
        const updatedMetadata = { ...ticketData.metadata } as any;
        let finalStatus: string;

        if (rellamadaResult.success) {
          finalStatus = 'completed';
          updatedMetadata.rellamada_id = rellamadaResult.rellamada_id;
          updatedMetadata.nogal_response = rellamadaResult.message;
          updatedMetadata.nogal_status = 'rellamada_created';
          console.log(`✅ [PROCESSOR] ${tipo}: Rellamada creada: ${rellamadaResult.rellamada_id}`);
        } else {
          finalStatus = 'pending';
          updatedMetadata.rellamada_error = rellamadaResult.message;
          updatedMetadata.nogal_status = 'rellamada_failed';
          console.error(`❌ [PROCESSOR] ${tipo}: Error en rellamada: ${rellamadaResult.message}`);
        }

        // Actualizar ticket con resultado de rellamada
        await supabase
          .from('tickets')
          .update({
            status: finalStatus,
            metadata: updatedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticket.id);

      } else {
        // Procesar como ticket normal
        console.log(`🎫 [PROCESSOR] Procesando como ticket normal para ${tipo}`);
        
        const nogalPayload: Omit<NogalTicketPayload, 'IdTicket'> = {
          IdCliente: idCliente,
          IdLlamada: call.conversation_id,
          TipoIncidencia: incidencia.tipo,
          MotivoIncidencia: incidencia.motivo,
          Ramo: incidencia.ramo || '',
          NumeroPoliza: '', // TODO: extraer de incidencia
          Notas: ticketData.description,
          FicheroLlamada: call.audio_download_url || call.fichero_llamada || ''
        };

        const nogalResult = await nogalTicketService.createAndSendTicket(nogalPayload);
        
        // Actualizar metadatos según resultado
        const updatedMetadata = { ...ticketData.metadata } as any;
        let finalStatus: string;

        if (nogalResult.success) {
          finalStatus = 'completed';
          updatedMetadata.nogal_ticket_id = nogalResult.ticket_id;
          updatedMetadata.nogal_response = nogalResult.message;
          updatedMetadata.nogal_status = 'sent_to_nogal';
          console.log(`✅ [PROCESSOR] ${tipo}: Ticket enviado: ${nogalResult.ticket_id}`);
        } else {
          finalStatus = 'pending';
          updatedMetadata.nogal_error = nogalResult.error;
          updatedMetadata.nogal_status = 'failed_to_send';
          console.error(`❌ [PROCESSOR] ${tipo}: Error enviando: ${nogalResult.error}`);
        }

        // Actualizar ticket con resultado
        await supabase
          .from('tickets')
          .update({
            status: finalStatus,
            metadata: updatedMetadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticket.id);
      }

      return ticket.id;

    } catch (error) {
      console.error(`❌ [PROCESSOR] Error procesando incidencia ${tipo}:`, error);
      return null;
    }
  }

  /**
   * 📝 Generar descripción del ticket desde una incidencia específica
   */
  private generateTicketDescriptionFromIncidencia(incidencia: any): string {
    let description = incidencia.necesidadCliente || incidencia.consideraciones || 'Gestión solicitada por el cliente';
    
    if (incidencia.esRellamada) {
      description = `📞 RELLAMADA: ${description}\n\nIncidencia relacionada: ${incidencia.incidenciaRelacionada}`;
    }
    
    return description;
  }

  /**
   * 📞 NUEVO: Crear rellamada usando el servicio específico
   */
  private async crearRellamada(
    incidencia: any,
    call: Call,
    idCliente: string,
    baseTicketData: any
  ): Promise<string | null> {
    try {
      console.log(`📞 [PROCESSOR] Creando rellamada:`, {
        idCliente,
        incidenciaRelacionada: incidencia.incidenciaRelacionada,
        tipo: incidencia.tipo
      });

      // Crear rellamada usando el servicio específico
      const rellamadaResponse = await nogalRellamadaService.crearRellamadaDesdeAnalisis(
        idCliente,
        call.conversation_id,
        incidencia.incidenciaRelacionada,
        incidencia.consideraciones || 'Seguimiento de incidencia solicitado por el cliente',
        call.audio_download_url || undefined
      );

      if (rellamadaResponse.success) {
        console.log(`✅ [PROCESSOR] Rellamada creada exitosamente: ${rellamadaResponse.rellamada_id}`);

        // Crear registro en tickets table con metadata de rellamada
        const ticketData = {
          ...baseTicketData,
          tipo_incidencia: incidencia.tipo,
          motivo_incidencia: incidencia.motivo,
          description: `RELLAMADA: ${incidencia.consideraciones}`,
          metadata: {
            ...baseTicketData.metadata,
            tipo_gestion: 'rellamada',
            rellamada_id: rellamadaResponse.rellamada_id,
            incidencia_relacionada: incidencia.incidenciaRelacionada,
            nogal_response: rellamadaResponse.nogal_response
          }
        };

        const { data: ticket, error } = await supabase
          .from('tickets')
          .insert([ticketData])
          .select('id')
          .single();

        if (error) {
          console.error(`❌ [PROCESSOR] Error guardando rellamada en BD:`, error);
          return null;
        }

        return ticket.id;
      } else {
        console.error(`❌ [PROCESSOR] Error creando rellamada:`, rellamadaResponse.message);
        return null;
      }
    } catch (error) {
      console.error(`❌ [PROCESSOR] Excepción creando rellamada:`, error);
      return null;
    }
  }

  /**
   * 🎫 NUEVO: Crear ticket normal usando el servicio existente
   */
  private async crearTicketNormal(
    incidencia: any,
    call: Call,
    idCliente: string,
    baseTicketData: any
  ): Promise<string | null> {
    try {
      console.log(`🎫 [PROCESSOR] Creando ticket normal:`, {
        idCliente,
        tipo: incidencia.tipo,
        motivo: incidencia.motivo
      });

      // Crear ticket interno
      const ticketData = {
        ...baseTicketData,
        tipo_incidencia: incidencia.tipo,
        motivo_incidencia: incidencia.motivo,
        description: incidencia.consideraciones || incidencia.necesidadCliente || 'Gestión automática',
        metadata: {
          ...baseTicketData.metadata,
          tipo_gestion: 'ticket',
          incidencia_data: incidencia
        }
      };

      const { data: ticket, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select('id')
        .single();

      if (error) {
        console.error(`❌ [PROCESSOR] Error creando ticket interno:`, error);
        return null;
      }

      console.log(`✅ [PROCESSOR] Ticket interno creado: ${ticket.id}`);

      // Enviar a Segurneo/Nogal si cumple criterios
      const mockAnalysis = {
        incident_type: incidencia.tipo,
        management_reason: incidencia.motivo,
        confidence: 0.8,
        priority: 'medium' as 'low' | 'medium' | 'high',
        summary: 'Gestión automática procesada',
        extracted_data: {}
      };
      
      const shouldSend = this.shouldSendToNogal(
        mockAnalysis, 
        { confidence: 0.8, idCliente }, 
        idCliente
      );

      if (shouldSend) {
        console.log(`📤 [PROCESSOR] Enviando ticket a Segurneo/Nogal: ${ticket.id}`);

        const nogalPayload = {
          IdCliente: idCliente,
          IdLlamada: call.conversation_id,
          TipoIncidencia: incidencia.tipo,
          MotivoIncidencia: incidencia.motivo,
          Ramo: incidencia.ramo || '',
          NumeroPoliza: incidencia.numeroPoliza || '',
          Notas: incidencia.consideraciones || incidencia.necesidadCliente || 'Gestión automática',
          FicheroLlamada: call.audio_download_url || ''
        };

        try {
          const nogalResult = await nogalTicketService.createAndSendTicket(nogalPayload);
          console.log(`✅ [PROCESSOR] Ticket enviado a Nogal exitosamente`);

          // Actualizar metadata con resultado de Nogal
          await supabase
            .from('tickets')
            .update({
              status: 'sent',
              metadata: {
                ...ticketData.metadata,
                nogal_result: nogalResult,
                sent_at: new Date().toISOString()
              }
            })
            .eq('id', ticket.id);

        } catch (nogalError) {
          console.error(`❌ [PROCESSOR] Error enviando ticket a Nogal:`, nogalError);
          
          await supabase
            .from('tickets')
            .update({
              status: 'pending',
              metadata: {
                ...ticketData.metadata,
                nogal_error: nogalError instanceof Error ? nogalError.message : 'Error desconocido',
                failed_at: new Date().toISOString()
              }
            })
            .eq('id', ticket.id);
        }
      }

      return ticket.id;
    } catch (error) {
      console.error(`❌ [PROCESSOR] Excepción creando ticket normal:`, error);
      return null;
    }
  }
}

// 🚀 Exportar instancia única
export const callProcessor = new CallProcessor(); 