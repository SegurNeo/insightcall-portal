#!/usr/bin/env node
// Script para probar la clasificación de tickets con casos específicos

import { nogalAnalysisService } from '../services/nogalAnalysisService';

interface TestCase {
  id: string;
  name: string;
  transcript: { role: string; message: string }[];
  expectedType: string;
  expectedMotivo: string;
  description: string;
}

const testCases: TestCase[] = [
  {
    id: 'conv_01k09zb8nsfj8st1qvn8zvz94k',
    name: 'Cambio DNI sin datos',
    transcript: [
      { role: 'agent', message: 'Hola soy Carlos, su agente virtual en la Correduría de Seguros Nogal, dígame por favor su nombre y apellido y si es usted un cliente, dígame por favor su DNI.' },
      { role: 'user', message: 'Hola, me llamo José Antonio, es 25 meses de edad y tengo un cliente virtual en la correduría de Seguros Nogal. 25 millones 577 092 B de Barcelona.' },
      { role: 'agent', message: 'Perfecto, dame un momento que te encuentre...' },
      { role: 'agent', message: 'José Antonio, veo que tienes contratada con nosotros una póliza de decesos... ¿Quieres que te ayude con alguna gestión de esta póliza o se trata de una nueva contratación?' },
      { role: 'user', message: 'Sí, es para hacer una modificación en la póliza. Quiero cambiar el DNI de uno de los asegurados.' },
      { role: 'agent', message: 'Claro, entiendo... Para poder ayudarte con eso, necesito que me digas el DNI actual del asegurado que quieres modificar y el nuevo DNI, por favor.' },
      { role: 'user', message: 'Vale, es que ahora mismo no tengo el número de DNI.' },
      { role: 'agent', message: 'Entiendo... Si no tienes el DNI ahora mismo, no puedo realizar la modificación. Te sugiero que cuando tengas esa información, nos llames de nuevo para poder ayudarte con el cambio.' },
      { role: 'user', message: 'Vale vale pues entonces se lo pido que me lo den y ya os llamo cuando lo tenga para poder hacer el cambio.' },
      { role: 'agent', message: 'Espero haberle sido de ayuda... Cualquier otra cosa que necesite, estamos a su disposición. Que tenga un buen día.' }
    ],
    expectedType: 'Modificación póliza emitida',
    expectedMotivo: 'Datos incompletos',
    description: 'Cliente quiere cambiar DNI pero no tiene los datos necesarios'
  },
  {
    id: 'conv_01k0ej4435f39tpscxndz2b01n',
    name: 'Incluir asegurado sin fecha nacimiento',
    transcript: [
      { role: 'agent', message: 'Hola soy Carlos, su agente virtual en la Correduría de Seguros Nogal, dígame por favor su nombre y apellido y si es usted un cliente, dígame por favor su DNI.' },
      { role: 'user', message: 'Hola, buenos días. Me llamo Manuel, mi DNI es 24113148V.' },
      { role: 'agent', message: 'Perfecto, dame un momento que te encuentre...' },
      { role: 'agent', message: 'Manuel, veo que tienes contratadas con nosotros pólizas de Responsabilidad Civil, Vehículo Agrícola, Decesos, PYME, dos de Hogar y tres de Responsabilidad Civil de Animales de Compañía... ¿Quiere que le ayude con alguna gestión de alguna de estas pólizas o se trata de una nueva contratación?' },
      { role: 'user', message: 'Sí, es una... sobre la póliza de cesos que quería hacer una... incluir a mi hijo.' },
      { role: 'agent', message: 'Claro, entiendo... Para incluir a tu hijo en la póliza de decesos, necesito que me digas su nombre completo y su fecha de nacimiento, por favor.' },
      { role: 'user', message: 'Vale, él se llama Jesús pero bueno, ahora no me acuerdo cuál es la fecha de nacimiento, la verdad.' },
      { role: 'agent', message: 'Entiendo... Para poder incluir a Jesús en la póliza, necesito su fecha de nacimiento exacta... Si no la tienes ahora, no te preocupes... puedes volver a llamarnos cuando la tengas...' },
      { role: 'user', message: 'Sí, yo creo que es lo mejor. Vale, pues a ver si hablo con él, que me diga todos sus datos bien con su DNI y nada, yo os vuelvo a llamar, ¿vale?' },
      { role: 'agent', message: 'Espero haberle sido de ayuda... Cualquier otra cosa que necesite, estamos a su disposición... Que tenga un buen día.' }
    ],
    expectedType: 'Modificación póliza emitida',
    expectedMotivo: 'Datos incompletos',
    description: 'Cliente quiere incluir a su hijo pero no tiene la fecha de nacimiento'
  },
  {
    id: 'conv_01k07fqjz1e53t773qv7arewd5',
    name: 'Consulta coberturas sin respuesta',
    transcript: [
      { role: 'agent', message: 'Hola soy Carlos, su agente virtual en la Correduría de Seguros Nogal, dígame por favor su nombre y apellido y si es usted un cliente, dígame por favor su DNI.' },
      { role: 'user', message: 'Hola, me llamo Rafael, mi DNI es 28353531M.' },
      { role: 'agent', message: 'Rafael, veo que tienes contratada con nosotros una póliza de hogar... ¿Quieres que te ayude con alguna gestión de esta póliza o se trata de una nueva contratación?' },
      { role: 'user', message: 'Sí, es que ayer contraté una póliza de hogar y quería saber si incluye la reparación de electrodomésticos.' },
      { role: 'agent', message: 'Entiendo tu consulta sobre las coberturas de tu póliza de hogar. Sin embargo, no tengo acceso directo a los detalles específicos de tu póliza en este momento.' },
      { role: 'agent', message: 'Te voy a generar una incidencia para que nuestro departamento comercial pueda revisar tu póliza y te proporcione información detallada sobre las coberturas que incluye.' },
      { role: 'user', message: 'Perfecto, gracias.' },
      { role: 'agent', message: 'Perfecto, Rafael. Hemos generado tu consulta y nos pondremos en contacto contigo lo antes posible para aclararte qué coberturas específicas incluye tu póliza de hogar.' }
    ],
    expectedType: 'Llamada gestión comercial',
    expectedMotivo: 'LLam gestión comerc',
    description: 'Cliente consulta coberturas pero el agente no puede resolver y requiere seguimiento'
  },
  // Casos adicionales para probar otras reglas del CSV
  {
    id: 'test_cambio_pago_anual',
    name: 'Cambio forma pago - anual a fraccionar',
    transcript: [
      { role: 'agent', message: 'Hola, ¿en qué puedo ayudarle?' },
      { role: 'user', message: 'Tengo una póliza que pago anualmente y quiero cambiar a mensual.' },
      { role: 'agent', message: 'Perfecto, puedo ayudarle con el fraccionamiento. Su póliza actual es de pago anual y quiere cambiar a mensual, ¿correcto?' },
      { role: 'user', message: 'Exacto, es más cómodo para mí.' },
      { role: 'agent', message: 'Entendido, procederemos con el cambio de forma de pago.' }
    ],
    expectedType: 'Llamada gestión comercial',
    expectedMotivo: 'Cambio forma de pago',
    description: 'Cliente con pago anual quiere fraccionar - va a gestión comercial'
  },
  {
    id: 'test_cambio_pago_no_anual',
    name: 'Cambio forma pago - no anual',
    transcript: [
      { role: 'agent', message: 'Hola, ¿en qué puedo ayudarle?' },
      { role: 'user', message: 'Tengo una póliza que pago semestralmente y quiero cambiar a anual.' },
      { role: 'agent', message: 'Perfecto, su póliza actual es de pago semestral y quiere cambiar a anual, ¿correcto?' },
      { role: 'user', message: 'Exacto.' },
      { role: 'agent', message: 'Procederemos con el cambio de periodicidad.' }
    ],
    expectedType: 'Modificación póliza emitida',
    expectedMotivo: 'Cambio forma de pago',
    description: 'Cliente con pago no anual quiere cambiar - va a modificación'
  },
  {
    id: 'test_consulta_simple',
    name: 'Consulta simple resuelta',
    transcript: [
      { role: 'agent', message: 'Hola, ¿en qué puedo ayudarle?' },
      { role: 'user', message: '¿Cuál es mi fecha de efecto?' },
      { role: 'agent', message: 'Su póliza comenzó el 15 de marzo de 2024.' },
      { role: 'user', message: 'Perfecto, gracias.' }
    ],
    expectedType: 'Llamada gestión comercial',
    expectedMotivo: 'Consulta cliente',
    description: 'Consulta simple que se resuelve en la llamada'
  }
];

