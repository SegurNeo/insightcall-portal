// 🧪 TEST: Verificar envío del ticket de la llamada actual
// Simular el procesamiento de la llamada conv_01jzvd2awmft5srw40b96hgpbb

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuración
const SUPABASE_URL = 'https://zfmrknubpbzsowfatnbq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmbXJrbnVicGJ6c293ZmF0bmJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzYxMzEwMCwiZXhwIjoyMDYzMTg5MTAwfQ.H6J7-J9yWKww1FXQGxdtMSMOXJULgJVJwZnKQMKfGFI';
const CONVERSATION_ID = 'conv_01jzvd2awmft5srw40b96hgpbb';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testCurrentCall() {
  console.log('🧪 TEST: Verificando envío del ticket de la llamada actual...');
  
  try {
    // 1. Obtener el ticket actual
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('call_id', (await supabase
        .from('calls')
        .select('id')
        .eq('conversation_id', CONVERSATION_ID)
        .single()).data?.id)
      .single();

    if (ticketError) {
      console.error('❌ Error obteniendo ticket:', ticketError);
      return;
    }

    console.log('📋 Ticket encontrado:', {
      id: ticket.id,
      id_cliente: ticket.metadata?.id_cliente,
      confidence: ticket.metadata?.confidence,
      status: ticket.status,
      nogal_status: ticket.metadata?.nogal_status
    });

    // 2. Verificar datos del cliente
    const idCliente = ticket.metadata?.id_cliente;
    const confidence = parseFloat(ticket.metadata?.confidence || '0');

    if (!idCliente) {
      console.error('❌ ERROR: No hay ID cliente en el ticket');
      return;
    }

    if (confidence < 0.7) {
      console.error(`❌ ERROR: Confianza muy baja: ${confidence * 100}%`);
      return;
    }

    console.log(`✅ Datos válidos para envío: ${idCliente} (${confidence * 100}%)`);

    // 3. Preparar payload para Segurneo Voice
    const payload = {
      IdCliente: idCliente,
      IdTicket: `IA-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      IdLlamada: CONVERSATION_ID,
      TipoIncidencia: ticket.metadata?.incident_type || 'Consulta',
      MotivoIncidencia: ticket.metadata?.management_reason || 'Información general',
      NumeroPoliza: ticket.metadata?.numeroPoliza || 'N/A',
      Notas: ticket.description || 'Ticket generado automáticamente',
      FicheroLlamada: ""
    };

    console.log('📤 Payload a enviar:', JSON.stringify(payload, null, 2));

    // 4. Enviar a Segurneo Voice
    console.log('🚀 Enviando a Segurneo Voice...');
    
    const response = await axios.post('https://segurneo-voice.onrender.com/api/crear-ticket', payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log('✅ ÉXITO - Respuesta de Segurneo Voice:', response.data);

    // 5. Actualizar ticket en BD
    const { error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'completed',
        metadata: {
          ...ticket.metadata,
          nogal_status: 'sent_to_nogal',
          nogal_sent_at: new Date().toISOString(),
          segurneo_response: response.data,
          ticket_id: payload.IdTicket
        }
      })
      .eq('id', ticket.id);

    if (updateError) {
      console.error('❌ Error actualizando ticket en BD:', updateError);
    } else {
      console.log('✅ Ticket actualizado en BD con estado: completed');
    }

    console.log('🎉 TEST COMPLETADO EXITOSAMENTE');

  } catch (error) {
    console.error('❌ ERROR en el test:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('ℹ️  Esto podría ser un error temporal del servidor de Segurneo Voice');
    }
  }
}

// Ejecutar test
testCurrentCall().catch(console.error); 