# QA EXECUTABLE TESTS - Phase 1
## Tests That Can Run Immediately (Without Backend API)

**Date:** 2026-04-15  
**Scope:** Tests 2, 3, 7 (Telegram, Vault, Audit Logging)  
**Status:** Ready for Execution  

---

## PART 1: TELEGRAM VALIDATION TESTS (Tests 2.1-2.3)

These tests validate the `src/middleware/validateTelegramUser.ts` middleware.

### Prerequisites
- Backend running on port 3000
- Supabase connected
- Coach athlete record exists in DB
- Telegram ID known

### Setup: Create Test Coach Record

```sql
-- In Supabase SQL Editor (Service Role)
INSERT INTO athletes (
  id,
  tenant_id,
  name,
  email,
  telegram_user_id,
  is_admin,
  created_at
) VALUES (
  'test-coach-uuid-12345'::UUID,
  'errt-team-uuid'::UUID,  -- Change to real ERRT tenant UUID
  'Test Coach QA',
  'test-coach-qa@errt.com',
  '123456789',  -- Telegram User ID (get from bot)
  true,
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  telegram_user_id = '123456789',
  is_admin = true;

-- Verify
SELECT id, name, email, telegram_user_id, is_admin 
FROM athletes 
WHERE email = 'test-coach-qa@errt.com';
```

### Test 2.1: Missing X-Telegram-User-Id Header ✅

**Purpose:** Endpoint returns 401 when header missing

**Command:**
```bash
curl -X POST http://localhost:3000/api/telegram/test \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v
```

**Expected Response:**
```
HTTP/1.1 401 Unauthorized

{
  "error": "Missing X-Telegram-User-Id header",
  "code": "NO_TELEGRAM_ID"
}
```

**Pass Criteria:**
- [ ] Status Code: 401
- [ ] error field contains "Missing X-Telegram-User-Id header"
- [ ] code field is "NO_TELEGRAM_ID"

---

### Test 2.2: Unauthorized Telegram ID ✅

**Purpose:** Endpoint returns 403 for non-coach Telegram ID

**Setup:**
```sql
-- Get a non-coach athlete's ID
SELECT id, telegram_user_id FROM athletes 
WHERE is_admin = false 
AND telegram_user_id IS NOT NULL 
LIMIT 1;

-- If no athletes have telegram_user_id, create one
INSERT INTO athletes (
  id,
  tenant_id,
  name,
  email,
  telegram_user_id,
  is_admin
) VALUES (
  'test-athlete-uuid-67890'::UUID,
  'errt-team-uuid'::UUID,
  'Regular Athlete',
  'athlete@errt.com',
  '987654321',  -- Different Telegram ID
  false  -- NOT a coach
);
```

**Command:**
```bash
curl -X POST http://localhost:3000/api/telegram/test \
  -H "X-Telegram-User-Id: 987654321" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v
```

**Expected Response:**
```
HTTP/1.1 403 Forbidden

{
  "error": "Telegram user not authorized. Only coaches can use this bot.",
  "code": "NOT_AUTHORIZED"
}
```

**Pass Criteria:**
- [ ] Status Code: 403
- [ ] error field contains "Only coaches can use this bot"
- [ ] code field is "NOT_AUTHORIZED"

---

### Test 2.3: Authorized Telegram ID ✅

**Purpose:** Endpoint returns 200 for authorized coach

**Command:**
```bash
curl -X POST http://localhost:3000/api/telegram/test \
  -H "X-Telegram-User-Id: 123456789" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -v
```

**Expected Response:**
```
HTTP/1.1 200 OK

{
  "message": "Authorized",
  "coach": {
    "id": "test-coach-uuid-12345",
    "tenant_id": "errt-team-uuid",
    "name": "Test Coach QA",
    "email": "test-coach-qa@errt.com",
    "is_admin": true
  }
}
```

**Pass Criteria:**
- [ ] Status Code: 200
- [ ] coach object contains all expected fields
- [ ] coach.is_admin is true
- [ ] coach.telegram_user_id matches request header

---

## Test 2 Summary

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 2.1  | [ ]  | [ ]  | Missing header |
| 2.2  | [ ]  | [ ]  | Non-coach user |
| 2.3  | [ ]  | [ ]  | Authorized coach |

**Overall Test 2 Status:** 
- [ ] PASS (all 3 tests pass)
- [ ] FAIL (one or more tests fail)

---

## PART 2: VAULT ENCRYPTION TESTS (Tests 3.1-3.4)

These tests validate the Vault encryption functions in `supabase_functions_vault.sql`.

