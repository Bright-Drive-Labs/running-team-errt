# Audit Logs Deployment Guide

## Overview
Deployment of the `audit_logs` table for multi-tenant audit trail in Bright Drive ERRT system.

- **Status**: Ready for deployment
- **Created**: 2026-04-15
- **Target**: Supabase (yxxlplorjolymdjffrca)
- **Security**: RLS enabled with multi-tenant isolation

---

## Files Created

1. **supabase_audit_logs_setup.sql** - Complete SQL schema
2. **scripts/deploy_audit_logs.js** - Deployment helper script
3. **AUDIT_LOGS_DEPLOYMENT.md** - This deployment guide

---

## What Gets Deployed

### 1. Table: audit_logs
Multi-tenant audit trail with 15 columns:

```
id              UUID          -- Unique log identifier
action          VARCHAR(50)   -- Action name (WORKOUT_PUSHED, etc.)
entity_type     VARCHAR(50)   -- Type of entity affected
entity_id       UUID          -- ID of affected entity
actor_id        VARCHAR(100)  -- Who performed action
actor_type      VARCHAR(50)   -- Category (TELEGRAM_BOT, SYSTEM, etc.)
actor_name      VARCHAR(150)  -- Human-readable name
created_at      TIMESTAMP     -- When action happened
before_values   JSONB         -- State before action
after_values    JSONB         -- State after action
status          VARCHAR(20)   -- SUCCESS, FAILED, DENIED
error_message   TEXT          -- Error details
tenant_id       UUID          -- Which team (CRITICAL for RLS)
```

### 2. Indexes (7 total)
- `idx_audit_tenant` - For RLS filtering
- `idx_audit_timestamp` - For recent actions
- `idx_audit_action_tenant` - For team audits
- `idx_audit_status` - For error tracking
- `idx_audit_tenant_timestamp` - Combined query performance
- `idx_audit_actor` - For "who did what"
- `idx_audit_entity` - For resource history

### 3. RLS Policies (2 policies)
- **"Logs visible only to own tenant"** - SELECT only logs from your tenant
- **"Allow system inserts"** - Backend can insert logs (validates tenant_id)

### 4. Function: log_action()
Helper function for safe audit log insertion with validation:

```sql
SELECT log_action(
  p_tenant_id,        -- UUID of team
  p_action,           -- 'WORKOUT_PUSHED'
  p_entity_type,      -- 'workout'
  p_entity_id,        -- UUID of workout
  p_actor_id,         -- 'telegram:123456'
  p_actor_type,       -- 'TELEGRAM_BOT'
  p_actor_name,       -- 'Daniel Pérez'
  p_before_values,    -- JSONB or NULL
  p_after_values,     -- JSONB or NULL
  p_status,           -- 'SUCCESS'
  p_error_message     -- NULL or error text
);
-- Returns: UUID of created log entry
```

---

## Deployment Steps

### Step 1: Manual SQL Deployment (Recommended)

1. Go to: https://app.supabase.com/
2. Select project: `yxxlplorjolymdjffrca`
3. Click: `SQL Editor` → `New Query`
4. Open file: `supabase_audit_logs_setup.sql`
5. Copy all content into the SQL editor
6. Click: `Run` button
7. Wait for success message
8. Proceed to "Step 2: Verification"

### Step 2: Verification (Run in SQL Editor)

After deployment, verify each component:

