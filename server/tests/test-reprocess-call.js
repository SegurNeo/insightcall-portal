// 🔄 Script para reprocesar llamada específica
// Reactiva el análisis IA y creación de tickets automáticos

const { CallProcessingService } = require('./src/services/callProcessingService');

console.log('🔄 Reprocesando llamada de prueba...\n');

async function reprocessCall() {
  const conversationId = 'conv_01jzthyz3gfytadhy5apzqvfq6';
  
  try {
    console.log(`📞 Reprocesando llamada: ${conversationId}`);
    
    const callProcessor = new CallProcessingService();
    
    // Simular webhook payload básico para reactivar el procesamiento
    const mockPayload = {
      conversation_id: conversationId,
      start_time: '2025-07-10T22:16:11Z',
      end_time: '2025-07-10T22:18:40Z'
    };
    
    console.log('🚀 Iniciando reprocesamiento...');
    const result = await callProcessor.processIncomingCall(mockPayload);
    
    console.log('✅ Reprocesamiento completado:');
    console.log(`   - ID: ${result.id}`);
    console.log(`   - Análisis: ${result.analysis_completed ? '✅' : '❌'}`);
    console.log(`   - Tickets: ${result.tickets_created || 0}`);
    console.log(`   - Procesado: ${result.processed_at ? '✅' : '⏳'}`);
    
    if (result.ai_analysis) {
      console.log('\n🧠 Análisis IA:');
      console.log(`   - Tipo: ${result.ai_analysis.tipo_incidencia || result.ai_analysis.incident_type}`);
      console.log(`   - Confianza: ${result.ai_analysis.confidence}`);
      console.log(`   - Requiere ticket: ${result.ai_analysis.requiere_ticket ?? result.ai_analysis.requires_ticket ?? 'unknown'}`);
    }
    
  } catch (error) {
    console.error('❌ Error en reprocesamiento:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar
reprocessCall(); 