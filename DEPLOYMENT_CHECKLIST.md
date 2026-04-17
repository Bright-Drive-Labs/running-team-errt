# ✅ DEPLOYMENT CHECKLIST — Multi-Tenant Security
**Status:** Ready for Production  
**Estimated Time:** 15-20 minutes  
**Risk Level:** LOW  
**Rollback Plan:** Available (see below)

---

## 📋 PRE-DEPLOYMENT VERIFICATION

### Documentation Review
- [ ] Read `ORQUESTACION_COMPLETADA_SUMMARY.md` (overview)
- [ ] Read `QA_REPORT_DAY_2_COMPLETE.md` (testing results)
- [ ] Read `SQL_DEPLOYMENT_GUIDE.md` (database setup)
- [ ] Read this checklist completely before starting

### Backup & Safety
- [ ] Database backup created (Supabase)
- [ ] Git branch protected (main)
- [ ] Rollback plan documented (see below)
- [ ] Team notified of maintenance window
- [ ] Have rollback contact list ready

### Environment Verification
- [ ] `SUPABASE_URL` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `JWT_SECRET` set (min 32 chars)
- [ ] `TELEGRAM_BOT_TOKEN` set (if using bot)
- [ ] `.env` file NOT committed

---

## 🗄️ PHASE 1: DATABASE SCHEMA (5-10 min)

### Step 1.1: Deploy RPC Functions (AGENTE 1)

**Location:** `supabase_functions_vault.sql`

```bash
# 1. Go to: https://app.supabase.com
# 2. Select your project
# 3. SQL Editor → New Query
# 4. Copy entire content of: supabase_functions_vault.sql
# 5. Paste in SQL Editor
# 6. Click "RUN"
```

**Verify:**
```sql
-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('store_intervals_key', 'get_intervals_key');
-- Expected: 2 rows
```

- [ ] RPC `store_intervals_key()` created
- [ ] RPC `get_intervals_key()` created
- [ ] RPC `revoke_intervals_key()` created
- [ ] Column `intervals_api_key_encrypted` added to athletes
- [ ] Verification query passed

### Step 1.2: Deploy Audit Logs (AGENTE 2)

**Location:** `supabase_audit_logs_setup.sql`

```bash
# 1. SQL Editor → New Query
# 2. Copy entire content of: supabase_audit_logs_setup.sql
# 3. Paste in SQL Editor
# 4. Click "RUN"
```

**Verify:**
```sql
-- Check table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'audit_logs';
-- Expected: 1 row

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'audit_logs';
-- Expected: 7+ indexes

-- Check RLS enabled
SELECT relname, relrowsecurity FROM pg_class 
WHERE relname = 'audit_logs';
-- Expected: relrowsecurity = true
```

- [ ] Table `audit_logs` created with 13 columns
- [ ] 7 indexes created (performance)
- [ ] RLS policies enabled
- [ ] Function `log_action()` created
- [ ] Verification queries passed

### Step 1.3: Test Database (5 min)

```bash
# Run verification checklist (from AGENTE 2 docs)
# Using Supabase SQL Editor:
# Copy & paste: AUDIT_LOGS_VERIFICATION_CHECKLIST.sql
# All 10 phases should PASS
```

- [ ] Phase 1-3: Table/Index/RLS checks PASS
- [ ] Phase 4-6: Function/Permissions checks PASS
- [ ] Phase 7-9: Functional tests PASS
- [ ] No errors in verification

**If ANY verification fails:**
- [ ] Check error message
- [ ] Review SQL_DEPLOYMENT_GUIDE.md troubleshooting
- [ ] Contact database admin
- [ ] DO NOT proceed to Phase 2

---

## 🔧 PHASE 2: BACKEND DEPLOYMENT (2-3 min)

### Step 2.1: Code Deployment

```bash
# 1. Ensure all changes committed
git status
# Expected: nothing to commit (working tree clean)

# 2. Push to main (if on feature branch)
git checkout main
git pull origin main
git merge feature/security-v1
git push origin main

# 3. Backend automatically deploys (if using CI/CD)
# OR manually:
npm install
npm run build
npm run start
```

**Verify:**
```bash
# Check server started
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

- [ ] Code pushed to main
- [ ] Dependencies installed (`npm install`)
- [ ] Build successful (`npm run build`)
- [ ] Server started (`npm run start`)
- [ ] Health check passes

### Step 2.2: Test JWT Auth

```bash
# 1. Create test athlete (if not exists)
# Using Supabase dashboard → athletes table
# Add: email="test@errt.com", password_hash="test123", tenant_id="errt-id"

# 2. Test login endpoint
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@errt.com","password":"test123"}'

