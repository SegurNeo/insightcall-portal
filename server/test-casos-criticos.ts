import 'dotenv/config';
import { nogalAnalysisService } from './src/services/nogalAnalysisService';
import { TranscriptMessage } from './src/types/common.types';

/**
 * 🧪 SCRIPT DE PRUEBA PARA CASOS CRÍTICOS
 * 
 * Verifica que las mejoras en los prompts detecten correctamente:
 * 1. "Reenvío agentes humanos no quiere IA"
 * 2. "Datos incompletos" (no confundir con modificaciones específicas)
 */

interface CasoCritico {
  nombre: string;
  esperado: {
    tipo: string;
    motivo: string;
  };
  conversacion: TranscriptMessage[];
}

const CASOS_CRITICOS: CasoCritico[] = [
  {
    nombre: "CASO 1: No quiere hablar con IA",
    esperado: {
      tipo: "Llamada gestión comercial",
      motivo: "Reenvío agentes humanos no quiere IA"
    },
    conversacion: [
      {
        role: 'agent',
        message: 'Hola soy Carlos, su agente virtual en la Correduría de Seguros Nogal, dígame por favor su nombre y apellido y si es usted un cliente, dígame por favor su DNI.'
      },
      {
        role: 'user', 
        message: 'Hola, me llamo Javier, mi DNI es 03-473-587-N de Navarra.'
      },
      {
        role: 'agent',
        message: 'Perfecto, dame un momento que te encuentre...'
      },
      {
        role: 'agent',
        message: '[Tool Call: identificar_cliente]'
      },
      {
        role: 'agent', 
        message: '[Tool Result: identificar_cliente]'
      },
      {
        role: 'agent',
        message: 'Javier, veo que tiene contratada con nosotros una póliza de coche... ¿Quiere que le ayude con alguna gestión de esta...'
      },
      {
        role: 'user',
        message: 'No, pero en serio, en serio, por favor. ¿No me puedes pasar con una persona? De verdad, no quiero hablar con una máquina, quiero hablar con una persona.'
      },
      {
        role: 'agent',
        message: 'Claro. En este caso le paso con uno de nuestros compañeros...'
      }
    ]
  },
  {
    nombre: "CASO 2: Datos incompletos (no modificación específica)",
    esperado: {
      tipo: "Modificación póliza emitida", 
      motivo: "Datos incompletos"
    },
    conversacion: [
      {
        role: 'agent',
        message: 'Hola, soy Carlos, agente virtual de Nogal. ¿En qué puedo ayudarle?'
      },
      {
        role: 'user',
        message: 'Hola, quiero incluir a mi hijo en mi póliza de decesos.'
      },
      {
        role: 'agent', 
        message: 'Perfecto, para incluir a su hijo en la póliza de decesos, necesito que me proporcione el nombre completo y la fecha de nacimiento de su hijo.'
      },
      {
        role: 'user',
        message: 'Su nombre es Miguel, pero la fecha de nacimiento no me la sé de memoria ahora mismo.'
      },
      {
        role: 'agent',
        message: 'Sin la fecha de nacimiento no puedo proceder con la inclusión. Necesita llamar de nuevo cuando tenga esa información.'
      }
    ]
  },
  {
    nombre: "CASO 3: No tomador (hermano)",
    esperado: {
      tipo: "Llamada gestión comercial",
      motivo: "Reenvío agentes humanos no tomador"
    },
    conversacion: [
      {
        role: 'agent',
        message: 'Hola soy Carlos, su agente virtual en la Correduría de Seguros Nogal, dígame por favor su nombre y apellido y si es usted un cliente, dígame por favor su DNI.'
      },
      {
        role: 'user',
        message: 'Mi nombre es Javier, mi DNI es 03-473-587-N de Navarra.'
      },
      {
        role: 'agent',
        message: 'Perfecto, dame un momento que te encuentre...'
      },
      {
        role: 'agent',
        message: '[Tool Call: identificar_cliente]'
      },
      {
        role: 'agent',
        message: '[Tool Result: identificar_cliente]'
      },
      {
        role: 'agent',
        message: 'Dígame Javier, ¿en qué puedo ayudarle?... Veo que tiene contratada con nosotros una póliza de coche... ¿Quiere que le ayude con alguna gestión de esta póliza o se trata de una nueva contratación?'
      },
      {
        role: 'user',
        message: 'No, es sobre la póliza del coche de mi hermano. Se llama Jesús, el DNI de mi hermano es 03 472 505 B de Barcelona y era porque necesitó información acerca de las coberturas que tiene en la póliza.'
      }
    ]
  }
];

