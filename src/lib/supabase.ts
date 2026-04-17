import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Warning: Supabase credentials not found. ' +
    'Set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_* variants) environment variables.'
  );
}

/**
 * Supabase client instance
 * Used for database operations, authentication, and real-time subscriptions
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