# Expected response:
# {
#   "access_token": "eyJ...",
#   "user": {"id":"...","email":"test@errt.com","tenant_id":"..."}
# }
```

- [ ] Login endpoint responds 200 OK
- [ ] JWT token returned
- [ ] Token decodes correctly

### Step 2.3: Test Protected Endpoint

```bash
# 1. Get token from previous test
TOKEN="eyJ..."

# 2. Test protected endpoint
curl -X GET http://localhost:3000/api/athlete/profile \
  -H "Authorization: Bearer $TOKEN"

# Expected: 200 OK with athlete profile

# 3. Test without token (should fail)
curl -X GET http://localhost:3000/api/athlete/profile

# Expected: 401 Unauthorized
```

- [ ] Protected endpoint requires JWT
- [ ] Valid JWT allows access
- [ ] Invalid JWT returns 401

---

## 📦 PHASE 3: DATA MIGRATION (3-5 min)

### Step 3.1: Prepare Migration

```bash
# 1. Stop API servers (if multi-instance)
# Or continue - migration is safe with running app

# 2. Create backup of athletes table (optional but recommended)
# Using Supabase UI → Export data

# 3. Prepare environment
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Service role, NOT anon key
```

- [ ] Backup created (optional but recommended)
- [ ] Environment variables set
- [ ] Service role key available (NOT anon key)

### Step 3.2: Run Migration Script

```bash
# 1. Run migration
npm run ts-node scripts/migrate-api-keys.ts

# Expected output:
# 🔍 Buscando atletas con API Keys...
#    ✓ Encontrados 16 atletas con API Keys
#
# 📋 Migrando 16 API Keys...
# [1/16] Procesando: coach@errt.com
#      📤 Guardando en Vault...
#      🔍 Verificando...
#      ✅ Migrado exitosamente
# ...
# 
# 📊 RESUMEN DE MIGRACIÓN
# ✅ Exitosos:  16
# ❌ Fallidos:  0
# ⏭️  Saltados:  0
# 📋 Total:     16
```

**If migration fails:**
- [ ] Check error message
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (NOT anon key)
- [ ] Check RPC `store_intervals_key()` exists
- [ ] Check `intervals_api_key_encrypted` column exists
- [ ] Re-run script (safe to run multiple times)

- [ ] Migration script runs successfully
- [ ] All athletes migrated (or appropriately skipped)
- [ ] Zero failures
- [ ] Script exits with code 0

### Step 3.3: Verify Migration

```bash
# 1. Check vault.secrets table
SELECT COUNT(*) FROM vault.secrets;
# Expected: >= 16 (one per athlete with API key)

# 2. Check athletes table (column should have vault refs)
SELECT id, email, intervals_api_key_encrypted FROM athletes 
WHERE intervals_api_key_encrypted IS NOT NULL 
LIMIT 5;
# Expected: vault secret UUIDs

# 3. Test RPC retrieval
SELECT get_intervals_key('athlete-uuid'::UUID, 'tenant-uuid'::UUID);
# Expected: decrypted API key string (not plaintext stored)

# 4. Verify old plaintext keys still exist (safety net)
SELECT COUNT(*) FROM athletes 
WHERE intervals_api_key IS NOT NULL;
# Expected: <= original count (same or less)
```

- [ ] Vault secrets created
- [ ] `intervals_api_key_encrypted` populated with secret UUIDs
- [ ] `get_intervals_key()` RPC returns decrypted keys
- [ ] Old plaintext keys still in database (backup)

---

## 🧪 PHASE 4: SMOKE TESTS (2-3 min)

### Test 4.1: Authentication Flow

```bash
# Login
JWT=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@errt.com","password":"test123"}' \
  | jq -r '.access_token')

echo "JWT: $JWT"

# Should print JWT token (looks like: eyJ...)
```

- [ ] Login successful
- [ ] JWT token returned
- [ ] Token is 3-part (xxx.yyy.zzz)

### Test 4.2: Protected Endpoints

```bash
# Test /api/athlete/profile (GET)
curl -X GET http://localhost:3000/api/athlete/profile \
  -H "Authorization: Bearer $JWT"
# Expected: 200 OK with athlete data

# Test /api/audit-logs (GET, admin-only)
curl -X GET http://localhost:3000/api/audit-logs?limit=10 \
  -H "Authorization: Bearer $JWT"
# Expected: 200 OK with audit logs (if admin)
# OR 403 Forbidden (if not admin)
```

- [ ] GET /api/athlete/profile returns 200 OK
- [ ] Data includes athlete information
- [ ] No sensitive fields exposed (password_hash omitted)

### Test 4.3: Audit Logging

```bash
# 1. Create a workout
curl -X POST http://localhost:3000/api/workouts/push \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"workout_name":"Test 5x1km","athlete_ids":[]}'
# Expected: 201 Created

