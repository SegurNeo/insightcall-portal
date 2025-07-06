import { HttpClient, HttpClientConfig } from './http-client';
import { StoredCall, StoredTranscript } from '@/types/segurneo_voice.types';

export class SegurneoVoiceClient extends HttpClient {
  constructor(config: Omit<HttpClientConfig, 'baseURL'>) {
    super({
      ...config,
      baseURL: process.env.SEGURNEO_VOICE_API_URL || 'https://api.segurneovoice.com',
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${process.env.SEGURNEO_VOICE_API_KEY}`,
      }
    });
  }

  async syncElevenLabsConversation(externalCallId: string): Promise<void> {
    await this.post(`/api/v1/calls/${externalCallId}/sync/elevenlabs`);
  }

  async getCallDetails(externalCallId: string): Promise<StoredCall> {
    const response = await this.get<StoredCall>(`/api/v1/calls/${externalCallId}`);
    return response.data;
  }

  async getCallTranscripts(externalCallId: string): Promise<StoredTranscript[]> {
    const response = await this.get<StoredTranscript[]>(`/api/v1/calls/${externalCallId}/transcripts`);
    return response.data;
  }
}

// Crear una instancia por defecto
export const segurneoVoiceClient = new SegurneoVoiceClient({
  timeout: 60000, // 60 segundos para operaciones que pueden ser más lentas
  headers: {
    'Accept': 'application/json',
  }
}); 