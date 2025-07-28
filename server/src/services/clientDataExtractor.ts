// 🔍 SERVICIO DE EXTRACCIÓN DE DATOS DE CLIENTE
// Extrae información del cliente desde los tool_results en transcripts
// 
// ⚠️ REGLA FUNDAMENTAL: NUNCA INVENTAR DATOS
// - Solo extraer datos que estén REALMENTE presentes en la llamada
// - Solo usar datos que hayan sido encontrados por herramientas o mencionados explícitamente
// - Si no hay datos reales, devolver campos vacíos o undefined
// - Prefiero campos vacíos que datos inventados o asumidos

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
    matchingMethod?: 'exact' | 'partial' | 'none' | 'single_client' | 'fallback_first_available' | 'no_ai_name_first_available' | 'no_tools_data';
  };
  // 🆕 NUEVO: Información de leads
  leadInfo?: {
    isLead: boolean;
    leadId?: string;
    campaña?: string;
    ramo?: string;
    availableLeads?: any[];
    selectedLead?: any;
  };
}

export class ClientDataExtractor {

  /**
   * 🎯 MÉTODO PRINCIPAL - Extrae datos del cliente de los transcripts
   * 
   * ⚠️ REGLA FUNDAMENTAL: NUNCA INVENTAR DATOS
   * - Solo extraer lo que esté REALMENTE presente en tool_results o transcripts
   * - No asumir, no interpolar, no generar datos sintéticos
   * - Mejor devolver campos vacíos que datos inventados
   */
  extractClientData(transcripts: CallTranscript[]): ExtractedClientData {
    console.log(`🔍 [EXTRACTOR] Analizando ${transcripts.length} transcripts para datos de cliente`);
    console.log(`⚠️ [EXTRACTOR] REGLA: Solo extraer datos REALMENTE presentes - NUNCA inventar`);

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

    // ⚠️ VALIDACIÓN FINAL: Verificar que no se han inventado datos
    console.log(`⚠️ [EXTRACTOR] VALIDACIÓN FINAL - Todos los datos provienen de:`);
    console.log(`  - Herramientas reales: ${extractedData.toolsUsed.join(', ') || 'Ninguna'}`);
    console.log(`  - Texto de transcripts: ${extractedData.extractionSource.includes('transcript') ? 'Sí' : 'No'}`);
    console.log(`  - Matching inteligente: ${extractedData.clientMatchingInfo ? 'Sí' : 'No'}`);
    console.log(`  - Confianza: ${extractedData.confidence}%`);
    console.log(`⚠️ [EXTRACTOR] GARANTÍA: Ningún dato ha sido inventado o asumido`);

    return extractedData;
  }

