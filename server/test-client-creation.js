// 🏢 TEST DE CREACIÓN DE CLIENTES
// Valida los diferentes flujos de creación de clientes

const { nogalAnalysisService } = require('./dist/services/nogalAnalysisService');
const { clientDataExtractor } = require('./dist/services/clientDataExtractor');

// 🧪 CASOS DE PRUEBA
const testCases = {
  nueva_contratacion_con_nombre: [
    {
      role: 'agent',
      message: 'Hola, le atiende Carlos de Nogal. ¿En qué puedo ayudarle?'
    },
    {
      role: 'user', 
      message: 'Hola, me llamo María García López y quiero contratar un seguro de hogar.'
    },
    {
      role: 'agent',
      message: '¿Me puede facilitar su teléfono y email para que un compañero se ponga en contacto?'
    },
    {
      role: 'user',
      message: 'Sí, mi teléfono es 666123456 y mi email es maria.garcia@email.com'
    },
    {
      role: 'agent',
      message: 'Perfecto María, un compañero se pondrá en contacto con usted para darle presupuesto.'
    }
  ],

  lead_detectado: [
    {
      role: 'agent',
      message: 'Hola, le atiende Carlos de Nogal. ¿En qué puedo ayudarle?'
    },
    {
      role: 'user',
      message: 'Hola, me llamo Pedro Martín, me han llamado de la campaña de seguros de hogar.'
    },
    {
      role: 'agent', 
      message: '¿Me puede confirmar su teléfono?'
    },
    {
      role: 'user',
      message: 'Sí, es el 677123456'
    },
    {
      role: 'agent',
      message: 'Perfecto, le paso con un especialista para darle toda la información.'
    }
  ],

  cliente_existente_modificacion: [
    {
      role: 'agent',
      message: 'Hola, le atiende Carlos de Nogal. ¿En qué puedo ayudarle?'
    },
    {
      role: 'user',
      message: 'Hola, soy Juan Pérez, cliente de Nogal con póliza 123456-A'
    },
    {
      role: 'agent',
      message: '¿En qué puedo ayudarle con su póliza?'
    },
    {
      role: 'user', 
      message: 'Quiero cambiar mi número de cuenta bancaria'
    },
    {
      role: 'agent',
      message: '¿Me puede facilitar el nuevo número de cuenta?'
    },
    {
      role: 'user',
      message: 'ES12 1234 5678 9012 3456 7890'
    }
  ]
};

// 📊 FUNCIÓN PRINCIPAL DE ANÁLISIS
async function testClientCreation(testName, transcripcion) {
  console.log(`\n🧪 ======= TEST: ${testName.toUpperCase()} =======`);
  console.log(`📝 Mensajes: ${transcripcion.length}`);
  
  try {
    // 1. Análisis con nogalAnalysisService (detecta tipo de incidencia y datos)
    const analysisResult = await nogalAnalysisService.analyzeCallForNogal(
      transcripcion,
      `test-${testName}`
    );
    
    console.log(`🧠 ANÁLISIS IA:`, {
      tipo: analysisResult.incidenciaPrincipal.tipo,
      motivo: analysisResult.incidenciaPrincipal.motivo,
      nombreCliente: analysisResult.datosExtraidos.nombreCliente,
      confidence: analysisResult.confidence
    });

    // 2. Extracción de datos de cliente
    const clientData = clientDataExtractor.extractClientDataWithAIContext(
      transcripcion.map(t => ({ ...t, speaker: t.role, message: t.message })),
      { datosExtraidos: analysisResult.datosExtraidos }
    );

    console.log(`🔍 DATOS CLIENTE:`, {
      idCliente: clientData.idCliente,
      nombre: clientData.nombre,
      telefono: clientData.telefono,
      email: clientData.email,
      confidence: clientData.confidence,
      source: clientData.extractionSource,
      isLead: clientData.leadInfo?.isLead
    });

    // 3. Simular decisión de flujo
    let flowDecision;
    if (clientData.idCliente) {
      flowDecision = '✅ CLIENTE EXISTENTE';
    } else if (clientData.leadInfo?.isLead) {
      flowDecision = '🚨 LEAD DETECTADO - Crear cliente primero';
    } else if (
      analysisResult.incidenciaPrincipal.tipo === 'Nueva contratación de seguros' &&
      analysisResult.datosExtraidos.nombreCliente
    ) {
      flowDecision = '🆕 CLIENTE NUEVO - Crear desde cero';
    } else {
      flowDecision = '🔄 FALLBACK - ID generado automáticamente';
    }

    console.log(`🎯 DECISIÓN DE FLUJO: ${flowDecision}`);

    // 4. Verificar si sería elegible para creación automática
    const isNewContract = analysisResult.incidenciaPrincipal.tipo === 'Nueva contratación de seguros';
    const hasClientName = !!analysisResult.datosExtraidos.nombreCliente;
    const hasContactInfo = !!(clientData.telefono || clientData.email);

    const wouldCreateClient = (isNewContract && hasClientName && hasContactInfo) || 
                              clientData.leadInfo?.isLead;

    console.log(`🏗️ ¿CREARÍA CLIENTE?: ${wouldCreateClient ? '✅ SÍ' : '❌ NO'}`);
    
    if (wouldCreateClient) {
      console.log(`📋 DATOS PARA CREACIÓN:`);
      console.log(`   - Nombre: ${analysisResult.datosExtraidos.nombreCliente || 'N/A'}`);
      console.log(`   - Teléfono: ${clientData.telefono || 'N/A'}`);
      console.log(`   - Email: ${clientData.email || 'N/A'}`);
      console.log(`   - Tipo: ${clientData.leadInfo?.isLead ? 'Lead' : 'Cliente nuevo'}`);
    }

    return {
      success: true,
      flowDecision,
      wouldCreateClient,
      analysisResult,
      clientData
    };

  } catch (error) {
    console.error(`❌ Error en test:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 🏁 EJECUTAR TODOS LOS TESTS
async function runAllTests() {
  console.log('🏁 INICIANDO TESTS DE CREACIÓN DE CLIENTES');
  console.log('============================================================');

  const results = {};
  
  for (const [testName, transcripcion] of Object.entries(testCases)) {
    const result = await testClientCreation(testName, transcripcion);
    results[testName] = result;
    
    // Pausa entre tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 📊 RESUMEN FINAL
  console.log('\n🏁 RESUMEN FINAL:');
  console.log('============================================================');
  
  const totalTests = Object.keys(results).length;
  const successfulTests = Object.values(results).filter(r => r.success).length;

  console.log(`📊 Total Tests: ${totalTests}`);
  console.log(`✅ Exitosos: ${successfulTests}`);
  console.log(`❌ Fallidos: ${totalTests - successfulTests}`);
  console.log(`📈 Porcentaje de Éxito: ${Math.round((successfulTests / totalTests) * 100)}%`);

  console.log('\n📋 Detalle por Test:');
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅' : '❌';
    const flow = result.success ? result.flowDecision : result.error;
    const creation = result.success && result.wouldCreateClient ? '🏗️ CREARÍA' : '⏭️ NO CREA';
    console.log(`   ${status} ${testName}: ${flow} ${creation}`);
  });

  if (successfulTests === totalTests) {
    console.log('\n🎉 ¡TODOS LOS TESTS PASARON!');
  } else {
    console.log('\n⚠️ Algunos tests fallaron, revisar implementación');
  }
}

// 🚀 EJECUTAR SI ES LLAMADO DIRECTAMENTE
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testClientCreation, runAllTests, testCases }; 