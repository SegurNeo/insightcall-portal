// 🔍 SERVICIO DE EXTRACCIÓN DE DATOS DE CLIENTE
// Extrae información del cliente desde los tool_results en transcripts

import { CallTranscript, ToolResult } from '../types/calls.types';

export interface ExtractedClientData {
  idCliente?: string;
  // numeroPoliza?: string; // ❌ REMOVIDO - La IA determinará la póliza específica
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

    // 1. NUEVO: Procesar tool_results estructurados (formato real de Segurneo)
    const structuredToolExtractions = this.extractFromStructuredTools(transcripts);
    if (structuredToolExtractions.found) {
      Object.assign(extractedData, structuredToolExtractions.data);
      extractedData.toolsUsed = structuredToolExtractions.toolsUsed;
      totalToolCalls = structuredToolExtractions.toolsUsed.length;
      successfulExtractions = structuredToolExtractions.found ? 1 : 0;
    }

    // 2. Fallback: Buscar tool calls como texto  
    if (totalToolCalls === 0) {
      const textToolExtractions = this.extractFromTextTools(transcripts);
      if (textToolExtractions.found) {
        Object.assign(extractedData, textToolExtractions.data);
        extractedData.toolsUsed = textToolExtractions.toolsUsed;
        totalToolCalls = textToolExtractions.toolsUsed.length;
        successfulExtractions = textToolExtractions.found ? 1 : 0;
      }
    }

    // 3. Procesar tools legacy (compatibilidad hacia atrás)
    if (totalToolCalls === 0) {
      for (const transcript of transcripts) {
        // Verificar si usa el formato legacy
        if ((transcript as any).tool_calls?.function && (transcript as any).tool_results?.status) {
          totalToolCalls++;
          
          const toolData = this.extractFromLegacyToolResult(
            (transcript as any).tool_calls.function.name,
            (transcript as any).tool_results
          );

          if (toolData) {
            successfulExtractions++;
            extractedData.toolsUsed.push((transcript as any).tool_calls.function.name);
            
            // Combinar datos extraídos
            Object.assign(extractedData, toolData);
          }
        }
      }
    }

    // 3. Si no hay datos de tools, extraer del texto general
    if (totalToolCalls === 0) {
      console.log(`📝 [EXTRACTOR] No hay tool calls, extrayendo del texto general`);
      const textData = this.extractFromTranscriptText(transcripts);
      Object.assign(extractedData, textData);
      extractedData.extractionSource = 'transcript_text';
    } else if (successfulExtractions < totalToolCalls) {
      // Datos mixtos (algunas tools + algo de texto)
      const textData = this.extractFromTranscriptText(transcripts);
      Object.assign(extractedData, textData);
      extractedData.extractionSource = 'mixed';
    }

    // 4. Calcular confianza
    extractedData.confidence = this.calculateConfidence(extractedData, totalToolCalls, successfulExtractions);

    console.log(`✅ [EXTRACTOR] Datos extraídos:`, {
      idCliente: extractedData.idCliente,
      // numeroPoliza: ❌ REMOVIDO - La IA determinará la póliza específica
      nombre: extractedData.nombre,
      source: extractedData.extractionSource,
      confidence: extractedData.confidence,
      toolsUsed: extractedData.toolsUsed
    });

