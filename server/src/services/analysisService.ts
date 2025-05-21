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
    // Basic validation of required fields
    if (!response.ActionID || !response.Details || !response.Context || !response.Priority) {
      throw new Error('Invalid analysis response format');
    }

    return {
      status: 'success',
      action_id: response.ActionID,
      details: response.Details,
      metadata: {
        context: response.Context,
        priority: response.Priority.toLowerCase(),
        customerSentiment: response.CustomerSentiment,
        keyTopics: response.KeyTopics,
        requiredActions: response.RequiredActions,
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