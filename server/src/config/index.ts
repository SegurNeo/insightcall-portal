import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  nogalSupabaseUrl: string;
  nogalSupabaseServiceKey: string;
  segurneoVoiceApiKey: string;
  segurneoVoiceBaseUrl: string;
  geminiApiKey: string;
  nogalApiBaseUrl: string;
  nogalApiTimeout: number;
  nogalApiKey?: string;
}

// Helper function to get required environment variables
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

// Helper function to get optional environment variables
function getOptionalEnvVar(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}

const config: Config = {
  // Server Configuration
  port: parseInt(getOptionalEnvVar('PORT', '3000')),
  nodeEnv: getOptionalEnvVar('NODE_ENV', 'development'),

  // Nogal Supabase Configuration
  nogalSupabaseUrl: getRequiredEnvVar('NOGAL_SUPABASE_URL'),
  nogalSupabaseServiceKey: getRequiredEnvVar('NOGAL_SUPABASE_SERVICE_KEY'),

  // Segurneo Voice Configuration
  segurneoVoiceApiKey: getRequiredEnvVar('SEGURNEO_VOICE_API_KEY'),
  segurneoVoiceBaseUrl: getOptionalEnvVar('SEGURNEO_VOICE_API_BASE_URL', 'https://segurneo-voice.onrender.com/api/v1'),

  // Gemini Configuration
  geminiApiKey: getRequiredEnvVar('GEMINI_API_KEY'),

  // Nogal API Configuration
  nogalApiBaseUrl: getOptionalEnvVar('NOGAL_API_BASE_URL', 'https://api.nogal.app/v1'),
  nogalApiTimeout: parseInt(getOptionalEnvVar('NOGAL_API_TIMEOUT', '30000')),
  nogalApiKey: getOptionalEnvVar('NOGAL_API_KEY'),
};

export default config; 