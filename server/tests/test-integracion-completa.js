// 🧪 TEST: INTEGRACIÓN COMPLETA - DecisionEngine + Executor
// Flujo completo: Transcripción → Decisión → Ejecución → Resultado

require('dotenv').config({ path: '../.env' });
const { callDecisionEngine } = require('./dist/services/callDecisionEngine.js');
const { callExecutor } = require('./dist/services/callExecutor.js');

// 🎯 CASO: Cliente nuevo quiere seguro de hogar (flujo completo)
const clienteNuevoCompleto = [
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
    message: "Hola, me llamo Ana López. Mi DNI es 12345678A. Quiero contratar un seguro de hogar para mi casa en Madrid.",
    segment_start_time: 9,
    segment_end_time: 15,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 3,
    speaker: "agent",
    message: "Perfecto Ana, déjame buscarte en nuestro sistema...",
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
        request_id: "identificar_cliente_test",
        result_value: JSON.stringify({
          status: "success",
          message: "No se encontraron resultados", // 🎯 CLIENTE NUEVO
          data: {
            clientes: [], // Array vacío = cliente nuevo
            leads: [],    
            detalle_polizas: [],
            incidencias: [],
            tipo_busqueda: "D",
            valor_busqueda: "12345678A"
          }
        }),
        tool_latency_secs: 1.8,
        tool_has_been_called: true
      }
    ],
    feedback: null
  },
  {
    sequence: 5,
    speaker: "agent",
    message: "Ana, veo que eres cliente nueva. Perfecto, voy a darte de alta y tramitar tu seguro de hogar.",
    segment_start_time: 30,
    segment_end_time: 35,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 6,
    speaker: "user",
    message: "Perfecto. Mi teléfono es 655444333 y mi email es ana.lopez@email.com",
    segment_start_time: 40,
    segment_end_time: 45,
    tool_calls: [],
    tool_results: [],
    feedback: null
  }
];

// 🎯 MOCKEAR CALL OBJECT (simular como viene de la BD)
const mockCall = {
  id: "test-call-id-12345",
  segurneo_call_id: "segurneo_test_123",
  conversation_id: "conv_test_integracion_completa",
  agent_id: "agent_test",
  caller_id: "655444333",
  start_time: "2025-07-28T18:00:00Z",
  end_time: "2025-07-28T18:03:00Z", 
  duration_seconds: 180,
  status: "completed",
  call_successful: true,
  termination_reason: "completed_successfully",
  cost_cents: 4500,
  agent_messages: 4,
  user_messages: 3,
  total_messages: 7,
  transcript_summary: "Ana López solicita contratar seguro de hogar siendo cliente nueva",
  transcripts: clienteNuevoCompleto,
  audio_download_url: "https://test-audio.com/test.mp3",
  audio_file_size: 1024000,
  fichero_llamada: "https://test-audio.com/test.mp3",
  analysis_completed: false,
  ai_analysis: null,
  tickets_created: 0,
  ticket_ids: [],
  received_at: "2025-07-28T18:00:00Z",
  created_at: "2025-07-28T18:00:00Z",
  updated_at: "2025-07-28T18:00:00Z"
};

