// 🧪 TEST: Detección de Rellamadas con incidencias existentes

// Cargar variables de entorno
require('dotenv').config({ path: '../.env' });

const { callDecisionEngine } = require('./dist/services/callDecisionEngine.js');

// ✅ CASO: Cliente con incidencia abierta de retención que llama de nuevo
const rellamadaTranscripts = [
  {
    sequence: 1,
    speaker: "agent",
    message: "Hola, soy Carlos de Nogal Seguros. ¿En qué puedo ayudarle?",
    segment_start_time: 0,
    segment_end_time: 3,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 2,
    speaker: "user", 
    message: "Hola, soy David Zurita. Me llamaron ayer sobre mi póliza de coche por el tema de la retención, pero no pude hablar. ¿Podemos revisar mi caso?",
    segment_start_time: 9,
    segment_end_time: 15,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 3,
    speaker: "agent",
    message: "Perfecto David, déjame buscarte en el sistema...",
    segment_start_time: 20,
    segment_end_time: 23,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 4,
    speaker: "agent",
    message: "[Tool Result: identificar_cliente]",
    segment_start_time: 20,
    segment_end_time: 23,
    tool_calls: [],
    tool_results: [
      {
        type: "webhook",
        is_error: false,
        tool_name: "identificar_cliente",
        request_id: "identificar_cliente_123",
        result_value: JSON.stringify({
          status: "success",
          message: "Cliente encontrado exitosamente",
          data: {
            clientes: [{
              codigo_cliente: "125296F00",
              email_cliente: "raquelbecerra1978@gmail.com",
              nif_cliente: "52108149Q",
              nombre_cliente: "DAVID ZURITA JIMENEZ",
              telefono_1: "647929978"
            }],
            detalle_polizas: [{
              codigo_cliente: "125296F00",
              matricula: "6896HJW",
              modelo: "Serie 3",
              poliza: "AU0420245310016",
              ramo: "Coche"
            }],
            // 🎯 INCIDENCIA ABIERTA - esto debería detectar rellamada
            incidencias: [{
              codigo_cliente: "125296F00",
              codigo_incidencia: "NG3291093",
              fecha_creacion_incidencia: "05.06.25",
              hora_creacion_incidencia: "09.58.45 am",
              motivo_de_incidencia: "Retención de Cliente Cartera Llamada",
              poliza: "AU0420245310016",
              ramo: "Coche",
              tipo_de_incidencia: "Retención de Cliente Cartera",
              via_recepcion: "Email - Cliente"
            }]
          }
        }),
        tool_latency_secs: 2.5,
        tool_has_been_called: true
      }
    ],
    feedback: null
  },
  {
    sequence: 5,
    speaker: "agent",
    message: "Perfecto David, veo que efectivamente tenemos una gestión abierta de retención sobre su póliza de coche. ¿Quiere continuar con esa gestión?",
    segment_start_time: 30,
    segment_end_time: 35,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 6,
    speaker: "user",
    message: "Sí, exactamente. Me habían dicho que iban a revisar las condiciones para que no cancele la póliza.",
    segment_start_time: 40,
    segment_end_time: 45,
    tool_calls: [],
    tool_results: [],
    feedback: null
  }
];

async function testRellamadaDetection() {
  console.log('🧪 [TEST] Probando detección de RELLAMADAS con incidencias existentes...\n');
  
  try {
    const decision = await callDecisionEngine.analyzeCall(
      rellamadaTranscripts, 
      'conv_rellamada_test_123'
    );
    
    console.log('✅ [TEST] Análisis completado!\n');
    console.log('📋 [TEST] RESULTADO:');
    console.log('================================================================================');
    console.log(JSON.stringify(decision, null, 2));
    console.log('================================================================================\n');
    
    // ✅ VALIDACIONES ESPECÍFICAS PARA RELLAMADAS
    console.log('🔍 [TEST] Validaciones para RELLAMADAS:\n');
    
    const isFollowUp = decision.incidentAnalysis?.followUpInfo?.isFollowUp;
    const relatedTicketId = decision.incidentAnalysis?.followUpInfo?.relatedTicketId;
    const clientType = decision.clientInfo?.clientType;
    const clientId = decision.clientInfo?.existingClientInfo?.clientId;
    const createNewTicket = decision.incidentAnalysis?.followUpInfo?.createNewTicket;
    
    console.log(`Es rellamada: ${isFollowUp} (esperado: true)`);
    console.log(`Ticket relacionado: ${relatedTicketId} (esperado: NG3291093)`);
    console.log(`Cliente tipo: ${clientType} (esperado: existing)`);
    console.log(`Cliente ID: ${clientId} (esperado: 125296F00)`);
    console.log(`Crear nuevo ticket: ${createNewTicket} (esperado: false - solo seguimiento)`);
    
    // Validar detección correcta
    const successRellamada = 
      isFollowUp === true &&
      relatedTicketId === 'NG3291093' &&
      clientType === 'existing' &&
      clientId === '125296F00';
    
    console.log('\n================================================================================');
    if (successRellamada) {
      console.log('🎉 [TEST] ¡ÉXITO! Rellamada detectada correctamente');
      console.log('✅ Incidencia existente encontrada en tool_results');
      console.log('✅ Cliente menciona "retención" → coincide con incidencia abierta');
      console.log('✅ Relaciona correctamente con ticket NG3291093');
      console.log('✅ Cliente existente identificado correctamente');
      
      if (createNewTicket === false) {
        console.log('✅ Correctamente identificado como SOLO seguimiento');
      } else {
        console.log('⚠️ Debería ser solo seguimiento, no crear ticket nuevo');
      }
    } else {
      console.log('❌ [TEST] Falló la detección de rellamada');
      console.log('   Revisar lógica de detección de incidencias en tool_results');
    }
    console.log('================================================================================');
    
  } catch (error) {
    console.error('❌ [TEST] Error en el test:', error);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar test
testRellamadaDetection(); 