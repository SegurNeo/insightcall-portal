// 🏢 TEST ESPECÍFICO PARA CREACIÓN DE CLIENTES CON LEAD
// Simula el caso completo que describe el usuario

const { nogalAnalysisService } = require('./dist/services/nogalAnalysisService');

// 🧪 CASO DE PRUEBA CON LEAD SIMULADO
const transcripcionConLead = [
  {
    role: 'agent',
    message: 'Hola, le atiende Carlos de Nogal. ¿En qué puedo ayudarle?'
  },
  {
    role: 'user',
    message: 'Hola, me llamo DANI VELA, me han llamado de la campaña AURA de seguros de decesos.'
  },
  {
    role: 'agent',
    message: '¿Me puede confirmar su teléfono?'
  },
  {
    role: 'user',
    message: 'Sí, es el 663585214'
  },
  {
    role: 'agent',
    message: '¿Y su email?'
  },
  {
    role: 'user',
    message: 'Es aacove@gmail.com'
  },
  {
    role: 'agent',
    message: 'Perfecto, le paso con un especialista para informarle sobre el seguro de decesos.'
  }
];

// 📊 FUNCIÓN DE ANÁLISIS COMPLETO
async function testCompleteFlow() {
  console.log(`🧪 ======= TEST COMPLETO CON LEAD =======`);
  
  try {
    // 1. Análisis con nogalAnalysisService
    const analysisResult = await nogalAnalysisService.analyzeCallForNogal(
      transcripcionConLead,
      'test-lead-completo'
    );
    
    console.log(`\n🧠 ANÁLISIS COMPLETO IA:`);
    console.log(`   - Tipo: ${analysisResult.incidenciaPrincipal.tipo}`);
    console.log(`   - Motivo: ${analysisResult.incidenciaPrincipal.motivo}`);
    console.log(`   - Ramo: ${analysisResult.incidenciaPrincipal.ramo}`);
    console.log(`   - Confidence: ${analysisResult.confidence}`);

    console.log(`\n📋 DATOS EXTRAÍDOS POR IA:`);
    const datos = analysisResult.datosExtraidos;
    console.log(`   - nombreCliente: ${datos.nombreCliente}`);
    console.log(`   - telefono: ${datos.telefono}`);
    console.log(`   - email: ${datos.email}`);
    console.log(`   - numeroPoliza: ${datos.numeroPoliza}`);
    
    if (datos.leadInfo) {
      console.log(`\n🎯 INFORMACIÓN DE LEAD:`);
      console.log(`   - isLead: ${datos.leadInfo.isLead}`);
      console.log(`   - idLead: ${datos.leadInfo.idLead}`);
      console.log(`   - campaña: ${datos.leadInfo.campaña}`);
      console.log(`   - ramo: ${datos.leadInfo.ramo}`);
    }

    // 2. Simular decisión de flujo
    const isNewContract = analysisResult.incidenciaPrincipal.tipo === 'Nueva contratación de seguros';
    const hasName = !!datos.nombreCliente;
    const hasContact = !!(datos.telefono || datos.email);
    const isLead = datos.leadInfo?.isLead;

    console.log(`\n🎯 DECISIÓN DE FLUJO:`);
    console.log(`   - Es nueva contratación: ${isNewContract}`);
    console.log(`   - Tiene nombre: ${hasName}`);
    console.log(`   - Tiene contacto: ${hasContact}`);
    console.log(`   - Es lead: ${isLead}`);

    let flowDecision;
    if (isLead && hasName) {
      flowDecision = '🚨 LEAD DETECTADO - Crear cliente con idLead';
    } else if (hasName && hasContact && isNewContract) {
      flowDecision = '🆕 CLIENTE NUEVO - Crear cliente sin idLead';
    } else {
      flowDecision = '🔄 FALLBACK - No crear cliente';
    }

    console.log(`\n✅ DECISIÓN FINAL: ${flowDecision}`);

    // 3. Mostrar datos que se usarían para crear cliente
    if (flowDecision.includes('CREAR')) {
      console.log(`\n📤 DATOS PARA CREACIÓN DE CLIENTE:`);
      
      const nombreCompleto = datos.nombreCliente || '';
      const nameParts = nombreCompleto.trim().split(' ');
      const nombre = nameParts[0] || '';
      const primerApellido = nameParts[1] || '';
      const segundoApellido = nameParts.slice(2).join(' ') || '';

      const clientDataForCreation = {
        nombre: nombre,
        primerApellido: primerApellido,
        segundoApellido: segundoApellido,
        telefono: datos.telefono || '',
        email: datos.email || '',
        ...(isLead && datos.leadInfo && {
          idLead: datos.leadInfo.idLead,
          campaña: datos.leadInfo.campaña
        })
      };

      console.log(`   - Datos procesados:`, clientDataForCreation);
      
      // Simular llamada a nogalClientService
      console.log(`\n📞 SIMULARÍA LLAMADA A:`);
      console.log(`   nogalClientService.createClientFromCall(clientData, "test-lead-completo")`);
      console.log(`   - Endpoint: POST /api/crear-cliente`);
      console.log(`   - Destino: segurneo-voice.onrender.com`);
    }

    // 4. Mostrar datos que se usarían para crear ticket
    console.log(`\n🎫 DATOS PARA TICKET:`);
    console.log(`   - IdCliente: [ID generado por Nogal]`);
    console.log(`   - IdLlamada: test-lead-completo`);
    console.log(`   - TipoIncidencia: ${analysisResult.incidenciaPrincipal.tipo}`);
    console.log(`   - MotivoIncidencia: ${analysisResult.incidenciaPrincipal.motivo}`);
    console.log(`   - Ramo: ${analysisResult.incidenciaPrincipal.ramo || ''}`);
    console.log(`   - Notas: ${analysisResult.notasParaNogal}`);

    return {
      success: true,
      analysisResult,
      flowDecision,
      wouldCreateClient: flowDecision.includes('CREAR')
    };

  } catch (error) {
    console.error(`❌ Error en test completo:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 🚀 EJECUTAR TEST
if (require.main === module) {
  testCompleteFlow()
    .then(result => {
      if (result.success) {
        console.log(`\n🎉 ¡TEST COMPLETADO EXITOSAMENTE!`);
        console.log(`✅ Flujo identificado: ${result.flowDecision}`);
        console.log(`🏗️ Crearía cliente: ${result.wouldCreateClient ? 'SÍ' : 'NO'}`);
      } else {
        console.log(`\n❌ Test falló: ${result.error}`);
      }
    })
    .catch(console.error);
}

module.exports = { testCompleteFlow }; 