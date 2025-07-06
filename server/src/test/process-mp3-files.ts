import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Cargar variables de entorno
config();

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

class MP3TestProcessor {
  private readonly openaiApiKey: string;
  private readonly backendUrl: string;
  private readonly segurneoApiKey: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    this.segurneoApiKey = process.env.SEGURNEO_VOICE_API_KEY || 'segurneo';

    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }
  }

  /**
   * Transcribe un archivo MP3 usando Whisper de OpenAI
   */
  async transcribeAudio(mp3Path: string): Promise<ProcessedTranscription> {
    console.log(`📝 Transcribiendo: ${path.basename(mp3Path)}`);

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(mp3Path));
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('language', 'es'); // Español

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
      
      // Convertir segmentos de Whisper a nuestro formato
      const segments: TranscriptionSegment[] = data.segments.map((seg: any, index: number) => ({
        text: seg.text.trim(),
        start: seg.start,
        end: seg.end,
        // Alternar speakers (esto es una aproximación, en producción el Gateway lo hace mejor)
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

  /**
   * Simula el formato de datos que envía el Gateway de Segurneo Voice
   */
  formatAsGatewayPayload(transcription: ProcessedTranscription, fileName: string) {
    const externalCallId = uuidv4().replace(/-/g, '').substring(0, 20); // ID similar al del Gateway
    const conversationId = `conv_${uuidv4()}`;
    const now = new Date();

    // Formato del webhook del Gateway
    return {
      event_type: 'call.completed',
      call_data: {
        externalCallId,
        conversationId,
        status: 'completed',
        startTime: Math.floor(now.getTime() / 1000) - Math.floor(transcription.duration),
        duration: Math.floor(transcription.duration),
        
        // Datos del cliente (simulados para pruebas)
        clientData: {
          phone: '+34600123456',
          name: 'Cliente de Prueba',
          dni: '12345678A',
          // Estos datos normalmente vendrían de buscar-cliente
          polizas: [
            {
              numero: '123456789',
              compania: 'REALE',
              estado: 'Contratada',
              ramo: 'auto'
            }
          ]
        },

        // Transcripciones en formato del Gateway
        transcripts: transcription.segments.map(seg => ({
          speaker: seg.speaker,
          text: seg.text,
          segment_start_time: seg.start,
          segment_end_time: seg.end,
          confidence: 0.95 // Simulado
        })),

        // Metadatos
        metadata: {
          source: 'mp3-test',
          originalFile: fileName,
          testRun: true,
          processedAt: now.toISOString()
        }
      }
    };
  }

  /**
   * Envía el webhook simulado al backend
   */
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

  /**
   * Procesa un archivo MP3 completo
   */
  async processMP3File(mp3Path: string): Promise<void> {
    console.log(`\n🎵 Procesando archivo: ${mp3Path}`);
    
    try {
      // 1. Transcribir
      const transcription = await this.transcribeAudio(mp3Path);
      console.log(`   ✅ Transcripción completada: ${transcription.segments.length} segmentos`);
      
      // 2. Formatear como webhook del Gateway
      const payload = this.formatAsGatewayPayload(transcription, path.basename(mp3Path));
      console.log(`   ✅ Payload formateado para llamada: ${payload.call_data.externalCallId}`);
      
      // 3. Enviar al backend
      await this.sendToBackend(payload);
      console.log(`   ✅ Procesamiento completado`);

      // 4. Guardar transcripción para revisión
      const outputPath = mp3Path.replace('.mp3', '_transcription.json');
      fs.writeFileSync(outputPath, JSON.stringify({
        payload,
        transcription
      }, null, 2));
      console.log(`   📄 Transcripción guardada en: ${outputPath}`);

    } catch (error) {
      console.error(`   ❌ Error procesando ${mp3Path}:`, error);
    }
  }

  /**
   * Procesa todos los MP3 en una carpeta
   */
  async processFolder(folderPath: string): Promise<void> {
    console.log(`📁 Procesando carpeta: ${folderPath}\n`);

    const files = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.mp3'))
      .map(file => path.join(folderPath, file));

    console.log(`Encontrados ${files.length} archivos MP3\n`);

    for (const file of files) {
      await this.processMP3File(file);
      // Pequeña pausa entre archivos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`\n✅ Procesamiento completado`);
  }
}

// Script de ejecución
async function main() {
  const processor = new MP3TestProcessor();
  
  // Obtener carpeta de los argumentos o usar default
  const folderPath = process.argv[2] || './test-mp3-files';
  
  if (!fs.existsSync(folderPath)) {
    console.error(`❌ La carpeta ${folderPath} no existe`);
    process.exit(1);
  }

  await processor.processFolder(folderPath);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { MP3TestProcessor }; 