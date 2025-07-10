// 🧪 TEST CON DATOS REALES DE SEGURNEO VOICE
// Usar el webhook exacto que recibimos con tool_results estructurados

import { ClientDataExtractor } from './dist/services/clientDataExtractor.js';

console.log('🧪 Probando ClientDataExtractor con DATOS REALES de Segurneo...\n');

// Transcripts REALES del webhook que recibimos
const realWebhookTranscripts = [
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
    "message": "Hola, buenas. Yo soy María del Carmen Oliva Jiménez.",
    "segment_start_time": 10,
    "segment_end_time": 13,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 9,
    "speaker": "agent",
    "message": "[Tool Call: identificar_cliente]",
    "segment_start_time": 46,
    "segment_end_time": 49,
    "tool_calls": [
      {
        "type": "webhook",
        "tool_name": "identificar_cliente",
        "request_id": "identificar_cliente_a9b223190f764cb6b436ee589bea9aea",
        "tool_details": {
          "url": "https://client-search-service.onrender.com/identificar_cliente",
          "body": "{\"id_llamada\": \"conv_01jztkf3pafmnrrggbn8y58m8k\", \"dni\": \"07535572J\", \"telefono\": \"+34687545560\"}",
          "type": "webhook",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json"
          },
          "path_params": {},
          "query_params": {}
        },
        "params_as_json": "{\"id_llamada\": \"default_id_llamada\", \"dni\": \"07535572J\"}",
        "tool_has_been_called": true
      }
    ],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 10,
    "speaker": "agent", 
    "message": "[Tool Result: identificar_cliente]",
    "segment_start_time": 46,
    "segment_end_time": 49,
    "tool_calls": [],
    "tool_results": [
      {
        "type": "webhook",
        "is_error": false,
        "tool_name": "identificar_cliente",
        "request_id": "identificar_cliente_a9b223190f764cb6b436ee589bea9aea",
        "result_value": "{\"status\":\"success\",\"message\":\"Cliente encontrado exitosamente\",\"data\":{\"clientes\":[{\"campaña\":\"\",\"codigo_cliente\":\"076486F00\",\"email_cliente\":\"maricarmenolivajimenez@gmail.com\",\"nif_cliente\":\"07535572J\",\"nombre_cliente\":\"MARIA DEL CARMEN OLIVA JIMENEZ\",\"telefono_1\":\"916138011\",\"telefono_2\":\"615280791\",\"telefono_3\":\"\"}],\"detalle_polizas\":[{\"codigo_cliente\":\"076486F00\",\"matricula\":\"8844DRZ\",\"modelo\":\"golf\",\"poliza\":\"056169760\",\"ramo\":\"Coche\"},{\"codigo_cliente\":\"076486F00\",\"codigo_postal\":\"28934\",\"direccion\":\"DOS DE MAYO\",\"direccion_ampliada\":\"\",\"escalera\":\"\",\"localidad\":\"MÓSTOLES\",\"numero\":\"41\",\"piso\":\"1º\",\"poliza\":\"0731880199061\",\"portal\":\"\",\"provincia\":\"28\",\"puerta\":\"A\",\"ramo\":\"Hogar\",\"via\":\"AV\"},{\"codigo_cliente\":\"076486F00\",\"matricula\":\"5325CRF\",\"modelo\":\"45\",\"poliza\":\"3022100025146\",\"ramo\":\"Coche\"},{\"codigo_cliente\":\"076486F00\",\"matricula\":\"2319DRP\",\"modelo\":\"Mondeo\",\"poliza\":\"3022400352826\",\"ramo\":\"Coche\"},{\"codigo_cliente\":\"076486F00\",\"matricula\":\"7187GVH\",\"modelo\":\"Scirocco\",\"poliza\":\"3022500162618\",\"ramo\":\"Coche\"},{\"codigo_cliente\":\"076486F00\",\"poliza\":\"450169\",\"ramo\":\"Decesos\"}],\"tipo_busqueda\":\"D\",\"valor_busqueda\":\"07535572J\",\"vtos_polizas\":[{\"codigo_cliente\":\"076486F00\",\"compañia\":\"Allianz\",\"estado\":\"Contratada\",\"fecha_efecto\":\"11.11.24\",\"importe_poliza\":\"402,10\",\"mes_vencimiento\":\"Diciembre\",\"poliza\":\"056169760\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Coche\",\"reemplaza_a\":\"2022101829\"},{\"codigo_cliente\":\"076486F00\",\"compañia\":\"Mapfre\",\"estado\":\"Contratada\",\"fecha_efecto\":\"01.01.19\",\"importe_poliza\":\"196,96\",\"mes_vencimiento\":\"Enero\",\"poliza\":\"0731880199061\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Hogar\",\"reemplaza_a\":\"042340981\"},{\"codigo_cliente\":\"076486F00\",\"compañia\":\"REALE\",\"estado\":\"Contratada\",\"fecha_efecto\":\"12.02.21\",\"importe_poliza\":\"245,41\",\"mes_vencimiento\":\"Febrero\",\"poliza\":\"3022100025146\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Coche\",\"reemplaza_a\":\"\"},{\"codigo_cliente\":\"076486F00\",\"compañia\":\"REALE\",\"estado\":\"Contratada\",\"fecha_efecto\":\"30.12.24\",\"importe_poliza\":\"523,87\",\"mes_vencimiento\":\"Diciembre\",\"poliza\":\"3022400352826\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Coche\",\"reemplaza_a\":\"02022100376\"},{\"codigo_cliente\":\"076486F00\",\"compañia\":\"REALE\",\"estado\":\"Contratada\",\"fecha_efecto\":\"05.07.25\",\"importe_poliza\":\"262,85\",\"mes_vencimiento\":\"Julio\",\"poliza\":\"3022500162618\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Coche\",\"reemplaza_a\":\"2022100903\"},{\"codigo_cliente\":\"076486F00\",\"compañia\":\"AURA\",\"estado\":\"Contratada\",\"fecha_efecto\":\"01.05.22\",\"importe_poliza\":\"241,92\",\"mes_vencimiento\":\"Mayo\",\"poliza\":\"450169\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Decesos\",\"reemplaza_a\":\"\"}]}}",
        "tool_latency_secs": 3.7603004006668925,
        "tool_has_been_called": true
      }
    ],
    "feedback": null
  },
  {
    "sequence": 11,
    "speaker": "agent",
    "message": "María del Carmen, veo que tienes contratadas con nosotros pólizas de coche, hogar y decesos... ¿Quiere que le ayude con alguna gestión de alguna de estas pólizas o se trata de una nueva contratación?",
    "segment_start_time": 46,
    "segment_end_time": 49,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  }
];

