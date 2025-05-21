const ANALYSIS_PROMPT = `Analiza la siguiente transcripción de una llamada de atención al cliente y determina la acción más apropiada a realizar.

CONTEXTO:
- Eres un analista experto en seguros
- Debes clasificar la conversación en una de estas acciones:
  1. Devolución de recibos (DEVOLUCION_RECIBOS)
  2. Anulación de pólizas (ANULACION_POLIZA)
  3. Regularizaciones de pólizas (REGULARIZACION_POLIZA)
  4. Cambios de mediador (CAMBIO_MEDIADOR)
  5. Contraseñas (CONTRASEÑAS)

TRANSCRIPCIÓN:
{transcription}

INSTRUCCIONES:
1. Identifica la intención principal del cliente
2. Clasifica la conversación en una de las 5 acciones listadas usando EXACTAMENTE uno de los valores en paréntesis
3. Proporciona un nivel de confianza en tu clasificación (0-1)
4. Resume brevemente la razón en español
5. Extrae información relevante para el ticket

IMPORTANTE: Debes responder SOLO en formato JSON con esta estructura exacta:
{
  "type": "TIPO_ACCION",
  "confidence": 0.XX,
  "summary": "Breve resumen de la situación",
  "details": {
    "context": "Contexto relevante extraído de la conversación",
    "priority": "low|medium|high",
    "requiredData": ["dato1", "dato2"]
  }
}`;

export default ANALYSIS_PROMPT; 