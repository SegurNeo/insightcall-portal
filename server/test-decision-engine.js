// 🧪 TEST: Nuevo CallDecisionEngine con ejemplo real compilado

// Cargar variables de entorno
require('dotenv').config({ path: '../.env' });

const { callDecisionEngine } = require('./dist/services/callDecisionEngine.js');

// ✅ DATOS REALES del log (simplificados para evitar errores de tipos)
const realTranscripts = [
  {
    sequence: 1,
    speaker: "agent",
    message: "Hola soy Carlos, su agente virtual en la Correduría de Seguros Nogal, dígame por favor su nombre y apellido y si es usted un cliente, dígame por favor su DNI.",
    segment_start_time: 0,
    segment_end_time: 3,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 2,
    speaker: "user", 
    message: "Hola, buenas tardes. Me llamo Javier. Mi DNI es 03-473-587-N de Navarra.",
    segment_start_time: 9,
    segment_end_time: 12,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 5,
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
        request_id: "identificar_cliente_d11c6807fd6b4978a61cc41d90021680",
        result_value: JSON.stringify({
          status: "success",
          message: "Cliente encontrado exitosamente",
          data: {
            clientes: [{
              campaña: "",
              codigo_cliente: "701795F00",
              email_cliente: "javi.garcia1407@gmail.com",
              nif_cliente: "03473587N",
              nombre_cliente: "JAVIER GARCIA RODRIGUEZ",
              telefono_1: "635361079",
              telefono_2: "",
              telefono_3: ""
            }],
            detalle_polizas: [{
              codigo_cliente: "701795F00",
              matricula: "8168DJR",
              modelo: "ELANTRA",
              poliza: "3022300060797",
              ramo: "Coche"
            }]
          }
        }),
        tool_latency_secs: 3.7,
        tool_has_been_called: true
      }
    ],
    feedback: null
  },
  {
    sequence: 7,
    speaker: "user",
    message: "Sí, quería ver si me podían pasar un presupuesto para un seguro de hogar",
    segment_start_time: 36,
    segment_end_time: 39,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 9,
    speaker: "user",
    message: "Sí, sí. Para hogar como le he dicho",
    segment_start_time: 51,
    segment_end_time: 54,
    tool_calls: [],
    tool_results: [],
    feedback: null
  }
];

async function testNewDecisionEngine() {
  console.log('🧪 [TEST] Probando nuevo CallDecisionEngine con caso real Javier...\n');
  
  try {
    const decision = await callDecisionEngine.analyzeCall(
      realTranscripts, 
      'conv_4601k18w7x5wejct6bseggqh1zw7'
    );
    
    console.log('✅ [TEST] Análisis completado!\n');
    console.log('📋 [TEST] RESULTADO:');
    console.log('================================================================================');
    console.log(JSON.stringify(decision, null, 2));
    console.log('================================================================================\n');
    
    // ✅ VALIDACIONES CLAVE
    console.log('🔍 [TEST] Validaciones clave:\n');
    
    const clientType = decision.clientInfo?.clientType;
    const clientId = decision.clientInfo?.existingClientInfo?.clientId;
    const incidentType = decision.incidentAnalysis?.primaryIncident?.type;
    const ramo = decision.incidentAnalysis?.primaryIncident?.ramo;
    
    console.log(`Cliente tipo: ${clientType} (esperado: existing)`);
    console.log(`Cliente ID: ${clientId} (esperado: 701795F00)`);
    console.log(`Incidencia: ${incidentType} (esperado: Nueva contratación de seguros)`);
    console.log(`Ramo: ${ramo} (esperado: HOGAR)`);
    
    // Validar casos críticos
    const success = 
      clientType === 'existing' &&
      clientId === '701795F00' &&
      incidentType === 'Nueva contratación de seguros' &&
      ramo === 'HOGAR';
    
    console.log('\n================================================================================');
    if (success) {
      console.log('🎉 [TEST] ¡ÉXITO! El nuevo sistema extrae correctamente la información');
      console.log('✅ Cliente existente detectado correctamente');
      console.log('✅ ID de cliente real (no fallback)');
      console.log('✅ Nueva contratación identificada');
      console.log('✅ Ramo HOGAR extraído de conversación');
    } else {
      console.log('⚠️ [TEST] El sistema necesita ajustes');
    }
    console.log('================================================================================');
    
  } catch (error) {
    console.error('❌ [TEST] Error en el test:', error);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar test
testNewDecisionEngine(); 