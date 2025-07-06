#!/usr/bin/env npx tsx

/**
 * Script para testear la clasificación de tickets con ejemplos de conversaciones reales
 */

import { config } from 'dotenv';
import { ticketClassifierService } from '../services/ticketClassifierService';
import { analysisService } from '../modules/analysis/services/analysis.service';
import { TranscriptMessage } from '../types/transcript.types';

config();

interface TestCase {
  name: string;
  description: string;
  messages: TranscriptMessage[];
  expectedTickets?: string[]; // Tipos de incidencia esperados
}

const TEST_CASES: TestCase[] = [
  {
    name: 'Cambio de número de cuenta',
    description: 'Cliente quiere cambiar su número de cuenta bancaria',
    messages: [
      { role: 'user', message: 'Hola, quiero cambiar el número de cuenta de mis pólizas' },
      { role: 'agent', message: 'Por supuesto, ¿me puede proporcionar su nuevo número de cuenta?' },
      { role: 'user', message: 'Sí, es ES91 2100 0418 4502 0005 1332' },
      { role: 'agent', message: 'Perfecto, procederemos a cambiar la cuenta en todas sus pólizas activas' }
    ],
    expectedTickets: ['Modificación póliza emitida']
  },
  {
    name: 'Nueva contratación de seguro de hogar',
    description: 'Cliente nuevo quiere contratar un seguro de hogar',
    messages: [
      { role: 'user', message: 'Hola, me han recomendado y quiero contratar un seguro para mi casa' },
      { role: 'agent', message: '¡Perfecto! ¿Es usted propietario o inquilino de la vivienda?' },
      { role: 'user', message: 'Propietario, es un piso de 80 metros cuadrados en Madrid' },
      { role: 'agent', message: 'Excelente, vamos a calcular su presupuesto para el seguro de hogar' }
    ],
    expectedTickets: ['Nueva contratación de seguros']
  },
  {
    name: 'Solicitud de grúa - asistencia',
    description: 'Cliente necesita asistencia en carretera',
    messages: [
      { role: 'user', message: 'Mi coche se ha averiado en la autopista, necesito una grúa urgente' },
      { role: 'agent', message: 'Entiendo, ¿me puede proporcionar su ubicación exacta?' },
      { role: 'user', message: 'Estoy en el kilómetro 45 de la A-6, dirección Madrid' },
      { role: 'agent', message: 'Le paso con nuestro servicio de asistencia en carretera inmediatamente' }
    ],
    expectedTickets: ['Llamada asistencia en carretera']
  },
  {
    name: 'Cancelación antes de efecto',
    description: 'Cliente quiere cancelar una póliza recién contratada',
    messages: [
      { role: 'user', message: 'He contratado un seguro hace dos días pero quiero cancelarlo' },
      { role: 'agent', message: '¿Me puede indicar el motivo de la cancelación?' },
      { role: 'user', message: 'He encontrado una oferta mejor en otra compañía' },
      { role: 'agent', message: 'Entiendo, procederemos con la cancelación antes del efecto' }
    ],
    expectedTickets: ['Cancelación antes de efecto']
  },
  {
    name: 'Modificación de coberturas',
    description: 'Cliente quiere cambiar de todo riesgo a terceros',
    messages: [
      { role: 'user', message: 'Quiero cambiar mi seguro de coche de todo riesgo a solo terceros' },
      { role: 'agent', message: '¿Puedo preguntarle el motivo del cambio?' },
      { role: 'user', message: 'El coche ya es viejo y no me compensa pagar tanto' },
      { role: 'agent', message: 'Perfecto, modificaremos su cobertura de todo riesgo a terceros' }
    ],
    expectedTickets: ['Modificación póliza emitida']
  },
  {
    name: 'Consulta general - información',
    description: 'Cliente hace consulta que se puede resolver en línea',
    messages: [
      { role: 'user', message: '¿Cuándo vence mi póliza de hogar?' },
      { role: 'agent', message: 'Su póliza de hogar vence el 15 de marzo de 2024' },
      { role: 'user', message: '¿Y cuánto pagaré en la renovación?' },
      { role: 'agent', message: 'La prima de renovación será de 245 euros anuales' }
    ],
    expectedTickets: ['Llamada gestión comercial']
  },
  {
    name: 'Datos incompletos - cesión de derechos',
    description: 'Cliente quiere cesión pero no tiene los datos completos',
    messages: [
      { role: 'user', message: 'Necesito una cesión de derechos para mi hipoteca' },
      { role: 'agent', message: '¿Tiene el número de préstamo y los datos del banco?' },
      { role: 'user', message: 'No, los tengo en casa. ¿Qué necesito exactamente?' },
      { role: 'agent', message: 'Necesitamos número de préstamo, entidad bancaria, oficina y fechas de inicio y fin' }
    ],
    expectedTickets: ['Modificación póliza emitida']
  }
];

