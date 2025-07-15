const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://zbunqgzxbvfcqhcxfvgz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpidW5xZ3p4YnZmY3FoY3hmdmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3MTQ2MjYsImV4cCI6MjA1MDI5MDYyNn0.jJGFPJZNGhBjpIUvvqyPJ3jSWz6tNxEpvGG5WOpjhUA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCall() {
  console.log('🔍 Buscando llamada: conv_01k06rddgvebrrbssz4n7tyefj');
  
  try {
    // Buscar en la tabla calls (nuevo sistema)
    const { data: callsData, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('conversation_id', 'conv_01k06rddgvebrrbssz4n7tyefj');
    
    if (callsError) {
      console.log('❌ Error en tabla calls:', callsError);
    } else {
      console.log('📞 Datos en tabla calls:', JSON.stringify(callsData, null, 2));
    }
    
    // Buscar en la tabla processed_calls (sistema legacy)
    const { data: processedData, error: processedError } = await supabase
      .from('processed_calls')
      .select('*')
      .eq('segurneo_external_call_id', 'conv_01k06rddgvebrrbssz4n7tyefj');
    
    if (processedError) {
      console.log('❌ Error en tabla processed_calls:', processedError);
    } else {
      console.log('📋 Datos en tabla processed_calls:', JSON.stringify(processedData, null, 2));
    }
    
    // Buscar tickets relacionados
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .or('conversation_id.eq.conv_01k06rddgvebrrbssz4n7tyefj,call_id.eq.conv_01k06rddgvebrrbssz4n7tyefj');
    
    if (ticketsError) {
      console.log('❌ Error en tickets:', ticketsError);
    } else {
      console.log('🎫 Tickets encontrados:', JSON.stringify(ticketsData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkCall().catch(console.error); 