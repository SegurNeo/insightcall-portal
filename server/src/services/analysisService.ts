import { v4 as uuidv4 } from 'uuid';
import { model } from '../lib/gemini';
import { TranscriptMessage } from '../types/transcript.types';
import { CallAnalysis } from '../types/analysis.types';
import ANALYSIS_PROMPT, { getPromptTemplate } from '../config/prompts';

interface AnalysisResult {
  status: 'success' | 'error';
  action_id?: string;
  details?: string;
  metadata?: {
    context?: string;
    priority?: 'low' | 'medium' | 'high';
    [key: string]: any;
  };
  error?: string;
}

class AnalysisService {
  private formatConversationForPrompt(messages: TranscriptMessage[]): string {
    return messages.map(m => `${m.role.toUpperCase()}: ${m.message}`).join('\n');
  }

  private validateAnalysisResponse(response: any): AnalysisResult {
    // Helper para obtener la clave sin importar el formato
    const findProp = (obj: any, variants: string[]): any => {
      for (const key of variants) {
        if (key in obj) return obj[key];
      }
      return undefined;
    };

    const actionId = findProp(response, ['ActionID', 'action_id', 'actionId']);
    const details = findProp(response, ['Details', 'details']);
    const context = findProp(response, ['Context', 'context']);
    const priorityRaw = findProp(response, ['Priority', 'priority']);

    if (!actionId || !details || !context || !priorityRaw) {
      console.error('validateAnalysisResponse: formato inválido o claves faltantes', {
        expected: ['ActionID/action_id/actionId', 'Details/details', 'Context/context', 'Priority/priority'],
        receivedKeys: Object.keys(response)
      });
      throw new Error('Invalid analysis response format – missing required fields');
    }

    const priority = ((): 'low' | 'medium' | 'high' => {
      const val = String(priorityRaw).toLowerCase();
      if (val === 'low' || val === 'medium' || val === 'high') return val;
      return 'medium';
    })();

    return {
      status: 'success',
      action_id: actionId,
      details: details,
      metadata: {
        context: context,
        priority,
        customerSentiment: findProp(response, ['CustomerSentiment', 'customer_sentiment', 'customerSentiment']),
        keyTopics: findProp(response, ['KeyTopics', 'key_topics', 'keyTopics']),
        requiredActions: findProp(response, ['RequiredActions', 'required_actions', 'requiredActions']),
      }
    };
  }

  async analyzeTranscript(messages: TranscriptMessage[], conversationId: string): Promise<AnalysisResult> {
    try {
      const conversationText = this.formatConversationForPrompt(messages);
      const prompt = getPromptTemplate('callAnalysis').replace('{{conversation}}', conversationText);

      const analysisResponse = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1000,
        },
      });

      const response = await analysisResponse.response;
      const text = response.text();
      const parsedResponse = JSON.parse(text);
      
      return this.validateAnalysisResponse(parsedResponse);
    } catch (error: any) {
      console.error('Error analyzing transcript:', error);
      return {
        status: 'error',
        error: error.message,
        details: 'Failed to analyze conversation transcript'
      };
    }
  }
}

export const analysisService = new AnalysisService(); 