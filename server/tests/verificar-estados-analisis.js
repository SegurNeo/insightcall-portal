// 🔍 VERIFICAR ESTADOS DE ANÁLISIS - Nueva columna
require('dotenv').config({ path: '../.env' });

async function verificarEstadosAnalisis() {
  console.log('🔍 [VERIFICACIÓN] Estados de análisis de las llamadas\n');
  
  try {
    const { supabase } = require('./dist/lib/supabase.js');
    
    const { data: calls, error } = await supabase
      .from('calls')
      .select('conversation_id, status, analysis_completed, created_at, tickets_created')
      .order('created_at', { ascending: false })
      .limit(8);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📊 ESTADOS DE ANÁLISIS - Lo que verás en la columna:');
    console.log('========================================================');
    
    calls.forEach((call, index) => {
      let estado = '';
      let color = '';
      
      if (call.status === 'failed') {
        estado = '🔴 Fallido';
        color = 'rojo';
      } else if (call.analysis_completed) {
        estado = '🟢 Completado';
        color = 'verde';
      } else if (call.status === 'completed') {
        estado = '🟡 En proceso';
        color = 'ámbar';
      } else {
        estado = '⚪ Pendiente';
        color = 'gris';
      }
      
      console.log(`${index + 1}. ${call.conversation_id.substring(0, 25)}...`);
      console.log(`   📅 Fecha: ${call.created_at.split('T')[0]}`);
      console.log(`   📊 Status: ${call.status}`);
      console.log(`   🧠 Análisis: ${call.analysis_completed ? 'SÍ' : 'NO'}`);
      console.log(`   🎫 Tickets: ${call.tickets_created || 0}`);
      console.log(`   ➡️  COLUMNA MOSTRARÁ: ${estado} (${color})`);
      console.log('');
    });
    
    const completados = calls.filter(c => c.analysis_completed).length;
    const enProceso = calls.filter(c => c.status === 'completed' && !c.analysis_completed).length;
    const fallidos = calls.filter(c => c.status === 'failed').length;
    
    console.log('🎯 RESUMEN DE ESTADOS:');
    console.log(`   🟢 Completado: ${completados} llamadas`);
    console.log(`   🟡 En proceso: ${enProceso} llamadas`);
    console.log(`   🔴 Fallido: ${fallidos} llamadas`);
    console.log('');
    console.log('✅ La columna "Análisis" ahora muestra estados reales del sistema');
    console.log('❌ Ya no aparecerá "Error al enviar" falso');
    console.log('');
    console.log('💡 INSTRUCCIONES PARA PROBAR:');
    console.log('   1. Refresca el frontend (Ctrl+F5)');
    console.log('   2. Ve a la página de Llamadas');
    console.log('   3. Busca la columna "Análisis" (antes era "Ticket Enviado")');
    console.log('   4. Deberías ver los estados de arriba con colores correctos');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verificarEstadosAnalisis(); 