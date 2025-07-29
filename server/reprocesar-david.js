// 🔄 REPROCESAR LLAMADA DE DAVID - Nueva estructura
require('dotenv').config({ path: '../.env' });

async function reprocesarDavid() {
  console.log('🔄 [REPROCESAMIENTO] Llamada de David con nuevo sistema\n');
  
  try {
    const { supabase } = require('./dist/lib/supabase.js');
    
    // 1. Obtener datos originales de David
    const { data: davidCall, error } = await supabase
      .from('calls')
      .select('*')
      .eq('conversation_id', 'conv_5301k1ar42b8fgh8b4cyy67e0srh')
      .single();

    if (error || !davidCall) {
      console.error('❌ No se encontró la llamada de David');
      return;
    }

    console.log('📋 Datos actuales de David:');
    console.log(`   🎫 Tickets creados: ${davidCall.tickets_created}`);
    console.log(`   🎫 Ticket IDs: ${JSON.stringify(davidCall.ticket_ids)}`);
    console.log(`   🧠 Análisis: ${davidCall.analysis_completed ? 'SÍ' : 'NO'}`);
    
    if (davidCall.ai_analysis?.tickets_creados) {
      console.log(`   📝 Estructura nueva: SÍ (${davidCall.ai_analysis.tickets_creados.length} tickets)`);
    } else {
      console.log('   📝 Estructura nueva: NO');
    }
    
    console.log('\n🚀 Aplicando estructura nueva manualmente...');
    
    // 2. Crear estructura nueva basada en los logs anteriores
    const nuevaEstructura = {
      tipo_incidencia: 'Solicitud duplicado póliza',
      motivo_gestion: 'Email',
      confidence: 0.95,
      prioridad: 'medium',
      resumen_analisis: 'Crear un ticket para el envío del duplicado de póliza por email y marcar la incidencia para seguimiento.',
      datos_extraidos: {
        nombreCompleto: 'David Zurita Jiménez',
        telefono: '647929978',
        email: 'raquelbecerra1978.com',
        codigoCliente: '125296F00',
        numeroPoliza: 'AU0420245310016',
        ramo: 'AUTO'
      },
      // 🎯 ACCIONES REALIZADAS (según logs anteriores)
      tickets_creados: [{
        ticket_id: 'IA-20250729-001',
        tipo_incidencia: 'Solicitud duplicado póliza',
        motivo_gestion: 'Email',
        cliente_id: '125296F00',
        estado: 'created',
        error: null
      }],
      rellamadas_creadas: [{
        ticket_relacionado: 'NG3291093',
        followup_id: 'NG3291093', 
        estado: 'created',
        motivo: 'Seguimiento de incidencia existente sobre retención de cliente',
        error: null
      }],
      clientes_creados: [], // Cliente existente
      resumen_ejecucion: 'Acciones completadas: 1 ticket creado + 1 rellamada para seguimiento'
    };

    // 3. Actualizar la base de datos
    const { error: updateError } = await supabase
      .from('calls')
      .update({
        ai_analysis: nuevaEstructura,
        updated_at: new Date().toISOString()
      })
      .eq('conversation_id', 'conv_5301k1ar42b8fgh8b4cyy67e0srh');

    if (updateError) {
      console.error('❌ Error actualizando:', updateError);
      return;
    }

    console.log('✅ ¡Llamada de David actualizada con nueva estructura!');
    console.log('');
    console.log('🎯 Ahora David debería mostrar en "Acciones":');
    console.log('   📝 1 ticket creado: IA-20250729-001');
    console.log('   📞 1 rellamada creada: NG3291093');
    console.log('   👤 0 clientes creados (existente)');
    console.log('');
    console.log('💡 Recarga el frontend y prueba la llamada de David');
    console.log('   • ID: conv_5301k1ar42b8fgh8b4cyy67e0srh');
    console.log('   • Debería aparecer pestaña "Acciones" con 2 acciones');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

reprocesarDavid(); 