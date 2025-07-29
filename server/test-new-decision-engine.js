// 🧪 TEST: Nuevo CallDecisionEngine con ejemplo real
// Probamos si puede extraer correctamente la información del caso Javier

import { callDecisionEngine } from './src/services/callDecisionEngine.js';

// ✅ DATOS REALES del log proporcionado
const realTranscripts = [
  {
    "sequence": 1,
    "speaker": "agent",
    "message": "Hola soy Carlos, su agente virtual en la Correduría de Seguros Nogal, dígame por favor su nombre y apellido y si es usted un cliente, dígame por favor su DNI.",
    "segment_start_time": 0,
    "segment_end_time": 3,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 2,
    "speaker": "user",
    "message": "Hola, buenas tardes. Me llamo Javier. Mi DNI es 03-473-587-N de Navarra.",
    "segment_start_time": 9,
    "segment_end_time": 12,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 3,
    "speaker": "agent",
    "message": "Perfecto, dame un momento que te encuentre...",
    "segment_start_time": 20,
    "segment_end_time": 23,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 4,
    "speaker": "agent",
    "message": "[Tool Call: identificar_cliente]",
    "segment_start_time": 20,
    "segment_end_time": 23,
    "tool_calls": [
      {
        "type": "webhook",
        "tool_name": "identificar_cliente",
        "request_id": "identificar_cliente_d11c6807fd6b4978a61cc41d90021680",
        "tool_details": {
          "url": "https://client-search-service.onrender.com/identificar_cliente",
          "body": "{\"id_llamada\": \"conv_4601k18w7x5wejct6bseggqh1zw7\", \"nombre\": \"Javier\", \"dni\": \"03473587N\", \"telefono\": \"+34618948462\"}",
          "type": "webhook",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json"
          },
          "path_params": {},
          "query_params": {}
        },
        "params_as_json": "{\"id_llamada\": \"default_id\", \"dni\": \"03473587N\", \"nombre\": \"Javier\"}",
        "tool_has_been_called": true
      }
    ],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 5,
    "speaker": "agent", 
    "message": "[Tool Result: identificar_cliente]",
    "segment_start_time": 20,
    "segment_end_time": 23,
    "tool_calls": [],
    "tool_results": [
      {
        "type": "webhook",
        "is_error": false,
        "tool_name": "identificar_cliente",
        "request_id": "identificar_cliente_d11c6807fd6b4978a61cc41d90021680",
        "result_value": "{\"status\":\"success\",\"message\":\"Cliente encontrado exitosamente\",\"data\":{\"clientes\":[{\"campaña\":\"\",\"codigo_cliente\":\"701795F00\",\"email_cliente\":\"javi.garcia1407@gmail.com\",\"nif_cliente\":\"03473587N\",\"nombre_cliente\":\"JAVIER GARCIA RODRIGUEZ\",\"telefono_1\":\"635361079\",\"telefono_2\":\"\",\"telefono_3\":\"\"}],\"detalle_polizas\":[{\"codigo_cliente\":\"701795F00\",\"matricula\":\"8168DJR\",\"modelo\":\"ELANTRA\",\"poliza\":\"3022300060797\",\"ramo\":\"Coche\"}],\"tipo_busqueda\":\"D\",\"valor_busqueda\":\"03473587N\",\"vtos_polizas\":[{\"codigo_cliente\":\"701795F00\",\"compañia\":\"REALE\",\"estado\":\"Contratada\",\"fecha_efecto\":\"01.05.23\",\"importe_poliza\":\"176,21\",\"mes_vencimiento\":\"Mayo\",\"poliza\":\"3022300060797\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Coche\",\"reemplaza_a\":\"050025026\"}]}}",
        "tool_latency_secs": 3.7439296239754185,
        "tool_has_been_called": true,
        "dynamic_variable_updates": []
      }
    ],
    "feedback": null
  },
  {
    "sequence": 6,
    "speaker": "agent",
    "message": "Javier, veo que tiene contratada con nosotros una póliza de coche... ¿Quiere que le ayude con alguna gestión de esta póliza o se trata de una nueva contratación?",
    "segment_start_time": 20,
    "segment_end_time": 23,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 7,
    "speaker": "user",
    "message": "Sí, quería ver si me podían pasar un presupuesto para un seguro de hogar",
    "segment_start_time": 36,
    "segment_end_time": 39,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 8,
    "speaker": "agent",
    "message": "Claro, ¿qué tipo de seguro le interesaría contratar, Javier? ¿Es para hogar, auto, o quizás vida?... Y para que un...",
    "segment_start_time": 43,
    "segment_end_time": 46,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 9,
    "speaker": "user",
    "message": "Sí, sí. Para hogar como le he dicho",
    "segment_start_time": 51,
    "segment_end_time": 54,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 10,
    "speaker": "agent",
    "message": "Ah, entiendo, Javier... Para un seguro de hogar... Perfecto, he tomado nota. Un compañero se pondrá en contacto con usted para darle un presupuesto y revisar su caso.",
    "segment_start_time": 64,
    "segment_end_time": 67,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 11,
    "speaker": "user",
    "message": "Vale, vale. Pues espero que me llame. Gracias",
    "segment_start_time": 76,
    "segment_end_time": 79,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 12,
    "speaker": "agent",
    "message": "Espero haberle sido de ayuda... Cualquier otra cosa que necesite, estamos a su disposición... Que tenga un buen día.",
    "segment_start_time": 82,
    "segment_end_time": 85,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
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
    
    // ✅ VALIDACIONES ESPERADAS
    console.log('🔍 [TEST] Validando resultados esperados...\n');
    
    const validations = [
      {
        name: 'Cliente tipo correcto',
        expected: 'existing',
        actual: decision.clientInfo.clientType,
        pass: decision.clientInfo.clientType === 'existing'
      },
      {
        name: 'Cliente ID correcto',
        expected: '701795F00',
        actual: decision.clientInfo?.existingClientInfo?.clientId,
        pass: decision.clientInfo?.existingClientInfo?.clientId === '701795F00'
      },
      {
        name: 'Nombre completo correcto',
        expected: 'JAVIER GARCIA RODRIGUEZ',
        actual: decision.clientInfo.extractedData?.nombreCompleto,
        pass: decision.clientInfo.extractedData?.nombreCompleto === 'JAVIER GARCIA RODRIGUEZ'
      },
      {
        name: 'Tipo de incidencia correcto',
        expected: 'Nueva contratación de seguros',
        actual: decision.incidentAnalysis.primaryIncident.type,
        pass: decision.incidentAnalysis.primaryIncident.type === 'Nueva contratación de seguros'
      },
      {
        name: 'Ramo correcto',
        expected: 'HOGAR',
        actual: decision.incidentAnalysis.primaryIncident.ramo,
        pass: decision.incidentAnalysis.primaryIncident.ramo === 'HOGAR'
      },
      {
        name: 'No debe crear cliente (ya existe)',
        expected: false,
        actual: decision.decisions.clientDecision.shouldCreateClient,
        pass: decision.decisions.clientDecision.shouldCreateClient === false
      },
      {
        name: 'Debe usar cliente existente',
        expected: true,
        actual: decision.decisions.clientDecision.useExistingClient,
        pass: decision.decisions.clientDecision.useExistingClient === true
      },
      {
        name: 'Fuente de datos correcta',
        expected: 'tool_results',
        actual: decision.decisions.clientDecision.clientDataSource,
        pass: decision.decisions.clientDecision.clientDataSource === 'tool_results'
      }
    ];
    
    let passedTests = 0;
    validations.forEach(test => {
      const icon = test.pass ? '✅' : '❌';
      const status = test.pass ? 'PASS' : 'FAIL';
      console.log(`${icon} [${status}] ${test.name}`);
      console.log(`    Esperado: ${test.expected}`);
      console.log(`    Actual: ${test.actual}\n`);
      if (test.pass) passedTests++;
    });
    
    console.log('================================================================================');
    console.log(`🎯 [TEST] RESULTADO FINAL: ${passedTests}/${validations.length} tests pasados`);
    
    if (passedTests === validations.length) {
      console.log('🎉 [TEST] ¡TODOS LOS TESTS PASARON! El nuevo sistema funciona correctamente.');
    } else {
      console.log('⚠️ [TEST] Algunos tests fallaron. Revisar lógica del LLM.');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Error en el test:', error);
  }
}

// Ejecutar test
testNewDecisionEngine(); 