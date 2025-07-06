import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { config } from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Cargar variables de entorno
config();

interface ManualTranscription {
  fileName: string;
  duration: number; // segundos
  messages: Array<{
    speaker: 'agent' | 'user';
    text: string;
    timestamp?: number; // segundos desde el inicio
  }>;
  clientData?: {
    phone?: string;
    name?: string;
    dni?: string;
    polizas?: Array<{
      numero: string;
      compania: string;
      estado: string;
      ramo: string;
    }>;
  };
}

class ManualTranscriptionProcessor {
  private readonly backendUrl: string;
  private readonly segurneoApiKey: string;

  constructor() {
    this.backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    this.segurneoApiKey = process.env.SEGURNEO_API_KEY || 'test-api-key';
  }

  /**
   * Procesa una transcripción manual
   */
  async processTranscription(transcription: ManualTranscription): Promise<void> {
    const externalCallId = uuidv4().replace(/-/g, '').substring(0, 20);
    const now = new Date();

    // Calcular timestamps si no están presentes
    let currentTime = 0;
    const segments = transcription.messages.map((msg, index) => {
      const segmentDuration = transcription.duration / transcription.messages.length;
      const timestamp = msg.timestamp ?? currentTime;
      currentTime += segmentDuration;

      return {
        speaker: msg.speaker,
        text: msg.text,
        segment_start_time: timestamp,
        segment_end_time: timestamp + segmentDuration,
        confidence: 0.95
      };
    });

    const payload = {
      event_type: 'call.completed',
      call_data: {
        externalCallId,
        conversationId: `conv_${uuidv4()}`,
        status: 'completed',
        startTime: Math.floor(now.getTime() / 1000) - transcription.duration,
        duration: transcription.duration,
        clientData: transcription.clientData || {
          phone: '+34600123456',
          name: 'Cliente Manual',
          dni: '12345678A',
          polizas: []
        },
        transcripts: segments,
        metadata: {
          source: 'mp3-test',
          originalFile: transcription.fileName,
          testRun: true,
          processedAt: now.toISOString(),
          transcriptionMethod: 'manual'
        }
      }
    };

    console.log(`📤 Enviando transcripción de ${transcription.fileName} al backend...`);

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

      console.log(`✅ Procesado exitosamente:`, response.data);
    } catch (error: any) {
      console.error('❌ Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Procesa todas las transcripciones de una carpeta
   */
  async processFolder(folderPath: string): Promise<void> {
    const files = fs.readdirSync(folderPath)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(folderPath, file));

    console.log(`📁 Encontrados ${files.length} archivos JSON\n`);

    for (const file of files) {
      try {
        console.log(`\n📄 Procesando: ${path.basename(file)}`);
        const content = fs.readFileSync(file, 'utf-8');
        const transcription: ManualTranscription = JSON.parse(content);
        
        await this.processTranscription(transcription);
        
        // Pequeña pausa entre archivos
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error procesando ${file}:`, error);
      }
    }
  }
}

// Ejemplo de formato de transcripción manual
const exampleTranscription: ManualTranscription = {
  fileName: "ejemplo_llamada.mp3",
  duration: 180, // 3 minutos
  messages: [
    {
      speaker: "agent",
      text: "Buenos días, gracias por llamar a Seguros Nogal. ¿En qué puedo ayudarle?"
    },
    {
      speaker: "user",
      text: "Hola, quiero cancelar mi póliza de auto porque he vendido el coche."
    },
    {
      speaker: "agent",
      text: "Entiendo. Para proceder con la cancelación, necesito algunos datos. ¿Me puede decir su número de póliza?"
    },
    {
      speaker: "user",
      text: "Sí, es la 135869899"
    },
    {
      speaker: "agent",
      text: "Perfecto. Voy a gestionar la cancelación de su póliza. ¿Desde qué fecha desea que sea efectiva?"
    },
    {
      speaker: "user",
      text: "Desde hoy mismo si es posible."
    },
    {
      speaker: "agent",
      text: "De acuerdo. He creado la solicitud de cancelación. Recibirá un email de confirmación."
    }
  ],
  clientData: {
    phone: "+34 600 123 456",
    name: "Juan Pérez",
    dni: "12345678A",
    polizas: [
      {
        numero: "135869899",
        compania: "ZURICH",
        estado: "Contratada",
        ramo: "auto"
      }
    ]
  }
};

// Script de ejecución
async function main() {
  const processor = new ManualTranscriptionProcessor();
  
  const command = process.argv[2];
  
  if (command === 'example') {
    // Guardar ejemplo
    fs.writeFileSync(
      'ejemplo_transcripcion.json',
      JSON.stringify(exampleTranscription, null, 2)
    );
    console.log('✅ Archivo de ejemplo creado: ejemplo_transcripcion.json');
    console.log('   Edítalo y luego ejecuta: npm run process-manual ejemplo_transcripcion.json');
    return;
  }
  
  const input = process.argv[2];
  
  if (!input) {
    console.log('Uso:');
    console.log('  npm run process-manual example     # Crear archivo de ejemplo');
    console.log('  npm run process-manual archivo.json # Procesar un archivo');
    console.log('  npm run process-manual /carpeta     # Procesar carpeta con JSONs');
    process.exit(1);
  }
  
  const stats = fs.statSync(input);
  
  if (stats.isDirectory()) {
    await processor.processFolder(input);
  } else {
    const content = fs.readFileSync(input, 'utf-8');
    const transcription: ManualTranscription = JSON.parse(content);
    await processor.processTranscription(transcription);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { ManualTranscriptionProcessor, ManualTranscription }; 