// 🧪 TEST: Cliente Completamente Nuevo (no existe en sistema)

require('dotenv').config({ path: '../.env' });
const { callDecisionEngine } = require('./dist/services/callDecisionEngine.js');

// 🎯 CASO: Cliente nuevo quiere contratar seguro de hogar
const clienteNuevoCase = [
  {
    sequence: 2,
    speaker: "user", 
    message: "Hola, me llamo Pedro Sánchez. Tengo el DNI 12345678Z. Me han recomendado vuestros seguros y me gustaría contratar un seguro de hogar.",
    segment_start_time: 9,
    segment_end_time: 15,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 3,
    speaker: "agent",
    message: "Perfecto Pedro, déjame buscarte en nuestro sistema...",
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
        request_id: "identificar_cliente_nuevo",
        result_value: JSON.stringify({
          status: "success",
          message: "No se encontraron resultados", // 🎯 CLIENTE NO EXISTE
          data: {
            clientes: [], // Array vacío = no existe
            leads: [],    // Array vacío = no es lead tampoco
            detalle_polizas: [],
            incidencias: [],
            tipo_busqueda: "D",
            valor_busqueda: "12345678Z"
          }
        }),
        tool_latency_secs: 1.5,
        tool_has_been_called: true
      }
    ],
    feedback: null
  },
  {
    sequence: 5,
    speaker: "agent",
    message: "Veo que eres un cliente nuevo Pedro. Perfecto, vamos a darte de alta y a tramitar tu seguro de hogar.",
    segment_start_time: 30,
    segment_end_time: 35,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 6,
    speaker: "user",
    message: "Perfecto. Mi teléfono es 666555444 y vivo en Madrid.",
    segment_start_time: 40,
    segment_end_time: 45,
    tool_calls: [],
    tool_results: [],
    feedback: null
  }
];

async function testClienteNuevo() {
  console.log('🧪 [TEST] Probando CLIENTE COMPLETAMENTE NUEVO...\n');
  
  try {
    const decision = await callDecisionEngine.analyzeCall(
      clienteNuevoCase,
      'conv_cliente_nuevo_123'
    );
    
    console.log('✅ [TEST] Análisis completado!\n');
    console.log('📋 [TEST] RESULTADO:');
    console.log('================================================================================');
    console.log(JSON.stringify(decision, null, 2));
    console.log('================================================================================\n');
    
    // ✅ VALIDACIONES ESPECÍFICAS PARA CLIENTE NUEVO
    console.log('🔍 [TEST] Validaciones para CLIENTE NUEVO:\n');
    
    const clientType = decision.clientInfo?.clientType;
    const shouldCreateClient = decision.decisions?.clientDecision?.shouldCreateClient;
    const useExistingClient = decision.decisions?.clientDecision?.useExistingClient;
    const incidentType = decision.incidentAnalysis?.primaryIncident?.type;
    const ramo = decision.incidentAnalysis?.primaryIncident?.ramo;
    const nombreCompleto = decision.clientInfo?.extractedData?.nombreCompleto;
    const telefono = decision.clientInfo?.extractedData?.telefono;
    const createNewTicket = decision.incidentAnalysis?.followUpInfo?.createNewTicket;
    const isFollowUp = decision.incidentAnalysis?.followUpInfo?.isFollowUp;
    
    console.log(`Cliente tipo: ${clientType} (esperado: new)`);
    console.log(`Crear cliente: ${shouldCreateClient} (esperado: true)`);
    console.log(`Usar existente: ${useExistingClient} (esperado: false)`);
    console.log(`Incidencia: ${incidentType} (esperado: Nueva contratación de seguros)`);
    console.log(`Ramo: ${ramo} (esperado: HOGAR)`);
    console.log(`Nombre: ${nombreCompleto} (esperado: incluir Pedro Sánchez)`);
    console.log(`Teléfono: ${telefono} (esperado: 666555444)`);
    console.log(`Crear ticket: ${createNewTicket} (esperado: true)`);
    console.log(`Es rellamada: ${isFollowUp} (esperado: false)`);
    
    // Validar lógica de cliente nuevo
    const successClienteNuevo = 
      clientType === 'new' &&
      shouldCreateClient === true &&
      useExistingClient === false &&
      incidentType === 'Nueva contratación de seguros' &&
      ramo === 'HOGAR' &&
      nombreCompleto?.includes('PEDRO') &&
      telefono === '666555444' &&
      createNewTicket === true &&
      isFollowUp === false;
    
    console.log('\n================================================================================');
    if (successClienteNuevo) {
      console.log('🎉 [TEST] ¡ÉXITO! Cliente nuevo detectado y procesado correctamente');
      console.log('✅ Reconoció que no existe en tool_results (arrays vacíos)');
      console.log('✅ Marcó como clientType: "new"');
      console.log('✅ Decidió crear cliente nuevo');
      console.log('✅ Extrajo datos básicos (nombre, teléfono)');
      console.log('✅ Identificó nueva contratación HOGAR');
      console.log('✅ Planificó flujo correcto: crear cliente → crear ticket');
    } else {
      console.log('❌ [TEST] Falló la detección de cliente nuevo');
      console.log('   Revisar lógica de detección cuando arrays están vacíos');
    }
    console.log('================================================================================');
    
  } catch (error) {
    console.error('❌ [TEST] Error en el test:', error);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar test
testClienteNuevo(); 