import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index';

interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  speaker?: 'agent' | 'user';
}

interface ProcessedTranscription {
  segments: TranscriptionSegment[];
  fullText: string;
  duration: number;
}

interface ProcessResult {
  success: boolean;
  error?: string;
  externalCallId?: string;
}

class MP3TestProcessor {
  private readonly openaiApiKey: string;
  private readonly backendUrl: string;
  private readonly segurneoApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    this.segurneoApiKey = process.env.SEGURNEO_VOICE_API_KEY || 'test-api-key';

    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
  }

  async transcribeAudio(mp3Path: string): Promise<ProcessedTranscription> {
    console.log(`📝 Transcribiendo: ${path.basename(mp3Path)}`);

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(mp3Path));
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'es');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${this.openaiApiKey}`,
          },
          maxBodyLength: Infinity,
        }
      );

      const data = response.data;
      
      const segments: TranscriptionSegment[] = data.segments.map((seg: any, index: number) => ({
        text: seg.text.trim(),
        start: seg.start,
        end: seg.end,
        speaker: index % 2 === 0 ? 'agent' : 'user'
      }));

      return {
        segments,
        fullText: data.text,
        duration: data.duration || segments[segments.length - 1]?.end || 0
      };
    } catch (error: any) {
      console.error('❌ Error en transcripción:', error.response?.data || error.message);
      throw error;
    }
  }

  formatAsGatewayPayload(transcription: ProcessedTranscription, fileName: string) {
    const externalCallId = uuidv4().replace(/-/g, '').substring(0, 20);
    const now = new Date();

    return {
      event_type: 'call.completed',
      call_data: {
        externalCallId,
        status: 'completed',
        startTime: Math.floor(now.getTime() / 1000) - Math.floor(transcription.duration),
        duration: Math.floor(transcription.duration),
        
        clientData: {
          phone: '+34600123456',
          name: 'Cliente de Prueba',
          dni: '12345678A',
          polizas: [
            {
              numero: '123456789',
              compania: 'REALE',
              estado: 'Contratada',
              ramo: 'auto'
            }
          ]
        },

        transcripts: transcription.segments.map(seg => ({
          speaker: seg.speaker,
          text: seg.text,
          segment_start_time: seg.start,
          segment_end_time: seg.end,
          confidence: 0.95
        })),

        metadata: {
          source: 'mp3-test',
          originalFile: fileName,
          testRun: true,
          processedAt: now.toISOString()
        }
      }
    };
  }

  async sendToBackend(payload: any): Promise<void> {
    console.log(`📤 Enviando al backend...`);
    
    try {
      const response = await axios.post(
        `${this.backendUrl}/api/v1/calls/webhook`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.segurneoApiKey
          }
        }
      );

      console.log(`✅ Respuesta del backend:`, response.data);
    } catch (error: any) {
      console.error('❌ Error enviando al backend:', error.response?.data || error.message);
      throw error;
    }
  }

  async processMP3File(mp3Path: string): Promise<ProcessResult> {
    console.log(`🎵 Procesando archivo: ${path.basename(mp3Path)}`);
    
    try {
      const transcription = await this.transcribeAudio(mp3Path);
      console.log(`📝 Transcripción completada: ${transcription.segments.length} segmentos`);

      const payload = this.formatAsGatewayPayload(transcription, path.basename(mp3Path));
      await this.sendToBackend(payload);

      return {
        success: true,
        externalCallId: payload.call_data.externalCallId
      };
    } catch (error: any) {
      console.error('❌ Error procesando MP3:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}