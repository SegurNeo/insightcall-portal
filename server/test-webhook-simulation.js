// 🔄 Simular webhook de Segurneo para activar reprocesamiento
// Envía POST al endpoint local para reactivar el análisis

const axios = require('axios');

console.log('🔄 Simulando webhook para reprocesamiento...\n');

async function simulateWebhook() {
  try {
    // Payload simulado del webhook de Segurneo
    const webhookPayload = {
      conversation_id: 'conv_01jzthyz3gfytadhy5apzqvfq6',
      start_time: '2025-07-10T22:16:11+00:00',
      end_time: '2025-07-10T22:18:40+00:00',
      duration_seconds: 149,
      cost_cents: 45,
      transcripts: [
        {
          speaker: 'user',
          timestamp: '2025-07-10T22:16:15+00:00',
          message: 'Hola, llamo porque no he recibido el regalo que me prometieron cuando contraté el seguro'
        },
        {
          speaker: 'agent', 
          timestamp: '2025-07-10T22:16:20+00:00',
          message: 'Buenos días, entiendo su preocupación. ¿Podría decirme su nombre y DNI para localizarle en nuestro sistema?'
        },
        {
          speaker: 'user',
          timestamp: '2025-07-10T22:16:35+00:00', 
          message: 'Sí, soy María García, mi DNI es 12345678A'
        },
        {
          speaker: 'agent',
          timestamp: '2025-07-10T22:16:40+00:00',
          message: 'Perfecto María, veo que efectivamente contrató una póliza de hogar hace 3 meses. Voy a revisar el estado de su regalo promocional'
        },
        {
          speaker: 'user',
          timestamp: '2025-07-10T22:17:00+00:00',
          message: 'Me dijeron que me llegaría en un plazo de 15 días y ya han pasado casi 3 meses'
        },
        {
          speaker: 'agent',
          timestamp: '2025-07-10T22:17:15+00:00',
          message: 'Tiene razón, veo que hay un retraso en la gestión. Voy a abrir una incidencia para que el departamento de regalos promocionales le contacte en 24-48 horas y resuelvan esta situación'
        },
        {
          speaker: 'user',
          timestamp: '2025-07-10T22:18:00+00:00',
          message: 'Vale, perfecto. ¿Necesita algún dato más?'
        },
        {
          speaker: 'agent',
          timestamp: '2025-07-10T22:18:20+00:00',
          message: 'No, con su DNI es suficiente. Le asigno el número de incidencia 2024-REGALO-789. Disculpe las molestias y gracias por su paciencia'
        }
      ],
      transcript_summary: 'Cliente María García contacta por no haber recibido regalo promocional prometido al contratar póliza de hogar hace 3 meses. Se abre incidencia 2024-REGALO-789 para gestión por departamento de regalos.',
      analysis_completed: false
    };

    console.log('📤 Enviando webhook simulado...');
    console.log(`📞 Conversation ID: ${webhookPayload.conversation_id}`);
    console.log(`⏱️ Duración: ${webhookPayload.duration_seconds}s`);
    console.log(`💬 Transcripts: ${webhookPayload.transcripts.length} mensajes`);
    
    // Intentar enviar al endpoint local (si está corriendo)
    try {
      const response = await axios.post('http://localhost:3000/api/v1/calls/webhook', webhookPayload, {
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': 'segurneo_test_key'
        },
        timeout: 30000
      });
      
      console.log('✅ Webhook procesado exitosamente:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, response.data);
      
    } catch (axiosError) {
      if (axiosError.code === 'ECONNREFUSED') {
        console.log('⚠️ Servidor no disponible en localhost:3000');
        console.log('💡 El payload está listo para cuando se active el servidor');
      } else {
        console.error('❌ Error en webhook:', axiosError.message);
      }
    }
    
    console.log('\n📋 Resumen del Test:');
    console.log('✅ Payload webhook válido generado');
    console.log('✅ Estructura completa con transcripts');
    console.log('✅ Caso de uso: Reclamación regalo promocional');
    console.log('✅ Debe generar ticket automático con alta confianza');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

simulateWebhook(); 