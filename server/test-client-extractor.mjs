// 🧪 Test del ClientDataExtractor corregido
// Usar datos reales de la llamada conv_01jztkf3pafmnrrggbn8y58m8k

import { ClientDataExtractor } from './src/services/clientDataExtractor.js';

console.log('🧪 Probando ClientDataExtractor corregido...\n');

// Transcripts reales de la llamada donde María del Carmen es identificada
const realTranscripts = [
  {
    message: "Hola soy Carlos, su agente virtual en la Correduría de Seguros Nogal, dígame por favor su nombre y apellido y si es usted un cliente, dígame por favor su DNI.",
    speaker: "agent",
    sequence: 1
  },
  {
    message: "Hola, buenas. Yo soy María del Carmen Oliva Jiménez.",
    speaker: "user", 
    sequence: 2
  },
  {
    message: "Perfecto, dame un momento que te encuentre...",
    speaker: "agent",
    sequence: 3
  },
  {
    message: "[Tool Call: identificar_cliente]",
    speaker: "agent",
    sequence: 4
  },
  {
    message: "[Tool Result: identificar_cliente]",
    speaker: "agent",
    sequence: 5
  },
  {
    message: "Lo siento, María del Carmen, no he podido encontrarte con los datos que me has dado... ¿Podrías confirmarme tu DNI o un teléfono de contacto para que pueda buscarte de nuevo?",
    speaker: "agent",
    sequence: 6
  },
  {
    message: "Claro, mi DNI es 07535572J.",
    speaker: "user",
    sequence: 7
  },
  {
    message: "Perfecto, dame un momento que te encuentre...",
    speaker: "agent",
    sequence: 8
  },
  {
    message: "[Tool Call: identificar_cliente]",
    speaker: "agent",
    sequence: 9
  },
  {
    message: "[Tool Result: identificar_cliente]",
    speaker: "agent",
    sequence: 10
  },
  {
    message: "María del Carmen, veo que tienes contratadas con nosotros pólizas de coche, hogar y decesos... ¿Quiere que le ayude con alguna gestión de alguna de estas pólizas o se trata de una nueva contratación?",
    speaker: "agent",
    sequence: 11  // ← AQUÍ ESTÁN LOS DATOS DEL CLIENTE
  },
  {
    message: "Sí, nada, me gustaría que me enviarais un duplicado de mi póliza por e-mail.",
    speaker: "user",
    sequence: 12
  }
];

async function testExtractor() {
  try {
    console.log('📋 Transcripts de entrada:');
    console.log(`   - Total mensajes: ${realTranscripts.length}`);
    console.log(`   - Tool calls detectados: ${realTranscripts.filter(t => t.message.includes('[Tool Call:')).length}`);
    console.log(`   - Tool results detectados: ${realTranscripts.filter(t => t.message.includes('[Tool Result:')).length}`);
    
    const extractor = new ClientDataExtractor();
    const result = extractor.extractClientData(realTranscripts);
    
    console.log('\n🎯 RESULTADO DE LA EXTRACCIÓN:');
    console.log('================================');
    console.log(`✅ ID Cliente: ${result.idCliente || '❌ NO EXTRAÍDO'}`);
    console.log(`✅ Nombre: ${result.nombre || '❌ NO EXTRAÍDO'}`);
    console.log(`✅ Número Póliza: ${result.numeroPoliza || '❌ NO EXTRAÍDO'}`);
    console.log(`✅ Teléfono: ${result.telefono || '❌ NO EXTRAÍDO'}`);
    console.log(`✅ Email: ${result.email || '❌ NO EXTRAÍDO'}`);
    
    console.log('\n📊 METADATOS:');
    console.log(`   - Fuente: ${result.extractionSource}`);
    console.log(`   - Confianza: ${result.confidence}%`);
    console.log(`   - Tools utilizadas: ${result.toolsUsed.join(', ')}`);
    
    console.log('\n🎉 EVALUACIÓN:');
    if (result.idCliente && result.nombre) {
      console.log('✅ ¡ÉXITO! El extractor ahora funciona correctamente');
      console.log('✅ Los tickets tendrán ID de cliente válido');
      console.log('✅ Se enviarán automáticamente a Segurneo Voice');
    } else {
      console.log('❌ AÚN HAY PROBLEMAS en la extracción');
      console.log('❌ Revisar patrones de búsqueda en extractFromAgentResponse()');
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testExtractor(); 