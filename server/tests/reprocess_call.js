require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configurar Supabase
const supabaseUrl = process.env.NOGAL_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NOGAL_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase requeridas');
  console.error('Buscando: NOGAL_SUPABASE_URL, VITE_SUPABASE_URL');
  console.error('Encontrado URL:', !!supabaseUrl);
  console.error('Encontrado KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Lógica inteligente para decidir si procesar ticket
 * Replicada del CallProcessingService para testing
 */
function shouldProcessTicketIntelligently(aiAnalysis) {
  const factors = [];
  let score = 0;
  let reason = '';

  // 🔥 FACTOR 1: Tipos de incidencia críticos (SIEMPRE procesar)
  const criticalIncidents = [
    'Nueva contratación de seguros',
    'Contratación Póliza',
    'Retención cliente',
    'Retención de Cliente Cartera Llamada',
    'Siniestros'
  ];

  const isCriticalIncident = criticalIncidents.some(incident => 
    aiAnalysis.tipo_incidencia?.includes(incident) || 
    aiAnalysis.incident_type?.includes(incident)
  );

  if (isCriticalIncident) {
    score += 100; // Máxima puntuación
    factors.push(`Incidencia crítica: ${aiAnalysis.tipo_incidencia || aiAnalysis.incident_type}`);
    reason = `Incidencia crítica que requiere procesamiento: ${aiAnalysis.tipo_incidencia || aiAnalysis.incident_type}`;
  }

  // 🔥 FACTOR 2: Información valiosa del cliente detectada
  const hasClientName = aiAnalysis.datos_extraidos?.nombreCliente || aiAnalysis.extracted_data?.nombreCliente;
  const hasClientInfo = aiAnalysis.datos_extraidos?.telefono || aiAnalysis.extracted_data?.telefono || 
                       aiAnalysis.datos_extraidos?.email || aiAnalysis.extracted_data?.email;
  
  if (hasClientName) {
    score += 30;
    factors.push(`Nombre de cliente detectado: ${hasClientName}`);
  }
  
  if (hasClientInfo) {
    score += 20;
    factors.push('Información de contacto detectada');
  }

  // 🔥 FACTOR 3: Resumen de llamada coherente y útil
  const summary = aiAnalysis.resumen_analisis || aiAnalysis.summary || '';
  const hasMeaningfulSummary = summary && 
    summary.length > 50 && 
    !summary.includes('Error en análisis');
  
  if (hasMeaningfulSummary) {
    score += 25;
    factors.push('Resumen de llamada coherente');
  }

  // 🔥 FACTOR 4: Confianza alta (factor tradicional)
  const confidence = aiAnalysis.confidence || 0;
  if (confidence >= 0.7) {
    score += 40;
    factors.push(`Alta confianza: ${confidence}`);
  } else if (confidence >= 0.5) {
    score += 20;
    factors.push(`Confianza media: ${confidence}`);
  } else if (confidence >= 0.3) {
    score += 10;
    factors.push(`Confianza baja pero procesable: ${confidence}`);
  }

  // 🔥 FACTOR 5: Tipo de incidencia que requiere seguimiento
  const needsFollowUp = [
    'Consulta cliente',
    'Pago de Recibo',
    'Duplicado',
    'Cambio'
  ];

  const needsFollowUpDetected = needsFollowUp.some(type => 
    aiAnalysis.tipo_incidencia?.includes(type) || 
    aiAnalysis.incident_type?.includes(type) ||
    aiAnalysis.motivo_gestion?.includes(type) ||
    aiAnalysis.management_reason?.includes(type)
  );

  if (needsFollowUpDetected) {
    score += 15;
    factors.push('Incidencia que requiere seguimiento');
  }

  // 🚨 DECISIÓN FINAL
  const shouldProcess = score >= 30; // Umbral mucho más flexible

  if (!reason) {
    if (shouldProcess) {
      reason = `Procesamiento aprobado por múltiples factores (score: ${score})`;
    } else {
      reason = `Procesamiento rechazado por falta de información valiosa (score: ${score})`;
    }
  }

  return {
    process: shouldProcess,
    reason,
    score,
    factors
  };
}

/**
 * Script para reprocesar llamadas específicas con la nueva lógica inteligente
 */
async function reprocessCall() {
  const callId = process.argv[2];
  
  if (!callId) {
    console.error('❌ Uso: node reprocess_call.js conv_01k070rfqht30vamr72gw4kxpm');
    process.exit(1);
  }

  console.log(`🔄 Reprocesando llamada: ${callId}`);
  
  try {
    // Buscar la llamada en la base de datos
    const { data: call, error } = await supabase
      .from('calls')
      .select('*')
      .eq('conversation_id', callId)
      .single();

    if (error || !call) {
      console.error(`❌ Llamada no encontrada: ${callId}`);
      console.error('Error:', error);
      process.exit(1);
    }

    console.log(`📋 Llamada encontrada:`, {
      id: call.id,
      conversation_id: call.conversation_id,
      status: call.status,
      tickets_created: call.tickets_created,
      ai_analysis: call.ai_analysis ? 'Sí' : 'No'
    });

    // Mostrar el análisis actual
    if (call.ai_analysis) {
      console.log(`🧠 Análisis actual:`, {
        confidence: call.ai_analysis.confidence || 0,
        tipo_incidencia: call.ai_analysis.tipo_incidencia || 'N/A',
        resumen: call.ai_analysis.resumen_analisis || 'N/A',
        nombreCliente: call.ai_analysis.datos_extraidos?.nombreCliente || 'N/A'
      });
      
      // Evaluar con la nueva lógica
      const shouldProcess = shouldProcessTicketIntelligently(call.ai_analysis);
      
      console.log(`\n🧠 Evaluación con nueva lógica inteligente:`);
      console.log(`   📊 Score: ${shouldProcess.score}`);
      console.log(`   ✅ ¿Procesar?: ${shouldProcess.process ? 'SÍ' : 'NO'}`);
      console.log(`   📝 Razón: ${shouldProcess.reason}`);
      console.log(`   🔍 Factores detectados:`);
      shouldProcess.factors.forEach((factor, index) => {
        console.log(`      ${index + 1}. ${factor}`);
      });
      
      if (shouldProcess.process) {
        console.log(`\n✅ ¡ÉXITO! La nueva lógica SÍ procesaría esta llamada`);
        console.log(`🎯 Esto significa que José Luis ahora tendría:`);
        console.log(`   - ✅ Cliente creado automáticamente`);
        console.log(`   - ✅ Ticket generado automáticamente`);
        console.log(`   - ✅ Flujo completo de nueva contratación`);
        
        // Comparar con la lógica antigua
        const oldLogicWouldProcess = (call.ai_analysis.confidence || 0) >= 0.7;
        console.log(`\n📊 Comparación:`);
        console.log(`   - Lógica antigua (>=70%): ${oldLogicWouldProcess ? 'SÍ' : 'NO'}`);
        console.log(`   - Nueva lógica inteligente: ${shouldProcess.process ? 'SÍ' : 'NO'}`);
        console.log(`   - Mejora: ${shouldProcess.process && !oldLogicWouldProcess ? '✅ MEJORADO' : '⚪ Sin cambio'}`);
        
      } else {
        console.log(`\n❌ La nueva lógica tampoco procesaría esta llamada`);
        console.log(`📋 Razón: ${shouldProcess.reason}`);
      }
    } else {
      console.log(`❌ No hay análisis de IA para evaluar`);
    }

  } catch (error) {
    console.error('❌ Error reprocesando llamada:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  reprocessCall();
} 