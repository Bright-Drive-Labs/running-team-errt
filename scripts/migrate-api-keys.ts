/**
 * Script to migrate API Keys from plaintext to Vault (encrypted)
 *
 * IMPORTANTE: Ejecutar UNA SOLA VEZ en producción
 *
 * Usage:
 * $ npm run migrate:api-keys
 *
 * Environment variables needed:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local if it exists
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Main migration function
 */
async function migrateApiKeysToVault() {
  console.log('Starting API Key migration to Vault...');
  console.log('This will migrate all plaintext API keys to encrypted storage.\n');

  try {
    // 1. Get all athletes with plaintext API keys
    console.log('Fetching athletes with API keys...');

    const { data: athletes, error: fetchError } = await supabase
      .from('athletes')
      .select('id, tenant_id, intervals_api_key, email, name')
      .not('intervals_api_key', 'is', null)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Failed to fetch athletes:', fetchError);
      process.exit(1);
    }

    if (!athletes || athletes.length === 0) {
      console.log('No athletes with API keys found. Migration complete.');
      process.exit(0);
    }

    console.log(`Found ${athletes.length} athletes with API keys\n`);

    // 2. Stats
    let successCount = 0;
    let failureCount = 0;
    const failures: Array<{ email: string; error: string }> = [];

    // 3. Migrate each athlete
    for (const athlete of athletes) {
      try {
        console.log(`[${successCount + failureCount + 1}/${athletes.length}] Migrating ${athlete.email}...`);

        // Validate API key exists and is non-empty
        if (!athlete.intervals_api_key || athlete.intervals_api_key.trim().length === 0) {
          console.log(`  ⚠️  Skipping: Empty API key`);
          failureCount++;
          failures.push({
            email: athlete.email,
            error: 'Empty API key'
          });
          continue;
        }

        // Call RPC store_intervals_key() (created by AGENTE 1)
        const { data, error: rpcError } = await supabase.rpc('store_intervals_key', {
          p_athlete_id: athlete.id,
          p_tenant_id: athlete.tenant_id,
          p_api_key: athlete.intervals_api_key
        });

        if (rpcError) {
          console.error(`  Error: ${rpcError.message}`);
          failureCount++;
          failures.push({
            email: athlete.email,
            error: rpcError.message
          });
          continue;
        }

        console.log(`  ✅ Successfully migrated`);
        successCount++;

      } catch (err) {
        console.error(`  Exception: ${err instanceof Error ? err.message : 'Unknown error'}`);
        failureCount++;
        failures.push({
          email: athlete.email,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    // 4. Summary
    console.log(`
=====================================
Migration Summary
=====================================
Total athletes:       ${athletes.length}
Successfully migrated: ${successCount}
Failed:              ${failureCount}
=====================================
`);

    if (failures.length > 0) {
      console.log('Failures:');
      for (const failure of failures) {
        console.log(`  - ${failure.email}: ${failure.error}`);
      }
    }

    if (successCount > 0) {
      console.log(`
NEXT STEPS:
1. Verify the migration in Supabase vault.secrets table
2. Test with: curl -X POST http://localhost:3000/api/athlete/profile \\
   -H "Authorization: Bearer <JWT_TOKEN>"
3. Once verified, remove the 'intervals_api_key' column from 'athletes' table
   (This is a safety net - it avoids having plaintext copies)
`);
    }

    process.exit(failureCount > 0 ? 1 : 0);

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

// Run migration
migrateApiKeysToVault();
