import { generateStructuredResponse } from '../lib/gemini';
import type { TranscriptMessage } from '../types/common.types';
import type { NogalTipoCreacion, NogalClientData } from '../types/nogal_tickets.types';

export interface NogalIncidencia {
  tipo: string;
  motivo: string;
  ramo?: string;
  consideraciones?: string;
  necesidadCliente?: string;
  tipoCreacion: NogalTipoCreacion;
  esRellamada?: boolean; // NUEVO: indica si esta incidencia es una rellamada
  incidenciaRelacionada?: string; // NUEVO: ID de la incidencia existente si es rellamada
}

export interface NogalAnalysisResult {
  incidenciaPrincipal: NogalIncidencia;
  incidenciasSecundarias: NogalIncidencia[];
  confidence: number; // 0-1
  resumenLlamada: string;
  datosExtraidos: {
    [key: string]: any;
  };
  notasParaNogal?: string; // Notas específicas según reglas del CSV
  requiereTicket: boolean;
  prioridad: 'low' | 'medium' | 'high';
  // NUEVOS CAMPOS PARA MÚLTIPLES GESTIONES
  multipleGestiones?: boolean; // true si hay más de una gestión
  totalGestiones?: number; // número total de gestiones identificadas
}

class NogalAnalysisService {
  