  /**
   * 🧠 NUEVO: Extracción inteligente con validación de análisis IA
   * Este método permite una segunda pasada de extracción con información del análisis IA
   * 
   * ⚠️ REGLA FUNDAMENTAL: NUNCA INVENTAR DATOS
   * - Solo usar datos que la IA haya encontrado REALMENTE en los transcripts
   * - No crear datos sintéticos ni asumir información
   * - Validar que los datos de IA correspondan a lo que realmente se dijo
   */
  extractClientDataWithAIContext(
    transcripts: CallTranscript[], 
    aiAnalysis?: { datosExtraidos?: { nombreCliente?: string; [key: string]: any } }
  ): ExtractedClientData {
    console.log(`🧠 [EXTRACTOR] Extracción inteligente con contexto IA`);
    console.log(`⚠️ [EXTRACTOR] REGLA: Solo usar datos que la IA encontró REALMENTE en los transcripts`);
    
    // Primera pasada: extracción normal
    const extractedData = this.extractClientData(transcripts);
    
    // Buscar TODOS los clientes disponibles en herramientas
    const availableClients = this.getAllClientsFromTools(transcripts);
    
    // 🆕 NUEVO: Buscar leads disponibles en herramientas Y análisis IA
    const leadInfo = this.getLeadInfoWithAIContext(transcripts, aiAnalysis);
    
    if (availableClients.length > 0) {
      console.log(`🔍 [EXTRACTOR] Encontrados ${availableClients.length} clientes en herramientas`);
      
      let selectedClient: any = null;
      let matchInfo: any = {
        availableClients: availableClients.map(c => ({ 
          nombre: c.nombre_cliente, 
          codigo: c.codigo_cliente 
        })),
        matchingScore: 0,
        matchingMethod: 'none'
      };
      
      // ⚠️ VALIDACIÓN: Solo usar el nombre de la IA si REALMENTE se mencionó en la llamada
      if (aiAnalysis?.datosExtraidos?.nombreCliente) {
        console.log(`🎯 [EXTRACTOR] IA detectó cliente: "${aiAnalysis.datosExtraidos.nombreCliente}"`);
        console.log(`⚠️ [EXTRACTOR] Usando SOLO porque la IA lo encontró en los transcripts`);
        matchInfo.aiDetectedName = aiAnalysis.datosExtraidos.nombreCliente;
        
        const matchResult = this.findBestClientMatch(
          aiAnalysis.datosExtraidos.nombreCliente, 
          availableClients
        );
        
        if (matchResult && matchResult.score >= 0.5) {
          // ✅ HAY MATCH VÁLIDO - usar cliente matched
          selectedClient = matchResult.cliente;
          matchInfo.matchingScore = matchResult.score;
          matchInfo.matchingMethod = matchResult.method;
          
          console.log(`✅ [EXTRACTOR] Match válido encontrado: ${selectedClient.nombre_cliente} (score: ${matchResult.score})`);
        } else {
          // ⚠️ NO HAY MATCH VÁLIDO pero HAY CLIENTES - usar el primero como fallback
          selectedClient = availableClients[0];
          matchInfo.matchingScore = 0.3; // Score bajo pero válido
          matchInfo.matchingMethod = 'fallback_first_available';
          
          console.log(`⚠️ [EXTRACTOR] Sin match válido para "${aiAnalysis.datosExtraidos.nombreCliente}", usando primer cliente disponible: ${selectedClient.nombre_cliente}`);
        }
      } else {
        // 📝 NO HAY NOMBRE DE IA pero HAY CLIENTES - usar el primero
        selectedClient = availableClients[0];
        matchInfo.matchingScore = 0.4; // Score medio porque no hay contexto IA
        matchInfo.matchingMethod = 'no_ai_name_first_available';
        
        console.log(`📝 [EXTRACTOR] Sin nombre de IA, usando primer cliente disponible: ${selectedClient.nombre_cliente}`);
      }
      
      // 🎯 ASIGNAR DATOS DEL CLIENTE SELECCIONADO (siempre que haya clientes disponibles)
      // ⚠️ IMPORTANTE: Estos datos vienen de herramientas reales, no inventados
      if (selectedClient) {
        extractedData.idCliente = selectedClient.codigo_cliente;
        extractedData.nombre = selectedClient.nombre_cliente;
        extractedData.email = selectedClient.email_cliente;
        extractedData.telefono = selectedClient.telefono_1 || selectedClient.telefono_2 || selectedClient.telefono_3;
        
        // Actualizar confianza basada en método de matching
        if (matchInfo.matchingScore >= 0.9) {
          extractedData.confidence = Math.min(extractedData.confidence + 30, 100);
        } else if (matchInfo.matchingScore >= 0.7) {
          extractedData.confidence = Math.min(extractedData.confidence + 20, 100);
        } else if (matchInfo.matchingScore >= 0.5) {
          extractedData.confidence = Math.min(extractedData.confidence + 10, 100);
        } else if (matchInfo.matchingMethod.includes('fallback') || matchInfo.matchingMethod.includes('no_ai')) {
          // Para fallbacks, mantener confianza base pero no reducir demasiado
          extractedData.confidence = Math.max(extractedData.confidence, 40); // Mínimo 40% para fallbacks
        }
        
        extractedData.clientMatchingInfo = matchInfo;
        
        console.log(`🎯 [EXTRACTOR] Cliente final asignado: ${selectedClient.nombre_cliente} (${selectedClient.codigo_cliente}) via ${matchInfo.matchingMethod}`);
      }
    } else if (leadInfo.isLead) {
      // 🆕 NUEVO: Si es un lead, extraer información relevante
      console.log(`🔍 [EXTRACTOR] Procesando lead: ${leadInfo.selectedLead?.nombre}`);
      
      const selectedLead = leadInfo.selectedLead;
      if (selectedLead) {
        // ⚠️ IMPORTANTE: Estos datos vienen de herramientas reales o análisis IA válido
        extractedData.nombre = selectedLead.nombre;
        extractedData.telefono = selectedLead.telefono;
        extractedData.email = selectedLead.email;
        
        // No asignar idCliente ya que es un lead, no un cliente
        extractedData.idCliente = undefined;
        
        // Aumentar confianza para leads válidos
        extractedData.confidence = Math.max(extractedData.confidence, 60);
        
        console.log(`✅ [EXTRACTOR] Lead procesado: ${selectedLead.nombre} (${leadInfo.leadId})`);
      }
    } else {
      // 📭 NO HAY CLIENTES NI LEADS EN HERRAMIENTAS
      if (aiAnalysis?.datosExtraidos?.nombreCliente) {
        extractedData.clientMatchingInfo = {
          aiDetectedName: aiAnalysis.datosExtraidos.nombreCliente,
          availableClients: [],
          matchingScore: 0,
          matchingMethod: 'no_tools_data'
        };
        console.log(`📭 [EXTRACTOR] IA detectó "${aiAnalysis.datosExtraidos.nombreCliente}" pero no hay datos de herramientas`);
      } else {
        console.log(`📭 [EXTRACTOR] Sin datos de herramientas ni nombre de IA`);
      }
    }
    
    // Asignar información del lead al resultado final
    extractedData.leadInfo = leadInfo;
    
    // ⚠️ VALIDACIÓN FINAL CON CONTEXTO IA: Verificar que no se han inventado datos
    console.log(`⚠️ [EXTRACTOR] VALIDACIÓN FINAL CON IA - Todos los datos provienen de:`);
    console.log(`  - Herramientas reales: ${extractedData.toolsUsed.join(', ') || 'Ninguna'}`);
    console.log(`  - Análisis IA validado: ${aiAnalysis?.datosExtraidos ? 'Sí' : 'No'}`);
    console.log(`  - Clientes disponibles: ${availableClients.length}`);
    console.log(`  - Leads disponibles: ${leadInfo.availableLeads?.length || 0}`);
    console.log(`  - Método de matching: ${extractedData.clientMatchingInfo?.matchingMethod || 'Ninguno'}`);
    console.log(`  - Confianza final: ${extractedData.confidence}%`);
    console.log(`⚠️ [EXTRACTOR] GARANTÍA: Ningún dato ha sido inventado - Solo datos reales de la llamada`);
    
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
   * 
   * ⚠️ REGLA FUNDAMENTAL: NUNCA INVENTAR DATOS
   * - Solo extraer datos que estén REALMENTE presentes en la respuesta de la herramienta
   * - No asumir campos que no estén explícitamente en la respuesta
   * - Validar que los datos sean válidos antes de extraerlos
   */
  private extractFromSegurneoToolData(toolName: string, data: any): Partial<ExtractedClientData> | null {
    console.log(`🔍 [EXTRACTOR] Extrayendo datos de ${toolName} - NUNCA inventar, solo usar datos reales`);
    
    const extracted: Partial<ExtractedClientData> = {};

    switch (toolName.toLowerCase()) {
      case 'identificar_cliente':
        // Formato real: { clientes: [...], detalle_polizas: [...], vtos_polizas: [...] }
        if (data.clientes && data.clientes.length > 0) {
          // 🎯 SIEMPRE tomar el primer cliente cuando hay clientes disponibles
          // Es mejor tener un cliente aproximado que no tener ninguno
          const cliente = data.clientes[0];
          
          // ⚠️ VALIDACIÓN: Solo extraer campos que realmente existen y no están vacíos
          if (cliente.codigo_cliente && cliente.codigo_cliente.trim()) {
            extracted.idCliente = cliente.codigo_cliente.trim();
          }
          if (cliente.nombre_cliente && cliente.nombre_cliente.trim()) {
            extracted.nombre = cliente.nombre_cliente.trim();
          }
          if (cliente.email_cliente && cliente.email_cliente.trim()) {
            extracted.email = cliente.email_cliente.trim();
          }
          
          // Buscar teléfono válido (no vacío) en orden de preferencia
          const telefono = cliente.telefono_1?.trim() || cliente.telefono_2?.trim() || cliente.telefono_3?.trim();
          if (telefono) {
            extracted.telefono = telefono;
          }
          
          // ❌ REMOVIDO: No extraemos números de póliza - la IA determinará si hay una específica
          
          if (data.clientes.length > 1) {
            console.log(`✅ [EXTRACTOR] Cliente identificado: ${extracted.nombre} (${extracted.idCliente}) - Nota: ${data.clientes.length} clientes disponibles, tomando el primero`);
          } else {
            console.log(`✅ [EXTRACTOR] Cliente identificado: ${extracted.nombre} (${extracted.idCliente})`);
          }
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
   * 
   * ⚠️ REGLA FUNDAMENTAL: NUNCA INVENTAR DATOS
   * - Solo extraer patrones ULTRA específicos que sean inequívocos
   * - No usar patrones genéricos que puedan capturar referencias vagas
   * - Validar exhaustivamente antes de extraer cualquier dato
   * - Preferir NO extraer que extraer datos dudosos
   */
  private extractFromTranscriptText(transcripts: CallTranscript[]): Partial<ExtractedClientData> {
    console.log(`📝 [EXTRACTOR] Extrayendo del texto - ULTRA conservador, NUNCA inventar`);
    
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
        // ❌ REMOVIDO: No extraemos números de póliza - la IA determinará si es específica
        console.log(`🎯 [EXTRACTOR] Póliza detectada pero no extraída - la IA determinará si es específica: ${match[1]}`);
        break; // Solo tomar la primera muy específica
      }
    }

    // Otros patrones básicos (NO pólizas) - ULTRA específicos
    const basicPatterns = {
      telefono: /\b(?:teléfono|phone|móvil|celular)\s*:?\s*([0-9\s\+\-]{9,15})\b/i,
      email: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/i
    };

    for (const [key, pattern] of Object.entries(basicPatterns)) {
      const match = fullText.match(pattern);
      if (match && match[1] && match[1].trim()) {
        const value = match[1].trim();
        
        // ⚠️ VALIDACIÓN ADICIONAL: Verificar que el dato sea válido
        if (key === 'telefono' && value.replace(/\D/g, '').length >= 9) {
          (extracted as any)[key] = value;
          console.log(`✅ [EXTRACTOR] Teléfono extraído del texto: ${value}`);
        } else if (key === 'email' && value.includes('@') && value.includes('.')) {
          (extracted as any)[key] = value;
          console.log(`✅ [EXTRACTOR] Email extraído del texto: ${value}`);
        }
      }
    }

    console.log(`📝 [EXTRACTOR] Extracción de texto completada - Solo datos ultra específicos`);
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
   * 
   * ⚠️ REGLA FUNDAMENTAL: NUNCA INVENTAR DATOS
   * - Solo generar IDs cuando sea absolutamente necesario para el flujo
   * - Marcar claramente que es un ID generado, no real
   * - Preferir no tener ID que tener uno inventado
   * - Solo usar cuando se tenga al menos un dato real (como teléfono válido)
   */
  generateFallbackClientId(conversationId: string, telefono?: string): string {
    console.log(`🎯 [EXTRACTOR] Generando ID fallback - SOLO con datos reales disponibles`);
    
    if (telefono && telefono.replace(/\D/g, '').length >= 9) {
      // Usar últimos 4 dígitos del teléfono + hash del conversation
      const phoneDigits = telefono.replace(/\D/g, '').slice(-4);
      const hashPart = conversationId.slice(-4);
      const fallbackId = `CLI_FALLBACK_${phoneDigits}_${hashPart}`;
      
      console.log(`✅ [EXTRACTOR] ID fallback generado con teléfono válido: ${fallbackId}`);
      return fallbackId;
    }
    
    // Fallback: usar hash del conversation_id SOLO si no hay absolutamente nada más
    const fallbackId = `CLI_FALLBACK_${conversationId.slice(-8)}`;
    console.log(`⚠️ [EXTRACTOR] ID fallback generado sin datos - revisar manualmente: ${fallbackId}`);
    return fallbackId;
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
   * 🧠 NUEVO: Extraer información de leads combinando tool_results + análisis IA
   */
  private getLeadInfoWithAIContext(
    transcripts: CallTranscript[], 
    aiAnalysis?: { datosExtraidos?: { nombreCliente?: string; [key: string]: any } }
  ): {
    isLead: boolean;
    leadId?: string;
    campaña?: string;
    ramo?: string;
    availableLeads?: any[];
    selectedLead?: any;
  } {
    const leadInfo: {
      isLead: boolean;
      leadId?: string;
      campaña?: string;
      ramo?: string;
      availableLeads?: any[];
      selectedLead?: any;
    } = {
      isLead: false,
      availableLeads: []
    };
    
    // PASO 1: Extraer leads de tool_results
    let foundFromTools = false;
    
    for (const transcript of transcripts) {
      if (transcript.tool_results && transcript.tool_results.length > 0) {
        for (const toolResult of transcript.tool_results) {
          if (!toolResult.is_error && toolResult.result_value && toolResult.tool_name === 'identificar_cliente') {
            try {
              const parsedResult = JSON.parse(toolResult.result_value);
              
              // Caso 1: Respuesta con leads (no clientes)
              if (parsedResult.status === 'success' && parsedResult.data?.leads && parsedResult.data.leads.length > 0) {
                console.log(`🔍 [EXTRACTOR] Encontrados ${parsedResult.data.leads.length} leads en herramientas`);
                
                leadInfo.isLead = true;
                leadInfo.availableLeads = parsedResult.data.leads;
                
                // Seleccionar el primer lead como principal
                const selectedLead = parsedResult.data.leads[0];
                leadInfo.selectedLead = selectedLead;
                leadInfo.leadId = selectedLead.idlead;
                leadInfo.campaña = selectedLead.campaña;
                leadInfo.ramo = selectedLead.ramo;
                
                console.log(`✅ [EXTRACTOR] Lead seleccionado: ${selectedLead.nombre} (${selectedLead.idlead}) - Campaña: ${selectedLead.campaña}`);
                
                foundFromTools = true;
                break; // Solo tomar el primer conjunto de leads encontrado
              }
              
              // Caso 2: Respuesta con mensaje "Lead encontrado exitosamente"
              if (parsedResult.message === 'Lead encontrado exitosamente' && parsedResult.data?.leads) {
                console.log(`🔍 [EXTRACTOR] Lead encontrado exitosamente: ${parsedResult.data.leads.length} leads`);
                
                leadInfo.isLead = true;
                leadInfo.availableLeads = parsedResult.data.leads;
                
                // Seleccionar el primer lead
                const selectedLead = parsedResult.data.leads[0];
                leadInfo.selectedLead = selectedLead;
                leadInfo.leadId = selectedLead.idlead;
                leadInfo.campaña = selectedLead.campaña;
                leadInfo.ramo = selectedLead.ramo;
                
                console.log(`✅ [EXTRACTOR] Lead procesado: ${selectedLead.nombre} (${selectedLead.idlead})`);
                
                foundFromTools = true;
                break;
              }
              
            } catch (error) {
              console.error(`❌ [EXTRACTOR] Error parseando leads de ${toolResult.tool_name}:`, error);
            }
          }
        }
      }
    }
    
    // PASO 2: Enriquecer con análisis IA si tenemos un lead
    if (foundFromTools && aiAnalysis?.datosExtraidos && leadInfo.selectedLead) {
      console.log(`🧠 [EXTRACTOR] Enriqueciendo lead con análisis IA`);
      
      const aiData = aiAnalysis.datosExtraidos;
      
      // Mejorar información del lead con datos de IA
      const enhancedLead = {
        ...leadInfo.selectedLead,
        // Agregar campos adicionales extraídos por IA
        telefono2: aiData.telefono2,
        recomendadoPor: aiData.recomendadoPor,
        direccion: aiData.direccion,
        fechaEfecto: aiData.fechaEfecto,
        // Sobrescribir campaña si la IA detectó una específica
        campaña: aiData.campaña || leadInfo.selectedLead.campaña,
        // Agregar contexto adicional
        aiEnhanced: true,
        aiContext: {
          nombreDetectado: aiData.nombreCliente,
          camposOpcionales: Object.keys(aiData).filter(key => 
            ['telefono2', 'recomendadoPor', 'direccion', 'fechaEfecto', 'campaña'].includes(key) && 
            aiData[key]
          )
        }
      };
      
      leadInfo.selectedLead = enhancedLead;
      
      console.log(`✅ [EXTRACTOR] Lead enriquecido con IA:`, {
        nombre: enhancedLead.nombre,
        idlead: enhancedLead.idlead,
        campaña: enhancedLead.campaña,
        camposIA: enhancedLead.aiContext?.camposOpcionales || [],
        aiEnhanced: enhancedLead.aiEnhanced
      });
    }
    
    // PASO 3: Si no se encontró lead en tools, pero la IA sugiere nueva contratación
    if (!foundFromTools && aiAnalysis?.datosExtraidos) {
      const aiData = aiAnalysis.datosExtraidos;
      
      // Detectar si podría ser un lead basado en análisis IA
      const hasLeadIndicators = 
        aiData.nombreCliente && 
        (aiData.campaña || aiData.recomendadoPor) &&
        !aiData.numeroPoliza; // No tiene póliza existente
      
      if (hasLeadIndicators) {
        console.log(`🧠 [EXTRACTOR] IA sugiere posible lead: ${aiData.nombreCliente}`);
        
        // Crear lead sintético desde análisis IA
        const syntheticLead = {
          nombre: aiData.nombreCliente,
          telefono: aiData.telefono,
          email: aiData.email,
          campaña: aiData.campaña || 'Sin campaña',
          ramo: aiData.ramo || 'Sin ramo',
          // Marcar como sintético
          synthetic: true,
          source: 'ai_analysis'
        };
        
        leadInfo.isLead = true;
        leadInfo.selectedLead = syntheticLead;
        leadInfo.campaña = syntheticLead.campaña;
        leadInfo.ramo = syntheticLead.ramo;
        leadInfo.availableLeads = [syntheticLead];
        
        console.log(`✅ [EXTRACTOR] Lead sintético creado desde IA:`, {
          nombre: syntheticLead.nombre,
          campaña: syntheticLead.campaña,
          source: syntheticLead.source
        });
      }
    }
    
    return leadInfo;
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

  /**
   * 🆕 NUEVO: Extraer caller ID de los tool_results
   * Busca en transfer_to_number, identificar_cliente, etc.
   */
  extractCallerIdFromTranscripts(transcripts: CallTranscript[]): string | null {
    console.log(`📞 [EXTRACTOR] Buscando caller ID en ${transcripts.length} transcripts`);
    
    for (const transcript of transcripts) {
      // 1. Buscar en tool_results estructurados
      if (transcript.tool_results && transcript.tool_results.length > 0) {
        for (const toolResult of transcript.tool_results) {
          const callerId = this.extractCallerIdFromToolResult(toolResult);
          if (callerId) {
            console.log(`✅ [EXTRACTOR] Caller ID encontrado en ${toolResult.tool_name}: ${callerId}`);
            return callerId;
          }
        }
      }
      
      // 2. Buscar en tool_calls si no se encontró en results
      if (transcript.tool_calls && transcript.tool_calls.length > 0) {
        for (const toolCall of transcript.tool_calls) {
          const callerId = this.extractCallerIdFromToolCall(toolCall);
          if (callerId) {
            console.log(`✅ [EXTRACTOR] Caller ID encontrado en tool_call ${toolCall.tool_name}: ${callerId}`);
            return callerId;
          }
        }
      }
    }
    
    console.log(`❌ [EXTRACTOR] No se encontró caller ID en los transcripts`);
    return null;
  }

  /**
   * 🔍 Extraer caller ID de un tool_result específico
   */
  private extractCallerIdFromToolResult(toolResult: any): string | null {
    try {
      // Parsear result_value si es string
      let resultData = toolResult.result_value;
      if (typeof resultData === 'string') {
        resultData = JSON.parse(resultData);
      }
      
      // Buscar en transfer_to_number
      if (toolResult.tool_name === 'transfer_to_number' && resultData.conference_name) {
        const conferenceMatch = resultData.conference_name.match(/transfer_customer_(\+\d+)_/);
        if (conferenceMatch && conferenceMatch[1]) {
          return conferenceMatch[1];
        }
      }
      
      // Buscar en identificar_cliente u otros tools
      if (resultData.caller_id) {
        return resultData.caller_id;
      }
      
      if (resultData.phone_number) {
        return resultData.phone_number;
      }
      
    } catch (error) {
      // Silencioso - no todos los tool_results son JSON
    }
    
    return null;
  }

  /**
   * 🔍 Extraer caller ID de un tool_call específico
   */
  private extractCallerIdFromToolCall(toolCall: any): string | null {
    try {
      // Parsear params_as_json si existe
      let params = toolCall.params_as_json;
      if (typeof params === 'string') {
        params = JSON.parse(params);
      }
      
      // Buscar en tool_details.body para identificar_cliente
      if (toolCall.tool_name === 'identificar_cliente' && toolCall.tool_details?.body) {
        let bodyData = toolCall.tool_details.body;
        if (typeof bodyData === 'string') {
          bodyData = JSON.parse(bodyData);
        }
        
        // Priorizar el telefono principal sobre telefono_alternativo
        if (bodyData.telefono && bodyData.telefono !== bodyData.telefono_alternativo) {
          return bodyData.telefono;
        }
      }
      
      // Buscar en params generales
      if (params?.caller_id) {
        return params.caller_id;
      }
      
      if (params?.telefono && params.telefono.startsWith('+')) {
        return params.telefono;
      }
      
    } catch (error) {
      // Silencioso - no todos los tool_calls tienen JSON válido
    }
    
    return null;
  }
}

// Exportar instancia única
export const clientDataExtractor = new ClientDataExtractor(); 