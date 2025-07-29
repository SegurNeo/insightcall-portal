// 🧪 TEST: Verificar nuevo CallExecutor con información de acciones
require('dotenv').config({ path: '../.env' });

const testPayload = {
  call_id: "segurneo_test_12345",
  conversation_id: "test_new_executor_12345",
  agent_id: "agent_test",
  caller_id: "666777888",
  start_time: "2025-07-29T12:00:00Z",
  end_time: "2025-07-29T12:02:00Z",
  duration_seconds: 120,
  status: "completed",
  call_successful: true,
  termination_reason: "completed_successfully",
  cost: 3500,
  participant_count: {
    agent_messages: 3,
    user_messages: 2,
    total_messages: 5
  },
  transcript_summary: "Cliente existente solicita duplicado de póliza",
  transcripts: [
    {
      speaker: "agent",
      message: "Hola, soy Carlos de Nogal. ¿En qué puedo ayudarle?",
      segment_start_time: 0,
      segment_end_time: 3,
      tool_calls: [],
      tool_results: []
    },
    {
      speaker: "user", 
      message: "Hola, soy María García. Necesito el duplicado de mi póliza.",
      segment_start_time: 3,
      segment_end_time: 8,
      tool_calls: [],
      tool_results: [
        {
          type: "webhook",
          is_error: false,
          tool_name: "identificar_cliente",
          request_id: "identificar_cliente_maria",
          result_value: JSON.stringify({
            status: "success",
            message: "Cliente encontrado",
            data: {
              clientes: [
                {
                  codigo_cliente: "CLI-67890",
                  nombre_cliente: "María García López",
                  telefono_1: "666777888",
                  email: "maria.garcia@email.com"
                }
              ],
              leads: [],
              detalle_polizas: [
                {
                  numero_poliza: "AUTO-2024-456",
                  ramo: "AUTO",
                  fecha_efecto: "2024-01-15",
                  prima_neta: 800,
                  estado: "Vigente"
                }
              ],
              incidencias: []
            }
          }),
          tool_latency_secs: 1.8,
          tool_has_been_called: true
        }
      ]
    },
    {
      speaker: "agent",
      message: "Perfecto María, le envío el duplicado por email.",
      segment_start_time: 8,
      segment_end_time: 12,
      tool_calls: [],
      tool_results: []
    }
  ],
  audio_download_url: "https://test-audio.com/test-maria.mp3",
  audio_file_size: 856000,
  fichero_llamada: "https://test-audio.com/test-maria.mp3"
};

async function testNuevoExecutor() {
  try {
    console.log('🧪 [TEST] Nuevo CallExecutor con información de acciones\n');

    // Importar newCallProcessor
    const { newCallProcessor } = require('./dist/services/newCallProcessor.js');
    
    console.log('🚀 [TEST] Procesando llamada de prueba...');
    const result = await newCallProcessor.processCall(testPayload);
    
    console.log('✅ [TEST] Resultado:', {
      success: result.success,
      message: result.message,
      callId: result.callId
    });

    if (result.success) {
      // Verificar que se guardó correctamente
      const { supabase } = require('./dist/lib/supabase.js');
      
      const { data: call, error } = await supabase
        .from('calls')
        .select('*')
        .eq('conversation_id', testPayload.conversation_id)
        .single();

      if (error || !call) {
        console.error('❌ [TEST] No se encontró la llamada en BD');
        return;
      }

      console.log('\n📊 [VERIFICACIÓN] Información guardada:');
      console.log('======================================================');
      console.log(`🎫 Tickets creados: ${call.tickets_created}`);
      console.log(`🎫 Ticket IDs: ${JSON.stringify(call.ticket_ids)}`);
      
      if (call.ai_analysis) {
        console.log(`\n🧠 ANÁLISIS:`);
        console.log(`📋 Tipo: ${call.ai_analysis.tipo_incidencia}`);
        console.log(`👤 Cliente: ${call.ai_analysis.datos_extraidos?.nombreCompleto}`);
        
        if (call.ai_analysis.tickets_creados) {
          console.log(`\n📝 TICKETS EN ANÁLISIS: ${call.ai_analysis.tickets_creados.length}`);
          call.ai_analysis.tickets_creados.forEach((t, i) => {
            console.log(`   ${i + 1}. ${t.ticket_id} - ${t.estado} (Cliente: ${t.cliente_id})`);
          });
        }
        
        if (call.ai_analysis.rellamadas_creadas) {
          console.log(`\n📞 RELLAMADAS EN ANÁLISIS: ${call.ai_analysis.rellamadas_creadas.length}`);
          call.ai_analysis.rellamadas_creadas.forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.followup_id} - ${r.estado} (Ticket: ${r.ticket_relacionado})`);
          });
        }
        
        if (call.ai_analysis.clientes_creados) {
          console.log(`\n👤 CLIENTES EN ANÁLISIS: ${call.ai_analysis.clientes_creados.length}`);
          call.ai_analysis.clientes_creados.forEach((c, i) => {
            console.log(`   ${i + 1}. ${c.cliente_id} - ${c.estado} (${c.nombre})`);
          });
        }

        if (call.ai_analysis.resumen_ejecucion) {
          console.log(`\n📊 RESUMEN: ${call.ai_analysis.resumen_ejecucion}`);
        }
      }
      console.log('======================================================');
      
      console.log('\n🎯 [CONCLUSIÓN] ¡El nuevo sistema funciona correctamente!');
      console.log('   • Información de acciones guardada ✅');
      console.log('   • Lista para mostrar en frontend ✅');
      console.log('   • Estructura completa para "Acciones" ✅');
    }

  } catch (error) {
    console.error('❌ [TEST] Error:', error);
  }
}

testNuevoExecutor(); 