// Como es TypeScript, vamos a usar el transpilado o simular la función

// Simulación simplificada de extractFromStructuredTools para test
function testExtractFromStructuredTools(transcripts) {
  console.log(`🔍 [TEST] Procesando ${transcripts.length} transcripts...`);
  
  for (let i = 0; i < transcripts.length; i++) {
    const transcript = transcripts[i];
    
    console.log(`📋 [TEST] Transcript ${i + 1}:`);
    console.log(`  - Speaker: ${transcript.speaker}`);
    console.log(`  - Message: ${transcript.message.substring(0, 50)}...`);
    console.log(`  - Tool calls: ${transcript.tool_calls.length}`);
    console.log(`  - Tool results: ${transcript.tool_results.length}`);
    
    // Verificar si hay tool_results con datos
    if (transcript.tool_results && transcript.tool_results.length > 0) {
      for (const toolResult of transcript.tool_results) {
        console.log(`\n🎯 [TEST] Tool Result encontrado:`);
        console.log(`  - Tool: ${toolResult.tool_name}`);
        console.log(`  - Error: ${toolResult.is_error}`);
        console.log(`  - Result value length: ${toolResult.result_value ? toolResult.result_value.length : 'null'}`);
        
        if (toolResult.result_value) {
          try {
            const parsed = JSON.parse(toolResult.result_value);
            console.log(`  - Parsed status: ${parsed.status}`);
            
            if (parsed.status === 'success' && parsed.data && parsed.data.clientes) {
              const cliente = parsed.data.clientes[0];
              console.log(`\n✅ [TEST] CLIENTE ENCONTRADO:`);
              console.log(`  - ID Cliente: ${cliente.codigo_cliente}`);
              console.log(`  - Nombre: ${cliente.nombre_cliente}`);
              console.log(`  - Email: ${cliente.email_cliente}`);
              console.log(`  - Teléfono 1: ${cliente.telefono_1}`);
              console.log(`  - Teléfono 2: ${cliente.telefono_2}`);
              
              return {
                found: true,
                data: {
                  idCliente: cliente.codigo_cliente,
                  nombre: cliente.nombre_cliente,
                  email: cliente.email_cliente,
                  telefono: cliente.telefono_1
                }
              };
            }
          } catch (error) {
            console.error(`❌ [TEST] Error parseando JSON:`, error.message);
          }
        }
      }
    }
  }
  
  return { found: false, data: {} };
}

