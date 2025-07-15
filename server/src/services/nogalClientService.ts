// 🏢 SERVICIO DE CREACIÓN DE CLIENTES EN NOGAL
// Implementa la API para crear clientes nuevos en el ERP

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Datos requeridos para crear un cliente en Nogal
 */
export interface CreateClientRequest {
  IdCliente: string;
  IdLlamada: string;
  Nombre: string;
  PrimerApellido: string;
  SegundoApellido: string;
  Telefono: string;
  Email: string;
  // Campos opcionales
  Telefono2?: string;
  RecomendadoPor?: string;
  Campaña?: string;
  IdLead?: string;
}

/**
 * Respuesta de la API de creación de clientes
 */
export interface CreateClientResponse {
  success: boolean;
  message: string;
  client_id?: string;
  nogal_response?: {
    status: string;
    mensaje: string;
  };
  missing_fields?: string[];
  errors?: string[];
}

/**
 * Datos extraídos de la llamada para crear cliente
 */
export interface ClientDataFromCall {
  nombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  email: string;
  telefono2?: string;
  recomendadoPor?: string;
  campaña?: string;
  idLead?: string;
}

export class NogalClientService {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.SEGURNEO_VOICE_URL || 'https://segurneo-voice.onrender.com';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Interceptor para logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[NogalClient] 🚀 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[NogalClient] ❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`[NogalClient] ✅ Response ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('[NogalClient] ❌ Response error:', error.response?.status, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 🎯 MÉTODO PRINCIPAL - Crear cliente en Nogal
   */
  async createClient(clientData: CreateClientRequest): Promise<CreateClientResponse> {
    try {
      console.log(`[NogalClient] 👤 Creando cliente: ${clientData.Nombre} ${clientData.PrimerApellido}`);
      
      // Validar campos requeridos
      this.validateRequiredFields(clientData);
      
      // Preparar payload según documentación
      const payload = this.preparePayload(clientData);
      
      console.log(`[NogalClient] 📤 Enviando payload:`, {
        IdCliente: payload.IdCliente,
        IdLlamada: payload.IdLlamada,
        Nombre: payload.Nombre,
        Telefono: payload.Telefono,
        Email: payload.Email,
        hasIdLead: !!payload.IdLead,
        hasCampaña: !!payload.Campaña
      });

      const response: AxiosResponse<CreateClientResponse> = await this.client.post(
        '/api/crear-cliente',
        payload
      );

      if (response.status !== 200) {
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      const result = response.data;
      
      console.log(`[NogalClient] 📥 Respuesta recibida:`, {
        success: result.success,
        message: result.message,
        client_id: result.client_id,
        nogal_status: result.nogal_response?.status
      });

      return result;

    } catch (error) {
      console.error('[NogalClient] ❌ Error creando cliente:', error);
      return this.handleError(error);
    }
  }

  /**
   * 🔍 Crear cliente desde datos extraídos de la llamada
   */
  async createClientFromCall(
    clientData: ClientDataFromCall,
    conversationId: string,
    generateClientId?: (name: string, phone: string) => string
  ): Promise<CreateClientResponse> {
    
    // Generar ID de cliente si no se proporciona generador
    const defaultGenerator = (name: string, phone: string): string => {
      const nameInitials = name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const phoneLastDigits = phone.slice(-4);
      return `CL${nameInitials}${phoneLastDigits}${timestamp}`;
    };

    const clientId = generateClientId?.(clientData.nombre, clientData.telefono) || 
                     defaultGenerator(clientData.nombre, clientData.telefono);

    const request: CreateClientRequest = {
      IdCliente: clientId,
      IdLlamada: conversationId,
      Nombre: clientData.nombre,
      PrimerApellido: clientData.primerApellido,
      SegundoApellido: clientData.segundoApellido,
      Telefono: clientData.telefono,
      Email: clientData.email,
      ...(clientData.telefono2 && { Telefono2: clientData.telefono2 }),
      ...(clientData.recomendadoPor && { RecomendadoPor: clientData.recomendadoPor }),
      ...(clientData.campaña && { Campaña: clientData.campaña }),
      ...(clientData.idLead && { IdLead: clientData.idLead })
    };

    console.log(`[NogalClient] 🔄 Creando cliente desde llamada:`, {
      generatedId: clientId,
      conversationId,
      hasLead: !!clientData.idLead,
      hasCampaña: !!clientData.campaña
    });

    return this.createClient(request);
  }

  /**
   * 🛡️ Validar campos requeridos
   */
  private validateRequiredFields(clientData: CreateClientRequest): void {
    const required = ['IdCliente', 'IdLlamada', 'Nombre', 'PrimerApellido', 'SegundoApellido', 'Telefono', 'Email'];
    const missing = required.filter(field => !clientData[field as keyof CreateClientRequest]);
    
    if (missing.length > 0) {
      throw new Error(`Faltan campos requeridos: ${missing.join(', ')}`);
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientData.Email)) {
      throw new Error('El email no tiene un formato válido');
    }

    // Validar teléfono básico
    const phoneRegex = /^\+?[0-9\s\-]{9,15}$/;
    if (!phoneRegex.test(clientData.Telefono)) {
      throw new Error('El teléfono no tiene un formato válido');
    }
  }

  /**
   * 📋 Preparar payload según documentación
   */
  private preparePayload(clientData: CreateClientRequest): CreateClientRequest {
    return {
      IdCliente: clientData.IdCliente,
      IdLlamada: clientData.IdLlamada,
      Nombre: clientData.Nombre.trim(),
      PrimerApellido: clientData.PrimerApellido.trim(),
      SegundoApellido: clientData.SegundoApellido.trim(),
      Telefono: clientData.Telefono.replace(/\s/g, ''), // Remover espacios
      Email: clientData.Email.toLowerCase().trim(),
      ...(clientData.Telefono2 && { Telefono2: clientData.Telefono2.replace(/\s/g, '') }),
      ...(clientData.RecomendadoPor && { RecomendadoPor: clientData.RecomendadoPor.trim() }),
      ...(clientData.Campaña && { Campaña: clientData.Campaña.trim() }),
      ...(clientData.IdLead && { IdLead: clientData.IdLead.trim() })
    };
  }

  /**
   * 🚨 Manejo de errores
   */
  private handleError(error: any): CreateClientResponse {
    if (error.response?.data) {
      // Error de la API
      return {
        success: false,
        message: error.response.data.message || 'Error del servidor',
        missing_fields: error.response.data.missing_fields,
        errors: error.response.data.errors
      };
    }

    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: 'Timeout en la conexión con el servidor',
        errors: ['Timeout']
      };
    }

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor',
        errors: ['Connection error']
      };
    }

    return {
      success: false,
      message: error.message || 'Error desconocido',
      errors: [error.message || 'Unknown error']
    };
  }
}

export const nogalClientService = new NogalClientService(); 