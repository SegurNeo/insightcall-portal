import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  nogalSupabaseUrl: string;
  nogalSupabaseServiceKey: string;
  segurneoVoiceApiKey: string;
  segurneoVoiceBaseUrl: string;
  geminiApiKey: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  nogalSupabaseUrl: process.env.NOGAL_SUPABASE_URL || '',
  nogalSupabaseServiceKey: process.env.NOGAL_SUPABASE_SERVICE_KEY || '',
  segurneoVoiceApiKey: process.env.SEGURNEO_VOICE_API_KEY || '',
  segurneoVoiceBaseUrl: process.env.SEGURNEO_VOICE_BASE_URL || 'https://segurneo-voice.onrender.com/api/v1',
  geminiApiKey: process.env.GEMINI_API_KEY || ''
};

export default config; 