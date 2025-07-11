#!/usr/bin/env node

// 🧪 TEST: Simular webhook con tool_calls/tool_results para probar la integración completa

const TEST_WEBHOOK_URL = 'http://localhost:3000/api/v1/calls/webhook';

// Payload simulado con tool_calls y tool_results reales
const testPayload = {
  call_id: `test-${Date.now()}`,
  conversation_id: `conv_test_${Date.now()}`,
  agent_id: 'test-agent',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 120000).toISOString(),
  duration_seconds: 120,
  status: 'completed',
  cost: 500,
  termination_reason: 'Test completed',
  transcript_summary: 'Cliente contacta para anular póliza de coche',
  call_successful: true,
  participant_count: {
    agent_messages: 3,
    user_messages: 2,
    total_messages: 5
  },
  audio_available: false,
  created_at: new Date().toISOString(),
  transcripts: [
    {
      sequence: 1,
      speaker: 'agent',
      message: 'Buenos días, soy el agente virtual de Nogal. ¿En qué puedo ayudarle?',
      segment_start_time: 0,
      segment_end_time: 3,
      confidence: 0.95,
      tool_calls: [],
      tool_results: []
    },
    {
      sequence: 2,
      speaker: 'user',
      message: 'Hola, necesito anular mi póliza de coche. Mi DNI es 12345678A.',
      segment_start_time: 4,
      segment_end_time: 8,
      confidence: 0.92,
      tool_calls: [
        {
          type: 'webhook',
          tool_name: 'identificar_cliente',
          request_id: 'test_req_123',
          tool_details: {
            url: 'https://example.com/identificar_cliente',
            method: 'POST',
            type: 'webhook',
            body: '{"nif": "12345678A"}',
            headers: {},
            path_params: {},
            query_params: {}
          },
          params_as_json: '{"nif": "12345678A"}',
          tool_has_been_called: true
        }
      ],
      tool_results: [
        {
          type: 'webhook',
          is_error: false,
          tool_name: 'identificar_cliente',
          request_id: 'test_req_123',
          result_value: JSON.stringify({
            status: 'success',
            message: 'Cliente encontrado exitosamente',
            data: {
              clientes: [{
                codigo_cliente: 'TEST123F00',
                nombre_cliente: 'JUAN PEREZ GARCIA',
                email_cliente: 'juan.perez@example.com',
                telefono_1: '600123456',
                nif_cliente: '12345678A'
              }],
              detalle_polizas: [{
                codigo_cliente: 'TEST123F00',
                poliza: 'TEST001',
                ramo: 'Coche',
                matricula: 'TEST123'
              }]
            }
          }),
          tool_latency_secs: 0.5,
          tool_has_been_called: true
        }
      ]
    },
    {
      sequence: 3,
      speaker: 'agent',
      message: 'Perfecto, he encontrado su póliza TEST001. Procederemos con la anulación.',
      segment_start_time: 9,
      segment_end_time: 12,
      confidence: 0.94,
      tool_calls: [],
      tool_results: []
    }
  ]
};

async function testWebhookIntegration() {
  console.log('🧪 PROBANDO INTEGRACIÓN WEBHOOK CON TOOL_CALLS/TOOL_RESULTS\n');
  
  try {
    // Importar fetch dinámicamente
    const fetch = (await import('node-fetch')).default;
    
    console.log('📤 Enviando payload al webhook...');
    console.log('📋 Payload:', JSON.stringify({
      call_id: testPayload.call_id,
      conversation_id: testPayload.conversation_id,
      hasToolCalls: testPayload.transcripts.some(t => t.tool_calls?.length > 0),
      hasToolResults: testPayload.transcripts.some(t => t.tool_results?.length > 0)
    }, null, 2));
    
    const response = await fetch(TEST_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'segurneo'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`📨 Status: ${response.status}`);
    const result = await response.text();
    console.log(`📨 Response: ${result}`);
    
    if (response.ok) {
      console.log('\n✅ WEBHOOK PROCESADO EXITOSAMENTE');
      console.log('🔍 Ahora verificando en BD...');
      
      // Dar tiempo para que se procese
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Verificar manualmente en el dashboard si:');
      console.log('   - Se creó la llamada con ID:', testPayload.conversation_id);
      console.log('   - Se extrajo el ID de cliente: TEST123F00');
      console.log('   - Se creó un ticket automáticamente');
      console.log('   - Se intentó enviar a Segurneo/Nogal');
      
    } else {
      console.error('❌ Error en webhook');
    }
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testWebhookIntegration(); 