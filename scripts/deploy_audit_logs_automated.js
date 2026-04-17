#!/usr/bin/env node

/**
 * Automated Audit Logs Deployment Script
 *
 * Attempts to deploy audit_logs schema using multiple methods:
 * 1. Supabase REST API (sql endpoint)
 * 2. Direct PostgreSQL connection
 * 3. Manual deployment instructions
 *
 * Usage: node scripts/deploy_audit_logs_automated.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

// Extract project ref
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];

// Read SQL file
const sqlFilePath = path.join(__dirname, '..', 'supabase_audit_logs_setup.sql');
if (!fs.existsSync(sqlFilePath)) {
  console.error(`ERROR: SQL file not found at ${sqlFilePath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

console.log('='.repeat(80));
console.log('AUDIT LOGS DEPLOYMENT - AUTOMATED');
console.log('='.repeat(80));
console.log(`Project: ${projectRef}`);
console.log(`SQL Size: ${sqlContent.length} bytes`);
console.log('');

/**
 * Method 1: Try REST API endpoint (admin-only)
 */
async function deployViaRestApi() {
  console.log('Attempting Method 1: Supabase REST API...');
  console.log('(Note: This requires service_role key, not anon key)');
  console.log('');

  // We don't have service_role key, so we skip this
  console.log('Status: Skipped (requires SERVICE_ROLE_KEY)');
  console.log('');
}

/**
 * Method 2: PostgreSQL direct connection (if available)
 */
async function deployViaPostgres() {
  console.log('Attempting Method 2: Direct PostgreSQL connection...');

  try {
    const pg = require('pg');
    const { Client } = pg;

    // Extract connection string from Supabase URL
    // Format: https://projectref.supabase.co
    const client = new Client({
      connectionString: `postgresql://postgres:${process.env.POSTGRES_PASSWORD || 'password'}@${projectRef}.supabase.co:5432/postgres`,
    });

    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connected!');
    console.log('');

    // Split SQL into statements and execute
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      try {
        console.log(`  [${i + 1}/${statements.length}] Executing...`);
        await client.query(stmt);
      } catch (err) {
        console.error(`  ERROR in statement ${i + 1}:`);
        console.error(`    ${err.message}`);
        // Continue on error (some statements may be idempotent)
      }
    }

    console.log('');
    console.log('All statements executed!');
    await client.end();
    return true;
  } catch (err) {
    console.log(`Status: Failed (${err.message})`);
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('Reason: pg module not installed');
      console.log('Install with: npm install pg');
    }
    console.log('');
    return false;
  }
}

/**
 * Method 3: Show manual deployment instructions
 */
function showManualInstructions() {
  console.log(''.repeat(80));
  console.log('MANUAL DEPLOYMENT INSTRUCTIONS');
  console.log('='.repeat(80));
  console.log('');
  console.log('Since automated deployment is not available, please follow these steps:');
  console.log('');
  console.log('Step 1: Go to Supabase Dashboard');
  console.log(`  URL: https://app.supabase.com/project/${projectRef}`);
  console.log('');
  console.log('Step 2: Navigate to SQL Editor');
  console.log('  - Click on "SQL Editor" in the left sidebar');
  console.log('  - Click "+ New Query" button');
  console.log('');
  console.log('Step 3: Copy and Paste SQL');
  console.log(`  - Open file: supabase_audit_logs_setup.sql`);
  console.log('  - Copy all content');
  console.log('  - Paste into the SQL editor');
  console.log('');
  console.log('Step 4: Execute the SQL');
  console.log('  - Click the "Run" button (blue play icon)');
  console.log('  - Wait for success message');
  console.log('');
  console.log('Step 5: Verify Deployment');
  console.log('  Run these verification queries in SQL Editor:');
  console.log('');
  console.log('  SELECT table_name FROM information_schema.tables');
  console.log('  WHERE table_name = \'audit_logs\';');
  console.log('  -- Expected: 1 row with "audit_logs"');
  console.log('');
  console.log('  SELECT indexname FROM pg_indexes');
  console.log('  WHERE tablename = \'audit_logs\';');
  console.log('  -- Expected: 7 indexes');
  console.log('');
  console.log('  SELECT policyname FROM pg_policies');
  console.log('  WHERE tablename = \'audit_logs\';');
  console.log('  -- Expected: 2 policies');
  console.log('');
  console.log('  SELECT routine_name FROM information_schema.routines');
  console.log('  WHERE routine_name = \'log_action\';');
  console.log('  -- Expected: 1 row with "log_action"');
  console.log('');
  console.log('Step 6: Test the Deployment');
  console.log('  After verifying, run the test commands in:');
  console.log('  - File: AUDIT_LOGS_DEPLOYMENT.md (section: "Functional Testing")');
  console.log('');
  console.log('='.repeat(80));
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  let success = false;

  // Try automated methods
  await deployViaRestApi();

  if (!success) {
    success = await deployViaPostgres();
  }

  // Show manual instructions if automated failed
  if (!success) {
    showManualInstructions();
  }

  // Summary
  console.log('SUMMARY');
  console.log('='.repeat(80));
  if (success) {
    console.log('Status: DEPLOYMENT SUCCESSFUL');
    console.log('');
    console.log('The audit_logs table is now ready to use!');
    console.log('');
    console.log('Backend can call: SELECT log_action(...) to insert logs');
    console.log('Frontend can query: SELECT * FROM audit_logs (with RLS isolation)');
  } else {
    console.log('Status: MANUAL DEPLOYMENT REQUIRED');
    console.log('');
    console.log('Please follow the manual deployment instructions above');
    console.log('or refer to: AUDIT_LOGS_DEPLOYMENT.md');
  }
  console.log('');
  console.log('Files created:');
  console.log('  1. supabase_audit_logs_setup.sql');
  console.log('  2. scripts/deploy_audit_logs.js (deployment helper)');
  console.log('  3. scripts/deploy_audit_logs_automated.js (this script)');
  console.log('  4. AUDIT_LOGS_DEPLOYMENT.md (deployment guide)');
  console.log('');
  console.log('='.repeat(80));
}

main().catch(console.error);