### Prerequisites
- Supabase database with Vault enabled (Pro plan)
- Functions deployed: `store_intervals_key()`, `get_intervals_key()`
- Athlete record exists

### Setup: Verify Functions Exist

```sql
-- In Supabase SQL Editor (Service Role)

-- Check store_intervals_key function
SELECT routine_name, routine_type, routine_schema
FROM information_schema.routines
WHERE routine_name = 'store_intervals_key'
AND routine_schema = 'public';

-- Check get_intervals_key function
SELECT routine_name, routine_type, routine_schema
FROM information_schema.routines
WHERE routine_name = 'get_intervals_key'
AND routine_schema = 'public';

-- Should return 2 rows (both functions exist)
```

### Test 3.1: API Key Never Plaintext ✅

**Purpose:** Encrypted API key stored as UUID (Vault reference), never plaintext

**SQL Query (Service Role):**
```sql
-- Get an athlete's encrypted key reference
SELECT 
  id,
  email,
  intervals_api_key_encrypted
FROM athletes 
WHERE intervals_api_key_encrypted IS NOT NULL
LIMIT 1;
```

**Expected Result:**
```
id                        | email           | intervals_api_key_encrypted
--------------------------|-----------------|-----------------------------
a1b2c3d4-e5f6...         | athlete@errt.com | v4r1d-u12e-1da5-8gh2...
```

**Verification:**
- The `intervals_api_key_encrypted` column should contain a UUID
- It should NOT contain any recognizable API key format
- If NULL, it means no key is stored (valid state)

**Pass Criteria:**
- [ ] Column contains UUID or NULL (never plaintext key)
- [ ] Can distinguish between UUID and actual API key string
- [ ] No sensitive data visible in SELECT

---

### Test 3.2: RPC Decryption (Service Role) ✅

**Purpose:** `get_intervals_key()` RPC retrieves and decrypts API key

**Prerequisite:**
```sql
-- First, store a test API key
SELECT store_intervals_key(
  'test-coach-uuid-12345'::UUID,
  'errt-team-uuid'::UUID,
  'test_intervals_api_key_12345'
) as stored;

-- Should return: t (true)
```

**SQL Query (Service Role):**
```sql
-- Retrieve the decrypted API key
SELECT get_intervals_key(
  'test-coach-uuid-12345'::UUID,
  'errt-team-uuid'::UUID
) as decrypted_key;
```

**Expected Result:**
```
decrypted_key
----------------------------
test_intervals_api_key_12345
```

**Pass Criteria:**
- [ ] RPC returns the plaintext API key
- [ ] Key matches what was stored
- [ ] No errors in execution
- [ ] Only service_role can access (next test)

---

### Test 3.3: Anon Client Denied ✅

**Purpose:** Anonymous client cannot call Vault functions

**Switch Authentication:**
In Supabase SQL Editor:
1. Look for "Authentication" dropdown (top right)
2. Switch from "Service Role" to "Anonymous"
3. Run the query below

**SQL Query (Anonymous):**
```sql
SELECT get_intervals_key(
  'test-coach-uuid-12345'::UUID,
  'errt-team-uuid'::UUID
);
```

**Expected Result:**
```
ERROR: permission denied for function get_intervals_key
```

**Pass Criteria:**
- [ ] Query fails with permission error
- [ ] Does NOT return the API key
- [ ] Does NOT crash or throw unexpected error
- [ ] This is the CORRECT security behavior

---

### Test 3.4: Store Restricted (Service Role Only) ✅

**Switch Back to Service Role:**
1. In Supabase SQL Editor authentication dropdown
2. Switch from "Anonymous" back to "Service Role"

**SQL Query (Service Role):**
```sql
SELECT store_intervals_key(
  'test-coach-uuid-12345'::UUID,
  'errt-team-uuid'::UUID,
  'new_test_key_xyz789'
) as stored;
```

**Expected Result:**
```
stored
------
t (true)
```

**Pass Criteria:**
- [ ] Function executes successfully
- [ ] Returns `t` (true)
- [ ] API key is now stored and encrypted

**Verify Storage (Service Role):**
```sql
SELECT intervals_api_key_encrypted 
FROM athletes 
WHERE id = 'test-coach-uuid-12345'::UUID;

-- Should show a UUID (the vault reference)
```

**Try with Anonymous (should fail):**
1. Switch to Anonymous
2. Run the store function

```sql
SELECT store_intervals_key(
  'test-coach-uuid-12345'::UUID,
  'errt-team-uuid'::UUID,
  'attempt_to_store'
);
```

**Expected Result:**
```
ERROR: permission denied for function store_intervals_key
```

