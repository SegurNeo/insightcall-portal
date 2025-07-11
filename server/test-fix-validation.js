// 🧪 TEST: Verificar que el fix de sanitización funciona
const axios = require('axios');

function sanitizeNumeroPoliza(numeroPoliza) {
  if (!numeroPoliza || numeroPoliza.trim() === '') {
    return 'N/A';
  }
  
  // ✅ FIX: Nogal no acepta múltiples pólizas separadas por comas
  // Convertir comas a pipes que sí acepta
  const sanitized = numeroPoliza
    .trim()
    .replace(/,\s*/g, '|') // Reemplazar "," y ", " por "|"
    .replace(/\s+/g, ' ');  // Normalizar espacios
  
  console.log(`🧹 Sanitizando NumeroPoliza: "${numeroPoliza}" → "${sanitized}"`);
  
  return sanitized;
}

async function testFixValidation() {
  console.log('🧪 TEST: Verificando que el fix funciona...');
  
  // Reproducir payload exacto que falló, pero con sanitización
  const originalPayload = {
    IdCliente: "1080901F00",
    IdLlamada: "conv_01jzve5hhzf4rs9pcmrd61x46k",
    TipoIncidencia: "Reclamación cliente regalo",
    MotivoIncidencia: "Reclamación atención al cliente",
    NumeroPoliza: "5951086, D6Z020016684, H5084988", // ❌ Formato que causa error
    Notas: "La clienta Isabel, identificada con el DNI 37683988Y, llama para reclamar un regalo que se le prometió por recomendar a otro cliente. El agente virtual no puede gestionar la reclamación y la transfiere a un compañero.\n\n[Generado automáticamente - Alta confianza]",
    IdTicket: "IA-20250711-FIX"
  };
  
  console.log('❌ PAYLOAD ORIGINAL (que falla):');
  console.log(`NumeroPoliza: "${originalPayload.NumeroPoliza}"`);
  
  // Aplicar sanitización
  const fixedPayload = {
    ...originalPayload,
    NumeroPoliza: sanitizeNumeroPoliza(originalPayload.NumeroPoliza), // ✅ Aplicar fix
    IdTicket: "IA-20250711-FIXED"
  };
  
  console.log('\n✅ PAYLOAD FIJO (debería funcionar):');
  console.log(`NumeroPoliza: "${fixedPayload.NumeroPoliza}"`);
  
  try {
    console.log('\n🚀 Enviando payload fijo...');
    
    const response = await axios.post('https://segurneo-voice.onrender.com/api/crear-ticket', fixedPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Nogal-InsightCall-Portal/1.0'
      },
      timeout: 15000
    });
    
    console.log('🎉 ¡FIX EXITOSO!');
    console.log('✅ Respuesta:', response.data);
    console.log('📊 Status:', response.status);
    
    // Verificar que el ticket se creó correctamente
    if (response.data.success && response.data.ticket_id) {
      console.log(`\n🎯 SOLUCIÓN CONFIRMADA:`);
      console.log(`- Ticket ID: ${response.data.ticket_id}`);
      console.log(`- NumeroPoliza sanitizada: "${fixedPayload.NumeroPoliza}"`);
      console.log(`- El error 500 está RESUELTO ✅`);
    }
    
  } catch (error) {
    console.error('❌ El fix NO funcionó:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Errors:', error.response?.data?.errors);
  }
}

// Test adicional: probar varios casos de sanitización
async function testSanitizationCases() {
  console.log('\n🧪 TEST: Casos de sanitización...');
  
  const testCases = [
    "5951086, D6Z020016684, H5084988",          // Comas con espacios
    "5951086,D6Z020016684,H5084988",            // Comas sin espacios
    "5951086 , D6Z020016684 , H5084988",        // Comas con espacios extra
    "5951086",                                  // Una sola póliza
    "",                                         // Vacío
    null,                                       // Null
    undefined,                                  // Undefined
    "   5951086, D6Z020016684   "               // Con espacios al inicio y final
  ];
  
  for (const testCase of testCases) {
    const result = sanitizeNumeroPoliza(testCase);
    console.log(`Input: "${testCase}" → Output: "${result}"`);
  }
}

// Ejecutar tests
testFixValidation()
  .then(() => testSanitizationCases())
  .catch(console.error); 