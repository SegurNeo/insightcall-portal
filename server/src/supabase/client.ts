import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase.types';
import config from '../config/index'; // Import config

// It's crucial to have these in your .env file
const supabaseUrl = config.nogalSupabaseUrl;
const supabaseServiceKey = config.nogalSupabaseServiceKey;

if (!supabaseUrl) {
  // Error is thrown by config.ts if not set, but good to have a check or rely on config's strictness
  throw new Error('NOGAL_SUPABASE_URL is not defined. Check config setup and .env file.');
}
if (!supabaseServiceKey) {
  // For server-side client, service_role key is usually required.
  // If you intend to use anon key, ensure RLS is set up accordingly.
  throw new Error('NOGAL_SUPABASE_SERVICE_KEY is not defined. Check config setup and .env file.');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      persistSession: false, // No necesitamos persistir la sesión en el servidor
      autoRefreshToken: false,
    }
  }
);

// You can add helper functions here if needed, for example, to handle errors
// or to provide more specific data access methods. 