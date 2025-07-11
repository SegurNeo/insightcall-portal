// 🔍 DEBUG: Investigar el error 500 en creación de tickets
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = 'https://zfmrknubpbzsowfatnbq.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmbXJrbnVicGJ6c293ZmF0bmJxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzYxMzEwMCwiZXhwIjoyMDYzMTg5MTAwfQ.H6J7-J9yWKww1FXQGxdtMSMOXJULgJVJwZnKQMKfGFI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debugRecentTickets() {
  console.log('🔍 DEBUG: Investigando tickets recientes...');
  
  try {
    // 1. Obtener los tickets más recientes
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        metadata,
        description,
        calls(conversation_id)
      `)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ Error obteniendo tickets:', error);
      return;
    }

    console.log(`📋 Encontrados ${tickets.length} tickets recientes:`);
    
    for (const ticket of tickets) {
      console.log('\n' + '='.repeat(50));
      console.log(`🎫 Ticket: ${ticket.id}`);
      console.log(`📅 Creado: ${new Date(ticket.created_at).toLocaleString()}`);
      console.log(`🔄 Status: ${ticket.status}`);
      console.log(`📞 Conversación: ${ticket.calls?.conversation_id || 'N/A'}`);
      
      // Analizar metadata
      const metadata = ticket.metadata || {};
      console.log(`👤 ID Cliente: ${metadata.id_cliente || 'N/A'}`);
      console.log(`🎯 Confidence: ${metadata.confidence || 'N/A'}`);
      console.log(`📤 Nogal Status: ${metadata.nogal_status || 'N/A'}`);
      
      if (metadata.nogal_error) {
        console.log(`❌ Error Nogal: ${metadata.nogal_error}`);
      }
      
      if (metadata.nogal_failed_at) {
        console.log(`⏰ Falló en: ${new Date(metadata.nogal_failed_at).toLocaleString()}`);
      }
      
      // Si hay error, intentar reenviar con debug
      if (metadata.nogal_status === 'failed_send' && metadata.id_cliente) {
        console.log('\n🔄 Intentando reenviar con debug...');
        await debugTicketSend(ticket, metadata);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

async function debugTicketSend(ticket, metadata) {
  try {
    // Preparar payload exacto como lo hace el sistema
    const payload = {
      IdCliente: metadata.id_cliente,
      IdTicket: `IA-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      IdLlamada: ticket.calls?.conversation_id || 'debug-test',
      TipoIncidencia: metadata.incident_type || 'Consulta',
      MotivoIncidencia: metadata.management_reason || 'Debug test',
      NumeroPoliza: metadata.numeroPoliza || 'N/A',
      Notas: ticket.description || 'Debug reenvío',
      FicheroLlamada: ""
    };

    console.log('📤 Payload de debug:', JSON.stringify(payload, null, 2));

    // Enviar con debug detallado
    const response = await axios.post('https://segurneo-voice.onrender.com/api/crear-ticket', payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'InsightCall-Debug/1.0'
      },
      timeout: 15000
    });

    console.log('✅ Respuesta exitosa:', response.data);
    console.log('📊 Status Code:', response.status);
    
  } catch (error) {
    console.error('❌ Error detallado en envío:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Headers:', error.response?.headers);
    console.error('Config:', error.config);
    
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout - el servidor no respondió en 15 segundos');
    }
  }
}

// Ejecutar debug
debugRecentTickets().catch(console.error); 