// 🎯 DATOS REALES del payload de Segurneo Voice
const realTranscripts = [
  {
    "sequence": 1,
    "speaker": "agent",
    "message": "Hola soy Carlos, su agente virtual en la Correduría de Seguros Nogal, dígame por favor su nombre...",
    "segment_start_time": 0,
    "segment_end_time": 3,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 2,
    "speaker": "user",
    "message": "Gracias.",
    "segment_start_time": 0,
    "segment_end_time": 3,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 3,
    "speaker": "agent",
    "message": "De nada... Para poder identificarle, dígame por favor su nombre y apellido... y si es un cliente, su DNI.",
    "segment_start_time": 8,
    "segment_end_time": 11,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 4,
    "speaker": "user",
    "message": "Vale, pues si te parece te doy mi DNI. Mi DNI es 52108149Q.",
    "segment_start_time": 16,
    "segment_end_time": 19,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 5,
    "speaker": "agent",
    "message": "Perfecto, dame un momento que te encuentre...",
    "segment_start_time": 30,
    "segment_end_time": 33,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 6,
    "speaker": "agent",
    "message": "[Tool Call: identificar_cliente]",
    "segment_start_time": 30,
    "segment_end_time": 33,
    "tool_calls": [
      {
        "type": "webhook",
        "tool_name": "identificar_cliente",
        "request_id": "identificar_cliente_47f6e3f44589482a801822f5057f5d74",
        "tool_details": {
          "url": "https://client-search-service.onrender.com/identificar_cliente",
          "body": "{\"id_llamada\": \"conv_01jztsgfyder7bbvnmeqt48gm7\", \"dni\": \"52108149Q\", \"telefono\": null}",
          "type": "webhook",
          "method": "POST",
          "headers": {
            "Content-Type": "application/json"
          },
          "path_params": {},
          "query_params": {}
        },
        "params_as_json": "{\"id_llamada\": \"default_id\", \"dni\": \"52108149Q\"}",
        "tool_has_been_called": true
      }
    ],
    "tool_results": [],
    "feedback": null
  },
  {
    "sequence": 7,
    "speaker": "agent",
    "message": "[Tool Result: identificar_cliente]",
    "segment_start_time": 30,
    "segment_end_time": 33,
    "tool_calls": [],
    "tool_results": [
      {
        "type": "webhook",
        "is_error": false,
        "tool_name": "identificar_cliente",
        "request_id": "identificar_cliente_47f6e3f44589482a801822f5057f5d74",
        "result_value": "{\"status\":\"success\",\"message\":\"Cliente encontrado exitosamente\",\"data\":{\"clientes\":[{\"campaña\":\"\",\"codigo_cliente\":\"125296F00\",\"email_cliente\":\"raquelbecerra1978@gmail.com\",\"nif_cliente\":\"52108149Q\",\"nombre_cliente\":\"DAVID ZURITA JIMENEZ\",\"telefono_1\":\"647929978\",\"telefono_2\":\"647929955\",\"telefono_3\":\"\"}],\"detalle_polizas\":[{\"codigo_cliente\":\"\",\"matricula\":\"\",\"modelo\":\"\",\"poliza\":\"\",\"ramo\":\"\"},{\"codigo_cliente\":\"125296F00\",\"poliza\":\"482011136280\",\"ramo\":\"Salud\"},{\"codigo_cliente\":\"125296F00\",\"codigo_postal\":\"28983\",\"direccion\":\"PABLO NERUDA\",\"direccion_ampliada\":\"\",\"escalera\":\"\",\"localidad\":\"ESQUIVIAS\",\"numero\":\"11\",\"piso\":\"\",\"poliza\":\"732500095342\",\"portal\":\"\",\"provincia\":\"45\",\"puerta\":\"\",\"ramo\":\"Hogar\",\"via\":\"CL\"},{\"codigo_cliente\":\"125296F00\",\"matricula\":\"6896HJW\",\"modelo\":\"Serie 3\",\"poliza\":\"AU0420245310016\",\"ramo\":\"Coche\"},{\"codigo_cliente\":\"125296F00\",\"poliza\":\"R-38524334\",\"ramo\":\"Vida\"}],\"incidencias\":[{\"codigo_cliente\":\"125296F00\",\"codigo_incidencia\":\"NG3291093\",\"fecha_creacion_incidencia\":\"05.06.25\",\"hora_creacion_incidencia\":\"09.58.45 am\",\"motivo_de_incidencia\":\"Retención de Cliente Cartera Llamada\",\"poliza\":\"AU0420245310016\",\"ramo\":\"Coche\",\"tipo_de_incidencia\":\"Retención de Cliente Cartera\",\"via_recepcion\":\"Email - Cliente\"}],\"tipo_busqueda\":\"D\",\"valor_busqueda\":\"52108149Q\",\"vtos_polizas\":[{\"codigo_cliente\":\"125296F00\",\"compañia\":\"Mapfre\",\"estado\":\"Contratada\",\"fecha_efecto\":\"18.01.18\",\"importe_poliza\":\"0,00\",\"mes_vencimiento\":\"Enero\",\"poliza\":\"02022100061\",\"poliza/suplemento\":\"Suplemento\",\"ramo\":\"Coche\",\"reemplaza_a\":\"\"},{\"codigo_cliente\":\"125296F00\",\"compañia\":\"MAPFRE\",\"estado\":\"Contratada\",\"fecha_efecto\":\"22.08.24\",\"importe_poliza\":\"1,043,00\",\"mes_vencimiento\":\"Enero\",\"poliza\":\"11136280\",\"poliza/suplemento\":\"Suplemento\",\"ramo\":\"Salud\",\"reemplaza_a\":\"G2S286000309\"},{\"codigo_cliente\":\"125296F00\",\"compañia\":\"AXA VIDA\",\"estado\":\"Contratada\",\"fecha_efecto\":\"01.04.25\",\"importe_poliza\":\"102,33\",\"mes_vencimiento\":\"Abril\",\"poliza\":\"68373310\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Vida\",\"reemplaza_a\":\"\"},{\"codigo_cliente\":\"125296F00\",\"compañia\":\"MAPFRE\",\"estado\":\"Contratada\",\"fecha_efecto\":\"10.07.25\",\"importe_poliza\":\"343,21\",\"mes_vencimiento\":\"Julio\",\"poliza\":\"732500095342\",\"poliza/suplemento\":\"Póliza\",\"ramo\":\"Hogar\",\"reemplaza_a\":\"04HU27988877\"},{\"codigo_cliente\":\"125296F00\",\"compañia\":\"QUALITAS\",\"estado\":\"Contratada\",\"fecha_efecto\":\"01.08.24\",\"importe_poliza\":\"323,58\",\"mes_vencimiento\":\"Agosto\",\"poliza\":\"AU0420245310016\",\"poliza/suplemento\":\"Suplemento\",\"ramo\":\"Coche\",\"reemplaza_a\":\"047455047\"}]}}",
        "tool_latency_secs": 1.4700729409232736,
        "tool_has_been_called": true
      }
    ],
    "feedback": null
  },
  {
    "sequence": 8,
    "speaker": "agent",
    "message": "Dígame David... ¿en qué puedo ayudarle?... Veo que tiene una incidencia abierta sobre una retención de cliente de cartera de coche... ¿Es sobre esto su consulta?",
    "segment_start_time": 30,
    "segment_end_time": 33,
    "tool_calls": [],
    "tool_results": [],
    "feedback": null
  }
];

