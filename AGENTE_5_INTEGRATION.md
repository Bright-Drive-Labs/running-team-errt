# AGENTE 5: Integration Lead (Frontend + Endpoints)

**Rol:** Integrar todos los componentes de seguridad de Day 1 en un servidor backend funcional.

**Fecha:** Day 2 de la orquestación de seguridad

---

## Tarea Completada

### 1. Crear Server.ts con Fastify y Middleware de Seguridad

**Archivo:** `src/server.ts`

- ✅ Fastify instance con logging
- ✅ JWT Plugin (@fastify/jwt)
- ✅ CORS middleware (@fastify/cors)
- ✅ Auth middleware (requireAuth, requireAdminAuth)
- ✅ Telegram middleware (requireTelegramAuth)
- ✅ Error handling global

**Rutas protegidas por JWT:**
```typescript
POST   /auth/login                    // Public (generates JWT)
POST   /auth/refresh                  // JWT required
GET    /api/athlete/profile           // JWT required
PUT    /api/athlete/settings          // JWT required (+ audit log)
POST   /api/workouts/push             // JWT required (+ audit log)
GET    /api/audit-logs                // JWT + Admin required
```

**Rutas protegidas por Telegram:**
```typescript
POST   /api/telegram/test             // X-Telegram-User-Id required
POST   /api/telegram/workout          // X-Telegram-User-Id required
GET    /api/telegram/workouts         // X-Telegram-User-Id required
GET    /api/telegram/stats            // X-Telegram-User-Id required
GET    /api/telegram/athletes         // X-Telegram-User-Id required
```

---

### 2. Crear intervals-api.ts con Vault Integration

**Archivo:** `src/lib/intervals-api.ts`

Implementa el flujo seguro de API Keys:

```typescript
getIntervalsApiKey()          // ← Llama RPC get_intervals_key() (AGENTE 1)
  ├─ Desencripta desde Vault
  ├─ Log acceso (logApiKeyAccessed)
  └─ Retorna en memoria temporal

createIntervalsWorkout()      // ← Usa API Key con Fastify
  ├─ Obtiene key del Vault
  ├─ POST a https://api.intervals.icu/v2/workouts
  └─ API Key se descarta (scope termina)

getIntervalsWorkouts()        // ← Obtener workouts del athlete
syncGarminToIntervals()       // ← Sincronizar Garmin data
```

**Seguridad:**
- API Keys NUNCA se guardan en memoria
- API Keys NUNCA se loguean en plaintext
- Desencriptación ocurre en servidor Supabase (RPC)
- Cada acceso se audita

---

### 3. Crear authMiddleware.ts con JWT Validation

**Archivo:** `src/middleware/authMiddleware.ts`

- ✅ `registerJwtPlugin()` - Setup Fastify JWT
- ✅ `requireAuth()` - Middleware para proteger rutas
- ✅ `requireAdminAuth()` - Middleware para admin-only
- ✅ `getClientIp()` - Extraer IP del cliente
- ✅ `AuthRequest` interface - Tipos TypeScript

**Flujo:**
```
Request con Authorization: Bearer <JWT>
  ↓
Middleware verifica firma (HS256)
  ↓
Middleware verifica expiration (24h)
  ↓
Middleware extrae claims (user_id, email, tenant_id, is_admin)
  ↓
Atache user a request.user
  ↓
Handler ejecuta con acceso a user data
```

---

### 4. Integrar logAction() en 5+ Endpoints

**Auditoría implementada en:**

1. **POST /auth/login**
   - Log: `ATHLETE_LOGIN` con status SUCCESS/FAILED
   - Captura: IP address
   
2. **POST /api/workouts/push**
   - Log: `WORKOUT_PUSHED` con status SUCCESS/FAILED
   - Datos: before_values, after_values, athlete_ids
   - Desencriptación de API Key también se loguea
   
3. **PUT /api/athlete/settings**
   - Log: `ATHLETE_SETTINGS_UPDATED` con before/after values
   - Compara valores antiguos vs nuevos
   
4. **POST /api/telegram/workout**
   - Log: `WORKOUT_PUSHED` con actor_type=TELEGRAM_BOT
   - Diferencia: action iniciada por Telegram vs Frontend
   
5. **GET /api/audit-logs**
   - Retorna todos los logs del tenant
   - Admin-only (requireAdminAuth)
   - Con paginación