class TestRunner {
  async runAllTests() {
    console.log('🧪 INICIANDO TESTS DE CLASIFICACIÓN DE TICKETS');
    console.log('=' .repeat(60));
    
    const results: any[] = [];
    
    for (let i = 0; i < TEST_CASES.length; i++) {
      const testCase = TEST_CASES[i];
      console.log(`\n📋 TEST ${i + 1}/${TEST_CASES.length}: ${testCase.name}`);
      console.log(`📝 ${testCase.description}`);
      
      try {
        // 1. Análisis con Gemini
        const conversationId = `test-${Date.now()}-${i}`;
        console.log('🧠 Analizando con Gemini...');
        const analysis = await analysisService.analyzeTranscript(testCase.messages, conversationId);
        
        // 2. Clasificación de tickets
        console.log('🎯 Clasificando tickets...');
        const classification = await ticketClassifierService.classifyTranscript(testCase.messages, conversationId);
        
        // 3. Mostrar resultados
        console.log('\n📊 RESULTADOS:');
        console.log(`   Status análisis: ${analysis.status}`);
        if (analysis.status === 'completed') {
          console.log(`   Sentiment: ${analysis.sentiment?.label} (${analysis.sentiment?.score?.toFixed(2)})`);
          console.log(`   Topics: ${analysis.topics?.join(', ')}`);
          console.log(`   Summary: ${analysis.summary}`);
        }
        
        console.log(`   Tickets detectados: ${classification.suggestions.length}`);
        
        if (classification.suggestions.length > 0) {
          classification.suggestions.forEach((suggestion, idx) => {
            console.log(`   ${idx + 1}. ${suggestion.tipo_incidencia} - ${suggestion.motivo_incidencia}`);
            console.log(`      Score: ${suggestion.score.toFixed(2)} | ${suggestion.justification}`);
          });
          
          // Verificar si coincide con expectativas
          if (testCase.expectedTickets) {
            const detectedTypes = classification.suggestions.map(s => s.tipo_incidencia);
            const hasExpectedMatch = testCase.expectedTickets.some(expected => 
              detectedTypes.includes(expected)
            );
            console.log(`   ✅ Coincide con expectativa: ${hasExpectedMatch ? 'SÍ' : 'NO'}`);
            if (!hasExpectedMatch) {
              console.log(`   🎯 Se esperaba: ${testCase.expectedTickets.join(', ')}`);
            }
          }
        } else {
          console.log('   ⚠️  No se detectaron tickets');
        }
        
        results.push({
          testName: testCase.name,
          analysis,
          classification,
          expectedTickets: testCase.expectedTickets
        });
        
      } catch (error) {
        console.error(`❌ ERROR en test ${testCase.name}:`, error);
        results.push({
          testName: testCase.name,
          error: error instanceof Error ? error.message : 'Error desconocido'
        });
      }
    }
    
    // Resumen final
    this.printSummary(results);
    
    return results;
  }
  
  private printSummary(results: any[]) {
    console.log('\n' + '=' .repeat(60));
    console.log('📈 RESUMEN DE TESTS');
    console.log('=' .repeat(60));
    
    const successful = results.filter(r => !r.error);
    const withTickets = successful.filter(r => r.classification?.suggestions?.length > 0);
    const highConfidence = successful.filter(r => 
      r.classification?.suggestions?.some((s: any) => s.score >= 0.7)
    );
    
    console.log(`✅ Tests ejecutados exitosamente: ${successful.length}/${results.length}`);
    console.log(`🎯 Tests con tickets detectados: ${withTickets.length}/${successful.length}`);
    console.log(`🔥 Tests con alta confianza (≥0.7): ${highConfidence.length}/${successful.length}`);
    
    // Tipos de tickets más detectados
    const allSuggestions = successful.flatMap(r => r.classification?.suggestions || []);
    const typeCount: Record<string, number> = {};
    allSuggestions.forEach((s: any) => {
      typeCount[s.tipo_incidencia] = (typeCount[s.tipo_incidencia] || 0) + 1;
    });
    
    console.log('\n📊 Tipos de incidencia más detectados:');
    Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([tipo, count]) => {
        console.log(`   ${tipo}: ${count} veces`);
      });
  }
}

// Ejecutar tests
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests()
    .then(() => {
      console.log('\n🎉 Tests completados');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error ejecutando tests:', error);
      process.exit(1);
    });
} 