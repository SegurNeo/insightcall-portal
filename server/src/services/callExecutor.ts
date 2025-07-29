// 🎯 CALL EXECUTOR - Ejecutor de decisiones del CallDecisionEngine
// Responsabilidad: Convertir decisiones del LLM en acciones concretas

import { supabase } from '../lib/supabase';
import { NogalClientService, CreateClientRequest } from './nogalClientService';
import { NogalTicketService } from './nogalTicketService';
import { NogalRellamadaService, RellamadaPayload } from './nogalRellamadaService';
import { CallDecision } from './callDecisionEngine';
import { Call } from '../types/call.types';
import { CallTranscript, NogalTicketPayload } from '../types/calls.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Resultado completo de la ejecución
 */
export interface ExecutionResult {
  success: boolean;
  message: string;
  callId: string;
  actions: {
    clientCreated?: {
      success: boolean;
      clientId?: string;
      error?: string;
    };
    ticketsCreated: {
      success: boolean;
      ticketId?: string;
      error?: string;
    }[];
    followUpCreated?: {
      success: boolean;
      followUpId?: string;
      error?: string;
    };
  };
  summary: string;
}

/**
 * 🚀 EXECUTOR PRINCIPAL - Convierte decisiones LLM en acciones reales
 */
export class CallExecutor {
  private readonly nogalClientService: NogalClientService;
  private readonly nogalTicketService: NogalTicketService;
  private readonly nogalRellamadaService: NogalRellamadaService;

  constructor() {
    this.nogalClientService = new NogalClientService();
    this.nogalTicketService = new NogalTicketService();
    this.nogalRellamadaService = new NogalRellamadaService();
  }

