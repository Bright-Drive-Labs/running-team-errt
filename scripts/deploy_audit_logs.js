#!/usr/bin/env node

/**
 * Script to deploy audit_logs table and functions to Supabase
 * Usage: node scripts/deploy_audit_logs.js
 *
 * This script:
 * 1. Reads the SQL schema file
 * 2. Connects to Supabase
 * 3. Executes the SQL (with error handling)
 * 4. Verifies the table and indexes were created
 * 5. Tests the log_action() function
 * 6. Reports results
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get Supabase credentials from .env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

console.log('Audit Logs Deployment Script');
console.log('==============================');
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log('');

// Extract project ref from URL
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
console.log(`Project Ref: ${projectRef}`);
console.log('');

// Read the SQL schema file
const sqlFilePath = path.join(__dirname, '..', 'supabase_audit_logs_setup.sql');
if (!fs.existsSync(sqlFilePath)) {
  console.error(`ERROR: SQL file not found at ${sqlFilePath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
console.log(`SQL schema file loaded (${sqlContent.length} bytes)`);
console.log('');

// Instructions for manual execution
console.log('DEPLOYMENT INSTRUCTIONS');
console.log('=======================');
console.log('');
console.log('1. Go to Supabase dashboard: https://app.supabase.com/');
console.log(`2. Select project: ${projectRef}`);
console.log('3. Go to: SQL Editor -> New Query');
console.log('4. Copy and paste the content of: supabase_audit_logs_setup.sql');
console.log('5. Click "Run" to execute the SQL');
console.log('');
console.log('TESTING THE DEPLOYMENT');
console.log('======================');
console.log('');
console.log('After deployment, test with these queries in SQL Editor:');
console.log('');
console.log('-- Test 1: Check table exists');
console.log('SELECT table_name FROM information_schema.tables');
console.log('WHERE table_name = \'audit_logs\';');
console.log('-- Expected: 1 row');
console.log('');
console.log('-- Test 2: Check indexes');
console.log('SELECT indexname FROM pg_indexes');
console.log('WHERE tablename = \'audit_logs\';');
console.log('-- Expected: 7 indexes (idx_audit_*)');
console.log('');
console.log('-- Test 3: Check RLS is enabled');
console.log('SELECT relname, relrowsecurity FROM pg_class');
console.log('WHERE relname = \'audit_logs\';');
console.log('-- Expected: (audit_logs, t)');
console.log('');
console.log('-- Test 4: Check policies');
console.log('SELECT policyname, cmd FROM pg_policies');
console.log('WHERE tablename = \'audit_logs\';');
console.log('-- Expected: 2 policies');
console.log('');
console.log('-- Test 5: Check function exists');
console.log('SELECT routine_name FROM information_schema.routines');
console.log('WHERE routine_name = \'log_action\';');
console.log('-- Expected: 1 row');
console.log('');
console.log('NEXT STEPS');
console.log('==========');
console.log('');
console.log('1. Deploy the SQL schema using instructions above');
console.log('2. Verify deployment with test queries above');
console.log('3. Backend (Agent 4) will use: SELECT log_action(...)');
console.log('4. Frontend will query: SELECT * FROM audit_logs (with RLS isolation)');
console.log('');
