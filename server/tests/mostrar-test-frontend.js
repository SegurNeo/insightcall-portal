// 🧪 MOSTRAR LLAMADA DE TEST - Frontend
require('dotenv').config({ path: '../.env' });

async function mostrarLlamadaTest() {
  console.log('🧪 [LLAMADA DE TEST] ¿Cómo se ve la nueva estructura?\n');
  
  try {
    const { supabase } = require('./dist/lib/supabase.js');
    
    const { data: call, error } = await supabase
      .from('calls')
      .select('*')
      .eq('conversation_id', 'test_new_executor_12345')
      .single();

    if (error || !call) {
      console.error('❌ No se encontró la llamada de test');
      return;
    }

    console.log('📱 INFORMACIÓN PARA EL FRONTEND:');
    console.log('=====================================');
    console.log(`🆔 ID: ${call.conversation_id}`);
    console.log(`📅 Fecha: ${call.created_at.split('T')[0]}`);
    console.log(`⏱️ Duración: ${call.duration_seconds}s`);
    console.log(`🧠 Análisis completado: ${call.analysis_completed}`);
    console.log('');
    
    if (call.ai_analysis) {
      console.log('🎯 ACCIONES QUE DEBERÍAS VER EN LA PESTAÑA "ACCIONES":');
      console.log('======================================================');
      
      if (call.ai_analysis.tickets_creados && call.ai_analysis.tickets_creados.length > 0) {
        console.log(`📝 TICKETS CREADOS (${call.ai_analysis.tickets_creados.length}):`);
        call.ai_analysis.tickets_creados.forEach((t, i) => {
          console.log(`   ${i + 1}. #${t.ticket_id}`);
          console.log(`      Tipo: ${t.tipo_incidencia}`);
          console.log(`      Cliente: ${t.cliente_id}`);
          console.log(`      Estado: ${t.estado} ✅`);
          console.log(`      Motivo: ${t.motivo_gestion}`);
        });
        console.log('');
      }
      
      if (call.ai_analysis.rellamadas_creadas && call.ai_analysis.rellamadas_creadas.length > 0) {
        console.log(`📞 RELLAMADAS (${call.ai_analysis.rellamadas_creadas.length}):`);
        call.ai_analysis.rellamadas_creadas.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.followup_id || 'N/A'}`);
          console.log(`      Estado: ${r.estado}`);
          console.log(`      Ticket relacionado: ${r.ticket_relacionado}`);
        });
        console.log('');
      } else {
        console.log('📞 RELLAMADAS: Ninguna');
        console.log('');
      }
      
      if (call.ai_analysis.clientes_creados && call.ai_analysis.clientes_creados.length > 0) {
        console.log(`👤 CLIENTES CREADOS (${call.ai_analysis.clientes_creados.length}):`);
        call.ai_analysis.clientes_creados.forEach((c, i) => {
          console.log(`   ${i + 1}. ${c.nombre}`);
          console.log(`      ID: ${c.cliente_id}`);
          console.log(`      Tipo: ${c.tipo}`);
          console.log(`      Estado: ${c.estado}`);
        });
        console.log('');
      } else {
        console.log('👤 CLIENTES CREADOS: Ninguno (cliente existente)');
        console.log('');
      }
      
      if (call.ai_analysis.resumen_ejecucion) {
        console.log(`📊 RESUMEN: ${call.ai_analysis.resumen_ejecucion}`);
        console.log('');
      }
    }
    
    console.log('🎯 INSTRUCCIONES PARA VER LA SECCIÓN:');
    console.log('=====================================');
    console.log('1. Abre el frontend en: http://localhost:8083/ (o puerto actual)');
    console.log('2. Ve a la página de Llamadas');
    console.log('3. Busca la llamada: test_new_executor_12345');
    console.log('4. Haz clic en el botón "Ver detalles"');
    console.log('5. Ve a la pestaña "Acciones" (nueva)');
    console.log('6. ¡Deberías ver la información de arriba!');
    console.log('');
    console.log('⚠️  IMPORTANTE:');
    console.log('   • Las llamadas ANTIGUAS (como la de David) NO tendrán acciones');
    console.log('   • Solo las llamadas NUEVAS mostrarán esta información');
    console.log('   • La sección dirá "No se realizaron acciones automáticas" en llamadas antiguas');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

mostrarLlamadaTest(); 