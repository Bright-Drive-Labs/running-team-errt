-- ============================================================================
-- AUDIT LOGS - POST-DEPLOYMENT VERIFICATION CHECKLIST
-- ============================================================================
-- Run these queries in Supabase SQL Editor to verify deployment
-- Copy & paste each section and run it
-- All queries should return expected results
-- ============================================================================

-- ============================================================================
-- PHASE 1: BASIC TABLE VERIFICATION
-- ============================================================================

-- CHECK 1.1: Table exists
-- Expected: 1 row with "audit_logs"
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'audit_logs';

-- CHECK 1.2: All columns present and correct type
-- Expected: 13 rows with correct data types
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- CHECK 1.3: Column count verification
-- Expected: 13
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'audit_logs';

-- CHECK 1.4: Foreign key constraint exists
-- Expected: 1 row with fk_audit_tenant constraint
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'audit_logs'
  AND constraint_type = 'FOREIGN KEY';

-- ============================================================================
-- PHASE 2: INDEX VERIFICATION
-- ============================================================================

-- CHECK 2.1: All 7 indexes created
-- Expected: 7 rows (all idx_audit_* indexes)
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename = 'audit_logs'
ORDER BY indexname;

-- CHECK 2.2: Index count verification
-- Expected: 7
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE tablename = 'audit_logs';

-- CHECK 2.3: Specific indexes verification
-- Expected: 7 rows (one for each index)
SELECT indexname
FROM pg_indexes
WHERE tablename = 'audit_logs'
  AND indexname IN (
    'idx_audit_tenant',
    'idx_audit_timestamp',
    'idx_audit_actor',
    'idx_audit_action_tenant',
    'idx_audit_status',
    'idx_audit_tenant_timestamp',
    'idx_audit_entity'
  )
ORDER BY indexname;

-- ============================================================================
-- PHASE 3: RLS (ROW LEVEL SECURITY) VERIFICATION
-- ============================================================================

-- CHECK 3.1: RLS is enabled on audit_logs
-- Expected: 1 row with (audit_logs, t)
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'audit_logs';

-- CHECK 3.2: RLS policies exist
-- Expected: 2 rows (SELECT and INSERT policies)
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'audit_logs'
ORDER BY policyname;

-- CHECK 3.3: Specific policies verification
-- Expected: 2 rows with policy names
SELECT policyname
FROM pg_policies
WHERE tablename = 'audit_logs'
  AND policyname IN (
    'Logs visible only to own tenant',
    'Allow system inserts'
  );

-- ============================================================================
-- PHASE 4: FUNCTION VERIFICATION
-- ============================================================================

-- CHECK 4.1: log_action function exists
-- Expected: 1 row with log_action
SELECT routine_name, routine_type, routine_schema
FROM information_schema.routines
WHERE routine_name = 'log_action'
  AND routine_schema = 'public';

-- CHECK 4.2: Function parameters
-- Expected: 11 IN parameters + 1 OUT (UUID)
SELECT parameter_name, parameter_mode, data_type
FROM information_schema.parameters
WHERE specific_name LIKE 'log_action%'
ORDER BY ordinal_position;

-- CHECK 4.3: Function return type
-- Expected: 1 row with UUID
SELECT data_type
FROM information_schema.routine_columns
WHERE table_name = 'log_action'
  AND column_name = 'log_action';

-- ============================================================================
-- PHASE 5: COMMENTS AND DOCUMENTATION
-- ============================================================================

-- CHECK 5.1: Table has comment
-- Expected: 1 row with comment text
SELECT obj_description('audit_logs'::regclass, 'pg_class') as table_comment;

-- CHECK 5.2: Column comments
-- Expected: Multiple rows (not all columns have comments)
SELECT attname, col_description(attrelid, attnum)
FROM pg_attribute
WHERE attrelid = 'audit_logs'::regclass
  AND col_description(attrelid, attnum) IS NOT NULL