async function testRealExtractor() {
  try {
    console.log('📋 ANÁLISIS DEL WEBHOOK REAL:');
    console.log(`   - Total mensajes: ${realWebhookTranscripts.length}`);
    
    // Contar tool_calls y tool_results
    let totalToolCalls = 0;
    let totalToolResults = 0;
    
    realWebhookTranscripts.forEach(t => {
      totalToolCalls += t.tool_calls.length;
      totalToolResults += t.tool_results.length;
    });
    
    console.log(`   - Tool calls encontrados: ${totalToolCalls}`);
    console.log(`   - Tool results encontrados: ${totalToolResults}`);
    
    // Ver el contenido del tool_result
    const toolResultTranscript = realWebhookTranscripts.find(t => t.tool_results.length > 0);
    if (toolResultTranscript) {
      const toolResult = toolResultTranscript.tool_results[0];
      console.log(`   - Tool name: ${toolResult.tool_name}`);
      console.log(`   - Is error: ${toolResult.is_error}`);
      console.log(`   - Result value length: ${toolResult.result_value.length} caracteres`);
      
      // Parsear preview del result_value
      try {
        const parsed = JSON.parse(toolResult.result_value);
        console.log(`   - Status: ${parsed.status}`);
        console.log(`   - Clientes encontrados: ${parsed.data?.clientes?.length || 0}`);
        console.log(`   - Pólizas encontradas: ${parsed.data?.detalle_polizas?.length || 0}`);
      } catch (e) {
        console.log(`   - Error parseando result_value: ${e.message}`);
      }
    }
    
    console.log('\n🚀 EJECUTANDO EXTRACTOR...');
    console.log('================================');
    
    const extractor = new ClientDataExtractor();
    const result = extractor.extractClientData(realWebhookTranscripts);
    
    console.log('\n🎯 RESULTADO DE LA EXTRACCIÓN:');
    console.log('================================');
    console.log(`✅ ID Cliente: ${result.idCliente || '❌ NO EXTRAÍDO'}`);
    console.log(`✅ Nombre: ${result.nombre || '❌ NO EXTRAÍDO'}`);
    console.log(`✅ Email: ${result.email || '❌ NO EXTRAÍDO'}`);
    console.log(`✅ Teléfono: ${result.telefono || '❌ NO EXTRAÍDO'}`);
    console.log(`✅ Número Póliza: ${result.numeroPoliza || '❌ NO EXTRAÍDO'}`);
    
    console.log('\n📊 METADATOS:');
    console.log(`   - Fuente: ${result.extractionSource}`);
    console.log(`   - Confianza: ${result.confidence}%`);
    console.log(`   - Tools utilizadas: ${result.toolsUsed.join(', ')}`);
    
    console.log('\n🎉 EVALUACIÓN FINAL:');
    if (result.idCliente === '076486F00' && result.nombre && result.email) {
      console.log('✅ ¡ÉXITO TOTAL! El extractor funciona perfectamente');
      console.log('✅ ID Cliente real extraído: 076486F00');
      console.log('✅ Datos completos del cliente capturados');
      console.log('✅ Los tickets ahora tendrán ID de cliente válido');
      console.log('✅ Se enviarán automáticamente a Segurneo Voice');
    } else {
      console.log('❌ AÚN HAY PROBLEMAS en la extracción');
      console.log(`❌ Esperaba ID: '076486F00', obtuvo: '${result.idCliente}'`);
      console.log('❌ Revisar el parsing del result_value en extractFromSegurneoToolData()');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testRealExtractor(); 