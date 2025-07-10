// 🔍 SERVICIO DE EXTRACCIÓN DE DATOS DE CLIENTE
// Extrae información del cliente desde los tool_results en transcripts

import { CallTranscript, ToolResult } from '../types/calls.types';

export interface ExtractedClientData {
  idCliente?: string;
  numeroPoliza?: string;
  telefono?: string;
  nombre?: string;
  email?: string;
  direccion?: string;
  cuentaBancaria?: string;
  // Metadatos de extracción
  extractionSource: 'tools' | 'transcript_text' | 'mixed';
  confidence: number;
  toolsUsed: string[];
}

export class ClientDataExtractor {

  /**
   * 🎯 MÉTODO PRINCIPAL - Extrae datos del cliente de los transcripts
   */
  extractClientData(transcripts: CallTranscript[]): ExtractedClientData {
    console.log(`🔍 [EXTRACTOR] Analizando ${transcripts.length} transcripts para datos de cliente`);

    const extractedData: ExtractedClientData = {
      extractionSource: 'tools',
      confidence: 0,
      toolsUsed: []
    };

    let totalToolCalls = 0;
    let successfulExtractions = 0;

    // 1. Procesar tools en los transcripts
    for (const transcript of transcripts) {
      if (transcript.tool_calls && transcript.tool_results) {
        totalToolCalls++;
        
        const toolData = this.extractFromToolResult(
          transcript.tool_calls.function.name,
          transcript.tool_results
        );

        if (toolData) {
          successfulExtractions++;
          extractedData.toolsUsed.push(transcript.tool_calls.function.name);
          
          // Combinar datos extraídos
          Object.assign(extractedData, toolData);
        }
      }
    }

    // 2. Si no hay datos de tools, extraer del texto
    if (totalToolCalls === 0) {
      console.log(`📝 [EXTRACTOR] No hay tool calls, extrayendo del texto`);
      const textData = this.extractFromTranscriptText(transcripts);
      Object.assign(extractedData, textData);
      extractedData.extractionSource = 'transcript_text';
    } else if (successfulExtractions < totalToolCalls) {
      // Datos mixtos (algunas tools + algo de texto)
      const textData = this.extractFromTranscriptText(transcripts);
      Object.assign(extractedData, textData);
      extractedData.extractionSource = 'mixed';
    }

    // 3. Calcular confianza
    extractedData.confidence = this.calculateConfidence(extractedData, totalToolCalls, successfulExtractions);

    console.log(`✅ [EXTRACTOR] Datos extraídos:`, {
      idCliente: extractedData.idCliente,
      numeroPoliza: extractedData.numeroPoliza,
      source: extractedData.extractionSource,
      confidence: extractedData.confidence,
      toolsUsed: extractedData.toolsUsed
    });

    return extractedData;
  }

  /**
   * 🛠️ Extraer datos de tool_results específicos
   */
  private extractFromToolResult(toolName: string, toolResult: ToolResult): Partial<ExtractedClientData> | null {
    if (toolResult.status !== 'success' || !toolResult.data) {
      return null;
    }

    const data = toolResult.data;
    const extracted: Partial<ExtractedClientData> = {};

    // Según el nombre de la herramienta, extraer campos específicos
    switch (toolName) {
      case 'buscar_cliente_seguros_nogal':
      case 'buscar_cliente':
        if (data.cliente_encontrado) {
          extracted.idCliente = data.id_cliente || data.clienteId || data.cliente_id;
          extracted.nombre = data.nombre || data.client_name;
          extracted.telefono = data.telefono || data.phone;
          extracted.email = data.email;
        }
        break;

      case 'consultar_poliza':
      case 'buscar_poliza':
        extracted.numeroPoliza = data.numero_poliza || data.poliza || data.policy_number;
        if (data.titular) {
          extracted.nombre = data.titular.nombre || data.titular;
          extracted.idCliente = data.titular.id || data.titular_id;
        }
        break;

      case 'actualizar_datos_bancarios':
      case 'cambiar_cuenta_bancaria':
        extracted.cuentaBancaria = data.nueva_cuenta || data.cuenta_bancaria || data.iban;
        break;

      case 'actualizar_direccion':
      case 'cambiar_direccion':
        extracted.direccion = data.nueva_direccion || data.direccion;
        break;

      default:
        // Búsqueda genérica de campos comunes
        extracted.idCliente = data.id_cliente || data.clienteId || data.cliente_id;
        extracted.numeroPoliza = data.numero_poliza || data.poliza;
        extracted.nombre = data.nombre || data.client_name;
        extracted.telefono = data.telefono || data.phone;
        extracted.email = data.email;
        break;
    }

    // Filtrar campos vacíos
    const filteredData = Object.fromEntries(
      Object.entries(extracted).filter(([_, value]) => value != null && value !== '')
    );

    return Object.keys(filteredData).length > 0 ? filteredData : null;
  }

  /**
   * 📝 Extraer datos del texto de los transcripts (fallback)
   */
  private extractFromTranscriptText(transcripts: CallTranscript[]): Partial<ExtractedClientData> {
    const extracted: Partial<ExtractedClientData> = {};
    
    // Unir todo el texto para análisis
    const fullText = transcripts
      .map(t => t.message)
      .join(' ')
      .toLowerCase();

    // Patrones regex para extracción básica
    const patterns = {
      numeroPoliza: /póliza\s*:?\s*([a-zA-Z0-9\-]+)/i,
      telefono: /teléfono\s*:?\s*([0-9\s\+\-]{9,15})/i,
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        (extracted as any)[key] = match[1].trim();
      }
    }

    return extracted;
  }

  /**
   * 📊 Calcular nivel de confianza en los datos extraídos
   */
  private calculateConfidence(data: ExtractedClientData, totalTools: number, successfulTools: number): number {
    let confidence = 0;

    // Base: presencia de ID de cliente (más importante)
    if (data.idCliente) confidence += 50;
    
    // Presencia de otros campos importantes
    if (data.numeroPoliza) confidence += 30;
    if (data.nombre) confidence += 10;
    if (data.telefono) confidence += 5;
    if (data.email) confidence += 3;
    if (data.direccion) confidence += 2;

    // Bonus por usar tools vs solo texto
    if (data.extractionSource === 'tools' && totalTools > 0) {
      confidence += (successfulTools / totalTools) * 20;
    } else if (data.extractionSource === 'transcript_text') {
      confidence = Math.min(confidence * 0.7, 70); // Máximo 70% para solo texto
    }

    return Math.min(Math.round(confidence), 100);
  }

  /**
   * 🎯 Generar ID de cliente si no se encontró uno
   */
  generateFallbackClientId(conversationId: string, telefono?: string): string {
    if (telefono) {
      // Usar últimos 4 dígitos del teléfono + hash del conversation
      const phoneDigits = telefono.replace(/\D/g, '').slice(-4);
      const hashPart = conversationId.slice(-4);
      return `CLI_${phoneDigits}_${hashPart}`;
    }
    
    // Fallback: usar hash del conversation_id
    return `CLI_${conversationId.slice(-8)}`;
  }
}

// Exportar instancia única
export const clientDataExtractor = new ClientDataExtractor(); 