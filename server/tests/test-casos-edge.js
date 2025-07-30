// 🧪 TEST: Casos Edge Complejos del CallDecisionEngine

require('dotenv').config({ path: '../.env' });
const { callDecisionEngine } = require('./dist/services/callDecisionEngine.js');

// 🎯 CASO 1: Cliente con MÚLTIPLES incidencias abiertas
const multipleIncidenciasCase = [
  {
    sequence: 2,
    speaker: "user", 
    message: "Hola, soy María González. Tengo varias gestiones pendientes. Una sobre mi póliza de hogar y otra sobre el coche. Quería saber el estado de mi modificación de cobertura del hogar.",
    segment_start_time: 9,
    segment_end_time: 15,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 4,
    speaker: "agent",
    message: "[Tool Result: identificar_cliente]",
    segment_start_time: 20,
    segment_end_time: 23,
    tool_calls: [],
    tool_results: [
      {
        type: "webhook",
        is_error: false,
        tool_name: "identificar_cliente",
        request_id: "identificar_cliente_multiple",
        result_value: JSON.stringify({
          status: "success",
          data: {
            clientes: [{
              codigo_cliente: "999888F00",
              nombre_cliente: "MARIA GONZALEZ LOPEZ",
              email_cliente: "maria.gonzalez@email.com",
              telefono_1: "666777888"
            }],
            detalle_polizas: [
              {
                codigo_cliente: "999888F00",
                poliza: "HG9988776655", 
                ramo: "Hogar"
              },
              {
                codigo_cliente: "999888F00",
                poliza: "AU1122334455",
                ramo: "Coche"
              }
            ],
            // 🎯 MÚLTIPLES INCIDENCIAS ABIERTAS
            incidencias: [
              {
                codigo_cliente: "999888F00",
                codigo_incidencia: "NG4567890",
                tipo_de_incidencia: "Modificación póliza emitida",
                motivo_de_incidencia: "Modificación coberturas", 
                poliza: "HG9988776655",
                ramo: "Hogar",
                fecha_creacion_incidencia: "15.06.25"
              },
              {
                codigo_cliente: "999888F00", 
                codigo_incidencia: "NG7890123",
                tipo_de_incidencia: "Llamada gestión comercial",
                motivo_de_incidencia: "Consulta cliente",
                poliza: "AU1122334455", 
                ramo: "Coche",
                fecha_creacion_incidencia: "18.06.25"
              }
            ]
          }
        }),
        tool_latency_secs: 2.8,
        tool_has_been_called: true
      }
    ],
    feedback: null
  }
];

// 🎯 CASO 2: NUEVA contratación - Cliente existente quiere VIDA
const nuevaContratacionCase = [
  {
    sequence: 2,
    speaker: "user",
    message: "Hola, soy Carlos Ruiz. Ya tengo con vosotros el seguro del coche, pero me gustaría contratar un seguro de vida también.",
    segment_start_time: 9,
    segment_end_time: 15,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 4,
    speaker: "agent", 
    message: "[Tool Result: identificar_cliente]",
    segment_start_time: 20,
    segment_end_time: 23,
    tool_calls: [],
    tool_results: [
      {
        type: "webhook",
        is_error: false,
        tool_name: "identificar_cliente", 
        request_id: "identificar_cliente_nueva",
        result_value: JSON.stringify({
          status: "success", 
          data: {
            clientes: [{
              codigo_cliente: "777666F00",
              nombre_cliente: "CARLOS RUIZ MARTIN",
              email_cliente: "carlos.ruiz@email.com",
              telefono_1: "655444333"
            }],
            detalle_polizas: [{
              codigo_cliente: "777666F00",
              poliza: "AU5566778899",
              ramo: "Coche"
            }],
            incidencias: [] // Sin incidencias abiertas
          }
        }),
        tool_latency_secs: 2.2,
        tool_has_been_called: true
      }
    ],
    feedback: null
  }
];

// 🎯 CASO 3: MODIFICACIÓN póliza específica - Cambiar cuenta bancaria
const modificacionPolizaCase = [
  {
    sequence: 2,
    speaker: "user",
    message: "Buenos días, soy Ana Torres. Necesito cambiar la cuenta bancaria de mi seguro de hogar porque he cambiado de banco.",
    segment_start_time: 9,
    segment_end_time: 15,
    tool_calls: [],
    tool_results: [],
    feedback: null
  },
  {
    sequence: 4,
    speaker: "agent",
    message: "[Tool Result: identificar_cliente]", 
    segment_start_time: 20,
    segment_end_time: 23,
    tool_calls: [],
    tool_results: [
      {
        type: "webhook",
        is_error: false,
        tool_name: "identificar_cliente",
        request_id: "identificar_cliente_modif",
        result_value: JSON.stringify({
          status: "success",
          data: {
            clientes: [{
              codigo_cliente: "555444F00", 
              nombre_cliente: "ANA TORRES GOMEZ",
              email_cliente: "ana.torres@email.com",
              telefono_1: "644333222"
            }],
            detalle_polizas: [{
              codigo_cliente: "555444F00",
              poliza: "HG3344556677",
              ramo: "Hogar"
            }],
            incidencias: []
          }
        }),
        tool_latency_secs: 1.9,
        tool_has_been_called: true
      }
    ],
    feedback: null
  },
  {
    sequence: 5,
    speaker: "user",
    message: "Sí, la nueva cuenta es ES91 2100 0418 4502 0005 1332 del Banco Santander.",
    segment_start_time: 30,
    segment_end_time: 35,
    tool_calls: [],
    tool_results: [],
    feedback: null
  }
];

