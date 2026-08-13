import { createClient } from '@supabase/supabase-js';

// Safe fallbacks to prevent runtime crashes when .env is not yet configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase configuration missing in .env file. Admin authentication calls will fail. Public portfolio remains functional.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