# 2. Check that log was created
curl -X GET http://localhost:3000/api/audit-logs?limit=5 \
  -H "Authorization: Bearer $JWT" \
  | jq '.logs | map(select(.action=="WORKOUT_PUSHED"))'
# Expected: At least one log with action='WORKOUT_PUSHED'
```

- [ ] Workout creation successful (201 Created)
- [ ] Audit log created automatically
- [ ] Log contains: action, actor, timestamp, status

### Test 4.4: Vault Encryption

```bash
# Verify API key is NEVER returned in plaintext

# 1. Query athletes table directly
curl -s http://localhost:3000/api/athlete/profile \
  -H "Authorization: Bearer $JWT" \
  | jq '.athlete | keys'
# Should NOT include: intervals_api_key

# 2. Check Supabase that column exists but has vault refs
SELECT intervals_api_key_encrypted FROM athletes LIMIT 1;
# Expected: UUID (vault secret id), NOT plaintext API key
```

- [ ] API key NOT exposed in API responses
- [ ] Column `intervals_api_key_encrypted` has vault UUIDs
- [ ] Plaintext API key NOT returned anywhere

---

## 🚨 PHASE 5: ROLLBACK PLAN (Read but don't execute)

**If you need to rollback, follow these steps:**

### Rollback Step 1: Pause Traffic
```bash
# Stop accepting new requests (optional)
# Or just revert code:
git revert <commit>
git push origin main
# Redeploy backend
```

### Rollback Step 2: Restore Database
```bash
# If you have backup from before migration:
# Supabase Dashboard → 
# Database → Backups → Restore to point in time

# Select time BEFORE step 3.2 (migration)
```

### Rollback Step 3: Verify
```bash
curl http://localhost:3000/health
# Should be 200 OK

# Test original functionality still works
curl -X POST http://localhost:3000/auth/login ...
# Should work as before
```

**Note:** Rollback should NOT be needed if all verification steps pass.

---

## ✅ DEPLOYMENT COMPLETE CHECKLIST

### All Phases Complete
- [ ] Phase 1: Database schema ✅
- [ ] Phase 2: Backend deployed ✅
- [ ] Phase 3: Data migrated ✅
- [ ] Phase 4: Smoke tests passed ✅
- [ ] Phase 5: Rollback plan reviewed ✅

### Post-Deployment
- [ ] All tests still passing
- [ ] No error logs
- [ ] Team notified
- [ ] Monitoring dashboard set up
- [ ] Documentation updated

### Sign-Off
- [ ] Reviewed by: ________________
- [ ] Approved by: ________________
- [ ] Date: ________________
- [ ] Time: ________________

---

## 📞 SUPPORT & TROUBLESHOOTING

### Database Issues
- Check: `SQL_DEPLOYMENT_GUIDE.md` → Troubleshooting section
- Contact: Database admin
- Escalation: Supabase support

### Backend Issues
- Check: `JWT_AUTH_README.md` → Debugging section
- Contact: Backend engineer
- Escalation: DevOps team

### Data Migration Issues
- Check: `scripts/migrate-api-keys.ts` → Run again
- Contact: Data engineer
- Escalation: Database team

### General Questions
- Documentation: `ORQUESTACION_COMPLETADA_SUMMARY.md`
- QA Results: `QA_REPORT_DAY_2_COMPLETE.md`
- Architecture: Multiple diagrams in docs folder

---

## 📊 MONITORING AFTER DEPLOYMENT

### First Hour
- [ ] Check error logs (should be empty)
- [ ] Monitor API response times
- [ ] Check authentication success rate
- [ ] Monitor Vault call latency

### First Day
- [ ] Review audit logs for any anomalies
- [ ] Check Vault encryption working
- [ ] Verify multi-tenant isolation (no data leakage)
- [ ] Monitor system resources

### First Week
- [ ] Review performance metrics
- [ ] Check for any issues reported by users
- [ ] Verify backup strategy working
- [ ] Plan next-phase improvements

---

## 🎯 SUCCESS CRITERIA

✅ Deployment is successful when:
- All smoke tests pass (Phase 4)
- No error logs in first hour
- Authentication works for all users
- Audit logs show expected entries
- No API failures in monitoring
- Team reports "all good"

🚨 Rollback if:
- Cannot login (Phase 4.1 fails)
- Protected endpoints return 5xx errors
- Vault decryption fails (Phase 4.4 fails)
- Data migration reported 100% failure
- More than 1% requests failing

---

**Deployment Checklist:** Ready to use  
**Last Updated:** 2026-04-15  
**Version:** 1.0  
**Status:** ✅ APPROVED FOR PRODUCTION
