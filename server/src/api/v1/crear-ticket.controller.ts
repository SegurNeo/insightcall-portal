// 🎫 CONTROLADOR PARA CREAR TICKETS EN NOGAL VÍA SEGURNEO VOICE
// Endpoint: POST /api/v1/crear-ticket

import { Request, Response } from 'express';
import { nogalTicketService } from '../../services/nogalTicketService';
import { NogalTicketPayload } from '../../types/calls.types';

export class CrearTicketController {

  /**
   * 🎯 POST /api/v1/crear-ticket
   * Crear ticket y enviarlo automáticamente a Nogal vía Segurneo Voice
   */
  async crearTicket(req: Request, res: Response) {
    try {
      console.log(`🎫 [ENDPOINT] Nueva solicitud de creación de ticket`);
      console.log(`📋 [ENDPOINT] Body recibido:`, req.body);

      // 1. Validar campos requeridos
      const { 
        IdCliente, 
        IdLlamada, 
        TipoIncidencia, 
        MotivoIncidencia, 
        Notas 
      } = req.body;

      const requiredFields = {
        IdCliente,
        IdLlamada,
        TipoIncidencia,
        MotivoIncidencia,
        Notas
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([_, value]) => !value || (typeof value === 'string' && value.trim() === ''))
        .map(([field, _]) => field);

      if (missingFields.length > 0) {
        console.error(`❌ [ENDPOINT] Campos faltantes: ${missingFields.join(', ')}`);
        return res.status(400).json({
          success: false,
          message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
          required_fields: ['IdCliente', 'IdLlamada', 'TipoIncidencia', 'MotivoIncidencia', 'Notas']
        });
      }

      // 2. Preparar payload para Nogal (sin IdTicket, se genera automáticamente)
      const ticketPayload: Omit<NogalTicketPayload, 'IdTicket'> = {
        IdCliente: IdCliente.toString().trim(),
        IdLlamada: IdLlamada.toString().trim(),
        TipoIncidencia: TipoIncidencia.toString().trim(),
        MotivoIncidencia: MotivoIncidencia.toString().trim(),
        NumeroPoliza: req.body.NumeroPoliza?.toString().trim() || '', // ✅ Opcional - vacío si no se identifica
        Notas: Notas.toString().trim(),
        FicheroLlamada: req.body.FicheroLlamada?.toString().trim() || ''
      };

      console.log(`📤 [ENDPOINT] Enviando ticket a Segurneo Voice:`, {
        IdCliente: ticketPayload.IdCliente,
        TipoIncidencia: ticketPayload.TipoIncidencia,
        hasPoliza: !!ticketPayload.NumeroPoliza
      });

      // 4. Enviar a Segurneo Voice usando el servicio
      const result = await nogalTicketService.createAndSendTicket(ticketPayload);

      // 5. Responder según el resultado
      if (result.success) {
        console.log(`✅ [ENDPOINT] Ticket creado exitosamente: ${result.ticket_id}`);
        return res.status(200).json({
          success: true,
          message: result.message,
          ticket_id: result.ticket_id,
          timestamp: new Date().toISOString()
        });
      } else {
        console.error(`❌ [ENDPOINT] Error en creación: ${result.error}`);
        return res.status(500).json({
          success: false,
          message: result.message,
          error: result.error,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error(`❌ [ENDPOINT] Error interno:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 🧪 GET /api/v1/crear-ticket/test
   * Probar conectividad con Segurneo Voice
   */
  async testConnectivity(req: Request, res: Response) {
    try {
      console.log(`🧪 [ENDPOINT] Probando conectividad con Segurneo Voice`);
      
      const testResult = await nogalTicketService.testConnection();
      
      return res.status(200).json({
        success: true,
        message: 'Prueba de conectividad completada',
        connectivity: testResult,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ [ENDPOINT] Error en prueba:`, error);
      return res.status(500).json({
        success: false,
        message: 'Error en prueba de conectividad',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 📋 GET /api/v1/crear-ticket/example
   * Mostrar ejemplo de payload
   */
  async showExample(req: Request, res: Response) {
    const example = {
      IdCliente: "CLI-2025-001",
      IdLlamada: "call_123456789",
      TipoIncidencia: "Consulta de póliza",
      MotivoIncidencia: "Cliente solicita información sobre cobertura",
      NumeroPoliza: "POL-123456", // Opcional - solo si se identifica en la llamada
      Notas: "Cliente satisfecho con la información"
    };

    const automaticFields = {
      IdTicket: "Generado automáticamente (IA-YYYYMMDD-XXX)",
      JsonId: "Generado automáticamente por Segurneo Voice (4 dígitos)",
      Fecha: "Generada automáticamente por Segurneo Voice (DD/MM/YYYY)",
      Hora: "Generada automáticamente por Segurneo Voice (HH:MM:SS)"
    };

    return res.status(200).json({
      description: "Ejemplo de payload para crear ticket vía Segurneo Voice",
      required_fields: example,
      automatic_fields: automaticFields,
      endpoint: "POST /api/v1/crear-ticket",
      note: "IdTicket, JsonId, Fecha y Hora se generan automáticamente"
    });
  }
}

// Exportar instancia única
export const crearTicketController = new CrearTicketController(); 