    return extractedData;
  }

  /**
   * 🔧 NUEVO: Extraer datos de tool calls en formato texto (Segurneo)
   */
  private extractFromTextTools(transcripts: CallTranscript[]): {
    found: boolean;
    data: Partial<ExtractedClientData>;
    toolsUsed: string[];
  } {
    console.log(`🔍 [EXTRACTOR] Buscando tool calls en formato texto`);
    
    const extracted: Partial<ExtractedClientData> = {};
    const toolsUsed: string[] = [];
    let found = false;

    for (let i = 0; i < transcripts.length; i++) {
      const transcript = transcripts[i];
      const message = transcript.message;

      // Buscar pattern: "[Tool Call: identificar_cliente]"
      const toolCallMatch = message.match(/\[Tool Call:\s*([^\]]+)\]/i);
      if (toolCallMatch) {
        const toolName = toolCallMatch[1].trim();
        toolsUsed.push(toolName);

        // Buscar la respuesta del agente después del tool result
        const responseTranscript = this.findAgentResponseAfterTool(transcripts, i);
        if (responseTranscript) {
          console.log(`📋 [EXTRACTOR] Analizando respuesta del agente para tool: ${toolName}`);
          console.log(`📋 [EXTRACTOR] Respuesta: ${responseTranscript.message.substring(0, 200)}...`);
          
          // Extraer datos específicos según el tipo de tool
          const toolData = this.extractFromAgentResponse(toolName, responseTranscript.message);
          if (toolData && Object.keys(toolData).length > 0) {
            Object.assign(extracted, toolData);
            found = true;
          }
        }
      }
    }

    return { found, data: extracted, toolsUsed };
  }

  /**
   * 🎯 Encontrar respuesta del agente después de un tool result
   */
  private findAgentResponseAfterTool(transcripts: CallTranscript[], toolCallIndex: number): CallTranscript | null {
    // Buscar el próximo mensaje del agente que no sea tool call/result
    for (let i = toolCallIndex + 1; i < transcripts.length; i++) {
      const transcript = transcripts[i];
      
      if (transcript.speaker === 'agent' && 
          !transcript.message.includes('[Tool Call:') && 
          !transcript.message.includes('[Tool Result:') &&
          transcript.message.trim().length > 20) {
        return transcript;
      }
    }
    return null;
  }

  /**
   * 🧠 Extraer datos del cliente de la respuesta del agente
   */
  private extractFromAgentResponse(toolName: string, agentMessage: string): Partial<ExtractedClientData> | null {
    const extracted: Partial<ExtractedClientData> = {};

    switch (toolName) {
      case 'buscar_cliente_seguros_nogal':
        // Extraer información estructurada de respuesta del agente
        const lines = agentMessage.split('\n');
        for (const line of lines) {
          const trimmed = line.trim().toLowerCase();
          
          if (trimmed.includes('cliente encontrado') || trimmed.includes('nombre:')) {
            const nameMatch = line.match(/nombre:\s*([^,\n]+)/i);
            if (nameMatch) {
              extracted.nombre = nameMatch[1].trim();
            }
          }
          
          if (trimmed.includes('teléfono:')) {
            const phoneMatch = line.match(/teléfono:\s*([0-9\s\+\-]+)/i);
            if (phoneMatch) {
              extracted.telefono = phoneMatch[1].trim();
            }
          }

          // Generar ID de cliente temporal (se mejorará con datos reales)
          if (extracted.nombre) {
            const nombreParts = extracted.nombre.split(' ');
            const initial = nombreParts.map(p => p[0]).join('').toUpperCase();
            extracted.idCliente = `CLI-${initial}-${Date.now().toString().slice(-6)}`;
          }
        }
        break;

      case 'consultar_poliza':
      case 'buscar_poliza':
        // ❌ REMOVIDO: La IA determinará si hay una póliza específica identificada
        // No extraemos números de póliza desde el extractor
        break;
    }

    return Object.keys(extracted).length > 0 ? extracted : null;
  }

  /**
   * 🚀 NUEVO: Extraer datos de tool_results estructurados (formato real Segurneo)
   */
  private extractFromStructuredTools(transcripts: CallTranscript[]): {
    found: boolean;
    data: Partial<ExtractedClientData>;
    toolsUsed: string[];
  } {
    console.log(`🔍 [EXTRACTOR] Procesando tool_results estructurados de Segurneo`);
    
    const extracted: Partial<ExtractedClientData> = {};
    const toolsUsed: string[] = [];
    let found = false;

    for (const transcript of transcripts) {
      // Verificar si hay tool_results en este transcript
      if (transcript.tool_results && transcript.tool_results.length > 0) {
        for (const toolResult of transcript.tool_results) {
          if (!toolResult.is_error && toolResult.result_value) {
            try {
              // Parsear el result_value como JSON
              const parsedResult = JSON.parse(toolResult.result_value);
              console.log(`📋 [EXTRACTOR] Tool: ${toolResult.tool_name}, Status: ${parsedResult.status}`);
              
              if (parsedResult.status === 'success' && parsedResult.data) {
                const toolData = this.extractFromSegurneoToolData(toolResult.tool_name, parsedResult.data);
                if (toolData && Object.keys(toolData).length > 0) {
                  Object.assign(extracted, toolData);
                  toolsUsed.push(toolResult.tool_name);
                  found = true;
                  
                  console.log(`✅ [EXTRACTOR] Datos extraídos de ${toolResult.tool_name}:`, toolData);
                }
              }
            } catch (error) {
              console.error(`❌ [EXTRACTOR] Error parseando result_value de ${toolResult.tool_name}:`, error);
            }
          }
        }
      }
    }

    return { found, data: extracted, toolsUsed };
  }

  /**
   * 🎯 Extraer datos específicos del formato de identificar_cliente de Segurneo
   */
  private extractFromSegurneoToolData(toolName: string, data: any): Partial<ExtractedClientData> | null {
    const extracted: Partial<ExtractedClientData> = {};

    switch (toolName.toLowerCase()) {
      case 'identificar_cliente':
        // Formato real: { clientes: [...], detalle_polizas: [...], vtos_polizas: [...] }
        if (data.clientes && data.clientes.length > 0) {
          const cliente = data.clientes[0]; // Tomar primer cliente
          
          extracted.idCliente = cliente.codigo_cliente;
          extracted.nombre = cliente.nombre_cliente;
          extracted.email = cliente.email_cliente;
          extracted.telefono = cliente.telefono_1 || cliente.telefono_2 || cliente.telefono_3;
          
          // ❌ REMOVIDO: No extraemos números de póliza - la IA determinará si hay una específica
          
          console.log(`✅ [EXTRACTOR] Cliente identificado: ${extracted.nombre} (${extracted.idCliente})`);
        }
        break;

      case 'consultar_poliza':
        // ❌ REMOVIDO: No extraemos números de póliza - la IA determinará si hay una específica
        break;
    }

    return Object.keys(extracted).length > 0 ? extracted : null;
  }

  /**
   * 🛠️ Extraer datos de tool_results legacy (compatibilidad)
   */
  private extractFromLegacyToolResult(toolName: string, toolResult: ToolResult): Partial<ExtractedClientData> | null {
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
        // extracted.numeroPoliza = data.numero_poliza || data.poliza || data.policy_number; // ❌ REMOVIDO
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
        // extracted.numeroPoliza = data.numero_poliza || data.poliza; // ❌ REMOVIDO
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

    // ⚠️ ULTRA CONSERVADOR: Solo extraer números de póliza con contexto muy específico
    // NO usar patrones genéricos que puedan capturar referencias vagas
    const specificPolizaPatterns = [
      /\bla\s+póliza\s+número\s+([a-zA-Z0-9\-]+)\b/i,
      /\bpóliza\s+([a-zA-Z0-9\-]+)\s+específicamente\b/i, 
      /\bmodificar\s+la\s+póliza\s+([a-zA-Z0-9\-]+)\b/i,
      /\bcambiar\s+en\s+la\s+póliza\s+([a-zA-Z0-9\-]+)\b/i
    ];

    // Solo extraer póliza si hay un patrón MUY específico
    for (const pattern of specificPolizaPatterns) {
      const match = fullText.match(pattern);
      if (match && match[1] && match[1].length >= 6) { // Mínimo 6 caracteres para ser válido
        // extracted.numeroPoliza = match[1].trim().toUpperCase(); // ❌ REMOVIDO
        // console.log(`🎯 [EXTRACTOR] Póliza específica identificada: ${extracted.numeroPoliza}`); // ❌ REMOVIDO
        console.log(`🎯 [EXTRACTOR] Póliza detectada pero no extraída - la IA determinará si es específica`);
        break; // Solo tomar la primera muy específica
      }
    }

    // Otros patrones básicos (NO pólizas)
    const basicPatterns = {
      telefono: /teléfono\s*:?\s*([0-9\s\+\-]{9,15})/i,
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
    };

    for (const [key, pattern] of Object.entries(basicPatterns)) {
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