**Pass Criteria:**
- [ ] Query fails with permission error
- [ ] No new key is stored
- [ ] This is correct security behavior

---

## Test 3 Summary

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 3.1  | [ ]  | [ ]  | Key is UUID (not plaintext) |
| 3.2  | [ ]  | [ ]  | RPC decrypts successfully |
| 3.3  | [ ]  | [ ]  | Anon denied access |
| 3.4  | [ ]  | [ ]  | Store restricted to service_role |

**Overall Test 3 Status:**
- [ ] PASS (all 4 tests pass)
- [ ] FAIL (one or more tests fail)

---

## PART 3: AUDIT LOGGING TESTS (Tests 7.1-7.3)

These tests validate the audit logging system in `src/utils/auditLog.ts`.

### Prerequisites
- Supabase database with `audit_logs` table
- Telegram bot running (or endpoint that calls audit logging)
- Coach record exists

### Setup: Verify audit_logs Table

```sql
-- In Supabase SQL Editor (Service Role)

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Should show columns: id, action, entity_type, entity_id, actor_id, actor_type, 
--                      actor_name, created_at, status, error_message, tenant_id, etc.
```

### Test 7.1: Workout Push Logged ✅

**Purpose:** Creating a workout via Telegram logs to audit_logs

**Setup (in Telegram):**
1. Get Telegram bot token and start bot
2. Get coach's Telegram ID (use /start)
3. Update coach record: `telegram_user_id = '<your-telegram-id>'`

**Send Telegram Command:**
```
/workout 5x1km @ 3:45/km
```

**Verify Log in Database:**
```sql
SELECT 
  id,
  action,
  entity_type,
  entity_id,
  actor_type,
  actor_name,
  status,
  error_message,
  tenant_id,
  created_at
FROM audit_logs
WHERE action = 'WORKOUT_PUSHED'
AND tenant_id = 'errt-team-uuid'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
id             | action          | entity_type | entity_id        | actor_type    | actor_name      | status  | error_message | tenant_id            | created_at
---------------|-----------------|-------------|------------------|----------------|-----------------|---------|---------------|----------------------|---------------------------
log-uuid-123   | WORKOUT_PUSHED  | workout     | workout-uuid-456 | TELEGRAM_BOT   | Test Coach QA   | SUCCESS | NULL          | errt-team-uuid       | 2026-04-15 14:32:10
```

**Pass Criteria:**
- [ ] Log row exists with action='WORKOUT_PUSHED'
- [ ] actor_type='TELEGRAM_BOT'
- [ ] status='SUCCESS'
- [ ] tenant_id matches coach's team
- [ ] created_at is recent (within last minute)
- [ ] error_message is NULL (no error)

---

### Test 7.2: Commands Logged ✅

**Purpose:** All Telegram commands are logged

**Send Multiple Commands:**
```
/start
/help
/stats
/list
/athletes
```

**Verify Logs:**
```sql
SELECT 
  action,
  entity_id,
  actor_name,
  status,
  created_at
FROM audit_logs
WHERE action = 'COACH_COMMAND'
AND actor_type = 'TELEGRAM_BOT'
AND tenant_id = 'errt-team-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
```
action           | entity_id | actor_name      | status  | created_at
-----------------|-----------|-----------------|---------|---------------------------
COACH_COMMAND    | athletes  | Test Coach QA   | SUCCESS | 2026-04-15 14:32:40
COACH_COMMAND    | list      | Test Coach QA   | SUCCESS | 2026-04-15 14:32:35
COACH_COMMAND    | stats     | Test Coach QA   | SUCCESS | 2026-04-15 14:32:30
COACH_COMMAND    | help      | Test Coach QA   | SUCCESS | 2026-04-15 14:32:25
COACH_COMMAND    | start     | Test Coach QA   | SUCCESS | 2026-04-15 14:32:20
```

**Pass Criteria:**
- [ ] Multiple log rows exist (one per command)
- [ ] action='COACH_COMMAND' for all
- [ ] entity_id varies (start, help, stats, etc.)
- [ ] status='SUCCESS' for all
- [ ] actor_name is consistent (same coach)
- [ ] created_at timestamps are in order

---

### Test 7.3: Failed Operations Logged ✅

**Purpose:** Failed operations log with error details

**Send Invalid Command:**
```
/workout
```
(Without workout description - should fail)

**Verify Error Log:**
```sql
SELECT 
  action,
  entity_id,
  status,
  error_message,
  created_at
