// 🧪 TEST: Cliente EXISTENTE que SÍ está en Nogal
// Mostrar diferencia vs cliente nuevo

require('dotenv').config({ path: '../.env' });
const { callDecisionEngine } = require('./dist/services/callDecisionEngine.js');

// 🎯 CASO: Cliente EXISTENTE (Pedro ya está en Nogal)
const clienteExistenteTranscript = [
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
    message: "Hola, soy Pedro Sánchez, mi DNI es 98765432Z. Quiero hacer una consulta sobre mi póliza de vida.",
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
        request_id: "identificar_cliente_existing",
        result_value: JSON.stringify({
          status: "success",
          message: "Cliente encontrado", // ← ¡CLIENTE EXISTE!
          data: {
            clientes: [  // ← Array con datos = EXISTE
              {
                codigo_cliente: "CLI-12345",
                nombre_cliente: "Pedro Sánchez",
                telefono_1: "666555444",
                email: "pedro.sanchez@email.com",
                fecha_nacimiento: "1985-05-15"
              }
            ],
            leads: [],    
            detalle_polizas: [
              {
                numero_poliza: "VID-2024-001",
                ramo: "VIDA",
                fecha_efecto: "2024-01-01",
                prima_neta: 1200,
                estado: "Vigente"
              }
            ],
            incidencias: [
              {
                id_incidencia: "INC-2024-789",
                tipo_incidencia: "Consulta póliza",
                fecha_creacion: "2024-07-15",
                estado: "Abierta",
                descripcion: "Consulta sobre cobertura de vida"
              }
            ]
          }
        }),
        tool_latency_secs: 2.1,
        tool_has_been_called: true
      }
    ],
    feedback: null
  },
  {
    sequence: 5,
    speaker: "agent",
    message: "Pedro, te he encontrado en el sistema. Veo que tienes una póliza de vida VID-2024-001. ¿Qué consulta tienes?",
    segment_start_time: 30,
    segment_end_time: 35,
    tool_calls: [],
    tool_results: [],
    feedback: null
  }
];

async function testClienteExistente() {
  console.log('🧪 [TEST] CLIENTE EXISTENTE - Ya está en Nogal...\n');
  
  try {
    // 🧠 Analizar con CallDecisionEngine
    console.log('🧠 Analizando llamada de cliente EXISTENTE...');
    const decision = await callDecisionEngine.analyzeCall(
      clienteExistenteTranscript,
      'conv_cliente_existente_test'
    );
    
    console.log('✅ Decisión generada:', {
      clientType: decision.clientInfo.clientType,
      hasExistingClientInfo: !!decision.clientInfo.existingClientInfo,
      existingClientId: decision.clientInfo.existingClientInfo?.clientId,
      shouldCreateClient: decision.decisions.clientDecision.shouldCreateClient,
      useExistingClient: decision.decisions.clientDecision.useExistingClient,
      incidentType: decision.incidentAnalysis.primaryIncident.type
    });

    // 📊 Comparación
    console.log('\n📊 [COMPARACIÓN]:');
    console.log('================================================================================');
    console.log('🆕 CLIENTE NUEVO (Ana):');
    console.log('  - tool_results.clientes: [] (vacío)');
    console.log('  - LLM detecta: clientType = "new"'); 
    console.log('  - Decisión: shouldCreateClient = true');
    console.log('  - Acción: Crear cliente nuevo en Nogal');
    console.log('');
    console.log('✅ CLIENTE EXISTENTE (Pedro):');
    console.log('  - tool_results.clientes: [datos del cliente]');
    console.log('  - LLM detecta: clientType = "existing"');
    console.log('  - Decisión: shouldCreateClient = false, useExistingClient = true');
    console.log('  - Acción: Usar cliente existente CLI-12345');
    console.log('================================================================================');

    // 🎯 Validaciones
    const validations = [
      {
        name: 'Cliente detectado como existente',
        check: decision.clientInfo.clientType === 'existing',
        expected: 'existing',
        actual: decision.clientInfo.clientType
      },
      {
        name: 'Información de cliente existente presente',
        check: !!decision.clientInfo.existingClientInfo?.clientId,
        expected: 'CLI-12345',
        actual: decision.clientInfo.existingClientInfo?.clientId || 'null'
      },
      {
        name: 'NO debe crear cliente nuevo',
        check: decision.decisions.clientDecision.shouldCreateClient === false,
        expected: false,
        actual: decision.decisions.clientDecision.shouldCreateClient
      },
      {
        name: 'SÍ debe usar cliente existente',
        check: decision.decisions.clientDecision.useExistingClient === true,
        expected: true,
        actual: decision.decisions.clientDecision.useExistingClient
      }
    ];

    let successCount = 0;
    console.log('\n📋 [VALIDACIONES CLIENTE EXISTENTE]:');
    
    for (const validation of validations) {
      const status = validation.check ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${validation.name}`);
      console.log(`    Esperado: ${validation.expected}`);
      console.log(`    Actual: ${validation.actual}`);
      console.log('');
      
      if (validation.check) successCount++;
    }

    console.log('================================================================================');
    if (successCount === validations.length) {
      console.log('🎉 [PERFECTO] El sistema distingue correctamente:');
      console.log('   ✅ Cliente NUEVO → Crear en Nogal');
      console.log('   ✅ Cliente EXISTENTE → Usar existente');
      console.log('   ✅ La diferencia está en los tool_results, NO en el nombre');
    } else {
      console.log('⚠️ [ERROR] El sistema no está detectando clientes existentes correctamente');
    }

  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  }
}

testClienteExistente(); 