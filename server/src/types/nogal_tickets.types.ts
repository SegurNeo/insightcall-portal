// Tipos para la integración con la API de Tickets de Nogal

/**
 * Datos del cliente obtenidos durante la llamada via buscar-cliente API
 */
export interface NogalClientData {
  // Datos de identificación
  dni?: string;
  phone?: string;
  name?: string;
  email?: string;
  codigoCliente?: string;
  
  // Datos obtenidos de buscar-cliente
  polizas?: {
    numero: string;
    compania: string;
    estado: string;
    ramo: 'hogar' | 'auto' | 'vida' | 'decesos' | 'Salud' | 'otros';
    fechaEfecto?: string;
    mesVencimiento?: string;
    importePoliza?: string;
  }[];
  
  incidenciasAbiertas?: {
    codigo: string;
    tipo: string;
    motivo: string;
    fechaCreacion?: string;
    poliza?: string;
  }[];
}

/**
 * Mapeo de tipos de incidencia de Nogal basado en tickets_nogal.csv
 */
export type NogalTipoIncidencia = 
  | 'Nueva contratación de seguros'
  | 'Modificación póliza emitida'
  | 'Llamada asistencia en carretera'
  | 'Retención de Cliente Cartera'
  | 'Cancelación antes de efecto'
  | 'Llamada gestión comercial'
  | 'Baja cliente en BBDD'
  | 'Reclamación cliente regalo'
  | 'Solicitud duplicado póliza';

/**
 * Motivos de gestión más comunes de Nogal
 */
export type NogalMotivoGestion = 
  | 'Contratación Póliza'
  | 'Póliza anterior suspensión de garantías'
  | 'Atención al cliente - Modif datos póliza'
  | 'Cambio nº de cuenta'
  | 'Siniestros'
  | 'Retención de Cliente Cartera Llamada'
  | 'Cancelación antes de efecto llamada'
  | 'LLam gestión comerc'
  | 'Pago de Recibo'
  | 'Consulta cliente'
  | 'Baja Cliente BBDD'
  | 'Reclamación atención al cliente'
  | 'Correo ordinario'
  | 'Duplicado Tarjeta'
  | 'Email'
  | 'Cambio fecha de efecto'
  | 'Cambio forma de pago'
  | 'Modificación nº asegurados'
  | 'Cambio dirección postal'
  | 'Modificación coberturas'
  | 'Cesión de derechos datos incompletos'
  | 'Cesión de derechos'
  | 'Corrección datos erróneos en póliza'
  | 'Datos incompletos'
  | 'Reenvío siniestros'
  | 'Reenvío agentes humanos'
  | 'Información recibos declaración renta'
  | 'Cambio de mediador';

/**
 * Resultado del análisis actualizado para tipos de Nogal
 */
export interface NogalGeminiAnalysisResult {
  // Clasificación principal usando tipos reales de Nogal
  tipoIncidencia: NogalTipoIncidencia;
  motivoGestion: NogalMotivoGestion;
  ramo?: 'hogar' | 'auto' | 'vida' | 'decesos' | 'Salud' | 'otros';
  
  // Confianza y prioridad
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high';
  
  // Contexto extraído
  resumenLlamada: string;
  consideraciones?: string; // Notas adicionales para el gestor
  
  // Datos específicos extraídos de la conversación
  datosExtraidos: {
    numeroPoliza?: string;
    numeroRecibo?: string;
    motivo?: string;
    fechaEfecto?: string;
    nuevaCCC?: string;
    direccionNueva?: string;
    aseguradoNuevo?: {
      nombre: string;
      apellidos: string;
      dni?: string;
      fechaNacimiento?: string;
    };
    prestamo?: {
      numero: string;
      banco: string;
      entidad: string;
      oficina: string;
      fechaInicio: string;
      fechaFin: string;
    };
  };
  
  // Control de creación
  requiereTicket: boolean;
  esExclusivaIA: boolean; // Para tipos marcados como "Exclusiva IA" en el CSV
  tipoCreacion: 'Manual' | 'Automática' | 'Exclusiva IA';
}

