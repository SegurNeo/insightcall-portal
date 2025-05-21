import { createClient } from '@supabase/supabase-js';
import config from '../config';

if (!config.nogalSupabaseUrl || !config.nogalSupabaseServiceKey) {
  throw new Error('Missing Supabase configuration');
}

console.log('Inicializando cliente de Supabase con URL:', config.nogalSupabaseUrl);

export const supabase = createClient(
  config.nogalSupabaseUrl,
  config.nogalSupabaseServiceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Verificar la conexión
Promise.resolve(
  supabase.from('processed_calls').select('count', { count: 'exact', head: true })
)
  .then(({ count, error }: { count: number | null; error: any }) => {
    if (error) {
      console.error('Error al verificar conexión con Supabase:', error);
    } else {
      console.log('Conexión con Supabase establecida. Total de llamadas:', count);
    }
  })
  .catch((err: Error) => {
    console.error('Error crítico al conectar con Supabase:', err);
  }); 