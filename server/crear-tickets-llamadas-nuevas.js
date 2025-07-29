// 🎯 CREAR TICKETS PARA NUEVAS LLAMADAS - Específico para conv_2001 y conv_2801
require('dotenv').config({ path: '../.env' });
const { v4: uuidv4 } = require('uuid');

async function crearTicketsLlamadasNuevas() {
  console.log('🎯 [CREACIÓN] Tickets para las 2 llamadas nuevas específicas\n');
  
  try {
    const { supabase } = require('./dist/lib/supabase.js');

    const llamadasObjetivo = [
      {
        conversation_id: 'conv_2001k1avsd8af7rsg2rrpmxdx74g',
        tipo: 'Llamada gestión comercial',
        motivo: 'Consulta cliente',
        cliente: '701795F00',
        nombre: 'JAVIER GARCIA RODRIGUEZ'
      },
      {
        conversation_id: 'conv_2801k1avzac1ey9a2nsxkb55ewzf', 
        tipo: 'Modificación póliza emitida',
        motivo: 'Corrección datos erróneos en póliza',
        cliente: '701795F00',
        nombre: 'Javier García'
      }
    ];

    let ticketsCreados = 0;

    for (const target of llamadasObjetivo) {
      console.log(`📞 Procesando: ${target.conversation_id}`);
      
      // Obtener datos de la llamada
      const { data: llamada, error: llamadaError } = await supabase
        .from('calls')
        .select('id, conversation_id, ticket_ids, caller_id, created_at')
        .eq('conversation_id', target.conversation_id)
        .single();
        
      if (llamadaError || !llamada) {
        console.log(`❌ Error: ${llamadaError?.message || 'No encontrada'}`);
        continue;
      }
      
      console.log(`   ✅ Encontrada: ${llamada.id}`);
      console.log(`   🎫 ticket_ids: ${JSON.stringify(llamada.ticket_ids)}`);
      
      if (llamada.ticket_ids && llamada.ticket_ids.length > 0) {
        const nogalTicketId = llamada.ticket_ids[0];
        const ticketUuid = uuidv4();
        
        const descripcion = `Ticket automático generado por IA

📞 Llamada: ${target.conversation_id}
🕐 Fecha: ${new Date(llamada.created_at).toLocaleDateString()}
👤 Cliente: ${target.cliente} (${target.nombre})
📱 Teléfono: ${llamada.caller_id || 'No disponible'}

🧠 Análisis IA:
• Tipo: ${target.tipo}
• Motivo: ${target.motivo}
• Estado: completed

🎫 ID Nogal: ${nogalTicketId}
📝 Creado retroactivamente para mostrar en frontend`;

        const ticketData = {
          id: ticketUuid,
          tipo_incidencia: target.tipo,
          motivo_incidencia: target.motivo,
          status: 'completed',
          priority: 'medium',
          description: descripcion,
          call_id: llamada.id,
          assignee_id: null,
          metadata: {
            source: 'ai-auto-generated-retroactive-fix',
            conversation_id: target.conversation_id,
            cliente_id: target.cliente,
            nogal_ticket_id: nogalTicketId,
            original_ticket_id: nogalTicketId,
            caller_id: llamada.caller_id,
            created_by_system: 'RetroactiveTicketCreation',
            nogal_status: 'sent_to_nogal',
            generated_uuid: ticketUuid,
            fix_date: new Date().toISOString()
          }
        };
        
        console.log(`   🎫 Creando: ${ticketUuid}`);
        console.log(`   📋 Nogal: ${nogalTicketId}`);
        
        const { error: insertError } = await supabase
          .from('tickets')
          .insert([ticketData]);
          
        if (insertError) {
          console.log(`   ❌ Error: ${insertError.message}`);
        } else {
          console.log(`   ✅ ¡Ticket creado!`);
          ticketsCreados++;
        }
      } else {
        console.log(`   ⚠️  Sin ticket_ids`);
      }
      
      console.log('');
    }

    // Verificación final
    console.log('🌐 VERIFICACIÓN FINAL:');
    console.log('=====================');
    
    const { data: resultado, error: resultadoError } = await supabase
      .from('calls')
      .select(`
        conversation_id,
        tickets_created,
        tickets_info:tickets(id, tipo_incidencia, status, created_at)
      `)
      .in('conversation_id', llamadasObjetivo.map(l => l.conversation_id))
      .order('created_at', { ascending: false });
      
    if (resultadoError) {
      console.error('❌ Error verificación:', resultadoError);
    } else {
      resultado.forEach(call => {
        console.log(`📞 ${call.conversation_id}:`);
        console.log(`   tickets_created: ${call.tickets_created}`);
        console.log(`   tickets en tabla: ${call.tickets_info.length}`);
        
        if (call.tickets_info.length > 0) {
          call.tickets_info.forEach((ticket, i) => {
            console.log(`     ${i+1}. ${ticket.id.substring(0, 8)}... - ${ticket.tipo_incidencia}`);
            console.log(`        Status: ${ticket.status}`);
          });
        }
        console.log('');
      });
      
      console.log('📊 RESUMEN:');
      console.log(`✅ Tickets creados en esta ejecución: ${ticketsCreados}`);
      console.log(`✅ Total llamadas procesadas: ${resultado.length}`);
      
      if (ticketsCreados > 0) {
        console.log('');
        console.log('🎉 ¡PROBLEMA RESUELTO!');
        console.log('✅ Las nuevas llamadas ahora tienen tickets');
        console.log('✅ El JOIN del frontend funcionará');
        console.log('✅ Las llamadas aparecerán en la tabla');
        console.log('');
        console.log('🚀 INSTRUCCIONES FINALES:');
        console.log('1. 🌐 Refresca el frontend completamente (Ctrl+F5)');
        console.log('2. 📋 Ve a la página "Llamadas"');
        console.log('3. 🔍 Busca las llamadas conv_2001... y conv_2801...');
        console.log('4. ✅ Deberían aparecer ahora en la lista');
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

crearTicketsLlamadasNuevas(); 