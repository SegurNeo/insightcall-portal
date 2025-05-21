const prompts = {
  callAnalysis: `
You are an AI assistant specialized in analyzing customer service call transcripts.
Please analyze the following conversation and provide a structured assessment.

CONVERSATION:
{{conversation}}

Please provide your analysis in the following format:
ActionID: [type of action needed - e.g., support_ticket, sales_followup, complaint_resolution]
Details: [brief summary of the key points and required actions]
Context: [business context - e.g., technical_support, billing, sales]
Priority: [low, medium, or high based on urgency and impact]
CustomerSentiment: [positive, neutral, or negative]
KeyTopics: [comma-separated list of main topics discussed]
RequiredActions: [comma-separated list of recommended next steps]
`
} as const;

export function getPromptTemplate(templateName: keyof typeof prompts): string {
  return prompts[templateName];
} 

const ANALYSIS_PROMPT = `Analiza la siguiente transcripción de una llamada y proporciona un análisis estructurado en formato JSON. La transcripción es:

{transcription}

Proporciona un análisis que incluya:
- type: El tipo principal de la llamada (ej: "SOPORTE_TECNICO", "CONSULTA_PRODUCTO", "QUEJA")
- confidence: Nivel de confianza en el análisis (0.0 a 1.0)
- summary: Resumen conciso de la llamada
- details:
  - priority: Prioridad de la llamada ("low", "medium", "high")
  - context: Contexto relevante adicional
  - requiredData: Array de datos necesarios para resolver la situación

Responde SOLO en formato JSON válido.`;

export default ANALYSIS_PROMPT; 