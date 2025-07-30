// 🧪 PROBAR TICKETS EN SUPABASE - Verificar que el nuevo sistema guarda tickets
require('dotenv').config({ path: '../.env' });

const NewCallProcessor = require('./dist/services/newCallProcessor').NewCallProcessor;

async function probarTicketsSupabase() {
  console.log('🧪 [PRUEBA] Verificando que tickets se guarden en Supabase\n');

  const processor = new NewCallProcessor();

  // 📋 Payload de prueba con estructura correcta
  const testPayload = {
    conversation_id: 'test_supabase_tickets_001',
    conversation_type: 'phone_call',
    call_id: 'test_supabase_tickets_001',
    cost: 0.015,
    participant_count: 2,
    transcripts: [
      { 
        segment_start_time: 0, 
        segment_end_time: 5, 
        text: "Hola, soy Carlos de SegurNeo. ¿En qué puedo ayudarte?",
        speaker: 'agent',
        tool_results: []
      },
      { 
        segment_start_time: 5, 
        segment_end_time: 15, 
        text: "Hola, soy María López. Necesito el duplicado de mi póliza por email. Mi póliza es AU0420245310015",
        speaker: 'user',
        tool_results: [
          {
            tool_name: 'identificar_cliente',
            clientes: [
              {
                codigo_cliente: '999TEST01',
                nombres: 'MARIA LOPEZ GARCIA',  
                telefono: '666777888',
                email: 'maria.lopez@email.com',
                polizas: [
                  {
                    numero_poliza: 'AU0420245310015',
                    ramo: 'AUTO',
                    estado: 'vigente'
                  }
                ]
              }
            ]
          }
        ]
      }
    ],
    analysis: {
      summary: "María López solicita duplicado de póliza AU0420245310015 por email.",
      transcript_summary: "Cliente solicita duplicado de póliza por email",
      tool_results: [
        {
          tool_name: 'identificar_cliente',
          clientes: [
            {
              codigo_cliente: '999TEST01',
              nombres: 'MARIA LOPEZ GARCIA',
              telefono: '666777888',
              email: 'maria.lopez@email.com',
              polizas: [
                {
                  numero_poliza: 'AU0420245310015',
                  ramo: 'AUTO',
                  estado: 'vigente'
                }
              ]
            }
          ]
        }
      ]
    }
  };

  try {
    console.log('🚀 Procesando llamada de prueba...');
    console.log(`📞 ID: ${testPayload.conversation_id}`);
    console.log('👤 Cliente: María López (código: 999TEST01)');
    console.log('🎫 Esperado: Crear ticket para duplicado de póliza');
    console.log('');

    // Procesar la llamada
    const result = await processor.processCall(testPayload);

    if (result.success) {
      console.log('✅ Llamada procesada exitosamente');
      console.log(`📋 Call ID creado: ${result.callId}`);
      console.log('');

      // Verificar en la tabla calls
      const { supabase } = require('./dist/lib/supabase.js');
      
      const { data: callData, error: callError } = await supabase
        .from('calls')
        .select('*')
        .eq('conversation_id', testPayload.conversation_id)
        .single();

      if (callError) {
        console.error('❌ Error verificando llamada en calls:', callError);
        return;
      }

      console.log('📞 LLAMADA EN TABLA CALLS:');
      console.log('=========================');
      console.log(`ID: ${callData.id}`);
      console.log(`conversation_id: ${callData.conversation_id}`);
      console.log(`tickets_created: ${callData.tickets_created}`);
      console.log(`ticket_ids: ${JSON.stringify(callData.ticket_ids)}`);
      console.log(`analysis_completed: ${callData.analysis_completed}`);
      console.log('');

      // Verificar en la tabla tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('call_id', callData.id);

      if (ticketsError) {
        console.error('❌ Error verificando tickets:', ticketsError);
        return;
      }

      console.log('🎫 TICKETS EN TABLA TICKETS:');
      console.log('============================');
      if (ticketsData && ticketsData.length > 0) {
        ticketsData.forEach((ticket, index) => {
          console.log(`${index + 1}. Ticket ID: ${ticket.id}`);
          console.log(`   call_id: ${ticket.call_id}`);
          console.log(`   conversation_id: ${ticket.conversation_id}`);
          console.log(`   tipo_incidencia: ${ticket.tipo_incidencia}`);
          console.log(`   motivo_gestion: ${ticket.motivo_gestion}`);
          console.log(`   cliente_id: ${ticket.cliente_id}`);
          console.log(`   status: ${ticket.status}`);
          console.log(`   nogal_ticket_id: ${ticket.nogal_ticket_id}`);
          console.log('');
        });

        console.log('🎉 ¡ÉXITO! Los tickets ahora se guardan en Supabase');
        console.log('✅ El frontend podrá hacer JOIN correctamente');
        console.log('✅ Las nuevas llamadas aparecerán en la página');
        
      } else {
        console.log('❌ NO SE ENCONTRARON TICKETS en la tabla tickets');
        console.log('⚠️  El frontend seguirá sin mostrar las nuevas llamadas');
      }

    } else {
      console.error('❌ Error procesando llamada:', result.error);
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

probarTicketsSupabase(); 