**Ejemplo de log creado:**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "action": "WORKOUT_PUSHED",
  "entity_type": "workout",
  "entity_id": "workout-uuid",
  "actor_id": "user-uuid",
  "actor_type": "FRONTEND",
  "actor_name": "coach@errt.com",
  "status": "SUCCESS",
  "before_values": null,
  "after_values": { "name": "5x1km @ 3:45/km" },
  "error_message": null,
  "ip_address": "203.0.113.42",
  "user_agent": "curl/7.68.0",
  "created_at": "2026-04-15T10:30:00Z"
}
```

---

### 5. Crear Script migrate-api-keys.ts

**Archivo:** `scripts/migrate-api-keys.ts`

Migra API Keys existentes (plaintext) al Vault (encrypted):

```bash
npm run migrate:api-keys
```

**Flujo:**
1. Obtiene todos los athletes con `intervals_api_key` (plaintext)
2. Para cada uno, llama RPC `store_intervals_key()`
3. Encriptación ocurre en servidor Supabase
4. Reporte final: success/failure counts

**Seguridad:**
- UNA SOLA EJECUCIÓN
- Después: remover columna `intervals_api_key` de tabla athletes
- Backup antes de ejecutar

---

### 6. Documentación y Testing

**Archivos creados:**

1. **TESTING.md** - 13 test cases con curl
   - Health check
   - JWT login/refresh
   - Workout creation + audit log
   - Settings update
   - Telegram auth
   - Error cases
   - Postman collection
   
2. **INTEGRATION_CHECKLIST.md** - Síntesis de 4 agentes
   - Dependencias de cada agente
   - Verificación pre/post deployment
   - Troubleshooting

3. **AGENTE_5_INTEGRATION.md** - Este documento

4. **.env.example** - Variables de entorno necesarias

5. **tsconfig.server.json** - TypeScript config para backend

---

### 7. Dependencias Agregadas

**package.json actualizado:**

```json
"dependencies": {
  "fastify": "^4.25.2",
  "@fastify/cors": "^9.0.1",
  "@fastify/jwt": "^7.2.3",
  "telegraf": "^4.15.0",
  "@supabase/supabase-js": "^2.103.0"
}

"devDependencies": {
  "typescript": "^5.3.3",
  "ts-node": "^10.9.2",
  "tsx": "^4.7.0",
  "@types/node": "^20.10.0"
}

"scripts": {
  "server": "node --loader ts-node/esm src/server.ts",
  "server:dev": "tsx watch src/server.ts",
  "migrate:api-keys": "tsx scripts/migrate-api-keys.ts"
}
```

---

## Cómo Ejecutar

### Development

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables
cp .env.example .env
# Editar .env con credenciales reales

# 3. Iniciar servidor
npm run server:dev

# 4. Probar (en otra terminal)
curl http://localhost:3000/health
```

### Production

```bash
# 1. Build
npm run build

# 2. Migrar API Keys
npm run migrate:api-keys

# 3. Iniciar servidor
NODE_ENV=production node --loader ts-node/esm src/server-entry.ts
```

---

## Flujo Completo Seguridad

### 1. Usuario Frontend intenta crear workout

```
curl -X POST http://localhost:3000/api/workouts/push \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"workout_name":"5x1km","athlete_ids":["uuid"]}'
```

### 2. Middleware JWT valida token

```typescript
// src/middleware/authMiddleware.ts
await request.jwtVerify()           // Verifica firma
const decoded = request.user        // Extrae claims
request.user = {
  user_id, email, tenant_id, is_admin
}
```

### 3. Handler crea workout en DB

```typescript
// src/server.ts:POST /api/workouts/push
const { data: workout, error } = await supabase
  .from('workouts')
  .insert({ ... })
```

### 4. Para cada athlete, obtiene API Key del Vault

```typescript
// src/lib/intervals-api.ts:createIntervalsWorkout
const apiKey = await getIntervalsApiKey(athleteId, tenantId, coachName)
// ↓ Llama RPC get_intervals_key (AGENTE 1)
// ↓ Desencriptación en servidor Supabase
// ↓ API Key retorna en memoria temporal
```

### 5. Usa API Key temporalmente

```typescript
const response = await fetch('https://api.intervals.icu/v2/workouts', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,  // ← En memoria
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(workoutData)
})
// ⚠️ API Key se descarta aquí (scope termina)
```

### 6. Loguea acciones en audit_logs

```typescript
// AGENTE 2: Insert via RPC log_action()
await logWorkoutPush({
  tenant_id,
  actor_id: user.user_id,
  actor_name: user.email,
  workout_id,
  workout_name,
  status: 'SUCCESS'
})

await logApiKeyAccessed({
  tenant_id,
  actor_id: 'system',
  actor_name: coachName,
  athlete_id: athleteId,
  status: 'SUCCESS'
})
```

### 7. Retorna respuesta