/**
 * Payload para crear ticket en la API de Nogal
 */
export interface NogalTicketPayload {
  "Fecha envío": string; // Formato DD/MM/YYYY
  "Hora envío": string;
  "IdCliente": string;
  "IdTicket": string;
  "TipoIncidencia": string;
  "MotivoIncidencia": string;
  "NumeroPoliza"?: string;
  "Notas": string;
  "FicheroLlamada"?: string;
}

/**
 * Respuesta de la API de Nogal al crear ticket
 */
export interface NogalTicketResponse {
  Respuesta: 'OK' | 'ERROR';
  mensaje?: string;
  codigoError?: string;
  detalles?: any;
}

/**
 * Mapeo de acciones Gemini actuales a tipos Nogal
 */
export const GEMINI_TO_NOGAL_MAPPING: Record<string, {
  tipoIncidencia: NogalTipoIncidencia;
  motivoGestion: NogalMotivoGestion;
  esExclusivaIA: boolean;
}> = {
  'DEVOLUCION_RECIBOS': {
    tipoIncidencia: 'Llamada gestión comercial',
    motivoGestion: 'Pago de Recibo',
    esExclusivaIA: false
  },
  'ANULACION_POLIZA': {
    tipoIncidencia: 'Cancelación antes de efecto',
    motivoGestion: 'Cancelación antes de efecto llamada',
    esExclusivaIA: false
  },
  'REGULARIZACION_POLIZA': {
    tipoIncidencia: 'Modificación póliza emitida',
    motivoGestion: 'Atención al cliente - Modif datos póliza',
    esExclusivaIA: false
  },
  'CAMBIO_MEDIADOR': {
    tipoIncidencia: 'Modificación póliza emitida',
    motivoGestion: 'Cambio de mediador',
    esExclusivaIA: false
  },
  'CONTRASEÑAS': {
    tipoIncidencia: 'Llamada gestión comercial',
    motivoGestion: 'Consulta cliente',
    esExclusivaIA: false
  },
  'REENVIO_SINIESTROS': {
    tipoIncidencia: 'Llamada gestión comercial',
    motivoGestion: 'Reenvío siniestros',
    esExclusivaIA: true
  },
  'REENVIO_AGENTES_HUMANOS': {
    tipoIncidencia: 'Llamada gestión comercial',
    motivoGestion: 'Reenvío agentes humanos',
    esExclusivaIA: true
  },
  'DATOS_INCOMPLETOS': {
    tipoIncidencia: 'Modificación póliza emitida',
    motivoGestion: 'Datos incompletos',
    esExclusivaIA: true
  }
};

/**
 * Datos completos de la llamada enviados por Segurneo Voice Gateway
 */
export interface CallDataFromGateway {
  // Identificación
  externalCallId: string;
  conversationId: string; // ID de Eleven Labs
  
  // Datos de la llamada
  startTime: number; // Unix timestamp
  duration: number; // segundos
  status: 'completed' | 'failed';
  
  // Transcripción
  transcript: {
    role: 'agent' | 'user';
    message: string;
    timestamp: number; // segundos desde inicio
    confidence: number;
  }[];
  
  // Datos del cliente (obtenidos durante la llamada)
  clientData: NogalClientData;
  
  // Metadatos técnicos
  audioQuality?: number;
  language?: string;
  
  // Control de tickets
  ticketCreated?: boolean; // Para evitar duplicados
  analysisPerformed?: boolean;
}

/**
 * Estados del procesamiento de tickets
 */
export type TicketCreationStatus = 
  | 'not_attempted'
  | 'in_progress' 
  | 'success'
  | 'failed'
  | 'skipped_low_confidence'
  | 'skipped_no_client_data';

/**
 * Resultado del procesamiento de ticket
 */
export interface TicketCreationResult {
  status: TicketCreationStatus;
  nogalTicketId?: string;
  error?: string;
  analysis?: NogalGeminiAnalysisResult;
  clientData?: NogalClientData;
  processingTime?: number; // milliseconds
} 