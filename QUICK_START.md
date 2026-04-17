# QUICK START - SQL Specialist Deliverables

**Status:** ✅ Ready to deploy  
**Date:** 2026-04-15

## 📦 What you got

4 files created for SQL Specialist (RPC + Vault) implementation:

```
1. supabase_functions_vault.sql
   └─ Complete PostgreSQL script with 3 functions + 1 migration
   └─ Ready to copy/paste into Supabase SQL Editor
   └─ ~400 lines (commented, tested)

2. SQL_DEPLOYMENT_GUIDE.md
   └─ Step-by-step instructions to execute in Supabase
   └─ Security tests (anon vs service_role)
   └─ Troubleshooting section
   └─ ~300 lines

3. backend_integration_example.js
   └─ Reference code for AGENTE 5 (Backend integration)
   └─ Functions to store/get/revoke API keys from backend
   └─ Real-world examples (create workout, sync Garmin)
   └─ ~250 lines

4. AGENTE_1_ENTREGA_SQL_SPECIALIST.md
   └─ Executive summary of deliverables
   └─ Checklist of completed tasks
   └─ FAQ section
   └─ ~150 lines
```

## 🚀 How to deploy (5 minutes)

### Step 1: Open Supabase SQL Editor
- Go to https://app.supabase.com/
- Click **SQL Editor** (left sidebar)
- Click **+ New Query**

### Step 2: Copy SQL script
- Open file: `supabase_functions_vault.sql`
- Copy all content
- Paste into SQL Editor
- Make sure **Authentication = "Service Role"** (top right)
- Click **Execute**

### Step 3: Run security tests
- Keep **Authentication = "Service Role"**
- Execute TEST 2 from `SQL_DEPLOYMENT_GUIDE.md` (should return TRUE)
- Change to **Authentication = "Anonymous"**
- Execute TEST 1 (should fail with "permission denied")
- Result: ✅ Your Vault encryption is secure

### Step 4: Verify deployment
- In SQL Editor, run verification queries from section "Verificar columna creada"
- You should see:
  - Column `intervals_api_key_encrypted` (type: uuid)
  - Functions `store_intervals_key()`, `get_intervals_key()`, `revoke_intervals_key()`

## 🔒 What this provides

### Security
- ✅ API Keys encrypted in Vault (never stored as plaintext)
- ✅ Multi-tenant validation (can't access other team's keys)
- ✅ SECURITY DEFINER functions (anon client gets 403 error)
- ✅ Error handling (no sensitive info exposed)

### Functions created
1. **`store_intervals_key(athlete_id, tenant_id, api_key)`**
   - Encrypts and saves API key in Vault
   - Returns: boolean (true = success)
   - Access: backend only (service_role)

2. **`get_intervals_key(athlete_id, tenant_id)`**
   - Retrieves and decrypts API key from Vault
   - Returns: decrypted API key text (temporary in memory)
   - Access: backend only (service_role)

3. **`revoke_intervals_key(athlete_id, tenant_id)`**
   - Removes encrypted key from Vault
   - Returns: boolean (true = success)
   - Access: backend only (service_role)

### Column added
- **`athletes.intervals_api_key_encrypted`** (type: UUID)
  - Stores reference to Vault secret, not the plaintext key
  - Never returned in SELECT queries
  - Always use RPC functions to access

## 🎯 Next steps

### For AGENTE 5 (Backend Integration)
- Use `backend_integration_example.js` as reference
- Implement endpoints to call these RPC functions
- Never expose API keys to frontend

### For AGENTE 2 (Design/UI)
- Create form for coach to input Intervals API key
- Send to backend endpoint (not directly to Supabase)

### For AGENTE 3 (Testing)
- Test that anon role gets 403 error
- Test that service_role can encrypt/decrypt
- Test multi-tenant isolation

### For AGENTE 4 (DevOps)
- Add SQL file to migrations folder
- Set up automated backups of vault.secrets
- Monitor function execution logs

## ⚠️ Important notes

1. **Vault only in Pro+** - Free tier doesn't have Vault. You need Pro or higher.

2. **Service role is secret** - Store `SUPABASE_SERVICE_ROLE_KEY` in environment variables only. Never commit to git.

3. **Frontend never gets the key** - All Intervals API calls happen in backend. Frontend only talks to your backend.

4. **Keys are temporary in memory** - When `get_intervals_key()` decrypts, the key exists in memory just for that function call. It's not stored as plaintext.

5. **Multi-tenant validation is critical** - The functions check that the athlete belongs to the tenant. This prevents data leakage between teams.

## 📞 If something goes wrong

### Error: "vault.create_secret does not exist"
→ You're on Free plan. Upgrade to Pro or higher.

### Error: "Permission denied for function"
→ Make sure Authentication = "Service Role" when running SQL, not "Anonymous".

### Error: "Column tenant_id does not exist"
→ Your athletes table doesn't have tenant_id yet. Add it:
```sql
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL;
```

### Can't find the files?
```bash
cd "/c/Bright-Drive-Agent/Proyects/Runing Team ERRT"
ls -la *.sql *.md *.js | grep -E "(supabase|SQL_DEPLOYMENT|AGENTE_1|backend_integration)"
```

## ✅ Verification checklist

- [ ] Opened Supabase SQL Editor
- [ ] Executed full `supabase_functions_vault.sql` script
- [ ] Ran TEST 1 with Anonymous role (got permission denied error)
- [ ] Ran TEST 2 with Service Role (got TRUE)
- [ ] Ran verification queries (found 3 functions + 1 column)
- [ ] Read `SQL_DEPLOYMENT_GUIDE.md` for details
- [ ] Shared `backend_integration_example.js` with Backend team

---

**That's it!** Your Vault encryption is ready. The backend can now securely store and use Intervals API keys.

Files location: `/c/Bright-Drive-Agent/Proyects/Runing Team ERRT/`
