import { createClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const env = (import.meta as any).env;

const supabaseUrl: string = env.VITE_SUPABASE_URL;
const supabaseAnonKey: string = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL atau Anon Key tidak ditemukan di .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);