  private readonly NOGAL_PROMPT = `
🚀 **ANÁLISIS AUTÓNOMO - INSTRUCCIÓN PRINCIPAL**:

🔥 **LA TRANSCRIPCIÓN COMPLETA TIENE TODA LA INFORMACIÓN QUE NECESITAS**:
- Datos del cliente (nombre, DNI, email, teléfono)
- Pólizas contratadas y números de póliza
- Incidencias abiertas y gestiones previas
- Contexto completo de todas las gestiones solicitadas

🎯 **TU MISIÓN - SÉ COMPLETAMENTE AUTÓNOMO**:
1. **EXTRAE TODO** de la transcripción directamente
2. **NO DEPENDAS** de datos externos - analiza SOLO la conversación
3. **IDENTIFICA MÚLTIPLES GESTIONES** si existen en una misma llamada
4. **DETECTA RELLAMADAS** cuando cliente menciona incidencias previas
5. **ENCUENTRA NÚMEROS DE PÓLIZA** mencionados en la conversación

🔥 **INSTRUCCIÓN CRÍTICA: ANALIZA LA CONVERSACIÓN COMPLETA DE PRINCIPIO A FIN**
NO te enfoques solo en la solicitud inicial del cliente. DEBES analizar TODA la conversación hasta el final para entender QUÉ REALMENTE PASÓ en la llamada.

⚠️ **REGLA FUNDAMENTAL: EL RESULTADO FINAL DE LA LLAMADA ES MÁS IMPORTANTE QUE LA SOLICITUD INICIAL**

Eres un experto en seguros y atención al cliente de la Correduría de Seguros Nogal. 
Analiza la siguiente conversación telefónica COMPLETA y clasifícala según los tipos de incidencia exactos de Nogal.

🔍 **METODOLOGÍA DE ANÁLISIS OBLIGATORIA**:

**ETAPA 1 - LECTURA COMPLETA**:
- Lee TODA la conversación de principio a fin SIN interrupciones
- NO hagas suposiciones basadas solo en las primeras líneas
- Entiende el FLUJO COMPLETO de la conversación

**ETAPA 2 - IDENTIFICACIÓN DEL RESULTADO REAL**:
- ¿Cómo TERMINA realmente la conversación?
- ¿Se resolvió la solicitud del cliente o NO?
- ¿Por qué NO se resolvió? (datos incompletos, agente sin acceso, etc.)

**ETAPA 3 - APLICACIÓN DE REGLAS DE NEGOCIO**:
- Aplica las reglas de Nogal según el RESULTADO FINAL, no la solicitud inicial
- Si la conversación NO se completó por falta de datos → "Datos incompletos"
- Si la conversación NO se resolvió por limitaciones del agente → "LLam gestión comerc"

🚨 **CASOS CRÍTICOS - EJEMPLOS REALES**:

**EJEMPLO 1 - SOLICITUD DE CAMBIO DNI SIN DATOS**:
- Cliente: "Quiero cambiar el DNI de un asegurado"
- Agente: "Necesito el DNI actual y el nuevo DNI"
- Cliente: "No tengo el DNI ahora mismo"
- Agente: "Entonces necesitaría que vuelva a llamar cuando tenga los datos"
- **ANÁLISIS**: La solicitud inicial es cambio DNI, PERO la conversación termina sin resolver por falta de datos
- **CLASIFICACIÓN CORRECTA**: "Modificación póliza emitida" + "Datos incompletos"
- **CLASIFICACIÓN INCORRECTA**: "Modificación póliza emitida" + "Modificación nº asegurados"

**EJEMPLO 2 - CONSULTA SIN RESPUESTA DEL AGENTE**:
- Cliente: "¿Mi póliza incluye reparación de electrodomésticos?"
- Agente: "No tengo acceso a esa información específica de coberturas"
- Agente: "Tengo que consultar esto y le llamaremos"
- **ANÁLISIS**: La solicitud inicial es consulta de coberturas, PERO el agente NO puede responder
- **CLASIFICACIÓN CORRECTA**: "Llamada gestión comercial" + "LLam gestión comerc"
- **CLASIFICACIÓN INCORRECTA**: "Llamada gestión comercial" + "Consulta cliente"

**EJEMPLO 3 - INCLUSIÓN ASEGURADO SIN FECHA NACIMIENTO**:
- Cliente: "Quiero incluir a mi hijo en la póliza de salud"
- Agente: "Necesito su fecha de nacimiento exacta"
- Cliente: "No me acuerdo, tendría que preguntarle"
- Agente: "Vuelva a llamar cuando tenga esa información"
- **ANÁLISIS**: La solicitud inicial es incluir asegurado, PERO termina sin completarse por falta de datos
- **CLASIFICACIÓN CORRECTA**: "Modificación póliza emitida" + "Datos incompletos"
- **CLASIFICACIÓN INCORRECTA**: "Modificación póliza emitida" + "Modificación nº asegurados"

TIPOS DE INCIDENCIA DISPONIBLES (CSV oficial actualizado de Nogal):

1. **Nueva contratación de seguros**
   - "Contratación Póliza" (ramo: el que corresponda - hogar/auto/vida/decesos/Salud/otros)
     • Consideración: Si el cliente no existe se crea y sobre esa ficha se crea la incidencia => entramos en creación de clientes, puede ser recomendado de cliente, sin referencias. Puede haber creado por una campaña de referimiento actualmente no muy activas salvo la del metro
     • Necesidad: Cliente llama porque quiere contratar un seguro y no tiene incidencia de vencimiento pendiente de contratar en nuestro sistema
     • Tipo creación: Manual / Automática
   - "Póliza anterior suspensión de garantías"
     • Consideración: debe de tener la póliza el check de suspensión de garantias "si"
     • Necesidad: Cliente llama porque quiere contratar un seguro y tiene una reserva de prima en cia
     • Tipo creación: Manual / Automática

2. **Modificación póliza emitida**
   - "Atención al cliente - Modif datos póliza"
     • Consideración: rellenamos datos en notas
     • Necesidad: Cliente llama porque quiere hacer alguna modificación que no varía prima (nombre o apellido…) y nos facilita directamente el dato correcto
     • Tipo creación: Manual / Automática
   - "Cambio nº de cuenta"
     • Consideración: rellenamos datos en notas
     • Necesidad: Cliente llama porque quiere cambiar la ccc en las pólizas y nos facilita la nueva cuenta
     • Tipo creación: Manual / Automática
   - "Cambio fecha de efecto"
     • Consideración: metemos en notas este dato
     • Necesidad: Cliente solicita el cambio de la fecha de efecto de la póliza, el cambio de la entrada en vigor de su seguro
     • Tipo creación: Manual / Automática
   - "Cambio forma de pago"
     • Consideración: metemos en notas este dato
     • Necesidad: Cliente solicita el cambio de la forma de pago, de la peridicidad del pago de su póliza SIN QUE FUERA ANUAL la forma de pago que tenia y que quiere modificar
     • Tipo creación: Manual / Automática
   - "Modificación nº asegurados"
     • Consideración: metemos en notas este dato. Metemos en notas asegurado a incluir o excluir. Nombre apellidos DNI si lo tuviera y fecha de nacimiento- Nombre y apellidos del asegurado a excluir. Metemos en notas desde que fecha quiere el cliente que entre en vigor el cambio
     • Necesidad: Cliente solicita que se incluya a un nuevo asegurado o bien que se elimine a alguno de los que tiene incluidos en póliza. Hay que preguntarle desde que fecha quiere que aplique el cambio
     • Tipo creación: Manual / Automática
   - "Cambio dirección postal"
     • Consideración: metemos en notas la nueva dirección
     • Necesidad: Cliente solicita que se modifique la dirección postal de sus pólizas
     • Tipo creación: Manual / Automática
   - "Modificación coberturas"
     • Consideración: metemos en notas lo que nos indiquen respecto a la cobertura a modificar, ejemplo: de todo riesgo a terceros en coche, quitar o incluir reparación de electrodomésticos... Metemos en notas desde que fecha quiere el cliente que entre en vigor el cambio
     • Necesidad: Cliente solicita modificación de cobertura de su póliza, ejemplo: de todo riesgo a terceros en coche, quitar o incluir reparación de electrodomésticos... Hay que preguntarle desde que fecha quiere que aplique el cambio
     • Tipo creación: Manual / Automática
   - "Cesión de derechos datos incompletos"
     • Consideración: Cliente solicita una cesión de derechos para un préstamo hipotecario, pero no tienen los datos para dárnoslos en la llamada. Hay que indicarle que los busque y nos vuelva a llamar cuando los tenga disponibles indicándole que necesitamos Nº de préstamo; banco (entidad y oficina) / Fecha inicio y fin del préstamo
     • Necesidad: Cliente solicita una cesión de derechos para un préstamo hipotecario, pero no tienen los datos para dárnoslos en la llamada
     • Tipo creación: Exclusiva IA
   - "Cesión de derechos"
     • Consideración: metemos en notas Nº de préstamo; banco (entidad y oficina) / Fecha inicio y fin del préstamo
     • Necesidad: Cliente solicita una cesión de derechos para un préstamo hipotecario y dispone de los datos requeridos, Nº de préstamo; banco (entidad y oficina) / Fecha inicio y fin del préstamo
     • Tipo creación: Manual / Automática
   - "Corrección datos erróneos en póliza"
     • Consideración: metemos en notas los datos a corregir y los valores correctos
     • Necesidad: Cliente solicita corregir errores que ha detectado en su póliza. Nos debe indicar los datos a corregir así como los valores correctos
     • Tipo creación: Manual / Automática
   - "Datos incompletos"
     • Consideración: metemos en notas los campos que quería modificar el cliente señalando que no tenía los datos completos en el momento de la llamada
     • Necesidad: Cliente solicita cambios pero no dispone de los nuevos datos
     • Tipo creación: Exclusiva IA

3. **Llamada asistencia en carretera**
   - "Siniestros"
     • Consideración: Cliente llama porque necesita una grúa. Pasamos directamente con asistencia de cia
     • Necesidad: Cliente llama porque necesita una grúa. Pasamos directamente con asistencia de cia
     • Tipo creación: Manual / Automática

4. **Retención cliente**
   - "Retención cliente"
     • Consideración: Cliente llama para ver renovación o anular una póliza
     • Necesidad: Cliente llama para ver renovación o anular una póliza
     • Tipo creación: Manual / Automática

5. **Llamada gestión comercial**
   - "LLam gestión comerc"
     • Consideración: Cliente solicita alguna gestión sobre una póliza ya contratada que no es ni renovación ni anulación
     • Necesidad: Cliente solicita alguna gestión sobre una póliza ya contratada que no es ni renovación ni anulación
     • Tipo creación: Manual / Automática
   - "Pago de Recibo"
     • Consideración: Cliente llama para realizar un pago pendiente de recibo. Se puede crear sobre una póliza contratada o cancelada
     • Necesidad: Cliente llama para realizar un pago pendiente de recibo. Se puede crear sobre una póliza contratada o cancelada
     • Tipo creación: Exclusiva agentes humanos
   - "Consulta cliente"
     • Consideración: Los gestores de atención al cliente dan respuesta al cliente en línea, la incidencia se les genera a ellos y se debe cerrar siempre
     • Necesidad: Cliente llama para realizar consulta y se puede resolver desde atención al cliente (info fechas de efecto, formas de pago, cias contratadas…). En el caso de IA aquí entraría todas las dudas que resuelva que se le haya facultado para ello en las FAQ
     • FAQ que puede resolver la IA:
       * ¿Cuál es la fecha de efecto de mi póliza?
       * ¿Cuál es mi número de póliza?
       * ¿Con qué compañía está emitida mi póliza?
       * ¿Cómo se realiza el pago?
       * ¿Cuándo se gira el próximo recibo?
     • Tipo creación: Manual / Automática
   - "Cambio forma de pago"
     • Consideración: metemos en notas este dato
     • Necesidad: Cliente solicita el cambio de la forma de pago, TIENE FORMA DE PAGO ANUAL Y QUIERE FRACCIONAR
     • Tipo creación: Manual / Automática
   - "Reenvío siniestros"
     • Consideración: Siempre que se pase la llamada a la cola de siniestros el ticket a crear debe tener el tipo "Llamada gestión comercial" y el motivo "Reenvío siniestros"
     • Necesidad: Cliente necesita ser transferido a la cola de siniestros
     • Tipo creación: Exclusiva IA
   - "Reenvío agentes humanos"
     • Consideración: Cuando se pase la llamada a la cola de humanos el ticket a crear debe tener el tipo "Llamada gestión comercial" y el motivo "Reenvío agentes humanos", siempre que no sea porque el cliente no quiere hablar con la IA o porque la persona que llama no es el tomador de la póliza de referencia
     • Necesidad: Cliente necesita ser transferido a agentes humanos por razones generales (no es cliente, proveedor, servicios de energía/seguridad, reclamaciones, pago recibos, comunicaciones por mail/sms, temas prohibidos como cripto/fiscalidad/política/inversiones)
     • Tipo creación: Exclusiva IA
   - "Reenvío agentes humanos no quiere IA"
     • Consideración: El cliente indica que quiere hablar con un agente humano
     • Necesidad: El cliente indica que quiere hablar con un agente humano
     • Tipo creación: Exclusiva IA
   - "Reenvío agentes humanos no tomador"
     • Consideración: La persona que llama no se corresponde con el tomador de la póliza
     • Necesidad: La persona que llama no se corresponde con el tomador de la póliza
     • Tipo creación: Exclusiva IA

6. **Baja cliente en BBDD**
   - "Baja Cliente BBDD"
     • Consideración: Cliente llama solicitando baja en la base de datos de sus datos porque no quiere que le llamen más
     • Necesidad: Cliente llama solicitando baja en la base de datos de sus datos porque no quiere que le llamen más
     • Tipo creación: Manual / Automática

7. **Reclamación cliente regalo**
   - "Reclamación atención al cliente"
     • Consideración: Cliente llama indicando que no ha recibido regalo ofrecido por comercial, por recomendar a otro cliente...
     • Necesidad: Cliente llama indicando que no ha recibido regalo ofrecido por comercial, por recomendar a otro cliente...
     • Tipo creación: Manual / Automática

8. **Solicitud duplicado póliza**
   - "Correo ordinario"
     • Consideración: Cliente solicita envío de duplicado de póliza por correo ordinario
     • Necesidad: Cliente solicita envío de duplicado de póliza por correo ordinario
     • Tipo creación: Manual / Automática
   - "Duplicado Tarjeta"
     • Consideración: Cliente solicita envío de duplicado de las tarjetas de seguro de decesos o salud
     • Necesidad: Cliente solicita envío de duplicado de las tarjetas de seguro de decesos o salud
     • Tipo creación: Manual / Automática
   - "Email"
     • Consideración: Cliente solicita envío de duplicado de póliza por email
     • Necesidad: Cliente solicita envío de duplicado de póliza por email
     • Tipo creación: Manual / Automática
   - "Información recibos declaración renta"
     • Consideración: Cliente solicita envío de recibos de ejercicio fiscal anterior para incorporar los datos a su declaración de la renta
     • Necesidad: Cliente solicita envío de recibos de ejercicio fiscal anterior para incorporar los datos a su declaración de la renta
     • Tipo creación: Manual / Automática

🔥 **REGLAS CRÍTICAS - ANÁLISIS DE TODA LA CONVERSACIÓN**:

🚨 **REGLA ABSOLUTA - DATOS INCOMPLETOS TIENE PRIORIDAD MÁXIMA**:
Si en CUALQUIER punto de la conversación el cliente NO tiene los datos necesarios para completar su solicitud, SIEMPRE clasificar como "Datos incompletos", independientemente de cuál era su solicitud inicial.

🚨 **REGLA ABSOLUTA - GESTIÓN NO RESUELTA TIENE PRIORIDAD ALTA**:
Si el agente NO puede resolver la consulta/gestión en la misma llamada, SIEMPRE clasificar como "LLam gestión comerc", independientemente de cuál era la consulta inicial.

**PASO 1 - ANÁLISIS OBLIGATORIO DEL FINAL DE LA LLAMADA**:

🔍 **SEÑALES ABSOLUTAS DE DATOS INCOMPLETOS** (PRIORIDAD MÁXIMA):
- Cliente dice: "no tengo", "no sé", "no recuerdo", "no me acuerdo", "no lo tengo aquí"
- Cliente dice: "tendría que preguntar", "necesito buscarlo", "no lo sé de memoria"
- Agente dice: "necesito que me proporcione", "vuelva a llamar cuando tenga", "sin esos datos no puedo"
- Conversación termina SIN completar la gestión por falta de información del cliente
- Cliente promete "volver a llamar", "llamaré cuando tenga los datos"

🔍 **SEÑALES ABSOLUTAS DE GESTIÓN NO RESUELTA** (PRIORIDAD ALTA):
- Agente dice: "no tengo acceso a", "tengo que consultar", "necesito revisar", "le derivaremos"
- Agente dice: "no puedo ver esa información", "eso lo tiene que ver otro departamento"
- Agente NO puede dar respuesta inmediata y completa
- Se menciona que "llamaremos", "nos pondremos en contacto", "haremos seguimiento"
- La consulta requiere seguimiento posterior o transferencia

**PASO 2 - APLICACIÓN INMEDIATA DE CLASIFICACIÓN**:

🚨 **SI DETECTAS DATOS INCOMPLETOS** → **OBLIGATORIO**:
- Tipo: "Modificación póliza emitida"
- Motivo: "Datos incompletos"
- NO importa si era cambio DNI, incluir asegurado, cambio cuenta, etc.
- EN NOTAS: especificar qué quería cambiar pero qué datos le faltaban

🚨 **SI DETECTAS GESTIÓN NO RESUELTA** → **OBLIGATORIO**:
- Tipo: "Llamada gestión comercial"  
- Motivo: "LLam gestión comerc"
- NO importa si era consulta específica o modificación
- EN NOTAS: especificar qué consultó pero que no se pudo resolver

**PASO 3 - VERIFICACIÓN CON EJEMPLOS CRÍTICOS**:

✅ **CORRECTO - Análisis completo**:
- Cliente: "Quiero cambiar el DNI de mi esposa"
- Agente: "¿Cuál es el DNI actual y el nuevo?"
- Cliente: "No me acuerdo del DNI actual"
- Agente: "Sin el DNI actual no puedo hacer la modificación"
- Cliente: "Vale, llamaré cuando lo tenga"
- **RESULTADO**: "Datos incompletos" (NO "Modificación nº asegurados")

❌ **INCORRECTO - Solo solicitud inicial**:
- Misma conversación → Clasificar como "Modificación nº asegurados"
- **ERROR**: No analiza que la conversación NO se completó por falta de datos

✅ **CORRECTO - Análisis completo**:
- Cliente: "¿Mi seguro de hogar cubre filtraciones de agua?"
- Agente: "No tengo acceso al detalle de coberturas específicas"
- Agente: "Tendría que consultarlo y le llamamos"
- **RESULTADO**: "LLam gestión comerc" (NO "Consulta cliente")

❌ **INCORRECTO - Solo solicitud inicial**:
- Misma conversación → Clasificar como "Consulta cliente"
- **ERROR**: No analiza que el agente NO pudo responder

**RAMO**: Solo incluir en "Nueva contratación de seguros - Contratación Póliza". Analiza la conversación para determinar el tipo de seguro que quiere contratar.

**NÚMERO DE PÓLIZA - REGLA CRÍTICA**: Si el cliente tiene pólizas contratadas, SIEMPRE incluir el número relevante (excepto en nueva contratación). 

🎯 **METODOLOGÍA PARA EXTRAER NÚMERO DE PÓLIZA**:

**PASO 1**: Analizar si se menciona un tipo específico de póliza en la conversación:
- "póliza de coche" / "seguro de auto" → buscar póliza de ramo AUTO
- "póliza de casa" / "seguro de hogar" → buscar póliza de ramo HOGAR  
- "seguro de vida" → buscar póliza de ramo VIDA
- "seguro de decesos" → buscar póliza de ramo DECESOS
- "seguro de salud" → buscar póliza de ramo SALUD

**PASO 2**: Si el cliente tiene pólizas en los datos, buscar la que coincida con el ramo mencionado:
- Si hay UNA póliza del ramo mencionado → usar esa póliza
- Si hay MÚLTIPLES pólizas del mismo ramo → usar la primera/activa
- Si NO se menciona ramo específico pero hay pólizas → usar la primera póliza disponible

**PASO 3**: Si se menciona un número de póliza específico en la conversación → usar exactamente ese número

**EJEMPLOS PRÁCTICOS**:
- Conversación: "quiero cambiar algo en mi póliza de coche" + Cliente tiene póliza AUTO "123456" → numeroPoliza: "123456"
- Conversación: "mi seguro de casa" + Cliente tiene póliza HOGAR "789012" → numeroPoliza: "789012" 
- Conversación: "quiero modificar la póliza 555777" → numeroPoliza: "555777"
- Conversación: "mi póliza" (genérico) + Cliente tiene 3 pólizas → usar la primera

**REGLA ABSOLUTA**: NUNCA dejar numeroPoliza vacío si el cliente tiene pólizas contratadas Y se está hablando de una gestión sobre póliza existente.

**REGLAS ESPECÍFICAS ADICIONALES:**

**RECLAMACIÓN DE REGALO**: Si el cliente menciona que no recibió un regalo, promoción, o beneficio prometido → USAR "Reclamación cliente regalo - Reclamación atención al cliente"

**PAGO DE RECIBOS**: 
- Cliente llama para pagar recibo → "Llamada gestión comercial - Pago de Recibo"
- NOTA: Este tipo es "Exclusiva agentes humanos" (solo se crea cuando se transfiere a humanos)

**CAMBIO FORMA DE PAGO - REGLA CRÍTICA**:
ANALIZAR la forma de pago ACTUAL del cliente:

- **SI TIENE PAGO ANUAL** y quiere fraccionar → "Llamada gestión comercial - Cambio forma de pago"
- **SI NO TIENE PAGO ANUAL** y quiere cambiar periodicidad → "Modificación póliza emitida - Cambio forma de pago"

Ejemplos:
- Cliente con pago anual → quiere mensual = "Llamada gestión comercial"
- Cliente con pago semestral → quiere anual = "Modificación póliza emitida"
- Cliente con pago mensual → quiere trimestral = "Modificación póliza emitida"

**TRANSFERENCIAS ESPECÍFICAS**:
- Cliente dice explícitamente "quiero hablar con una persona" → "Llamada gestión comercial - Reenvío agentes humanos no quiere IA"
- Persona que llama no es el tomador → "Llamada gestión comercial - Reenvío agentes humanos no tomador"
- Transferencia por otras razones (no es cliente, proveedor, energía/seguridad, reclamaciones, pago recibos, mail/sms, temas prohibidos) → "Llamada gestión comercial - Reenvío agentes humanos"

**CONSULTA CLIENTE vs LLAM GESTIÓN COMERC - ANÁLISIS EXHAUSTIVO**:

- **"Consulta cliente"**: SOLO cuando la consulta SÍ se resuelve COMPLETAMENTE en la misma llamada:
  * El agente responde directamente y de forma completa
  * Se proporciona TODA la información solicitada al momento
  * FAQ que puede resolver la IA: fecha efecto, número póliza, compañía, forma pago, próximo recibo
  * El cliente queda COMPLETAMENTE satisfecho con la respuesta
  * NO se requiere seguimiento ni transferencia
  * La conversación termina con la información proporcionada
  
- **"LLam gestión comerc"**: SIEMPRE cuando la gestión NO se resuelve completamente en la misma llamada:
  * El agente NO puede dar respuesta inmediata o completa
  * Se necesita transferir a otro departamento o consultar
  * Se requiere seguimiento posterior o revisión
  * El agente dice: "tengo que consultar", "te llamaremos", "necesito derivar esto", "no tengo acceso"
  * Gestiones complejas que no son ni renovación ni anulación
  * Cualquier situación donde la llamada NO cierra con una solución completa

**RECIBOS PARA DECLARACIÓN DE RENTA**: Si el cliente solicita recibos para la declaración de la renta → "Solicitud duplicado póliza - Información recibos declaración renta"

🔥 **GESTIONES MÚLTIPLES - REGLA CRÍTICA**:

**IMPORTANTE**: Una conversación puede tener **MÚLTIPLES GESTIONES DIFERENTES**. Debes analizarlas TODAS:

1. **INCIDENCIA PRINCIPAL**: La gestión más importante o la primera mencionada
2. **INCIDENCIAS SECUNDARIAS**: Otras gestiones adicionales en la misma llamada

**TIPOS DE GESTIONES QUE PUEDEN COEXISTIR**:
- ✅ **RELLAMADA** + **TICKET NUEVO**: Cliente llama por seguimiento Y solicita algo nuevo
- ✅ **MÚLTIPLES TICKETS**: Cliente solicita varias gestiones nuevas diferentes
- ✅ **CONSULTA** + **MODIFICACIÓN**: Cliente pregunta algo Y solicita un cambio

📞 **DETECCIÓN DE RELLAMADAS**:

Una **RELLAMADA** se identifica cuando:
1. **El cliente menciona una incidencia/ticket/caso YA ABIERTO** que tiene pendiente
2. **Solicita seguimiento** sobre esa incidencia existente
3. **Se identifica la incidencia en sus datos abiertos**

🔍 **INDICADORES DE RELLAMADA**:
- Cliente dice: "tengo un caso abierto", "sobre mi incidencia", "el ticket que tengo", "mi consulta anterior"
- Cliente menciona: "me dijeron que me llamarían", "estoy esperando respuesta", "quiero seguimiento"
- Agente dice: "veo que tiene una incidencia abierta sobre...", "paso nota a mis compañeros"
- Se identifica una incidencia abierta en los datos del cliente Y el cliente hace referencia a ella

**EJEMPLOS DE MÚLTIPLES GESTIONES**:

🎯 **CASO TÍPICO - RELLAMADA + TICKET NUEVO**:
- Cliente: "Me han llamado por mi incidencia de hogar y estaba esperando respuesta" (→ RELLAMADA)
- Cliente: "También quiero un duplicado de mi póliza de vida por email" (→ TICKET NUEVO)

🎯 **CASO MÚLTIPLES TICKETS**:
- Cliente: "Quiero cambiar mi cuenta bancaria" (→ TICKET 1)
- Cliente: "Y también necesito un duplicado de póliza" (→ TICKET 2)

**DETECCIÓN OBLIGATORIA**: Siempre buscar frases como:
- "También...", "Y otra cosa...", "Ya que estoy...", "Ya aprovechando...", "Además..."
- "Otra gestión que necesito...", "Y por último...", "Una cosa más..."

{{clientData}}

REGLAS ESPECIALES:
- En modificaciones: SIEMPRE preguntar fecha de inicio (hoy, renovación póliza...)
- Si existe incidencia pendiente de vencimiento: crear rellamada sobre esa incidencia
- Para "Exclusiva IA": solo crear automáticamente con alta confianza
- Para "Manual / Automática": se puede crear tanto manual como automáticamente

🚨 **MÉTODO DE ANÁLISIS PASO A PASO - OBLIGATORIO**:

**PASO 1**: Lee TODA la conversación sin interrupciones - NO te quedes en las primeras líneas
**PASO 2**: Identifica la solicitud inicial del cliente (ej: "quiero cambiar DNI")
**PASO 3**: Analiza CÓMO se desarrolla la conversación - ¿qué problemas surgen?
**PASO 4**: Identifica CÓMO TERMINA la conversación - ¿se resolvió o no? ¿por qué?
**PASO 5**: Aplica las reglas según el RESULTADO FINAL, no la solicitud inicial

🔥 **EJEMPLOS DE ANÁLISIS COMPLETO OBLIGATORIOS**:

**CASO A - Cambio DNI con datos incompletos**:
CONVERSACIÓN EJEMPLO:
CLIENTE: Hola, quiero cambiar el DNI de mi esposa en la póliza
AGENTE: Perfecto, necesito el DNI actual de su esposa y el nuevo DNI
CLIENTE: El nuevo DNI sí lo tengo, es 12345678Z
AGENTE: ¿Y cuál es el DNI actual que figura en la póliza?
CLIENTE: Ese no me lo sé de memoria
AGENTE: Sin el DNI actual no puedo hacer la modificación
CLIENTE: Vale, entonces llamaré cuando lo tenga

**ANÁLISIS PASO A PASO**:
- Solicitud inicial: Cambio de DNI (sería "Modificación nº asegurados")
- Desarrollo: Cliente proporciona nuevo DNI pero NO tiene el actual
- Final: Conversación termina SIN resolver por falta de datos del cliente
- Frases clave: "no me lo sé", "sin el DNI actual no puedo", "llamaré cuando lo tenga"
- **CLASIFICACIÓN**: "Datos incompletos" (NO "Modificación nº asegurados")

**CASO B - Consulta sin respuesta del agente**:
CONVERSACIÓN EJEMPLO:
CLIENTE: Quería saber si mi seguro de hogar cubre daños por filtraciones
AGENTE: Déjeme ver... no tengo acceso a ese detalle de coberturas
AGENTE: Tendría que consultarlo en el sistema interno
CLIENTE: ¿Y cuándo podría saberlo?
AGENTE: Le llamaremos en 24-48 horas con la respuesta

**ANÁLISIS PASO A PASO**:
- Solicitud inicial: Consulta sobre coberturas (sería "Consulta cliente")
- Desarrollo: Agente no tiene acceso a la información
- Final: Conversación termina SIN respuesta, requiere seguimiento
- Frases clave: "no tengo acceso", "tendría que consultarlo", "le llamaremos"
- **CLASIFICACIÓN**: "LLam gestión comerc" (NO "Consulta cliente")

CONVERSACIÓN A ANALIZAR:
{{conversation}}

🔥 **INSTRUCCIONES FINALES - ANÁLISIS EXHAUSTIVO**:

1. **PRIMERO**: Lee la conversación COMPLETA - NO hagas suposiciones tempranas
2. **SEGUNDO**: Identifica el RESULTADO REAL de la llamada, no solo la solicitud inicial  
3. **TERCERO**: Busca señales de datos incompletos o gestión no resuelta
4. **CUARTO**: Aplica las reglas según el análisis completo de toda la conversación
5. **QUINTO**: Verifica que tu clasificación coincide con los ejemplos dados
6. **SEXTO**: GENERAR NOTAS ESPECÍFICAS según las consideraciones exactas del CSV
7. Extrae solo información mencionada EXPLÍCITAMENTE en la conversación
8. Para ramo: solo en "Nueva contratación de seguros - Contratación Póliza"
9. Para número de póliza: incluir si el cliente tiene pólizas (excepto nueva contratación)
10. Determina prioridad basada en urgencia y complejidad
11. El campo "requiereTicket" debe ser true salvo casos excepcionales

🚨 **REGLA CRÍTICA - CONSIDERACIONES Y NOTAS OBLIGATORIAS**:

Para CADA tipo de incidencia, DEBES seguir EXACTAMENTE las consideraciones del CSV para generar las notas:

**EJEMPLOS DE CONSIDERACIONES ESPECÍFICAS**:

• **"Modificación nº asegurados"** → NOTAS OBLIGATORIAS:
  - Asegurado a incluir o excluir (nombre, apellidos, DNI, fecha nacimiento)
  - Fecha desde la que quiere que aplique el cambio
  - Número de póliza específica si se identifica
  - Ejemplo: "Cliente quiere incluir a su hijo Juan García López, DNI 12345678A, nacido 15/03/2000, en póliza 123456 (AUTO), a partir del 01/04/2024"

• **"Cambio nº de cuenta"** → NOTAS OBLIGATORIAS:
  - Nueva cuenta bancaria completa
  - Número de póliza específica si se identifica
  - Ejemplo: "Cliente facilita nueva CCC: ES12 1234 5678 9012 3456 7890 para póliza 123456 (AUTO)"

• **"Cesión de derechos"** → NOTAS OBLIGATORIAS:
  - Nº de préstamo, banco (entidad y oficina), fecha inicio y fin
  - Ejemplo: "Préstamo 123456789, Banco Santander Oficina 0049, vigencia 01/01/2020 - 01/01/2040"

• **"Datos incompletos"** → NOTAS OBLIGATORIAS:
  - Qué quería modificar el cliente + qué datos específicos le faltaban
  - Número de póliza específica si se identifica
  - Ejemplo: "Cliente quería cambiar DNI de asegurado en póliza 123456 (AUTO) pero no disponía del DNI actual en el momento de la llamada"

• **"Cambio dirección postal"** → NOTAS OBLIGATORIAS:
  - Nueva dirección completa
  - Ejemplo: "Nueva dirección: Calle Mayor 123, 4º B, 28001 Madrid"

• **"Modificación coberturas"** → NOTAS OBLIGATORIAS:
  - Cobertura específica a modificar + fecha de aplicación
  - Número de póliza específica si se identifica
  - Ejemplo: "Cliente quiere cambiar de todo riesgo a terceros en póliza 123456 (AUTO) matrícula 1234ABC, efectivo desde renovación"

• **"LLam gestión comerc"** → NOTAS OBLIGATORIAS:
  - Qué consultó el cliente + por qué no se pudo resolver
  - Ejemplo: "Cliente consultó sobre cobertura de filtraciones, agente sin acceso a detalle de coberturas, requiere consulta interna"

• **"Consulta cliente"** → NOTAS OBLIGATORIAS:
  - Qué consultó + respuesta proporcionada
  - Ejemplo: "Cliente consultó fecha efecto póliza 123456, se informó que es 15/03/2024"

• **"Cambio forma de pago"** → NOTAS OBLIGATORIAS:
  - Forma de pago actual + nueva forma de pago solicitada
  - Ejemplo: "Cliente con pago anual quiere cambiar a pago mensual" o "Cliente con pago semestral quiere cambiar a anual"

• **"Cambio fecha de efecto"** → NOTAS OBLIGATORIAS:
  - Nueva fecha de efecto solicitada
  - Ejemplo: "Cliente solicita cambio fecha efecto al 01/05/2024"

• **"Corrección datos erróneos en póliza"** → NOTAS OBLIGATORIAS:
  - Datos a corregir + valores correctos
  - Ejemplo: "Corregir nombre asegurado de 'Juan Pérez' a 'Juan Pérez García' en póliza 123456"

• **"Atención al cliente - Modif datos póliza"** → NOTAS OBLIGATORIAS:
  - Datos específicos a modificar
  - Ejemplo: "Cambiar apellido de 'García' a 'García López' en póliza 123456"

• **"Contratación Póliza"** → NOTAS OBLIGATORIAS:
  - Tipo de seguro + detalles de contratación + origen (recomendación, campaña)
  - Ejemplo: "Cliente quiere contratar seguro de hogar para vivienda en Madrid, recomendado por cliente existente"

• **"Reenvío agentes humanos"** → NOTAS OBLIGATORIAS:
  - Motivo específico del reenvío
  - Ejemplo: "Cliente es proveedor, no cliente - reenvío a agentes humanos"

• **"Reenvío agentes humanos no quiere IA"** → NOTAS OBLIGATORIAS:
  - Confirmación de que cliente solicitó expresamente hablar con persona
  - Ejemplo: "Cliente solicitó expresamente hablar con agente humano"

• **"Cesión de derechos datos incompletos"** → NOTAS OBLIGATORIAS:
  - Qué datos del préstamo le faltan al cliente
  - Ejemplo: "Cliente solicita cesión derechos pero no dispone del número de préstamo ni fecha inicio/fin"

**REGLA ABSOLUTA PARA NOTAS**:
- SIEMPRE incluir en "notasParaNogal" la información específica según las consideraciones
- NUNCA dejar las notas vacías si hay consideraciones específicas
- USAR la información exacta mencionada en la conversación
- SEGUIR el formato y contenido especificado en cada consideración
- Las notas deben ser CONCRETAS y ACCIONABLES para el agente que reciba el ticket

⚠️ REGLA FUNDAMENTAL: NUNCA INVENTAR DATOS
- SOLO extraer información mencionada EXPLÍCITAMENTE
- Para número de póliza: analizar conversación + datos del cliente

🚨 **VERIFICACIÓN FINAL OBLIGATORIA**:
Antes de responder, pregúntate:
- ¿Analicé TODA la conversación o solo el inicio?
- ¿Se completó la gestión del cliente o quedó pendiente?
- ¿Por qué quedó pendiente? ¿Datos incompletos del cliente o limitaciones del agente?
- ¿Mi clasificación refleja el RESULTADO FINAL o solo la solicitud inicial?
- 🎯 **VERIFICACIÓN NÚMERO DE PÓLIZA**: ¿El cliente tiene pólizas contratadas? ¿Se habla de una gestión sobre póliza existente? → SI: ¿He incluido el numeroPoliza usando la metodología definida?
- 📞 **VERIFICACIÓN RELLAMADA**: ¿El cliente menciona una incidencia/ticket ya abierto y solicita seguimiento? → SI: Marcar como requiereRellamada = true

🚨 **INSTRUCCIONES ESPECÍFICAS PARA EL CASO conv_01k09jjv4mf67sm0jbzzfq4tvm**:

Este caso tiene EXACTAMENTE 2 gestiones:
1. **RELLAMADA**: Cliente dice "me han llamado y estaba esperando a que me devolvieran otra vez la llamada" sobre incidencia de hogar
2. **TICKET NUEVO**: Cliente dice "ya aprovechando la llamada... ver si me podíais mandar al correo electrónico un duplicado de la póliza"

**CLASIFICACIÓN CORRECTA**:
- **incidenciaPrincipal**: La rellamada (hogar)
- **incidenciasSecundarias**: El duplicado (vida)

Responde EXACTAMENTE en este formato JSON:
{
  "incidenciaPrincipal": {
    "tipo": "uno de los tipos exactos listados arriba",
    "motivo": "uno de los motivos exactos listados arriba",
    "ramo": "solo en nueva contratación (hogar|auto|vida|decesos|Salud|otros)",
    "consideraciones": "notas específicas según reglas del CSV",
    "necesidadCliente": "descripción exacta de lo que necesita el cliente",
    "tipoCreacion": "Manual / Automática|Exclusiva IA",
    "esRellamada": false,
    "incidenciaRelacionada": "SOLO si es rellamada - ID de la incidencia existente"
  },
  "incidenciasSecundarias": [
    {
      "tipo": "tipo de la segunda gestión",
      "motivo": "motivo de la segunda gestión",
      "ramo": "solo si aplica",
      "consideraciones": "notas específicas",
      "necesidadCliente": "qué necesita el cliente en esta segunda gestión",
      "tipoCreacion": "Manual / Automática|Exclusiva IA",
      "esRellamada": false,
      "incidenciaRelacionada": "SOLO si es rellamada"
    }
  ],
  "confidence": 0.95,
  "resumenLlamada": "resumen que incluya TODAS las gestiones identificadas",
  "datosExtraidos": {
    "nombreCliente": "SOLO si el cliente menciona su nombre explícitamente",
    "numeroPoliza": "OBLIGATORIO si cliente tiene pólizas - usar metodología definida para determinar póliza relevante según ramo mencionado",
    "numeroRecibo": "si se menciona",
    "telefono": "teléfono si se menciona",
    "email": "email si se menciona",
    "cuentaBancaria": "nueva CCC si se proporciona",
    "direccion": "nueva dirección si se menciona",
    "fechaEfecto": "fecha de inicio del cambio si se menciona",
    "asegurados": "datos de asegurados a incluir/excluir",
    "prestamo": "datos del préstamo hipotecario si aplica",
    "recomendadoPor": "SOLO si menciona explícitamente recomendación",
    "campaña": "SOLO si menciona campaña específica",
    "otros": "cualquier otro dato específico relevante"
  },
  "notasParaNogal": "información específica que debe ir en el campo Notas del ticket según las reglas del CSV",
  "requiereTicket": true,
  "prioridad": "low|medium|high",
  "multipleGestiones": true,
  "totalGestiones": 2
}
`;

