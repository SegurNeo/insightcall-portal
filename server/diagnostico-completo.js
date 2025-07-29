// 🔍 DIAGNÓSTICO COMPLETO - Por qué no aparecen las nuevas llamadas
require('dotenv').config({ path: '../.env' });

async function diagnosticoCompleto() {
  console.log('🔍 [DIAGNÓSTICO] Investigando por qué no aparecen nuevas llamadas\n');
  
  try {
    const { supabase } = require('./dist/lib/supabase.js');

    // 1. VERIFICAR LA LLAMADA ESPECÍFICA EN CALLS
    console.log('📞 1. VERIFICANDO LLAMADA ESPECÍFICA EN CALLS:');
    console.log('=============================================');
    
    const { data: llamadaEspecifica, error: llamadaError } = await supabase
      .from('calls')
      .select('*')
      .eq('conversation_id', 'conv_7601k1av6py5fchs0jv25xk297jp')
      .single();

    if (llamadaError) {
      console.error('❌ Error:', llamadaError);
    } else if (llamadaEspecifica) {
      console.log('✅ LLAMADA ENCONTRADA:');
      console.log(`   ID: ${llamadaEspecifica.id}`);
      console.log(`   conversation_id: ${llamadaEspecifica.conversation_id}`);
      console.log(`   status: ${llamadaEspecifica.status}`);
      console.log(`   analysis_completed: ${llamadaEspecifica.analysis_completed}`);
      console.log(`   tickets_created: ${llamadaEspecifica.tickets_created}`);
      console.log(`   ticket_ids: ${JSON.stringify(llamadaEspecifica.ticket_ids)}`);
      console.log(`   created_at: ${llamadaEspecifica.created_at}`);
      console.log(`   start_time: ${llamadaEspecifica.start_time}`);
      console.log(`   caller_id: ${llamadaEspecifica.caller_id}`);
      console.log(`   duration_seconds: ${llamadaEspecifica.duration_seconds}`);
      console.log(`   agent_messages: ${llamadaEspecifica.agent_messages}`);
      console.log(`   user_messages: ${llamadaEspecifica.user_messages}`);
      console.log(`   total_messages: ${llamadaEspecifica.total_messages}`);
    } else {
      console.log('❌ LLAMADA NO ENCONTRADA en calls');
    }

    console.log('\n');

    // 2. VERIFICAR ÚLTIMAS 10 LLAMADAS EN CALLS
    console.log('📋 2. ÚLTIMAS 10 LLAMADAS EN CALLS:');
    console.log('==================================');
    
    const { data: ultimasLlamadas, error: ultimasError } = await supabase
      .from('calls')
      .select('conversation_id, created_at, status, analysis_completed, tickets_created')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ultimasError) {
      console.error('❌ Error:', ultimasError);
    } else {
      ultimasLlamadas.forEach((call, index) => {
        const isTarget = call.conversation_id === 'conv_7601k1av6py5fchs0jv25xk297jp';
        const prefix = isTarget ? '🎯' : '  ';
        console.log(`${prefix} ${index + 1}. ${call.conversation_id}`);
        console.log(`     📅 created_at: ${call.created_at}`);
        console.log(`     🔄 status: ${call.status}`);
        console.log(`     🧠 analysis: ${call.analysis_completed ? 'SÍ' : 'NO'}`);
        console.log(`     🎫 tickets: ${call.tickets_created || 0}`);
        console.log('');
      });
    }

    // 3. VERIFICAR TICKETS DE LA LLAMADA ESPECÍFICA
    console.log('🎫 3. TICKETS DE LA LLAMADA ESPECÍFICA:');
    console.log('=====================================');
    
    if (llamadaEspecifica) {
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('call_id', llamadaEspecifica.id);

      if (ticketsError) {
        console.error('❌ Error consultando tickets:', ticketsError);
      } else if (tickets && tickets.length > 0) {
        console.log(`✅ ENCONTRADOS ${tickets.length} TICKETS:`);
        tickets.forEach((ticket, index) => {
          console.log(`   ${index + 1}. ID: ${ticket.id}`);
          console.log(`      call_id: ${ticket.call_id}`);
          console.log(`      conversation_id: ${ticket.conversation_id}`);
          console.log(`      tipo_incidencia: ${ticket.tipo_incidencia}`);
          console.log(`      cliente_id: ${ticket.cliente_id}`);
          console.log(`      status: ${ticket.status}`);
          console.log('');
        });
      } else {
        console.log('❌ NO SE ENCONTRARON TICKETS para esta llamada');
      }
    }

    // 4. VERIFICAR QUÉ CONSULTA HACE EL FRONTEND
    console.log('🌐 4. SIMULANDO CONSULTA DEL FRONTEND:');
    console.log('=====================================');
    
    // Esta es la consulta que hace voiceCallsRealDataService.ts
    const { data: frontendQuery, error: frontendError } = await supabase
      .from('calls')
      .select(`
        *,
        tickets_info:tickets(
          id,
          status,
          metadata
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (frontendError) {
      console.error('❌ Error en consulta frontend:', frontendError);
    } else {
      console.log(`✅ CONSULTA FRONTEND DEVUELVE ${frontendQuery.length} REGISTROS:`);
      
      const targetCall = frontendQuery.find(call => 
        call.conversation_id === 'conv_7601k1av6py5fchs0jv25xk297jp'
      );
      
      if (targetCall) {
        console.log('🎯 LLAMADA OBJETIVO ENCONTRADA EN CONSULTA FRONTEND:');
        console.log(`   conversation_id: ${targetCall.conversation_id}`);
        console.log(`   tickets_info: ${JSON.stringify(targetCall.tickets_info)}`);
        console.log(`   created_at: ${targetCall.created_at}`);
      } else {
        console.log('❌ LLAMADA OBJETIVO NO ENCONTRADA EN CONSULTA FRONTEND');
        console.log('');
        console.log('📋 LLAMADAS QUE SÍ DEVUELVE:');
        frontendQuery.slice(0, 5).forEach((call, index) => {
          console.log(`   ${index + 1}. ${call.conversation_id} (${call.created_at})`);
        });
      }
    }

    // 5. RESUMEN Y DIAGNÓSTICO
    console.log('\n');
    console.log('📊 5. RESUMEN DEL DIAGNÓSTICO:');
    console.log('=============================');
    
    if (llamadaEspecifica) {
      console.log('✅ La llamada SÍ existe en la tabla calls');
      console.log(`✅ Procesamiento completado: ${llamadaEspecifica.analysis_completed ? 'SÍ' : 'NO'}`);
      console.log(`✅ Tickets creados: ${llamadaEspecifica.tickets_created || 0}`);
      
      const enFrontend = frontendQuery && frontendQuery.some(call => 
        call.conversation_id === 'conv_7601k1av6py5fchs0jv25xk297jp'
      );
      
      if (enFrontend) {
        console.log('✅ La llamada SÍ aparece en la consulta del frontend');
        console.log('🔍 POSIBLE PROBLEMA: Cache o filtrado en el frontend');
      } else {
        console.log('❌ La llamada NO aparece en la consulta del frontend');
        console.log('🔍 POSIBLE PROBLEMA: JOIN con tickets o filtrado en la consulta');
      }
    } else {
      console.log('❌ La llamada NO existe en la tabla calls');
      console.log('🔍 PROBLEMA: El procesamiento no guardó la llamada correctamente');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

diagnosticoCompleto(); 