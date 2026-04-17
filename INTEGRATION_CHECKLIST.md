# AGENTE 5 Integration Checklist

## Síntesis de Componentes de Day 1

### AGENTE 1: Vault & RPC (API Key Storage)
**Status:** ✅ INTEGRADO

**RPC Functions esperadas:**
```sql
-- GET (Desencryption)
SELECT * FROM vault.decrypted_secrets 
WHERE name = 'intervals_api_key_{athlete_id}';

-- RPC store_intervals_key(p_athlete_id, p_tenant_id, p_api_key)
-- RPC get_intervals_key(p_athlete_id, p_tenant_id)
```

**Integración en AGENTE 5:**
- ✅ `src/lib/intervals-api.ts` llama `getIntervalsApiKey()`
- ✅ `createIntervalsWorkout()` usa API Key en memoria temporal
- ✅ API Key se descarta después de request (no persiste)
- ✅ Script `migrate-api-keys.ts` para migración inicial

**Testing:**
```typescript
// En src/lib/intervals-api.ts línea 39-44
const { data: apiKey, error } = await supabase.rpc('get_intervals_key', {
  p_athlete_id: athleteId,
  p_tenant_id: tenantId
});
```

---

### AGENTE 2: Audit Logging (audit_logs table & RLS)
**Status:** ✅ INTEGRADO

**Expected Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id UUID,
  actor_id VARCHAR(255),
  actor_type VARCHAR(20),
  actor_name VARCHAR(255),
  status VARCHAR(20), -- SUCCESS, FAILED, DENIED
  before_values JSONB,
  after_values JSONB,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP
);

-- RPC log_action() function
```

**Integración en AGENTE 5:**
- ✅ `src/utils/auditLog.ts` con 7+ helper functions
- ✅ `logAction()` - General purpose logging
- ✅ `logWorkoutPush()` - Workout creation
- ✅ `logApiKeyAccessed()` - API key access
- ✅ `logAthleteLogin()` - Login events
- ✅ `logCoachCommand()` - Telegram commands
- ✅ `logAthleteSubscription()` - Subscription events
- ✅ `logAthleteDataSync()` - Sync operations

**Endpoints que loguean:**
1. POST /auth/login - `logAthleteLogin()`
2. POST /auth/refresh - Implicit (token refresh)
3. POST /api/workouts/push - `logWorkoutPush()`
4. PUT /api/athlete/settings - `logAction()` con before/after
5. GET /api/audit-logs - Admin only view
6. POST /api/telegram/workout - `logWorkoutPush()`

**Testing:**
```bash
# Crear workout y verificar log
curl -X POST http://localhost:3000/api/workouts/push \
  -H "Authorization: Bearer $JWT" \
  -d '{"workout_name":"5x1km","athlete_ids":[]}'

# Buscar en audit_logs
curl http://localhost:3000/api/audit-logs -H "Authorization: Bearer $JWT"
# Buscar entry con action='WORKOUT_PUSHED', status='SUCCESS'
```

---

### AGENTE 3: JWT Auth (authMiddleware)
**Status:** ✅ INTEGRADO

**Expected:**
- JWT tokens con payload: `{ user_id, email, tenant_id, is_admin }`
- Signature con HS256
- Expiration: 24h

**Integración en AGENTE 5:**
- ✅ `src/middleware/authMiddleware.ts` con:
  - `registerJwtPlugin()` - Fastify JWT setup
  - `requireAuth()` - Middleware para proteger rutas
  - `requireAdminAuth()` - Middleware para admin-only
  - `getClientIp()` - Capture IP para audit logs
  - `AuthRequest` interface

**Endpoints protegidos:**
1. POST /auth/login - Public (genera JWT)
2. POST /auth/refresh - JWT required
3. GET /api/athlete/profile - JWT required
4. PUT /api/athlete/settings - JWT required
5. POST /api/workouts/push - JWT required
6. GET /api/audit-logs - JWT + ADMIN required

**Testing:**
```bash
# 1. Login
JWT=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"coach@errt.com","password":"pass123"}' \
  | jq -r '.access_token')

# 2. Use JWT
curl -H "Authorization: Bearer $JWT" \
  http://localhost:3000/api/athlete/profile

# 3. Verify expiration
sleep 86401 # Wait 24h
curl -H "Authorization: Bearer $JWT" \
  http://localhost:3000/api/athlete/profile
# Esperado: 401 Unauthorized
```

---

### AGENTE 4: Telegram Middleware & Validation
**Status:** ✅ INTEGRADO

**Expected:**
- Telegram ID validation via header: `X-Telegram-User-Id`
- Coach lookup in athletes table (is_admin=true)
- Bot commands: /start, /help, /workout, /list, /stats, /athletes

**Integración en AGENTE 5:**
- ✅ `src/middleware/validateTelegramUser.ts` utilizado en:
  - `requireTelegramAuth()` middleware para FastifyEndpoints
  - `CoachRequest` interface

**Endpoints Telegram protegidos:**
1. POST /api/telegram/test - Validation test
2. POST /api/telegram/workout - Create workout
3. GET /api/telegram/workouts - List workouts
4. GET /api/telegram/stats - Team statistics
5. GET /api/telegram/athletes - List athletes

**Testing:**
```bash
# Get valid Telegram ID
TELEGRAM_ID=$(sqlite3 db.sqlite "SELECT telegram_user_id FROM athletes WHERE is_admin=1 LIMIT 1")