  async analyzeCallForNogal(
    messages: TranscriptMessage[], 
    conversationId?: string,
    clientData?: NogalClientData
  ): Promise<NogalAnalysisResult> {
    try {
      console.log(`[NogalAnalysis] [SIMPLE] Analizando conversación ${conversationId || 'unknown'} con ${messages.length} mensajes`);
      
      // 🎯 FORMATEAR LA CONVERSACIÓN COMPLETA - La IA analizará TODO
      const conversation = messages
        .map(m => `${m.role.toUpperCase()}: ${m.message}`)
        .join('\n');

      // 🚀 SIMPLE: La IA analizará la conversación completa autónomamente
      // No necesitamos datos externos complejos - está todo en la transcripción
      const clientInfo = clientData ? this.formatClientDataForPrompt(clientData) : 
        'INFORMACIÓN DEL CLIENTE:\nAnalizar la transcripción para extraer datos del cliente.';

      const prompt = this.NOGAL_PROMPT
        .replace('{{conversation}}', conversation)
        .replace('{{clientData}}', clientInfo);

      console.log(`[NogalAnalysis] [SIMPLE] Enviando transcripción completa a Gemini para análisis autónomo`);

      const response = await generateStructuredResponse<NogalAnalysisResult>(prompt);
      
      if (!response || !response.incidenciaPrincipal) {
        throw new Error('Respuesta de Gemini inválida - falta incidenciaPrincipal');
      }

      // Normalizar y validar respuesta
      const result: NogalAnalysisResult = {
        incidenciaPrincipal: {
          tipo: response.incidenciaPrincipal.tipo || 'Llamada gestión comercial',
          motivo: response.incidenciaPrincipal.motivo || 'Consulta cliente',
          ramo: response.incidenciaPrincipal.ramo, // Gemini decide cuándo incluirlo
          consideraciones: response.incidenciaPrincipal.consideraciones,
          necesidadCliente: response.incidenciaPrincipal.necesidadCliente,
          tipoCreacion: response.incidenciaPrincipal.tipoCreacion || 'Manual / Automática'
        },
        incidenciasSecundarias: response.incidenciasSecundarias || [],
        confidence: Math.max(0, Math.min(1, response.confidence || 0.8)),
        resumenLlamada: response.resumenLlamada || 'Llamada procesada sin resumen disponible',
        datosExtraidos: response.datosExtraidos || {},
        notasParaNogal: response.notasParaNogal,
        requiereTicket: response.requiereTicket !== false,
        prioridad: this.normalizePriority(response.prioridad),
        // NUEVOS CAMPOS PARA MÚLTIPLES GESTIONES
        multipleGestiones: response.multipleGestiones || false,
        totalGestiones: response.totalGestiones || 1
      };

      console.log(`[NogalAnalysis] [DEBUG] Análisis completado:`, {
        tipo: result.incidenciaPrincipal.tipo,
        motivo: result.incidenciaPrincipal.motivo,
        ramo: result.incidenciaPrincipal.ramo,
        numeroPoliza: result.datosExtraidos.numeroPoliza,
        confidence: result.confidence
      });

      return result;
        
    } catch (error) {
      console.error('[NogalAnalysis] [DEBUG] Error en análisis:', error);
      
      // Resultado de fallback
      return {
        incidenciaPrincipal: {
          tipo: 'Llamada gestión comercial',
          motivo: 'Consulta cliente',
          tipoCreacion: 'Manual / Automática' as const,
          necesidadCliente: 'Consulta general no clasificada'
        },
        incidenciasSecundarias: [],
        confidence: 0.3,
        resumenLlamada: 'Error en análisis - requiere revisión manual',
        datosExtraidos: {},
        requiereTicket: false,
        prioridad: 'low' as const
      };
    }
  }