ORDER BY attnum;

-- CHECK 5.3: Index comments
-- Expected: Multiple rows with index documentation
SELECT indexname,
       obj_description(('audit_logs_' || indexname)::regclass, 'pg_class') as comment
FROM pg_indexes
WHERE tablename = 'audit_logs';

-- ============================================================================
-- PHASE 6: PERMISSIONS VERIFICATION
-- ============================================================================

-- CHECK 6.1: Table permissions
-- Expected: Roles with SELECT, INSERT, UPDATE, DELETE
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'audit_logs'
ORDER BY grantee, privilege_type;

-- CHECK 6.2: Function permissions
-- Expected: authenticated and service_role have EXECUTE
SELECT grantee, privilege_type
FROM information_schema.role_routine_grants
WHERE routine_name = 'log_action'
ORDER BY grantee;

-- ============================================================================
-- PHASE 7: FUNCTIONAL TESTS
-- ============================================================================

-- SETUP: Get a test team (find an existing team)
-- Expected: At least 1 team
SELECT id, name
FROM teams
LIMIT 5;
-- Copy one team UUID for the tests below

-- TEST 7.1: Insert a successful log entry
-- Replace 'your-team-uuid' with actual team UUID from SETUP above
-- Expected: Returns a UUID
SELECT log_action(
  'your-team-uuid'::UUID,
  'TEST_ACTION_SUCCESS',
  'test_entity',
  NULL,
  'test_actor_success',
  'TEST_SYSTEM',
  'Test System',
  NULL,
  '{"test": "data"}'::JSONB,
  'SUCCESS',
  NULL
);

-- TEST 7.2: Insert a failed log entry
-- Expected: Returns a UUID
SELECT log_action(
  'your-team-uuid'::UUID,
  'TEST_ACTION_FAILED',
  'test_entity',
  NULL,
  'test_actor_failed',
  'TEST_SYSTEM',
  'Test System',
  NULL,
  NULL,
  'FAILED',
  'This is a test error message'
);

-- TEST 7.3: Verify logs were inserted
-- Expected: 2 rows (from tests 7.1 and 7.2)
SELECT action, status, error_message
FROM audit_logs
WHERE action LIKE 'TEST_ACTION%'
ORDER BY created_at DESC;

-- TEST 7.4: Query by tenant
-- Replace 'your-team-uuid' with actual team UUID
-- Expected: 2+ rows
SELECT action, status, created_at
FROM audit_logs
WHERE tenant_id = 'your-team-uuid'::UUID
ORDER BY created_at DESC
LIMIT 10;

-- TEST 7.5: Query by status
-- Expected: 1+ rows
SELECT action, error_message
FROM audit_logs
WHERE status = 'FAILED'
  AND action LIKE 'TEST_ACTION%';

-- TEST 7.6: Test invalid tenant_id (should fail)
-- Expected: ERROR about invalid tenant_id
SELECT log_action(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'TEST_INVALID_TENANT',
  'test',
  NULL,
  'test',
  'TEST',
  'Test'
);

-- TEST 7.7: Test missing required parameters (should fail)
-- Expected: ERROR about null/empty action
SELECT log_action(
  'your-team-uuid'::UUID,
  '',  -- Empty action (invalid)
  'test',
  NULL,
  'test',
  'TEST',
  'Test'
);

-- ============================================================================
-- PHASE 8: PERFORMANCE VERIFICATION
-- ============================================================================

-- PERF 8.1: Index usage - Recent actions
-- Expected: Uses index scan (not sequential scan)
-- Look for "Index Scan" in output, not "Seq Scan"
EXPLAIN (ANALYZE, BUFFERS)
SELECT action, actor_name, created_at
FROM audit_logs
WHERE tenant_id = (SELECT id FROM teams LIMIT 1)::UUID
ORDER BY created_at DESC
LIMIT 10;