```sql
-- 1. Verify table exists
SELECT table_name FROM information_schema.tables
WHERE table_name = 'audit_logs';
-- Expected: audit_logs (1 row)

-- 2. Verify columns
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;
-- Expected: id, action, entity_type, entity_id, actor_id, actor_type, actor_name, 
--           created_at, before_values, after_values, status, error_message, tenant_id

-- 3. Verify indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'audit_logs'
ORDER BY indexname;
-- Expected: idx_audit_actor, idx_audit_action_tenant, idx_audit_entity,
--           idx_audit_status, idx_audit_tenant, idx_audit_tenant_timestamp,
--           idx_audit_timestamp

-- 4. Verify RLS is enabled
SELECT relname, relrowsecurity FROM pg_class
WHERE relname = 'audit_logs';
-- Expected: audit_logs | t (true)

-- 5. Verify RLS policies
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'audit_logs';
-- Expected: 2 rows
-- - Logs visible only to own tenant (SELECT)
-- - Allow system inserts (INSERT)

-- 6. Verify function exists
SELECT routine_name, routine_type FROM information_schema.routines
WHERE routine_name = 'log_action'
AND routine_schema = 'public';
-- Expected: log_action | FUNCTION

-- 7. Verify function signature
SELECT routine_name, data_type
FROM information_schema.routine_columns
WHERE routine_name = 'log_action'
ORDER BY ordinal_position;
-- Expected: 11 parameters + 1 return value
```

### Step 3: Functional Testing

```sql
-- First, find an existing team UUID (from teams table)
SELECT id, name FROM teams LIMIT 1;
-- Note the team UUID for testing

-- Then run these tests:

-- TEST 1: Insert a successful log
SELECT log_action(
  'YOUR_TEAM_UUID'::UUID,
  'WORKOUT_PUSHED',
  'workout',
  NULL,
  'telegram:123456',
  'TELEGRAM_BOT',
  'Daniel Pérez',
  NULL,
  '{"name": "5x1km", "status": "published"}'::JSONB,
  'SUCCESS',
  NULL
);
-- Expected: Returns a UUID (log_id)

-- TEST 2: Verify log was inserted
SELECT id, action, actor_id, status, created_at FROM audit_logs
WHERE action = 'WORKOUT_PUSHED'
ORDER BY created_at DESC
LIMIT 1;
-- Expected: 1 row with your log

-- TEST 3: Insert a failed log
SELECT log_action(
  'YOUR_TEAM_UUID'::UUID,
  'ATHLETE_LOGIN',
  'athlete',
  NULL,
  'user:999',
  'FRONTEND',
  'Mobile App',
  NULL,
  NULL,
  'FAILED',
  'Invalid credentials'
);
-- Expected: Returns a UUID

-- TEST 4: Query logs for your team
SELECT action, status, error_message, created_at
FROM audit_logs
WHERE tenant_id = 'YOUR_TEAM_UUID'::UUID
ORDER BY created_at DESC
LIMIT 5;
-- Expected: 2+ rows with your logs

-- TEST 5: Verify indexes work
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM audit_logs
WHERE tenant_id = 'YOUR_TEAM_UUID'::UUID
AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
-- Expected: Uses index scan, not sequential scan

-- TEST 6: Test invalid tenant_id (should fail)
SELECT log_action(
  '00000000-0000-0000-0000-000000000000'::UUID,
  'TEST',
  'test',
  NULL,
  'test',
  'TEST',
  'Test'
);
-- Expected: Error message about invalid tenant_id
```

---

## Security Checklist

- [x] RLS enabled on audit_logs table
- [x] SELECT policy restricts to user's tenant
- [x] INSERT policy validates tenant_id exists
- [x] Foreign key constraint to teams table
- [x] ON DELETE CASCADE prevents orphaned logs
- [x] SECURITY DEFINER on log_action() function
- [x] Proper GRANT permissions configured
- [x] Audit table is append-only (immutable)
- [x] Timestamps stored in UTC (TIMESTAMP WITH TIME ZONE)

---

## Performance Characteristics

### Indexes
- **Primary filtering**: `idx_audit_tenant` - O(log n) tenant-based queries
- **Time-based**: `idx_audit_timestamp` - Latest actions O(1)
- **Combined**: `idx_audit_tenant_timestamp` - Recent team actions O(log n)
- **Entity history**: `idx_audit_entity` - All changes to a resource O(log n)