  /**
   * 🎯 MÉTODO PRINCIPAL - Ejecutar decisión completa
   */
  async executeDecision(
    decision: CallDecision,
    call: Call,
    transcripts: CallTranscript[]
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    console.log(`🚀 [EXECUTOR] Ejecutando decisión para llamada: ${call.conversation_id}`);

    try {
      const result: ExecutionResult = {
        success: true,
        message: 'Ejecución completada',
        callId: call.id,
        actions: {
          ticketsCreated: []
        },
        summary: ''
      };

      // 🏗️ PASO 1: Crear cliente si es necesario
      let clientId = decision.clientInfo.existingClientInfo?.clientId || null;
      
      if (decision.decisions.clientDecision.shouldCreateClient) {
        console.log(`👤 [EXECUTOR] Creando cliente nuevo...`);
        const clientResult = await this.createClient(decision, call.conversation_id);
        result.actions.clientCreated = clientResult;
        
        if (clientResult.success) {
          clientId = clientResult.clientId!;
          console.log(`✅ [EXECUTOR] Cliente creado: ${clientId}`);
        } else {
          console.error(`❌ [EXECUTOR] Error creando cliente: ${clientResult.error}`);
          result.success = false;
        }
      } else {
        console.log(`👤 [EXECUTOR] Usando cliente existente: ${clientId}`);
      }

      // 🎫 PASO 2: Crear tickets si es necesario
      if (decision.decisions.ticketDecision.shouldCreateTickets && clientId) {
        console.log(`🎫 [EXECUTOR] Creando ${decision.decisions.ticketDecision.ticketCount} ticket(s)...`);
        
        for (const ticketInfo of decision.decisions.ticketDecision.ticketsInfo) {
          const ticketResult = await this.createTicket(
            decision,
            call,
            clientId,
            ticketInfo.numeroPoliza || null
          );
          result.actions.ticketsCreated.push(ticketResult);
          
          if (ticketResult.success) {
            console.log(`✅ [EXECUTOR] Ticket creado: ${ticketResult.ticketId}`);
          } else {
            console.error(`❌ [EXECUTOR] Error creando ticket: ${ticketResult.error}`);
            result.success = false;
          }
        }
      }

      // 📞 PASO 3: Crear rellamada si es necesario
      if (decision.decisions.followUpDecision.shouldCreateFollowUp) {
        console.log(`📞 [EXECUTOR] Creando rellamada...`);
        const followUpResult = await this.createFollowUp(decision, call, clientId!);
        result.actions.followUpCreated = followUpResult;
        
        if (followUpResult.success) {
          console.log(`✅ [EXECUTOR] Rellamada creada: ${followUpResult.followUpId}`);
        } else {
          console.error(`❌ [EXECUTOR] Error creando rellamada: ${followUpResult.error}`);
          result.success = false;
        }
      }

      // 🔄 PASO 4: Actualizar registro de llamada
      await this.updateCallRecord(call.id, decision, result);

      // 📋 PASO 5: Generar resumen
      result.summary = this.generateExecutionSummary(decision, result);
      
      const duration = Date.now() - startTime;
      console.log(`🎉 [EXECUTOR] Ejecución completada en ${duration}ms: ${result.success ? 'ÉXITO' : 'CON ERRORES'}`);
      
      return result;

    } catch (error) {
      console.error(`❌ [EXECUTOR] Error fatal en ejecución:`, error);
      return {
        success: false,
        message: `Error fatal: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        callId: call.id,
        actions: { ticketsCreated: [] },
        summary: 'Ejecución fallida por error interno'
      };
    }
  }

  /**
   * 👤 Crear cliente nuevo usando NogalClientService
   */
  private async createClient(
    decision: CallDecision,
    conversationId: string
  ): Promise<{ success: boolean; clientId?: string; error?: string }> {
    try {
      const extractedData = decision.clientInfo.extractedData;
      
      // Parsear nombre completo en componentes
      const { nombre, primerApellido, segundoApellido } = this.parseFullName(
        extractedData.nombreCompleto || ''
      );

      // Generar ID único para el cliente
      const clientId = this.generateClientId();

      const clientRequest: CreateClientRequest = {
        IdCliente: clientId,
        IdLlamada: conversationId,
        Nombre: nombre,
        PrimerApellido: primerApellido,
        SegundoApellido: segundoApellido,
        Telefono: extractedData.telefono || '',
        Email: extractedData.email || 'sin-email@nogal.com', // Email por defecto si no hay
        // Campos opcionales de leads si aplica  
        IdLead: decision.clientInfo.leadInfo?.leadId,
        Campaña: decision.clientInfo.leadInfo?.campaignName
      };

      console.log(`👤 [EXECUTOR] Datos del cliente a crear:`, {
        IdCliente: clientRequest.IdCliente,
        Nombre: clientRequest.Nombre,
        PrimerApellido: clientRequest.PrimerApellido,
        SegundoApellido: clientRequest.SegundoApellido,
        Telefono: clientRequest.Telefono,
        Email: clientRequest.Email
      });

      const response = await this.nogalClientService.createClient(clientRequest);
      
      if (response.success) {
        return {
          success: true,
          clientId: clientId // Usar el ID que generamos nosotros
        };
      } else {
        return {
          success: false,
          error: response.message
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Error interno creando cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * 🎫 Crear ticket usando NogalTicketService
   */
  private async createTicket(
    decision: CallDecision,
    call: Call,
    clientId: string,
    numeroPoliza?: string | null
  ): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    try {
      const incident = decision.incidentAnalysis.primaryIncident;
      
      const ticketPayload: Omit<NogalTicketPayload, 'IdTicket'> = {
        IdCliente: clientId,
        IdLlamada: call.conversation_id,
        TipoIncidencia: incident.type,
        MotivoIncidencia: incident.reason,
        Ramo: incident.ramo || '',
        NumeroPoliza: numeroPoliza || '',
        Notas: this.generateTicketNotes(decision, call),
        FicheroLlamada: call.audio_download_url || call.fichero_llamada || ''
      };

      console.log(`🎫 [EXECUTOR] Datos del ticket a crear:`, {
        IdCliente: ticketPayload.IdCliente,
        TipoIncidencia: ticketPayload.TipoIncidencia,
        MotivoIncidencia: ticketPayload.MotivoIncidencia,
        Ramo: ticketPayload.Ramo,
        NumeroPoliza: ticketPayload.NumeroPoliza,
        NotasLength: ticketPayload.Notas.length
      });

      const response = await this.nogalTicketService.createAndSendTicket(ticketPayload);
      
      if (response.success) {
        return {
          success: true,
          ticketId: response.ticket_id
        };
      } else {
        return {
          success: false,
          error: response.message
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Error interno creando ticket: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * 📞 Crear rellamada usando NogalRellamadaService
   */
  private async createFollowUp(
    decision: CallDecision,
    call: Call,
    clientId: string
  ): Promise<{ success: boolean; followUpId?: string; error?: string }> {
    try {
      const followUpInfo = decision.incidentAnalysis.followUpInfo;
      
      if (!followUpInfo.relatedTicketId) {
        return {
          success: false,
          error: 'No se encontró ticket relacionado para la rellamada'
        };
      }

      const rellamadaPayload: RellamadaPayload = {
        IdCliente: clientId,
        IdTicket: followUpInfo.relatedTicketId,
        IdLlamada: call.conversation_id,
        Notas: this.generateFollowUpNotes(decision, call),
        FicheroLlamada: call.audio_download_url || call.fichero_llamada || ''
      };

      console.log(`📞 [EXECUTOR] Datos de la rellamada a crear:`, {
        IdCliente: rellamadaPayload.IdCliente,
        IdTicket: rellamadaPayload.IdTicket,
        IdLlamada: rellamadaPayload.IdLlamada,
        NotasLength: rellamadaPayload.Notas.length
      });

      const response = await this.nogalRellamadaService.crearRellamada(rellamadaPayload);
      
      if (response.success) {
        return {
          success: true,
          followUpId: response.rellamada_id
        };
      } else {
        return {
          success: false,
          error: response.message
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `Error interno creando rellamada: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  /**
   * 🔄 Actualizar registro de llamada con resultados
   */
  private async updateCallRecord(
    callId: string,
    decision: CallDecision,
    result: ExecutionResult
  ): Promise<void> {
    try {
      const ticketIds = result.actions.ticketsCreated
        .filter(t => t.success && t.ticketId)
        .map(t => t.ticketId!);

      const updateData = {
        analysis_completed: true,
        ai_analysis: {
          tipo_incidencia: decision.incidentAnalysis.primaryIncident.type,
          motivo_gestion: decision.incidentAnalysis.primaryIncident.reason,
          confidence: decision.metadata.confidence,
          prioridad: decision.decisions.priority,
          resumen_analisis: decision.metadata.processingRecommendation,
          datos_extraidos: decision.clientInfo.extractedData
        },
        tickets_created: ticketIds.length,
        ticket_ids: ticketIds,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('calls')
        .update(updateData)
        .eq('id', callId);

      if (error) {
        console.error(`❌ [EXECUTOR] Error actualizando llamada:`, error);
        throw new Error(`Error actualizando base de datos: ${error.message}`);
      }

      console.log(`✅ [EXECUTOR] Llamada actualizada en BD: ${callId}`);

    } catch (error) {
      console.error(`❌ [EXECUTOR] Error en actualización de BD:`, error);
      // No lanzar error - ya tenemos los tickets creados
    }
  }

  // 🛠️ MÉTODOS AUXILIARES

  /**
   * Parsear nombre completo en componentes
   */
  private parseFullName(fullName: string): { 
    nombre: string; 
    primerApellido: string; 
    segundoApellido?: string; 
  } {
    const parts = fullName.trim().split(/\s+/);
    
    if (parts.length === 1) {
      return { nombre: parts[0], primerApellido: 'Sin especificar' };
    } else if (parts.length === 2) {
      return { nombre: parts[0], primerApellido: parts[1] };
    } else {
      return { 
        nombre: parts[0], 
        primerApellido: parts[1], 
        segundoApellido: parts.slice(2).join(' ') 
      };
    }
  }

  /**
   * Generar ID único para cliente
   */
  private generateClientId(): string {
    const timestamp = Date.now().toString().substring(-6); // Últimos 6 dígitos
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${timestamp}${random}F00`;
  }

  /**
   * Generar notas para ticket
   */
  private generateTicketNotes(decision: CallDecision, call: Call): string {
    const incident = decision.incidentAnalysis.primaryIncident;
    const extractedData = decision.clientInfo.extractedData;
    
    let notes = `${incident.description}\n\n`;
    
    // Agregar datos extraídos relevantes
    if (extractedData.direccion) {
      notes += `Dirección: ${extractedData.direccion}\n`;
    }
    
    // Agregar contexto de rellamada si aplica
    if (decision.incidentAnalysis.followUpInfo.isFollowUp) {
      notes += `\n[RELLAMADA] Relacionada con ticket: ${decision.incidentAnalysis.followUpInfo.relatedTicketId}\n`;
    }
    
    notes += `\nProcesado automáticamente por IA (Confianza: ${Math.round(decision.metadata.confidence * 100)}%)`;
    
    return notes.substring(0, 500); // Limitar longitud
  }

  /**
   * Generar notas para rellamada
   */
  private generateFollowUpNotes(decision: CallDecision, call: Call): string {
    const followUpInfo = decision.incidentAnalysis.followUpInfo;
    
    let notes = `Rellamada de seguimiento: ${followUpInfo.followUpReason || 'Cliente solicita seguimiento'}\n\n`;
    notes += `${decision.incidentAnalysis.primaryIncident.description}\n\n`;
    notes += `Procesado automáticamente por IA (Confianza: ${Math.round(decision.metadata.confidence * 100)}%)`;
    
    return notes.substring(0, 500);
  }

  /**
   * Generar resumen de ejecución
   */
  private generateExecutionSummary(decision: CallDecision, result: ExecutionResult): string {
    const actions = [];
    
    if (result.actions.clientCreated?.success) {
      actions.push(`Cliente creado: ${result.actions.clientCreated.clientId}`);
    }
    
    const successfulTickets = result.actions.ticketsCreated.filter(t => t.success);
    if (successfulTickets.length > 0) {
      actions.push(`${successfulTickets.length} ticket(s) creado(s)`);
    }
    
    if (result.actions.followUpCreated?.success) {
      actions.push(`Rellamada creada: ${result.actions.followUpCreated.followUpId}`);
    }
    
    return actions.length > 0 
      ? `Acciones completadas: ${actions.join(', ')}`
      : 'No se realizaron acciones adicionales';
  }
}

// Exportar instancia singleton
export const callExecutor = new CallExecutor(); 