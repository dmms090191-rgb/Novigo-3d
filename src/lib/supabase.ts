import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'cache-control': 'no-cache',
          'pragma': 'no-cache',
        },
      },
    })
  : null;

export const isSupabaseConfigured = () => !!supabase;
