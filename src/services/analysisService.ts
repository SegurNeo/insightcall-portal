import { GoogleGenerativeAI } from '@google/generative-ai';
import { model } from '@/lib/gemini';
import { TranscriptMessage } from '@/types';
import { CallAnalysis } from '@/types/analysis';
import ANALYSIS_PROMPT from '@/config/prompts';

// Función auxiliar para generar UUIDs
const generateUUID = () => {
  // Implementación fallback de UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export class AnalysisService {
  private formatTranscript(messages: TranscriptMessage[]): string {
    return messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.message}`)
      .join('\n');
  }

  private isValidResponse(response: any): boolean {
    return (
      response &&
      typeof response.type === 'string' &&
      typeof response.confidence === 'number' &&
      typeof response.summary === 'string' &&
      response.details &&
      typeof response.details.priority === 'string' &&
      typeof response.details.context === 'string' &&
      Array.isArray(response.details.requiredData)
    );
  }

  private cleanJsonResponse(text: string): string {
    // Eliminar marcadores de código markdown si existen
    return text.replace(/```json\n?|\n?```/g, '').trim();
  }

  async analyzeTranscript(transcript: TranscriptMessage[], conversationId: string): Promise<CallAnalysis> {
    try {
      const formattedTranscript = this.formatTranscript(transcript);
      const prompt = ANALYSIS_PROMPT.replace('{transcription}', formattedTranscript);

      console.log('Sending prompt to Gemini:', prompt);

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1000,
        },
      });

      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini response:', text);

      try {
        const cleanedText = this.cleanJsonResponse(text);
        const parsedResponse = JSON.parse(cleanedText);
        
        if (!this.isValidResponse(parsedResponse)) {
          console.error('Invalid response structure:', parsedResponse);
          throw new Error('La respuesta del modelo no tiene el formato esperado');
        }
        
        return {
          analysis_id: generateUUID(),
          conversation_id: conversationId,
          action_id: parsedResponse.type.toLowerCase().replace('_', '-'),
          status: 'success',
          details: parsedResponse.summary,
          metadata: {
            confidence: parsedResponse.confidence,
            priority: parsedResponse.details.priority,
            context: parsedResponse.details.context,
            requiredData: parsedResponse.details.requiredData
          }
        };
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        throw new Error('No se pudo procesar la respuesta del modelo');
      }
    } catch (error) {
      console.error('Error analyzing transcription:', error);
      return {
        analysis_id: generateUUID(),
        conversation_id: conversationId,
        action_id: '',
        status: 'error',
        details: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}

export const analysisService = new AnalysisService(); 