// 🎯 FUNCIÓN DE TEST UNIFICADA
async function testCasosEdge() {
  console.log('🧪 [TEST] Probando CASOS EDGE complejos...\n');
  
  const testCases = [
    {
      name: "MÚLTIPLES INCIDENCIAS",
      transcripts: multipleIncidenciasCase,
      conversationId: "conv_multiple_inc",
      expectations: {
        clientType: "existing",
        clientId: "999888F00", 
        isFollowUp: true,
        relatedTicketId: "NG4567890", // Debería elegir la de HOGAR (modificación coberturas)
        incidentType: "Modificación póliza emitida",
        createNewTicket: false
      }
    },
    {
      name: "NUEVA CONTRATACIÓN VIDA",
      transcripts: nuevaContratacionCase,
      conversationId: "conv_nueva_vida",
      expectations: {
        clientType: "existing",
        clientId: "777666F00",
        isFollowUp: false,
        incidentType: "Nueva contratación de seguros",
        ramo: "VIDA",
        createNewTicket: true,
        shouldCreateClient: false
      }
    },
    {
      name: "MODIFICACIÓN CUENTA BANCARIA", 
      transcripts: modificacionPolizaCase,
      conversationId: "conv_cambio_cuenta",
      expectations: {
        clientType: "existing",
        clientId: "555444F00",
        isFollowUp: false,
        incidentType: "Modificación póliza emitida",
        reason: "Cambio nº de cuenta",
        numeroPolizaAfectada: "HG3344556677",
        createNewTicket: true
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`🎯 [TEST] CASO: ${testCase.name}`);
    console.log('================================================================================');
    
    try {
      const decision = await callDecisionEngine.analyzeCall(
        testCase.transcripts,
        testCase.conversationId
      );
      
      // Extraer datos relevantes
      const clientType = decision.clientInfo?.clientType;
      const clientId = decision.clientInfo?.existingClientInfo?.clientId;
      const isFollowUp = decision.incidentAnalysis?.followUpInfo?.isFollowUp;
      const relatedTicketId = decision.incidentAnalysis?.followUpInfo?.relatedTicketId;
      const incidentType = decision.incidentAnalysis?.primaryIncident?.type;
      const reason = decision.incidentAnalysis?.primaryIncident?.reason;
      const ramo = decision.incidentAnalysis?.primaryIncident?.ramo;
      const numeroPolizaAfectada = decision.incidentAnalysis?.primaryIncident?.numeroPolizaAfectada;
      const createNewTicket = decision.incidentAnalysis?.followUpInfo?.createNewTicket;
      const shouldCreateClient = decision.decisions?.clientDecision?.shouldCreateClient;
      
      console.log(`Cliente: ${clientType} (${clientId})`);
      console.log(`Incidencia: ${incidentType} - ${reason}`);
      console.log(`Ramo: ${ramo} | Póliza: ${numeroPolizaAfectada}`);
      console.log(`Es rellamada: ${isFollowUp} | Related: ${relatedTicketId}`);
      console.log(`Crear ticket: ${createNewTicket} | Crear cliente: ${shouldCreateClient}`);
      
      // Validaciones específicas por caso
      let success = true;
      const exp = testCase.expectations;
      
      if (exp.clientType && clientType !== exp.clientType) success = false;
      if (exp.clientId && clientId !== exp.clientId) success = false;
      if (exp.isFollowUp !== undefined && isFollowUp !== exp.isFollowUp) success = false; 
      if (exp.relatedTicketId && relatedTicketId !== exp.relatedTicketId) success = false;
      if (exp.incidentType && incidentType !== exp.incidentType) success = false;
      if (exp.reason && reason !== exp.reason) success = false;
      if (exp.ramo && ramo !== exp.ramo) success = false;
      if (exp.numeroPolizaAfectada && numeroPolizaAfectada !== exp.numeroPolizaAfectada) success = false;
      if (exp.createNewTicket !== undefined && createNewTicket !== exp.createNewTicket) success = false;
      if (exp.shouldCreateClient !== undefined && shouldCreateClient !== exp.shouldCreateClient) success = false;
      
      console.log(success ? '✅ ÉXITO' : '❌ FALLÓ');
      console.log('================================================================================\n');
      
    } catch (error) {
      console.error('❌ ERROR:', error.message);
      console.log('================================================================================\n');
    }
  }
}

// Ejecutar tests
testCasosEdge(); 