```json
{
  "success": true,
  "workout": { "id": "uuid", "name": "5x1km @ 3:45/km" },
  "pushed_to_athletes": [
    { "athlete_id": "uuid", "success": true }
  ],
  "timestamp": "2026-04-15T10:30:00Z"
}
```

---

## Dependencias de Otros Agentes

### AGENTE 1 (Vault)
**RPC Functions requeridas:**
- `get_intervals_key(p_athlete_id, p_tenant_id)` → returns encrypted API Key
- `store_intervals_key(p_athlete_id, p_tenant_id, p_api_key)` → stores encrypted

**Verificación:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name LIKE '%intervals_key%';
```

### AGENTE 2 (Audit)
**Table requerida:**
- `audit_logs` con columnas: id, tenant_id, action, actor_id, status, created_at, etc.

**RPC Function requerida:**
- `log_action(p_tenant_id, p_action, ...)` → inserts into audit_logs

**RLS Policy requerida:**
- Aislar por tenant_id (solo users pueden ver sus logs)

**Verificación:**
```sql
SELECT * FROM audit_logs LIMIT 1;
SELECT * FROM pg_policies WHERE tablename = 'audit_logs';
```

### AGENTE 3 (JWT)
**Depende de:**
- JWT_SECRET environment variable
- @fastify/jwt plugin

**Lo que proporciona AGENTE 5:**
- Integración en middleware
- Tipos TypeScript (AuthRequest, AuthUser)
- Protected routes

### AGENTE 4 (Telegram)
**Depende de:**
- Athletes table con columna: telegram_user_id
- is_admin flag para validar coaches

**Lo que proporciona AGENTE 5:**
- Integración en Fastify endpoints
- Protected Telegram routes (/api/telegram/*)

---

## Verificación Pre-Deployment

```bash
# 1. TypeScript compila sin errores
npx tsc --noEmit -p tsconfig.server.json

# 2. Dependencias instaladas
npm install

# 3. Variables de entorno configuradas
env | grep -E 'SUPABASE|JWT_SECRET|TELEGRAM'

# 4. RPC functions existen
# (Query Supabase dashboard SQL editor)

# 5. Audit table existe
# (Query Supabase dashboard SQL editor)

# 6. Servidor inicia sin errores
npm run server:dev
# Esperado: "Server listening on port 3000"

# 7. Health check funciona
curl http://localhost:3000/health
# Esperado: { "status": "ok" }
```

---

## Entrega a AGENTE 6 (QA)

Los siguientes archivos están listos para testing:

1. **TESTING.md** - Test cases y curl commands
2. **src/server.ts** - Servidor backend funcional
3. **src/middleware/authMiddleware.ts** - JWT validation
4. **src/lib/intervals-api.ts** - Vault integration
5. **scripts/migrate-api-keys.ts** - API key migration
6. **INTEGRATION_CHECKLIST.md** - Verificación de agentes

**AGENTE 6 debe:**
- Ejecutar todos los tests en TESTING.md
- Verificar que no hay plaintext secrets en logs
- Validar auditoría (antes/después values)
- Testing de error cases (401, 403, 400)
- Performance testing
- Security audit
- Deployment checklist

---

## Notas de Seguridad

### API Keys
✅ NUNCA en responses
✅ NUNCA en plaintext logs
✅ NUNCA cacheadas
✅ SIEMPRE desde Vault (encrypted)
✅ SIEMPRE en memoria temporal
✅ SIEMPRE con audit trail

### JWT Tokens
✅ Firmados con HS256
✅ Expiration: 24h
✅ Claims: user_id, email, tenant_id, is_admin
✅ Refresh endpoint para renovar
✅ NUNCA en database (stateless)

### Audit Logs
✅ TODAS las acciones loguean
✅ Status: SUCCESS, FAILED, DENIED
✅ IP address capturada
✅ before_values / after_values (comparación)
✅ RLS Policy aísla por tenant

### Telegram Auth
✅ Validación vía header X-Telegram-User-Id
✅ Lookup en athletes table
✅ is_admin=true requerido
✅ Acciones loguean con actor_type=TELEGRAM_BOT

---

## Siguientes Pasos

1. **Ejecutar TESTING.md** (AGENTE 6)
   - Verificar todos los endpoints
   - Validar audit logs
   - Probar error cases

2. **Security Audit** (AGENTE 6)
   - No hay API keys en responses
   - Tenant isolation (RLS)
   - No hay secrets en logs

3. **Performance Testing** (AGENTE 6)
   - Load testing
   - Benchmark RPC calls
   - API Key decryption speed

4. **Deployment** (AGENTE 6)
   - Production checklist
   - Migration script execution
   - Health checks
   - Rollback plan

---

**Status:** ✅ AGENTE 5 Completo - Ready for AGENTE 6 (QA)