FROM audit_logs
WHERE action = 'COACH_COMMAND'
AND status = 'FAILED'
AND tenant_id = 'errt-team-uuid'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
```
action         | entity_id | status  | error_message                           | created_at
----------------|-----------|---------|----------------------------------------|---------------------------
COACH_COMMAND   | workout   | FAILED  | Invalid format - missing workout... | 2026-04-15 14:33:00
```

**Pass Criteria:**
- [ ] Log row exists with status='FAILED'
- [ ] error_message contains explanation of failure
- [ ] action='COACH_COMMAND'
- [ ] created_at is recent

---

### Test 7.4: RLS Isolation on Logs ✅

**Purpose:** Each coach sees only their tenant's logs

**Setup:**
```sql
-- Get tenant IDs
SELECT id, name FROM teams LIMIT 5;

-- Get coaches from each team
SELECT id, name, email, tenant_id, is_admin 
FROM athletes 
WHERE is_admin = true 
LIMIT 5;
```

**Query as Coach A (Service Role for now):**
```sql
-- Count logs for ERRT team
SELECT COUNT(*) as errt_logs FROM audit_logs
WHERE tenant_id = 'errt-team-uuid';

-- Expected: > 0 (we just created logs)
```

**Query as Coach B (Service Role for now):**
```sql
-- Count logs for runners58 team
SELECT COUNT(*) as runners58_logs FROM audit_logs
WHERE tenant_id = 'runners58-team-uuid';

-- Expected: Some number (different from ERRT)
```

**Cross-Tenant Query (should fail with RLS):**
```sql
-- Try to see logs from other team
SELECT COUNT(*) FROM audit_logs
WHERE tenant_id = 'runners58-team-uuid'
AND tenant_id != (SELECT tenant_id FROM athletes WHERE id = auth.uid() LIMIT 1);

-- With RLS enabled, this should filter the results
-- (In production, only authenticated user's team logs visible)
```

**Pass Criteria:**
- [ ] Coach A sees different log counts than Coach B
- [ ] No cross-team log visibility
- [ ] RLS policy prevents unauthorized access

---

## Test 7 Summary

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 7.1  | [ ]  | [ ]  | Workout logged |
| 7.2  | [ ]  | [ ]  | Commands logged |
| 7.3  | [ ]  | [ ]  | Errors logged |
| 7.4  | [ ]  | [ ]  | RLS isolation works |

**Overall Test 7 Status:**
- [ ] PASS (all tests pass)
- [ ] FAIL (one or more tests fail)

---

## SUMMARY: Executable Tests Status

| Category | Test | Status |
|----------|------|--------|
| Telegram Validation | 2.1 | ✅ Ready |
| Telegram Validation | 2.2 | ✅ Ready |
| Telegram Validation | 2.3 | ✅ Ready |
| Vault Encryption | 3.1 | ✅ Ready |
| Vault Encryption | 3.2 | ✅ Ready |
| Vault Encryption | 3.3 | ✅ Ready |
| Vault Encryption | 3.4 | ✅ Ready |
| Audit Logging | 7.1 | ✅ Ready |
| Audit Logging | 7.2 | ✅ Ready |
| Audit Logging | 7.3 | ✅ Ready |
| Audit Logging | 7.4 | ✅ Ready |

**Total Executable Tests:** 11/31  
**Tests Requiring Backend:** 20  

---

## FINAL CHECKLIST

Before declaring tests complete:

```
TELEGRAM TESTS (2.x):
  [ ] 2.1 Missing header → 401
  [ ] 2.2 Non-coach → 403
  [ ] 2.3 Coach authorized → 200 with coach data

VAULT TESTS (3.x):
  [ ] 3.1 Encrypted key is UUID (not plaintext)
  [ ] 3.2 RPC decrypts API key successfully
  [ ] 3.3 Anon cannot call get_intervals_key()
  [ ] 3.4 Store function restricted to service_role

AUDIT TESTS (7.x):
  [ ] 7.1 Workout creation creates log
  [ ] 7.2 All Telegram commands logged
  [ ] 7.3 Failed operations log with error
  [ ] 7.4 RLS prevents cross-tenant log access

OVERALL:
  [ ] All 11 executable tests PASS
  [ ] No unexpected errors
  [ ] Results match expected outcomes
  [ ] Security controls working as intended
```

---

## NEXT STEPS

After completing executable tests:

1. **Report Results** to main QA report
2. **Implement Backend API** (for Tests 1, 4, 5, 6, 8, 9, 10)
3. **Run Remaining Tests** once backend is ready
4. **Security Audit** with external team
5. **Load Test** with 1000+ concurrent users
6. **Deploy to Staging** for UAT

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-15  
**Status:** Ready for Execution
