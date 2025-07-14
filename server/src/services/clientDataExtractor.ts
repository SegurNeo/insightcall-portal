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
  // 🧠 Nuevo: información de matching inteligente
  clientMatchingInfo?: {
    aiDetectedName?: string;
    availableClients?: any[];
    matchingScore?: number;
    matchingMethod?: 'exact' | 'partial' | 'none' | 'single_client';
  };
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
      toolsUsed: extractedData.toolsUsed,
      matchingInfo: extractedData.clientMatchingInfo
    });

    return extractedData;
  }

  /**
   * 🧠 NUEVO: Extracción inteligente con validación de análisis IA
   * Este método permite una segunda pasada de extracción con información del análisis IA
   */
  extractClientDataWithAIContext(
    transcripts: CallTranscript[], 
    aiAnalysis?: { datosExtraidos?: { nombreCliente?: string } }
  ): ExtractedClientData {
    console.log(`🧠 [EXTRACTOR] Extracción inteligente con contexto IA`);
    
    // Primera pasada: extracción normal
    const extractedData = this.extractClientData(transcripts);
    
    // Si hay análisis IA con nombre del cliente, validar matching
    if (aiAnalysis?.datosExtraidos?.nombreCliente) {
      console.log(`🎯 [EXTRACTOR] IA detectó cliente: "${aiAnalysis.datosExtraidos.nombreCliente}"`);
      
      // Buscar clientes en los tool_results para hacer matching
      const availableClients = this.getAllClientsFromTools(transcripts);
      
      if (availableClients.length > 0) {
        console.log(`🔍 [EXTRACTOR] Encontrados ${availableClients.length} clientes en herramientas, haciendo matching...`);
        
        const matchResult = this.findBestClientMatch(
          aiAnalysis.datosExtraidos.nombreCliente, 
          availableClients
        );
        
        // Actualizar datos extraídos con el mejor match
        if (matchResult) {
          extractedData.idCliente = matchResult.cliente.codigo_cliente;
          extractedData.nombre = matchResult.cliente.nombre_cliente;
          extractedData.email = matchResult.cliente.email_cliente;
          extractedData.telefono = matchResult.cliente.telefono_1 || matchResult.cliente.telefono_2 || matchResult.cliente.telefono_3;
          
          // Información de matching para debugging
          extractedData.clientMatchingInfo = {
            aiDetectedName: aiAnalysis.datosExtraidos.nombreCliente,
            availableClients: availableClients.map(c => ({ 
              nombre: c.nombre_cliente, 
              codigo: c.codigo_cliente 
            })),
            matchingScore: matchResult.score,
            matchingMethod: matchResult.method
          };
          
          // Actualizar confianza basada en matching
          if (matchResult.score >= 0.9) {
            extractedData.confidence = Math.min(extractedData.confidence + 30, 100);
          } else if (matchResult.score >= 0.7) {
            extractedData.confidence = Math.min(extractedData.confidence + 20, 100);
          } else if (matchResult.score >= 0.5) {
            extractedData.confidence = Math.min(extractedData.confidence + 10, 100);
          }
          
          console.log(`✅ [EXTRACTOR] Cliente validado por IA: ${matchResult.cliente.nombre_cliente} (score: ${matchResult.score}, método: ${matchResult.method})`);
        } else {
          console.log(`⚠️ [EXTRACTOR] No se encontró match válido para "${aiAnalysis.datosExtraidos.nombreCliente}"`);
          
          extractedData.clientMatchingInfo = {
            aiDetectedName: aiAnalysis.datosExtraidos.nombreCliente,
            availableClients: availableClients.map(c => ({ 
              nombre: c.nombre_cliente, 
              codigo: c.codigo_cliente 
            })),
            matchingScore: 0,
            matchingMethod: 'none'
          };
          
          // Si no hay match, reducir confianza si habíamos tomado un cliente automáticamente
          if (extractedData.idCliente && extractedData.extractionSource === 'tools') {
            extractedData.confidence = Math.max(extractedData.confidence - 20, 0);
            console.log(`⚠️ [EXTRACTOR] Reducida confianza por mismatch entre IA y herramientas`);
          }
        }
      } else if (extractedData.idCliente) {
        // Solo hay un cliente de las herramientas, marcar como match único
        extractedData.clientMatchingInfo = {
          aiDetectedName: aiAnalysis.datosExtraidos.nombreCliente,
          availableClients: [],
          matchingScore: 0.5, // Score medio porque no podemos comparar
          matchingMethod: 'single_client'
        };
        console.log(`ℹ️ [EXTRACTOR] Solo un cliente disponible, no se puede validar matching`);
      }
    }
    
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

  /**
   * 🔍 Extraer todos los clientes encontrados en tool_results
   */
  private getAllClientsFromTools(transcripts: CallTranscript[]): any[] {
    const allClients: any[] = [];
    
    for (const transcript of transcripts) {
      if (transcript.tool_results && transcript.tool_results.length > 0) {
        for (const toolResult of transcript.tool_results) {
          if (!toolResult.is_error && toolResult.result_value && toolResult.tool_name === 'identificar_cliente') {
            try {
              const parsedResult = JSON.parse(toolResult.result_value);
              if (parsedResult.status === 'success' && parsedResult.data?.clientes) {
                allClients.push(...parsedResult.data.clientes);
              }
            } catch (error) {
              console.error(`❌ [EXTRACTOR] Error parseando clientes de ${toolResult.tool_name}:`, error);
            }
          }
        }
      }
    }
    
    return allClients;
  }

  /**
   * 🎯 Encontrar el mejor match entre el nombre de IA y los clientes disponibles
   */
  private findBestClientMatch(aiDetectedName: string, availableClients: any[]): {
    cliente: any;
    score: number;
    method: 'exact' | 'partial';
  } | null {
    if (!aiDetectedName || availableClients.length === 0) {
      return null;
    }
    
    const normalizedAIName = this.normalizeName(aiDetectedName);
    let bestMatch: { cliente: any; score: number; method: 'exact' | 'partial' } | null = null;
    
    for (const cliente of availableClients) {
      const clientName = this.normalizeName(cliente.nombre_cliente);
      const score = this.calculateNameSimilarity(normalizedAIName, clientName);
      
      if (score >= 0.9) {
        // Match exacto o muy alto
        return { cliente, score, method: 'exact' };
      } else if (score >= 0.5 && (!bestMatch || score > bestMatch.score)) {
        // Match parcial mejor que el anterior
        bestMatch = { cliente, score, method: 'partial' };
      }
    }
    
    // Solo devolver matches parciales si el score es >= 0.5
    return bestMatch && bestMatch.score >= 0.5 ? bestMatch : null;
  }

  /**
   * 🔤 Normalizar nombre para comparación
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z\s]/g, '') // Solo letras y espacios
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 📊 Calcular similitud entre nombres
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    // Exact match
    if (name1 === name2) {
      return 1.0;
    }
    
    // Split por palabras y buscar coincidencias
    const words1 = name1.split(' ').filter(w => w.length > 1);
    const words2 = name2.split(' ').filter(w => w.length > 1);
    
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }
    
    let matches = 0;
    let totalWords = Math.max(words1.length, words2.length);
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matches++;
          break;
        } else if (word1.length > 3 && word2.length > 3) {
          // Para palabras largas, permitir similitud de Levenshtein
          const similarity = this.levenshteinSimilarity(word1, word2);
          if (similarity >= 0.8) {
            matches += similarity;
            break;
          }
        }
      }
    }
    
    return matches / totalWords;
  }

  /**
   * 📏 Calcular similitud de Levenshtein
   */
  private levenshteinSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    
    const distance = this.levenshteinDistance(str1, str2);
    return (maxLength - distance) / maxLength;
  }

  /**
   * 📐 Distancia de Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Exportar instancia única
export const clientDataExtractor = new ClientDataExtractor(); 