async function runTests(): Promise<void> {
  console.log('🧪 Iniciando pruebas de clasificación de tickets...\n');
  
  let passedTests = 0;
  let totalTests = testCases.length;
  
  for (const testCase of testCases) {
    console.log(`📝 Caso: ${testCase.name} (${testCase.id})`);
    console.log(`📋 Descripción: ${testCase.description}`);
    console.log(`🎯 Esperado: ${testCase.expectedType} → ${testCase.expectedMotivo}`);
    
    try {
      const result = await nogalAnalysisService.analyzeCallForNogal(
        testCase.transcript,
        testCase.id,
        undefined
      );
      
      const actualType = result.incidenciaPrincipal.tipo;
      const actualMotivo = result.incidenciaPrincipal.motivo;
      
      console.log(`🔄 Obtenido: ${actualType} → ${actualMotivo}`);
      console.log(`📊 Confianza: ${result.confidence}`);
      
      const typeMatch = actualType === testCase.expectedType;
      const motivoMatch = actualMotivo === testCase.expectedMotivo;
      const testPassed = typeMatch && motivoMatch;
      
      if (testPassed) {
        console.log('✅ PRUEBA EXITOSA\n');
        passedTests++;
      } else {
        console.log('❌ PRUEBA FALLIDA');
        if (!typeMatch) console.log(`   ❌ Tipo incorrecto: esperado "${testCase.expectedType}", obtenido "${actualType}"`);
        if (!motivoMatch) console.log(`   ❌ Motivo incorrecto: esperado "${testCase.expectedMotivo}", obtenido "${actualMotivo}"`);
        console.log('');
      }
      
    } catch (error) {
      console.log(`❌ ERROR EN LA PRUEBA: ${error}`);
      console.log('');
    }
  }
  
  console.log(`📊 RESULTADOS FINALES:`);
  console.log(`✅ Pruebas exitosas: ${passedTests}/${totalTests}`);
  console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡TODAS LAS PRUEBAS PASARON! El sistema de clasificación funciona correctamente.');
  } else {
    console.log('⚠️ Algunas pruebas fallaron. Revise los prompts o la lógica de clasificación.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error ejecutando pruebas:', error);
      process.exit(1);
    });
}

export { runTests, testCases }; 