import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  SegurneoHealthResponse,
  SegurneoSyncResponse,
  SegurneoListCallsResponse,
  SegurneoGetCallResponse,
  SegurneoGetTranscriptsResponse,
  StoredCall
} from '../types/segurneo_voice.types'; // Using path alias
import config from '../config'; // Import config

const SEGURNEO_API_BASE_URL = config.segurneoVoiceBaseUrl;
const SEGURNEO_API_KEY = config.segurneoVoiceApiKey;

class SegurneoGatewayClient {
  private client: AxiosInstance;

  constructor() {
    if (!SEGURNEO_API_KEY) {
      console.warn('SEGURNEO_VOICE_API_KEY is not set (via config). Client will not be authenticated.');
    }
    if (SEGURNEO_API_BASE_URL === 'https://segurneo-voice.onrender.com/api/v1' && !process.env.SEGURNEO_VOICE_API_BASE_URL) {
        console.info('Using default SEGURNEO_VOICE_API_BASE_URL (via config). Ensure this is correct for your environment.')
    }

    this.client = axios.create({
      baseURL: SEGURNEO_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(SEGURNEO_API_KEY ? { 'X-API-Key': SEGURNEO_API_KEY } : {}),
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          console.error(
            `Error from Segurneo Voice API: ${error.response.status} - ${error.config?.url}`,
            error.response.data
          );
        } else if (error.request) {
          console.error('No response received from Segurneo Voice API:', error.request);
        } else {
          console.error('Error setting up request to Segurneo Voice API:', error.message);
        }
        // Re-throw a more generic error or a custom error type
        throw new Error(`Failed to call Segurneo Voice API: ${error.message}`);
      }
    );
  }

  async getHealth(): Promise<SegurneoHealthResponse> {
    const response = await this.client.get<SegurneoHealthResponse>('/health');
    return response.data;
  }

  async syncElevenLabsConversation(conversationId: string): Promise<SegurneoSyncResponse> {
    const response = await this.client.post<SegurneoSyncResponse>(
      '/tasks/elevenlabs/conversations/sync',
      { conversation_id: conversationId }
    );
    return response.data;
  }

  async listCalls(params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    startDate?: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    agentId?: string;
  }): Promise<SegurneoListCallsResponse> {
    const response = await this.client.get<SegurneoListCallsResponse>('/calls', { params });
    return response.data;
  }

  async getCallDetails(externalCallId: string): Promise<SegurneoGetCallResponse> {
    const response = await this.client.get<SegurneoGetCallResponse>(`/calls/${externalCallId}`);
    return response.data;
  }

  async getCallTranscripts(externalCallId: string): Promise<SegurneoGetTranscriptsResponse> {
    const response = await this.client.get<SegurneoGetTranscriptsResponse>(
      `/calls/${externalCallId}/transcripts`
    );
    return response.data;
  }
}

export const segurneoGatewayClient = new SegurneoGatewayClient(); 