# Test endpoint
curl -X POST http://localhost:3000/api/telegram/test \
  -H "X-Telegram-User-Id: $TELEGRAM_ID"
# Esperado: 200 OK with coach data

# Create workout
curl -X POST http://localhost:3000/api/telegram/workout \
  -H "X-Telegram-User-Id: $TELEGRAM_ID" \
  -d '{"name":"5x1km"}'
# Esperado: 201 Created
```

---

## Architecture Flow

```
User Request
    ↓
1. JWT Middleware (authMiddleware) - Verify token signature & expiration
    ├── Valid → Attach user to request.user
    └── Invalid → 401 Unauthorized
    ↓
2. Business Logic (getIntervalsApiKey, createIntervalsWorkout)
    ├── Call RPC get_intervals_key() (AGENTE 1)
    ├── Desencrypt API Key (Vault)
    ├── Use in memory (temporary)
    └── Discard after request
    ↓
3. Audit Logging (logAction, logWorkoutPush)
    ├── Call RPC log_action() (AGENTE 2)
    ├── Insert to audit_logs table
    ├── RLS Policy ensures tenant isolation
    └── Log includes: action, actor, status, timestamp, ip_address
    ↓
Response to Client (never includes API keys, passwords, or sensitive data)
```

---

## Integration Points

### Code Dependencies

```
src/server.ts (Main Server)
├── src/middleware/authMiddleware.ts (AGENTE 3)
├── src/middleware/validateTelegramUser.ts (AGENTE 4)
├── src/lib/intervals-api.ts (uses Vault RPC from AGENTE 1)
├── src/utils/auditLog.ts (uses audit_logs from AGENTE 2)
└── src/handlers/fastifyTelegramEndpoints.ts
```

### Database Dependencies

```sql
-- AGENTE 1: Vault
vault.secrets (encryption keys)

-- AGENTE 2: Audit
audit_logs (action tracking)
Athletes RLS Policy (tenant isolation)

-- AGENTE 3: Auth
athletes table (email, password_hash, tenant_id, is_admin)

-- AGENTE 4: Telegram
athletes table (telegram_user_id column needed)
```

### Environment Dependencies

```bash
# AGENTE 1: Vault
SUPABASE_URL=...
SUPABASE_ANON_KEY=...

# AGENTE 2: Audit
(Uses RPC log_action function)

# AGENTE 3: Auth
JWT_SECRET=... (Required!)

# AGENTE 4: Telegram
TELEGRAM_BOT_TOKEN=...
```

---

## Verification Checklist

### Pre-Deployment

- [ ] AGENTE 1 RPC functions exist:
  ```sql
  SELECT routine_name FROM information_schema.routines 
  WHERE routine_name LIKE 'get_intervals_key%' 
  OR routine_name LIKE 'store_intervals_key%';
  ```

- [ ] AGENTE 2 Audit table exists:
  ```sql
  SELECT * FROM audit_logs LIMIT 1;
  ```

- [ ] AGENTE 2 RLS policies active:
  ```sql
  SELECT * FROM pg_policies 
  WHERE tablename = 'audit_logs';
  ```

- [ ] AGENTE 3 JWT_SECRET set:
  ```bash
  echo $JWT_SECRET  # Should not be empty
  ```

- [ ] AGENTE 4 Telegram IDs configured:
  ```sql
  SELECT COUNT(*) as coaches_with_telegram_id 
  FROM athletes 
  WHERE is_admin=true AND telegram_user_id IS NOT NULL;
  ```

### Post-Deployment

- [ ] Login creates JWT token
- [ ] JWT token contains correct claims
- [ ] Protected endpoints require JWT
- [ ] Non-admin can't access /api/audit-logs
- [ ] Workout creation logs to audit_logs
- [ ] API keys stored encrypted (never plaintext)
- [ ] Telegram auth works with X-Telegram-User-Id
- [ ] All errors logged with correct status

### Security Validation

- [ ] No API keys in responses
- [ ] No passwords in responses
- [ ] No plaintext secrets in logs
- [ ] Tenant isolation enforced (RLS)
- [ ] IP addresses captured in logs
- [ ] Error messages don't leak sensitive info
- [ ] CORS configured correctly
- [ ] Rate limiting (if configured)

---

## Troubleshooting

### "RPC get_intervals_key not found"
→ AGENTE 1 function not created. Check Supabase Dashboard > SQL Editor

### "audit_logs table not found"
→ AGENTE 2 not executed. Run migration in Supabase

### "JWT malformed"
→ JWT_SECRET mismatch. Regenerate tokens with correct secret

### "Unauthorized - Telegram user not authorized"
→ Coach not in athletes table or is_admin=false. Check:
```sql
SELECT id, is_admin, telegram_user_id FROM athletes 
WHERE telegram_user_id = YOUR_ID;
```

---

## Next Steps (AGENTE 6: QA)

AGENTE 6 será responsable de:
1. Ejecutar todos los tests en TESTING.md
2. Verificar complianza con seguridad
3. Performance testing
4. Load testing
5. Integration testing end-to-end
6. Deployment checklist
