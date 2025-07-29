// 🎫 VERIFICACIÓN ESPECÍFICA: Ticket de David Zurita Jiménez
require('dotenv').config({ path: '../.env' });

async function verificarTicketDavid() {
  console.log('🎫 [VERIFICACIÓN] Ticket específico de David Zurita Jiménez\n');
  
  try {
    const { supabase } = require('./dist/lib/supabase.js');

    // 1. Obtener la llamada con tickets relacionados
    const { data: call, error } = await supabase
      .from('calls')
      .select(`
        id,
        conversation_id,
        ai_analysis,
        ticket_ids,
        tickets_created,
        tickets(*)
      `)
      .eq('conversation_id', 'conv_5301k1ar42b8fgh8b4cyy67e0srh')
      .single();

    if (error || !call) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📋 INFORMACIÓN GENERAL:');
    console.log('===============================================');
    console.log(`🆔 Call ID: ${call.id}`);
    console.log(`📞 Conversation ID: ${call.conversation_id}`);
    console.log(`🎫 Tickets creados: ${call.tickets_created}`);
    console.log(`🎫 Ticket IDs array: ${JSON.stringify(call.ticket_ids)}`);
    console.log('===============================================\n');

    // 2. Mostrar tickets de la tabla tickets
    console.log('🎫 TICKETS EN TABLA BD:');
    console.log('===============================================');
    if (call.tickets && call.tickets.length > 0) {
      call.tickets.forEach((ticket, index) => {
        console.log(`📋 Ticket ${index + 1}:`);
        console.log(`   🆔 ID: ${ticket.id}`);
        console.log(`   📊 Estado: ${ticket.status}`);
        console.log(`   📅 Creado: ${ticket.created_at}`);
        if (ticket.metadata) {
          console.log('   📋 Metadata:');
          Object.entries(ticket.metadata).forEach(([key, value]) => {
            console.log(`      ${key}: ${JSON.stringify(value)}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('⚠️ No hay tickets en la tabla tickets');
    }

    // 3. Mostrar información del análisis IA
    console.log('🧠 ANÁLISIS DE IA - ACCIONES REALIZADAS:');
    console.log('===============================================');
    if (call.ai_analysis) {
      console.log(`📋 Tipo incidencia: ${call.ai_analysis.tipo_incidencia}`);
      console.log(`🎯 Motivo gestión: ${call.ai_analysis.motivo_gestion}`);
      console.log(`👤 Cliente: ${call.ai_analysis.datos_extraidos?.nombreCompleto}`);
      console.log(`🏢 Código cliente: ${call.ai_analysis.datos_extraidos?.codigoCliente}`);
      console.log(`📞 Teléfono: ${call.ai_analysis.datos_extraidos?.telefono}`);
      console.log(`📧 Email: ${call.ai_analysis.datos_extraidos?.email}`);
      
      // Buscar información sobre acciones realizadas
      console.log('\n🎯 ACCIONES DETECTADAS EN EL ANÁLISIS:');
      
      if (call.ai_analysis.tickets_creados) {
        console.log('📝 TICKETS CREADOS:');
        call.ai_analysis.tickets_creados.forEach((t, i) => {
          console.log(`   ${i + 1}. ID: ${t.ticket_id || 'N/A'}`);
          console.log(`      Tipo: ${t.tipo_incidencia || 'N/A'}`);
          console.log(`      Cliente: ${t.cliente_id || 'N/A'}`);
          console.log(`      Estado: ${t.estado || 'N/A'}`);
        });
      }
      
      if (call.ai_analysis.rellamadas_creadas) {
        console.log('\n📞 RELLAMADAS CREADAS:');
        call.ai_analysis.rellamadas_creadas.forEach((r, i) => {
          console.log(`   ${i + 1}. Ticket relacionado: ${r.ticket_relacionado || 'N/A'}`);
          console.log(`      Estado: ${r.estado || 'N/A'}`);
          console.log(`      Motivo: ${r.motivo || 'N/A'}`);
        });
      }

      if (call.ai_analysis.clientes_creados) {
        console.log('\n👤 CLIENTES CREADOS:');
        call.ai_analysis.clientes_creados.forEach((c, i) => {
          console.log(`   ${i + 1}. Cliente ID: ${c.cliente_id || 'N/A'}`);
          console.log(`      Nombre: ${c.nombre || 'N/A'}`);
          console.log(`      Tipo: ${c.tipo || 'N/A'}`);
        });
      }

      // Mostrar resumen de ejecución si existe
      if (call.ai_analysis.resumen_ejecucion) {
        console.log('\n📊 RESUMEN DE EJECUCIÓN:');
        console.log(`   ${call.ai_analysis.resumen_ejecucion}`);
      }
    } else {
      console.log('❌ No hay análisis de IA disponible');
    }
    console.log('===============================================\n');

    // 4. Conclusiones para el frontend
    console.log('🎯 CONCLUSIONES PARA EL FRONTEND:');
    console.log('===============================================');
    console.log('✅ ACCIONES QUE DEBERÍAN MOSTRARSE:');
    
    const acciones = [];
    
    if (call.ai_analysis?.tickets_creados?.length > 0) {
      acciones.push(`📝 ${call.ai_analysis.tickets_creados.length} ticket(s) creado(s)`);
    }
    
    if (call.ai_analysis?.rellamadas_creadas?.length > 0) {
      acciones.push(`📞 ${call.ai_analysis.rellamadas_creadas.length} rellamada(s) creada(s)`);
    }
    
    if (call.ai_analysis?.clientes_creados?.length > 0) {
      acciones.push(`👤 ${call.ai_analysis.clientes_creados.length} cliente(s) creado(s)`);
    }

    if (acciones.length > 0) {
      acciones.forEach(accion => console.log(`   ${accion}`));
    } else {
      console.log('   ⚠️ No se detectaron acciones en el análisis');
    }
    
    console.log('\n🔧 PROBLEMA DETECTADO:');
    console.log('   • El análisis existe pero puede que no esté estructurado correctamente');
    console.log('   • Necesitamos mapear mejor la información para el frontend');
    console.log('   • La sección "Ticket" debe convertirse en "Acciones"');
    console.log('===============================================');

  } catch (error) {
    console.error('❌ [ERROR] Error en verificación:', error);
  }
}

// Ejecutar verificación
verificarTicketDavid(); 