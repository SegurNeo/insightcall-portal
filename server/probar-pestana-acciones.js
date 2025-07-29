// 🎯 PROBAR PESTAÑA ACCIONES - Verificación completa
require('dotenv').config({ path: '../.env' });

async function probarPestanaAcciones() {
  console.log('🎯 [VERIFICACIÓN] Pestaña Acciones - CallDetailsSidebar\n');
  
  try {
    const { supabase } = require('./dist/lib/supabase.js');
    
    // 1. Buscar llamadas con ai_analysis estructurado
    const { data: calls, error } = await supabase
      .from('calls')
      .select('conversation_id, analysis_completed, ai_analysis, tickets_created, ticket_ids')
      .not('ai_analysis', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('🔍 LLAMADAS CON DATOS PARA LA PESTAÑA "ACCIONES":');
    console.log('=====================================================');
    
    calls.forEach((call, index) => {
      console.log(`\n${index + 1}. ${call.conversation_id}`);
      console.log(`   🧠 Análisis completado: ${call.analysis_completed ? 'SÍ' : 'NO'}`);
      console.log(`   🎫 Tickets creados: ${call.tickets_created || 0}`);
      console.log(`   🆔 Ticket IDs: ${JSON.stringify(call.ticket_ids || [])}`);
      
      if (call.ai_analysis) {
        const ai = call.ai_analysis;
        
        // Verificar estructura de acciones
        const ticketsCreados = ai.tickets_creados || [];
        const rellamadasCreadas = ai.rellamadas_creadas || [];
        const clientesCreados = ai.clientes_creados || [];
        
        console.log('   ');
        console.log('   📋 ACCIONES QUE SE MOSTRARÁN EN LA PESTAÑA:');
        console.log('   ============================================');
        
        if (clientesCreados.length > 0) {
          clientesCreados.forEach((cliente, i) => {
            console.log(`     👤 Cliente ${i + 1}: ${cliente.nombre || 'N/A'} (${cliente.estado || 'unknown'})`);
          });
        }
        
        if (ticketsCreados.length > 0) {
          ticketsCreados.forEach((ticket, i) => {
            console.log(`     🎫 Ticket ${i + 1}: ${ticket.ticket_id} - ${ticket.tipo_incidencia} (${ticket.estado})`);
          });
        }
        
        if (rellamadasCreadas.length > 0) {
          rellamadasCreadas.forEach((rellamada, i) => {
            console.log(`     📞 Rellamada ${i + 1}: ${rellamada.followup_id || 'ID no disponible'} (${rellamada.estado})`);
          });
        }
        
        if (ticketsCreados.length === 0 && rellamadasCreadas.length === 0 && clientesCreados.length === 0) {
          console.log('     ⚠️  Sin acciones específicas en ai_analysis');
        }
        
        console.log(`   📝 Resumen: ${ai.resumen_ejecucion || 'No disponible'}`);
      } else {
        console.log('   ❌ ai_analysis: null (no se mostrará pestaña Acciones)');
      }
    });
    
    console.log('\n\n🎯 CÓMO PROBAR LA PESTAÑA ACCIONES:');
    console.log('===================================');
    console.log('1. 🌐 Abre el frontend en el navegador');
    console.log('2. 📋 Ve a la página de "Llamadas"');
    console.log('3. 🔍 Busca una de estas llamadas:');
    calls.forEach((call, index) => {
      console.log(`   ${index + 1}. ${call.conversation_id}`);
    });
    console.log('4. 👆 Haz clic en "Ver detalles"');
    console.log('5. 📑 Busca la pestaña "Acciones" (con icono Activity)');
    console.log('6. ✅ Deberías ver el timeline cronológico con las acciones');
    
    console.log('\n\n🔧 COMPONENTES ACTUALIZADOS:');
    console.log('============================');
    console.log('✅ CallDetailsSidebar: Pestaña "Tickets" → "Acciones"');
    console.log('✅ CallActionsSection: Timeline de acciones IA');
    console.log('✅ Columna "Análisis": Estados reales del sistema');
    console.log('');
    console.log('🎉 ¡La pestaña "Acciones" debería funcionar correctamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

probarPestanaAcciones(); 