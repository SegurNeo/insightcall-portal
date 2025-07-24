import axios, { AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * 📞 SERVICIO DE RELLAMADAS NOGAL
 * 
 * Maneja la creación de rellamadas cuando el cliente contacta sobre una incidencia ya abierta
 * y solicita seguimiento o que le vuelvan a llamar.
 */

export interface RellamadaPayload {
  IdCliente: string;
  IdTicket: string;
  IdLlamada: string;
  Notas: string;
  FicheroLlamada?: string;
}

export interface RellamadaResponse {
  success: boolean;
  message: string;
  rellamada_id?: string;
  nogal_response?: {
    rec_id: string;
    status: string;
    timestamp: string;
  };
  missing_fields?: string[];
  required_fields?: string[];
  errors?: string[];
}

export class NogalRellamadaService {
  private readonly SEGURNEO_BASE_URL = 'https://segurneo-voice.onrender.com';
  private readonly RELLAMADA_ENDPOINT = '/api/crear-rellamada';

  /**
   * 📞 Crear una rellamada sobre una incidencia existente
   */
  async crearRellamada(payload: RellamadaPayload): Promise<RellamadaResponse> {
    try {
      console.log(`📞 [RELLAMADA] Creando rellamada para cliente: ${payload.IdCliente}`);
      console.log(`📞 [RELLAMADA] Ticket relacionado: ${payload.IdTicket}`);
      console.log(`📞 [RELLAMADA] Llamada: ${payload.IdLlamada}`);

      // Validar campos requeridos
      this.validarCamposRequeridos(payload);

      // Sanitizar notas
      const payloadSanitizado = {
        ...payload,
        Notas: this.sanitizarNotas(payload.Notas)
      };

      console.log(`📞 [RELLAMADA] Payload sanitizado:`, {
        IdCliente: payloadSanitizado.IdCliente,
        IdTicket: payloadSanitizado.IdTicket,
        IdLlamada: payloadSanitizado.IdLlamada,
        NotasLength: payloadSanitizado.Notas.length,
        hasFicheroLlamada: !!payloadSanitizado.FicheroLlamada
      });

      // Enviar a Segurneo Voice
      const url = `${this.SEGURNEO_BASE_URL}${this.RELLAMADA_ENDPOINT}`;
      console.log(`📤 [RELLAMADA] Enviando a: ${url}`);

      const response: AxiosResponse<RellamadaResponse> = await axios.post(
        url,
        payloadSanitizado,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 segundos
        }
      );

      console.log(`✅ [RELLAMADA] Respuesta recibida (${response.status}):`, response.data);

      if (response.data.success) {
        console.log(`✅ [RELLAMADA] Rellamada creada exitosamente: ${response.data.rellamada_id}`);
        return response.data;
      } else {
        console.error(`❌ [RELLAMADA] Error en respuesta:`, response.data);
        throw new Error(response.data.message || 'Error desconocido al crear rellamada');
      }

    } catch (error) {
      console.error(`❌ [RELLAMADA] Error creando rellamada:`, error);

      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Error de respuesta del servidor
          const errorData = error.response.data as RellamadaResponse;
          console.error(`❌ [RELLAMADA] Error HTTP ${error.response.status}:`, errorData);
          
          return {
            success: false,
            message: errorData.message || `Error HTTP ${error.response.status}`,
            missing_fields: errorData.missing_fields,
            required_fields: errorData.required_fields,
            errors: errorData.errors
          };
        } else if (error.request) {
          // Error de conexión
          console.error(`❌ [RELLAMADA] Error de conexión:`, error.message);
          return {
            success: false,
            message: 'Error de conexión con el servicio de rellamadas',
            errors: [error.message]
          };
        }
      }

      // Error genérico
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido',
        errors: [error instanceof Error ? error.message : 'Error desconocido']
      };
    }
  }

  /**
   * 🔍 Generar ID de rellamada único
   */
  generarIdRellamada(): string {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `RELLAM-${timestamp}-${random}`;
  }

  /**
   * ✅ Validar campos requeridos
   */
  private validarCamposRequeridos(payload: RellamadaPayload): void {
    const camposRequeridos: (keyof RellamadaPayload)[] = ['IdCliente', 'IdTicket', 'IdLlamada', 'Notas'];
    const camposFaltantes: string[] = [];

    for (const campo of camposRequeridos) {
      if (!payload[campo] || payload[campo].toString().trim() === '') {
        camposFaltantes.push(campo);
      }
    }

    if (camposFaltantes.length > 0) {
      throw new Error(`Faltan campos requeridos para rellamada: ${camposFaltantes.join(', ')}`);
    }
  }

  /**
   * 🧹 Sanitizar notas para evitar problemas
   */
  private sanitizarNotas(notas: string): string {
    if (!notas) return '';

    const originalLength = notas.length;
    
    // Limpiar caracteres problemáticos y normalizar
    let sanitized = notas
      .trim()
      .replace(/[\r\n\t]+/g, ' ')  // Reemplazar saltos de línea y tabs por espacios
      .replace(/\s+/g, ' ')        // Normalizar espacios múltiples
      .replace(/[^\w\sáéíóúüñÁÉÍÓÚÜÑ.,;:()\-\/]/g, '') // Solo caracteres seguros
      .substring(0, 500);          // Limitar longitud

    console.log(`🧹 [RELLAMADA] Sanitizando Notas: ${originalLength} chars → ${sanitized.length} chars`);
    
    return sanitized;
  }

  /**
   * 🎯 Crear rellamada desde análisis de Nogal
   */
  async crearRellamadaDesdeAnalisis(
    clienteId: string,
    conversationId: string,
    incidenciaRelacionada: string,
    notas: string,
    audioUrl?: string
  ): Promise<RellamadaResponse> {
    
    const payload: RellamadaPayload = {
      IdCliente: clienteId,
      IdTicket: incidenciaRelacionada,
      IdLlamada: conversationId,
      Notas: notas || 'Cliente solicita seguimiento de incidencia existente',
      ...(audioUrl && { FicheroLlamada: audioUrl })
    };

    console.log(`🎯 [RELLAMADA] Creando desde análisis:`, {
      clienteId,
      conversationId,
      incidenciaRelacionada,
      notasLength: payload.Notas.length,
      hasAudio: !!audioUrl
    });

    return this.crearRellamada(payload);
  }

  /**
   * 📋 Validar que la incidencia existe en los datos del cliente
   */
  validarIncidenciaExiste(
    incidenciaId: string, 
    incidenciasAbiertas?: Array<{ codigo: string; tipo: string; motivo: string }>
  ): boolean {
    if (!incidenciasAbiertas || incidenciasAbiertas.length === 0) {
      console.warn(`⚠️ [RELLAMADA] Cliente no tiene incidencias abiertas para validar: ${incidenciaId}`);
      return false;
    }

    const incidenciaEncontrada = incidenciasAbiertas.find(inc => 
      inc.codigo === incidenciaId || 
      inc.codigo.includes(incidenciaId) ||
      incidenciaId.includes(inc.codigo)
    );

    if (incidenciaEncontrada) {
      console.log(`✅ [RELLAMADA] Incidencia validada: ${incidenciaEncontrada.codigo} - ${incidenciaEncontrada.tipo}`);
      return true;
    } else {
      console.warn(`⚠️ [RELLAMADA] Incidencia no encontrada en datos del cliente: ${incidenciaId}`);
      console.warn(`⚠️ [RELLAMADA] Incidencias disponibles:`, incidenciasAbiertas.map(i => i.codigo));
      return false;
    }
  }
}

export const nogalRellamadaService = new NogalRellamadaService(); 