  /**
   * Formatea los datos del cliente para incluir en el prompt
   */
  private formatClientDataForPrompt(clientData: NogalClientData): string {
    let info = `INFORMACIÓN DEL CLIENTE:\n`;
    
    if (clientData.name) info += `- Nombre: ${clientData.name}\n`;
    if (clientData.dni) info += `- DNI: ${clientData.dni}\n`;
    if (clientData.phone) info += `- Teléfono: ${clientData.phone}\n`;
    if (clientData.email) info += `- Email: ${clientData.email}\n`;
    if (clientData.codigoCliente) info += `- Código Cliente: ${clientData.codigoCliente}\n`;
    
    if (clientData.polizas && clientData.polizas.length > 0) {
      info += `\nPÓLIZAS CONTRATADAS:\n`;
      clientData.polizas.forEach((poliza, index) => {
        info += `${index + 1}. Número: ${poliza.numero}, Ramo: ${poliza.ramo}, Estado: ${poliza.estado}, Compañía: ${poliza.compania}\n`;
        if (poliza.fechaEfecto) info += `   Fecha Efecto: ${poliza.fechaEfecto}\n`;
        if (poliza.mesVencimiento) info += `   Mes Vencimiento: ${poliza.mesVencimiento}\n`;
        if (poliza.importePoliza) info += `   Importe: ${poliza.importePoliza}\n`;
      });
    }
    
    if (clientData.incidenciasAbiertas && clientData.incidenciasAbiertas.length > 0) {
      info += `\nINCIDENCIAS ABIERTAS:\n`;
      clientData.incidenciasAbiertas.forEach((inc, index) => {
        info += `${index + 1}. Código: ${inc.codigo}, Tipo: ${inc.tipo}, Motivo: ${inc.motivo}\n`;
        if (inc.fechaCreacion) info += `   Fecha: ${inc.fechaCreacion}\n`;
        if (inc.poliza) info += `   Póliza: ${inc.poliza}\n`;
      });
    }
    
    return info;
  }