-- PERF 8.2: Index usage - Find errors
-- Expected: Uses index scan
EXPLAIN (ANALYZE, BUFFERS)
SELECT action, error_message
FROM audit_logs
WHERE status = 'FAILED'
LIMIT 20;

-- PERF 8.3: Index usage - Actor history
-- Expected: Uses index scan
EXPLAIN (ANALYZE, BUFFERS)
SELECT action, created_at
FROM audit_logs
WHERE actor_id = 'test_actor_success'
ORDER BY created_at DESC;

-- PERF 8.4: Table statistics
-- Expected: Shows row count, page count
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE tablename = 'audit_logs';

-- ============================================================================
-- PHASE 9: SECURITY TESTS
-- ============================================================================

-- SEC 9.1: Verify RLS policy blocks cross-tenant access
-- This requires two different athlete accounts
-- Expected: Different results for different athletes
-- (This test requires manual setup with multiple users)

-- SEC 9.2: Verify audit log immutability (no UPDATE allowed)
-- Expected: ERROR - violates row-level security policy
UPDATE audit_logs
SET action = 'HACKED'
WHERE id = (SELECT id FROM audit_logs LIMIT 1);

-- SEC 9.3: Verify audit log immutability (no DELETE allowed)
-- Expected: ERROR - violates row-level security policy
DELETE FROM audit_logs
WHERE id = (SELECT id FROM audit_logs LIMIT 1);

-- ============================================================================
-- PHASE 10: CLEANUP (OPTIONAL - Remove test data)
-- ============================================================================

-- CLEANUP 10.1: Delete test logs
-- WARNING: This actually deletes the test data!
-- Run only if you want to clean up after testing
DELETE FROM audit_logs
WHERE action LIKE 'TEST_ACTION%';

-- CLEANUP 10.2: Verify cleanup
-- Expected: 0 rows if cleanup was run
SELECT COUNT(*) as test_logs_remaining
FROM audit_logs
WHERE action LIKE 'TEST_ACTION%';

-- ============================================================================
-- VERIFICATION SUMMARY SCRIPT
-- ============================================================================
-- Run this single script to get a summary of all key components
-- Expected: 7-8 rows showing all key components exist

SELECT 'Table audit_logs' as component, COUNT(*)::text as count
FROM information_schema.tables
WHERE table_name = 'audit_logs'
UNION ALL
SELECT 'Columns', COUNT(*)::text
FROM information_schema.columns
WHERE table_name = 'audit_logs'
UNION ALL
SELECT 'Indexes', COUNT(*)::text
FROM pg_indexes
WHERE tablename = 'audit_logs'
UNION ALL
SELECT 'RLS Policies', COUNT(*)::text
FROM pg_policies
WHERE tablename = 'audit_logs'
UNION ALL
SELECT 'Function log_action', COUNT(*)::text
FROM information_schema.routines
WHERE routine_name = 'log_action'
  AND routine_schema = 'public'
UNION ALL
SELECT 'Audit Log Entries', COUNT(*)::text
FROM audit_logs
ORDER BY component;

-- ============================================================================
-- END OF VERIFICATION CHECKLIST
-- ============================================================================

-- EXPECTED RESULTS SUMMARY:
-- ========================
--
-- Table creation:      ✓ (1 table with 13 columns)
-- Indexes:             ✓ (7 indexes)
-- RLS:                 ✓ (RLS enabled + 2 policies)
-- Function:            ✓ (log_action with 11 parameters)
-- Permissions:         ✓ (SELECT, INSERT, EXECUTE grants)
-- Tests:               ✓ (Can insert and query logs)
-- Performance:         ✓ (Indexes used in queries)
-- Security:            ✓ (UPDATE/DELETE blocked by RLS)
-- Documentation:       ✓ (Comments on table, columns, indexes)
--
-- If all checks pass: Deployment is SUCCESSFUL
-- If any check fails: Review error and refer to AUDIT_LOGS_DEPLOYMENT.md

-- ============================================================================