### Expected Query Performance
| Query Type | Index | Performance |
|-----------|-------|-------------|
| Get team's last 10 actions | idx_audit_tenant_timestamp | <10ms |
| Find all failed actions | idx_audit_status | <50ms |
| Get actor's history | idx_audit_actor | <100ms |
| Get resource's change history | idx_audit_entity | <20ms |

### Storage
- Per log entry: ~500-1000 bytes (without JSONB data)
- JSONB fields optional (before_values/after_values)
- Expected: 1-10 MB per month per team (depending on activity)

---

## Integration Points

### For Backend (Agent 4)
After deployment, backend can call:

```javascript
// Using Supabase client
const logId = await supabase
  .rpc('log_action', {
    p_tenant_id: teamId,
    p_action: 'WORKOUT_PUSHED',
    p_entity_type: 'workout',
    p_entity_id: workoutId,
    p_actor_id: 'telegram:123456',
    p_actor_type: 'TELEGRAM_BOT',
    p_actor_name: 'Bot Handler',
    p_before_values: null,
    p_after_values: { name: '5x1km', status: 'published' },
    p_status: 'SUCCESS',
    p_error_message: null
  });

console.log('Audit log created:', logId);
```

### For Frontend
Frontend can query audit logs (RLS will filter by tenant):

```javascript
// React/Vue component
const { data: logs, error } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('tenant_id', currentTeamId)
  .eq('status', 'FAILED')  // Optional: get only failed actions
  .order('created_at', { ascending: false })
  .limit(50);

// RLS automatically filters to user's team
```

---

## Troubleshooting

### Issue: RLS policy returns 0 rows
**Cause**: User is not associated with the queried tenant_id
**Solution**: Ensure user's athletes.tenant_id matches the queried tenant

### Issue: Cannot insert logs (INSERT fails)
**Cause**: tenant_id doesn't exist in teams table
**Solution**: Verify teams table has the team_id before inserting logs

### Issue: log_action() returns error about invalid tenant_id
**Cause**: Trying to log for a team that doesn't exist
**Solution**: Create team first, or use existing team UUID

### Issue: Indexes not being used (sequential scan)
**Cause**: PostgreSQL query planner chose sequential scan
**Solution**: Run ANALYZE on table; check statistics

---

## Next Steps (After Deployment)

1. **Agent 4 (Backend)**: Integrate `log_action()` calls in:
   - Workout push endpoints
   - API key management
   - Auth/login handlers
   - Data modification endpoints

2. **Agent 5 (Frontend Integration)**: Add UI to query audit logs:
   - Coach dashboard: Recent team actions
   - Error tracking page: Failed operations
   - Security page: Login/permission logs

3. **Monitoring**: Set up alerts for:
   - High volume of FAILED actions
   - Unusual actor patterns (suspicious logins)
   - Rapid API key creation/deletion

---

## Rollback (If Needed)

If deployment needs to be rolled back:

```sql
-- Drop all RLS policies
DROP POLICY "Logs visible only to own tenant" ON audit_logs;
DROP POLICY "Allow system inserts" ON audit_logs;

-- Drop function
DROP FUNCTION log_action(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, VARCHAR, JSONB, JSONB, VARCHAR, TEXT);

-- Drop indexes
DROP INDEX IF EXISTS idx_audit_tenant;
DROP INDEX IF EXISTS idx_audit_timestamp;
DROP INDEX IF EXISTS idx_audit_actor;
DROP INDEX IF EXISTS idx_audit_action_tenant;
DROP INDEX IF EXISTS idx_audit_status;
DROP INDEX IF EXISTS idx_audit_tenant_timestamp;
DROP INDEX IF EXISTS idx_audit_entity;

-- Drop table (BE CAREFUL - DATA LOSS)
DROP TABLE IF EXISTS audit_logs CASCADE;
```

---

## Questions?

For issues or questions about this deployment, refer to:
- Supabase SQL Editor: https://app.supabase.com/project/yxxlplorjolymdjffrca/sql/new
- Files: supabase_audit_logs_setup.sql, scripts/deploy_audit_logs.js
