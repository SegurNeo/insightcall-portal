// 🔍 TEST: Validar campos específicos que causan error 500 en Nogal
const axios = require('axios');

async function testNogalValidation() {
  console.log('🔍 TEST: Validando campos problemáticos en Nogal...');
  
  // Test 1: Tipos de incidencia válidos
  const tiposIncidencia = [
    "Consulta",
    "Reclamación cliente regalo",
    "Llamada gestión comercial",
    "Modificación póliza emitida",
    "Llamada asistencia en carretera",
    "Retención de Cliente Cartera",
    "Cancelación antes de efecto"
  ];
  
  // Test 2: Motivos de gestión válidos
  const motivosGestion = [
    "Información general",
    "Reclamación atención al cliente",
    "Consulta cliente",
    "Pago de Recibo",
    "Atención al cliente - Modif datos póliza",
    "Cambio nº de cuenta",
    "Siniestros"
  ];
  
  // Test 3: Formatos de NumeroPoliza
  const formatosPoliza = [
    "N/A",
    "5951086",
    "D6Z020016684",
    "H5084988",
    "5951086, D6Z020016684, H5084988", // ❌ Múltiples valores - posible problema
    "5951086|D6Z020016684|H5084988",  // Test con pipes
    "5951086;D6Z020016684;H5084988"   // Test con punto y coma
  ];
  
  // Test 4: Formatos de Notas
  const formatosNotas = [
    "Nota simple",
    "Nota con saltos de línea\\n\\nSegundo párrafo", // ❌ Saltos de línea - posible problema
    "Nota con saltos de línea\n\nSegundo párrafo",   // Sin escape
    "Nota con caracteres especiales: áéíóú ñ",
    "Nota con comillas \"dobles\" y 'simples'",
    "Nota con paréntesis (información adicional)",
    "Nota muy larga: " + "x".repeat(500)
  ];
  
  console.log('\n🧪 TEST 1: Validando tipos de incidencia...');
  for (const tipo of tiposIncidencia) {
    await testSingleField('TipoIncidencia', tipo);
  }
  
  console.log('\n🧪 TEST 2: Validando motivos de gestión...');  
  for (const motivo of motivosGestion) {
    await testSingleField('MotivoIncidencia', motivo);
  }
  
  console.log('\n🧪 TEST 3: Validando formatos de póliza...');
  for (const poliza of formatosPoliza) {
    await testSingleField('NumeroPoliza', poliza);
  }
  
  console.log('\n🧪 TEST 4: Validando formatos de notas...');
  for (const nota of formatosNotas) {
    await testSingleField('Notas', nota);
  }
  
  // Test 5: Reproducir payload exacto que falló
  console.log('\n🚨 TEST 5: Reproduciendo payload exacto que falló...');
  await testExactFailedPayload();
}

async function testSingleField(fieldName, fieldValue) {
  try {
    const basePayload = {
      IdCliente: "1080901F00",
      IdTicket: `IA-20250711-${Date.now().toString().slice(-3)}`,
      IdLlamada: "conv_test",
      TipoIncidencia: "Consulta",
      MotivoIncidencia: "Consulta cliente",
      NumeroPoliza: "N/A",
      Notas: "Test validation",
      FicheroLlamada: ""
    };
    
    // Sobrescribir el campo específico
    basePayload[fieldName] = fieldValue;
    
    const response = await axios.post('https://segurneo-voice.onrender.com/api/crear-ticket', basePayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log(`✅ ${fieldName}: "${fieldValue}" - VÁLIDO`);
    
  } catch (error) {
    console.error(`❌ ${fieldName}: "${fieldValue}" - ERROR:`, error.response?.data?.message || error.message);
    
    if (error.response?.data?.errors) {
      console.error('   Errores detallados:', error.response.data.errors);
    }
  }
}

async function testExactFailedPayload() {
  try {
    const failedPayload = {
      IdCliente: "1080901F00",
      IdLlamada: "conv_01jzve5hhzf4rs9pcmrd61x46k",
      TipoIncidencia: "Reclamación cliente regalo",
      MotivoIncidencia: "Reclamación atención al cliente",
      NumeroPoliza: "5951086, D6Z020016684, H5084988",
      Notas: "La clienta Isabel, identificada con el DNI 37683988Y, llama para reclamar un regalo que se le prometió por recomendar a otro cliente.  El agente virtual no puede gestionar la reclamación y la transfiere a un compañero.\\n\\n[Generado automáticamente - Alta confianza]",
      IdTicket: "IA-20250711-TEST"
    };
    
    console.log('📤 Payload exacto que falló:', JSON.stringify(failedPayload, null, 2));
    
    const response = await axios.post('https://segurneo-voice.onrender.com/api/crear-ticket', failedPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    console.log('✅ ¡Payload falló AHORA FUNCIONA!:', response.data);
    
  } catch (error) {
    console.error('❌ PAYLOAD EXACTO REPRODUCE EL ERROR:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Errors:', error.response?.data?.errors);
    
    // Analizar cada error específico
    if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      console.log('\n🔍 ANÁLISIS DE ERRORES:');
      error.response.data.errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err}`);
      });
    }
  }
}

// Ejecutar test
testNogalValidation().catch(console.error); 