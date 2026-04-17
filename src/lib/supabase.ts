import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';

// Use SERVICE_ROLE_KEY for server-side access (unrestricted)
// Fallback to ANON_KEY if service role is not available
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    'Warning: Supabase credentials not found. ' +
    'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
}

console.log(`✓ Supabase initialized with URL: ${supabaseUrl}`);
console.log(`✓ Using key type: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE (full access)' : 'ANON (RLS enforced)'}`);

/**
 * Supabase client instance
 * Uses SERVICE_ROLE_KEY for full database access (no RLS restrictions)
 * Used for server-side database operations, authentication, and audit logging
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