async function testIntegracionCompleta() {
  console.log('🧪 [TEST] INTEGRACIÓN COMPLETA - Decision Engine + Executor...\n');
  
  try {
    // 🎯 PASO 1: Analizar llamada con DecisionEngine
    console.log('🧠 [PASO 1] Analizando llamada con CallDecisionEngine...');
    const decision = await callDecisionEngine.analyzeCall(
      clienteNuevoCompleto,
      'conv_test_integracion_completa'
    );
    
    console.log('✅ [PASO 1] Decisión generada:', {
      clientType: decision.clientInfo.clientType,
      shouldCreateClient: decision.decisions.clientDecision.shouldCreateClient,
      shouldCreateTickets: decision.decisions.ticketDecision.shouldCreateTickets,
      incidentType: decision.incidentAnalysis.primaryIncident.type,
      confidence: decision.metadata.confidence
    });

    // 🚀 PASO 2: Ejecutar decisión con CallExecutor
    console.log('\n🚀 [PASO 2] Ejecutando decisión con CallExecutor...');
    
    // ⚠️ NOTA: En un test real, esto llamaría a los servicios de Nogal
    // Para el test, solo verificamos que la lógica funciona
    console.log('⚠️ [INFO] Test en modo SIMULACIÓN - no se envían datos reales a Nogal');
    
    const executionResult = await callExecutor.executeDecision(
      decision,
      mockCall,
      clienteNuevoCompleto
    );
    
    console.log('✅ [PASO 2] Ejecución completada:', {
      success: executionResult.success,
      message: executionResult.message,
      summary: executionResult.summary,
      clientCreated: !!executionResult.actions.clientCreated?.success,
      ticketsCreated: executionResult.actions.ticketsCreated.length,
      followUpCreated: !!executionResult.actions.followUpCreated?.success
    });

    // 📊 PASO 3: Validar flujo completo
    console.log('\n📊 [PASO 3] Validando flujo completo...');
    
    const validations = [
      {
        name: '🧠 Análisis LLM correcto',
        check: decision.clientInfo.clientType === 'new' && 
               decision.decisions.clientDecision.shouldCreateClient === true,
        expected: 'Cliente nuevo detectado y marcado para creación',
        actual: `Tipo: ${decision.clientInfo.clientType}, Crear: ${decision.decisions.clientDecision.shouldCreateClient}`
      },
      {
        name: '🎫 Ticket planificado',
        check: decision.decisions.ticketDecision.shouldCreateTickets === true &&
               decision.decisions.ticketDecision.ticketCount === 1,
        expected: 'Un ticket de nueva contratación',
        actual: `Crear tickets: ${decision.decisions.ticketDecision.shouldCreateTickets}, Count: ${decision.decisions.ticketDecision.ticketCount}`
      },
      {
        name: '🚀 Ejecución iniciada',
        check: executionResult.success === true,
        expected: 'Ejecución exitosa',
        actual: `Success: ${executionResult.success}, Message: ${executionResult.message}`
      },
      {
        name: '👤 Cliente gestionado', 
        check: executionResult.actions.clientCreated !== undefined,
        expected: 'Intento de creación de cliente',
        actual: `Cliente created result: ${JSON.stringify(executionResult.actions.clientCreated)}`
      },
      {
        name: '🎫 Tickets gestionados',
        check: executionResult.actions.ticketsCreated.length > 0,
        expected: 'Al menos un ticket procesado',
        actual: `Tickets procesados: ${executionResult.actions.ticketsCreated.length}`
      }
    ];

    let successCount = 0;
    console.log('\n📋 [VALIDACIONES]:');
    console.log('================================================================================');
    
    for (const validation of validations) {
      const status = validation.check ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${validation.name}`);
      console.log(`    Esperado: ${validation.expected}`);
      console.log(`    Actual: ${validation.actual}`);
      console.log('');
      
      if (validation.check) successCount++;
    }

    console.log('================================================================================');
    console.log(`🎯 [RESULTADO FINAL] ${successCount}/${validations.length} validaciones pasaron`);
    
    if (successCount === validations.length) {
      console.log('🎉 [ÉXITO TOTAL] ¡El flujo completo funciona perfectamente!');
      console.log('✅ CallDecisionEngine + CallExecutor integrados correctamente');
      console.log('✅ Flujo: Transcripción → Análisis LLM → Decisiones → Ejecución');
      console.log('✅ Listo para reemplazar el sistema actual');
    } else {
      console.log('⚠️ [PARCIAL] El flujo tiene algunos problemas menores');
      console.log('🔧 Revisar logs para ajustes finales');
    }
    console.log('================================================================================');

    // 📄 PASO 4: Mostrar resumen detallado
    console.log('\n📄 [RESUMEN DETALLADO]:');
    console.log('Decision Engine Output:', JSON.stringify({
      clientType: decision.clientInfo.clientType,
      extractedData: decision.clientInfo.extractedData,
      primaryIncident: decision.incidentAnalysis.primaryIncident,
      clientDecision: decision.decisions.clientDecision,
      ticketDecision: decision.decisions.ticketDecision,
      confidence: decision.metadata.confidence
    }, null, 2));
    
    console.log('\nExecutor Result:', JSON.stringify({
      success: executionResult.success,
      actions: executionResult.actions,
      summary: executionResult.summary
    }, null, 2));

  } catch (error) {
    console.error('❌ [TEST] Error en integración completa:', error);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar test de integración
testIntegracionCompleta(); 