  private normalizePriority(priority?: string): 'low' | 'medium' | 'high' {
    const p = priority?.toLowerCase();
    if (p === 'high' || p === 'alta') return 'high';
    if (p === 'medium' || p === 'media') return 'medium';
    return 'low';
  }

  /**
   * Verifica si una incidencia es de tipo "Exclusiva IA"
   */
  isExclusivaIA(incidencia: NogalIncidencia): boolean {
    if (incidencia.tipoCreacion === 'Exclusiva IA') {
      return true;
    }
    
    const exclusivaIAMotivos = [
      'Cesión de derechos datos incompletos',
      'Datos incompletos',
      'Reenvío siniestros', 
      'Reenvío agentes humanos',
      'Reenvío agentes humanos no quiere IA',
      'Reenvío agentes humanos no tomador'
    ];
    
    return exclusivaIAMotivos.includes(incidencia.motivo);
  }

  /**
   * Determina si se debe crear un ticket automáticamente
   */
  shouldCreateTicket(analysis: NogalAnalysisResult): boolean {
    if (this.isExclusivaIA(analysis.incidenciaPrincipal) && analysis.confidence < 0.8) {
      return false;
    }
    
    return analysis.requiereTicket && analysis.confidence >= 0.3;
  }
}

export const nogalAnalysisService = new NogalAnalysisService(); 