async function probarCasoCritico(caso: CasoCritico): Promise<boolean> {
  console.log(`\n🧪 PROBANDO: ${caso.nombre}`);
  console.log('='  .repeat(60));
  
  try {
    const resultado = await nogalAnalysisService.analyzeCallForNogal(
      caso.conversacion,
      `test_${Date.now()}`
    );
    
    console.log(`📊 RESULTADO DEL ANÁLISIS:`);
    console.log(`   Tipo detectado: "${resultado.incidenciaPrincipal.tipo}"`);
    console.log(`   Motivo detectado: "${resultado.incidenciaPrincipal.motivo}"`);
    console.log(`   Confianza: ${resultado.confidence}`);
    console.log(`   Requiere ticket: ${resultado.requiereTicket}`);
    
    // Verificar si coincide con lo esperado
    const tipoCorrecte = resultado.incidenciaPrincipal.tipo === caso.esperado.tipo;
    const motivoCorrecto = resultado.incidenciaPrincipal.motivo === caso.esperado.motivo;
    const exitoso = tipoCorrecte && motivoCorrecto;
    
    console.log(`\n✅ ESPERADO:`);
    console.log(`   Tipo: "${caso.esperado.tipo}"`);
    console.log(`   Motivo: "${caso.esperado.motivo}"`);
    
    if (exitoso) {
      console.log(`\n🎉 ✅ ÉXITO: Detección correcta!`);
      
      // Verificar umbral para creación automática
      const deberiaCrearTicket = nogalAnalysisService.shouldCreateTicket(resultado);
      console.log(`   🎫 Creará ticket automáticamente: ${deberiaCrearTicket ? 'SÍ' : 'NO'}`);
      
      if (!deberiaCrearTicket) {
        console.log(`   ⚠️  ADVERTENCIA: Confianza ${resultado.confidence} puede ser insuficiente`);
      }
      
    } else {
      console.log(`\n❌ FALLO: Detección incorrecta`);
      if (!tipoCorrecte) {
        console.log(`   ❌ Tipo incorrecto: esperado "${caso.esperado.tipo}", obtuvo "${resultado.incidenciaPrincipal.tipo}"`);
      }
      if (!motivoCorrecto) {
        console.log(`   ❌ Motivo incorrecto: esperado "${caso.esperado.motivo}", obtuvo "${resultado.incidenciaPrincipal.motivo}"`);
      }
    }
    
    return exitoso;
    
  } catch (error) {
    console.log(`\n💥 ERROR: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

async function ejecutarPruebas(): Promise<void> {
  console.log('🚀 INICIANDO PRUEBAS DE CASOS CRÍTICOS');
  console.log('='.repeat(60));
  
  let exitos = 0;
  let total = CASOS_CRITICOS.length;
  
  for (const caso of CASOS_CRITICOS) {
    const exitoso = await probarCasoCritico(caso);
    if (exitoso) exitos++;
    
    // Pausa pequeña entre pruebas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 RESUMEN FINAL:`);
  console.log(`   ✅ Casos exitosos: ${exitos}/${total}`);
  console.log(`   ❌ Casos fallidos: ${total - exitos}/${total}`);
  console.log(`   📈 Tasa de éxito: ${Math.round((exitos/total) * 100)}%`);
  
  if (exitos === total) {
    console.log(`\n🎉 ¡PERFECTO! Todos los casos críticos se detectan correctamente`);
  } else {
    console.log(`\n⚠️  Necesita más ajustes en los prompts`);
  }
  
  console.log('\n🏁 Pruebas completadas');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  ejecutarPruebas().catch(console.error);
}

export { ejecutarPruebas, CASOS_CRITICOS }; 