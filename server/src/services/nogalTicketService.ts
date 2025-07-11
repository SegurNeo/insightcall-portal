// 🎫 SERVICIO DE TICKETS NOGAL VÍA SEGURNEO VOICE
// Envío exclusivo a través de Segurneo Voice (no directo a Nogal)

import axios, { AxiosError } from 'axios';
import { NogalTicketPayload, NogalTicketResponse } from '../types/calls.types';
import { supabase } from '../lib/supabase';

export class NogalTicketService {
  private readonly SEGURNEO_VOICE_ENDPOINT = 'https://segurneo-voice.onrender.com/api/crear-ticket';
  private readonly TIMEOUT_MS = 15000; // 15 segundos

  /**
   * 🎯 MÉTODO PRINCIPAL - Crear y enviar ticket a Segurneo Voice
   */
  async createAndSendTicket(ticketData: Omit<NogalTicketPayload, 'IdTicket'>): Promise<NogalTicketResponse> {
    console.log(`🎫 [NOGAL] Creando ticket para cliente: ${ticketData.IdCliente}`);

    try {
      // 1. Generar ID único para el ticket
      const idTicket = await this.generateUniqueTicketId();
      
      // 2. Completar payload con valor por defecto para NumeroPoliza
      const completePayload: NogalTicketPayload = {
        ...ticketData,
        IdTicket: idTicket,
        NumeroPoliza: ticketData.NumeroPoliza || 'N/A' // ✅ Valor por defecto si no existe
      };

      console.log(`📋 [NOGAL] Payload para Segurneo Voice:`, {
        IdCliente: completePayload.IdCliente,
        IdTicket: completePayload.IdTicket,
        IdLlamada: completePayload.IdLlamada,
        TipoIncidencia: completePayload.TipoIncidencia,
        hasPoliza: !!completePayload.NumeroPoliza
      });

      // 3. Enviar a Segurneo Voice
      const response = await this.sendToSegurneoVoice(completePayload);

      if (response.success) {
        console.log(`✅ [NOGAL] Ticket enviado exitosamente: ${idTicket}`);
        return {
          success: true,
          message: 'Ticket creado y enviado exitosamente a Nogal vía Segurneo Voice',
          ticket_id: idTicket
        };
      } else {
        console.error(`❌ [NOGAL] Error en envío: ${response.error}`);
        return response;
      }

    } catch (error) {
      console.error(`❌ [NOGAL] Error en creación de ticket:`, error);
      return {
        success: false,
        message: 'Error interno en creación de ticket',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 🎲 Generar ID único de ticket con formato IA-YYYYMMDD-XXX
   */
  private async generateUniqueTicketId(): Promise<string> {
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    // Buscar el último número secuencial del día
    const todayPrefix = `IA-${dateStr}-`;
    
    try {
      // Buscar tickets del día en Supabase
      const { data: existingTickets, error } = await supabase
        .from('tickets')
        .select('metadata')
        .like('metadata->ticket_id', `${todayPrefix}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn(`⚠️ [NOGAL] Error buscando tickets existentes, usando secuencial 001:`, error);
        return `${todayPrefix}001`;
      }

      let nextNumber = 1;
      
      if (existingTickets && existingTickets.length > 0) {
        const lastTicket = existingTickets[0];
        const lastTicketId = lastTicket.metadata?.ticket_id;
        
        if (lastTicketId && typeof lastTicketId === 'string') {
          const match = lastTicketId.match(/-(\d{3})$/);
          if (match) {
            nextNumber = parseInt(match[1]) + 1;
          }
        }
      }

      const sequentialPart = nextNumber.toString().padStart(3, '0');
      const ticketId = `${todayPrefix}${sequentialPart}`;
      
      console.log(`🎲 [NOGAL] ID generado: ${ticketId}`);
      return ticketId;
      
    } catch (error) {
      console.warn(`⚠️ [NOGAL] Error generando ID, usando timestamp:`, error);
      // Fallback: usar timestamp
      const timestamp = Date.now().toString().slice(-3);
      return `${todayPrefix}${timestamp}`;
    }
  }

  /**
   * 📤 Enviar ticket a Segurneo Voice
   */
  private async sendToSegurneoVoice(payload: NogalTicketPayload): Promise<NogalTicketResponse> {
    try {
      console.log(`📤 [NOGAL] Enviando a Segurneo Voice: ${this.SEGURNEO_VOICE_ENDPOINT}`);
      
      const response = await axios.post(this.SEGURNEO_VOICE_ENDPOINT, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Nogal-InsightCall-Portal/1.0'
        },
        timeout: this.TIMEOUT_MS
      });

      if (response.status === 200) {
        console.log(`✅ [NOGAL] Respuesta exitosa de Segurneo Voice:`, response.data);
        return {
          success: true,
          message: 'Ticket enviado exitosamente via Segurneo Voice',
          ticket_id: payload.IdTicket
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error(`❌ [NOGAL] Error enviando a Segurneo Voice:`, error);
      
      let errorMessage = 'Error enviando ticket a Segurneo Voice';
      
      if (error instanceof AxiosError) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = `Timeout después de ${this.TIMEOUT_MS}ms`;
        } else if (error.response) {
          errorMessage = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
        } else if (error.request) {
          errorMessage = 'Sin respuesta del servidor Segurneo Voice';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        message: errorMessage,
        error: errorMessage
      };
    }
  }

  /**
   * 🧪 Probar conectividad con Segurneo Voice
   */
  async testConnection(): Promise<{
    segurneoVoice: boolean;
    responseTime?: number;
    error?: string;
  }> {
    console.log(`🧪 [NOGAL] Probando conectividad con Segurneo Voice`);
    
    const startTime = Date.now();
    
    try {
      // Hacer un request simple para verificar que el endpoint responde
      const response = await axios.get(this.SEGURNEO_VOICE_ENDPOINT.replace('/crear-ticket', '/health'), {
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        segurneoVoice: response.status === 200,
        responseTime
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        segurneoVoice: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * 🎯 Generar ID de ticket para casos externos (mantener compatibilidad)
   */
  generateTicketId(conversationId: string, tipoIncidencia: string): string {
    // Este método se mantiene para compatibilidad, pero ahora usa el nuevo formato
    const today = new Date();
    const dateStr = today.getFullYear().toString() + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    // Usar hash del conversationId para generar un número único
    const hash = conversationId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const uniqueNumber = Math.abs(hash % 999) + 1;
    const sequentialPart = uniqueNumber.toString().padStart(3, '0');
    
    return `IA-${dateStr}-${sequentialPart}`;
  }
}

// Exportar instancia única
export const nogalTicketService = new NogalTicketService(); 