console.log('🧪 TEST: Probando extracción de datos con payload real de Segurneo...\n');

// Ejecutar test de extracción
const result = testExtractFromStructuredTools(realTranscripts);

console.log('\n📊 RESULTADO FINAL:');
console.log('==================');
console.log('Found:', result.found);
if (result.found) {
  console.log('ID Cliente:', result.data.idCliente);
  console.log('Nombre:', result.data.nombre);
  console.log('Email:', result.data.email);
  console.log('Teléfono:', result.data.telefono);
} else {
  console.log('❌ No se encontraron datos del cliente');
}

// Validar resultado esperado
console.log('\n✅ VALIDACIÓN:');
if (result.found && result.data.idCliente === '125296F00') {
  console.log('✅ ID Cliente correcto');
} else {
  console.log('❌ ID Cliente incorrecto. Esperado: 125296F00, Recibido:', result.data?.idCliente || 'null');
}

if (result.found && result.data.nombre === 'DAVID ZURITA JIMENEZ') {
  console.log('✅ Nombre correcto');
} else {
  console.log('❌ Nombre incorrecto. Esperado: DAVID ZURITA JIMENEZ, Recibido:', result.data?.nombre || 'null');
}

if (result.found && result.data.email === 'raquelbecerra1978@gmail.com') {
  console.log('✅ Email correcto');
} else {
  console.log('❌ Email incorrecto. Esperado: raquelbecerra1978@gmail.com, Recibido:', result.data?.email || 'null');
}

if (result.found && result.data.telefono === '647929978') {
  console.log('✅ Teléfono correcto');
} else {
  console.log('❌ Teléfono incorrecto. Esperado: 647929978, Recibido:', result.data?.telefono || 'null');
} 