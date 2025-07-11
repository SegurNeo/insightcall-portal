// 🔍 TEST DIRECTO: Reproducir error 500 sin dependencias de Supabase
const axios = require('axios');

async function testTicketCreation() {
  console.log('🔍 TEST: Reproduciendo error 500 en creación de tickets...');
  
  try {
    // Simular payload exacto que genera el sistema
    const payload = {
      IdCliente: "125296F00", // Cliente real de la llamada
      IdTicket: "IA-20250711-002",
      IdLlamada: "conv_01jzvd2awmft5srw40b96hgpbb",
      TipoIncidencia: "Consulta",
      MotivoIncidencia: "Información general",
      NumeroPoliza: "N/A",
      Notas: "Cliente David (DNI: 52108149Q) contactó solicitando una grúa. Tenía una incidencia abierta de retención de cliente cartera, pero su solicitud actual era por asistencia en carretera. [Generado automáticamente - Alta confianza]",
      FicheroLlamada: ""
    };

    console.log('📤 Payload completo:', JSON.stringify(payload, null, 2));

    // Enviar con debug detallado
    const response = await axios.post('https://segurneo-voice.onrender.com/api/crear-ticket', payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nogal-InsightCall-Portal/1.0'
      },
      timeout: 15000
    });

    console.log('✅ ÉXITO - Respuesta:', response.data);
    console.log('📊 Status:', response.status);
    
  } catch (error) {
    console.error('❌ ERROR REPRODUCED:');
    console.error('Status:', error.response?.status);
    console.error('StatusText:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Headers:', error.response?.headers);
    
    // Análisis detallado del error
    if (error.response?.status === 500) {
      console.log('\n🔍 ANÁLISIS DEL ERROR 500:');
      console.log('- Error interno del servidor Segurneo Voice');
      console.log('- Posible problema con el formato de datos');
      console.log('- Verificar campos requeridos');
      
      // Intentar con payload mínimo
      console.log('\n🧪 Probando con payload mínimo...');
      await testMinimalPayload();
    }
  }
}

async function testMinimalPayload() {
  try {
    const minimalPayload = {
      IdCliente: "125296F00",
      IdTicket: "IA-20250711-003",
      IdLlamada: "conv_test",
      TipoIncidencia: "Consulta",
      MotivoIncidencia: "Test",
      NumeroPoliza: "N/A",
      Notas: "Test minimo",
      FicheroLlamada: ""
    };

    console.log('📤 Payload mínimo:', JSON.stringify(minimalPayload, null, 2));

    const response = await axios.post('https://segurneo-voice.onrender.com/api/crear-ticket', minimalPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Payload mínimo FUNCIONA:', response.data);
    console.log('🎯 El problema está en algún campo específico del payload completo');
    
  } catch (error) {
    console.error('❌ Payload mínimo también falla:', error.response?.data);
  }
}

// Test adicional: verificar formato de campos específicos
async function testFieldValidation() {
  console.log('\n🔍 Validando campos específicos...');
  
  const problematicFields = [
    'IdCliente: "125296F00"',
    'IdLlamada: "conv_01jzvd2awmft5srw40b96hgpbb"',
    'Notas: con descripción larga',
    'TipoIncidencia: "Consulta"',
    'MotivoIncidencia: "Información general"'
  ];
  
  console.log('Campos a validar:', problematicFields);
  
  // Probar con caracteres especiales en Notas
  const testNotas = [
    "Descripción simple",
    "Descripción con (paréntesis)",
    "Descripción con [corchetes]",
    "Descripción con acentos: información, conclusión",
    "Descripción con : dos puntos",
    "Descripción con - guiones",
    "Descripción con . puntos.",
    "Descripción con , comas,"
  ];
  
  for (const nota of testNotas) {
    console.log(`\n🧪 Probando nota: "${nota}"`);
    
    try {
      const payload = {
        IdCliente: "125296F00",
        IdTicket: `IA-20250711-${Date.now().toString().slice(-3)}`,
        IdLlamada: "conv_test",
        TipoIncidencia: "Consulta",
        MotivoIncidencia: "Test",
        NumeroPoliza: "N/A",
        Notas: nota,
        FicheroLlamada: ""
      };
      
      await axios.post('https://segurneo-voice.onrender.com/api/crear-ticket', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });
      
      console.log('✅ Nota válida');
      
    } catch (error) {
      console.error('❌ Nota problemática:', error.response?.status, error.response?.data);
    }
  }
}

// Ejecutar tests
console.log('🚀 Iniciando batería de tests...');
testTicketCreation()
  .then(() => testFieldValidation())
  .catch(console.error); 