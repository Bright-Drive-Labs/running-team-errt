# API Testing Guide - AGENTE 5 Integration

Este documento contiene todos los tests para verificar la integración de seguridad.

## Setup

Antes de ejecutar los tests:

```bash
# 1. Instalar dependencias
npm install @fastify/jwt @fastify/cors

# 2. Configurar variables de entorno
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=eyJhbGc...
export JWT_SECRET=your-secret-key-here
export TELEGRAM_BOT_TOKEN=your-telegram-token

# 3. Iniciar servidor
npm run dev
# o para backend
node --loader ts-node/esm src/server.ts
```

## Test 1: Health Check

```bash
curl -X GET http://localhost:3000/health
# Respuesta: { "status": "ok", "timestamp": "..." }
```

## Test 2: Login (JWT)

```bash
# Login con credenciales válidas
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "coach@errt.com",
    "password": "pass123"
  }'

# Respuesta esperada:
# {
#   "access_token": "eyJhbGc...",
#   "user": {
#     "id": "uuid",
#     "email": "coach@errt.com",
#     "tenant_id": "uuid",
#     "is_admin": true
#   }
# }

# Guardar token
export JWT="eyJhbGc..."
```

## Test 3: Refresh Token

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json"

# Respuesta: { "access_token": "eyJhbGc..." }
```

## Test 4: Get Athlete Profile (JWT Protected)

```bash
curl -X GET http://localhost:3000/api/athlete/profile \
  -H "Authorization: Bearer $JWT"

# Respuesta esperada:
# {
#   "athlete": {
#     "id": "uuid",
#     "email": "coach@errt.com",
#     "name": "Coach Name",
#     ...
#   }
# }
```

## Test 5: Create Workout (JWT Protected + Audit Log)

```bash
curl -X POST http://localhost:3000/api/workouts/push \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "workout_name": "5x1km @ 3:45/km",
    "athlete_ids": ["athlete-uuid-1", "athlete-uuid-2"],
    "description": "Intense tempo training"
  }'

# Respuesta esperada:
# {
#   "success": true,
#   "workout": {
#     "id": "workout-uuid",
#     "name": "5x1km @ 3:45/km"
#   },
#   "pushed_to_athletes": [
#     { "athlete_id": "...", "success": true },
#     { "athlete_id": "...", "success": false, "error": "..." }
#   ],
#   "timestamp": "..."
# }
```

Verificar que se creó un log en `audit_logs`:
```bash
curl -X GET "http://localhost:3000/api/audit-logs?limit=10" \
  -H "Authorization: Bearer $JWT"

# Buscar entries con action='WORKOUT_PUSHED'
```

## Test 6: Update Athlete Settings (JWT Protected + Audit Log)

```bash
curl -X PUT http://localhost:3000/api/athlete/settings \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Ultra runner from ERRT",
    "instagram_handle": "@runner_handle",
    "website": "https://example.com"
  }'

# Respuesta esperada:
# {
#   "success": true,
#   "athlete": { ... updated athlete data ... }
# }

# Verificar log en audit_logs con action='ATHLETE_SETTINGS_UPDATED'
```

## Test 7: Get Audit Logs (Admin Only)

```bash
# Con token de admin
curl -X GET "http://localhost:3000/api/audit-logs?limit=50&offset=0" \
  -H "Authorization: Bearer $JWT_ADMIN"

# Respuesta esperada:
# {
#   "logs": [
#     {
#       "id": "uuid",
#       "tenant_id": "uuid",
#       "action": "WORKOUT_PUSHED",
#       "actor_name": "Coach Name",
#       "status": "SUCCESS",
#       "created_at": "...",
#       ...
#     }
#   ],
#   "pagination": { "limit": 50, "offset": 0, "total": 15 }
# }

# Si no es admin:
# { "error": "Forbidden - Admin access required", "code": "FORBIDDEN" }
```

## Test 8: Telegram Auth (Header Based)

```bash
# Reemplazar con ID de Telegram válido
export TELEGRAM_ID="123456789"

curl -X POST http://localhost:3000/api/telegram/test \
  -H "X-Telegram-User-Id: $TELEGRAM_ID" \
  -H "Content-Type: application/json"

# Respuesta si coach autorizado:
# {
#   "success": true,
#   "message": "Authorization successful",
#   "coach": { "id": "uuid", "name": "Coach Name", ... },
#   "tenant_id": "uuid"
# }

# Respuesta si no autorizado:
# { "error": "Telegram user not authorized. Only coaches can use this bot." }
```

## Test 9: Telegram Create Workout

```bash
curl -X POST http://localhost:3000/api/telegram/workout \
  -H "X-Telegram-User-Id: $TELEGRAM_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "10km easy run",
    "description": "Recovery day"
  }'

# Respuesta esperada:
# {
#   "success": true,
#   "message": "Workout created successfully",
#   "workout": { "id": "uuid", "name": "10km easy run" }
# }

# Verificar que se loguea con actor_type='TELEGRAM_BOT'
```

## Test 10: Error Cases

### 10a. Missing Authorization Header

```bash
curl -X GET http://localhost:3000/api/athlete/profile

# Respuesta:
# { "error": "Unauthorized", "code": "UNAUTHORIZED" }
```

### 10b. Invalid JWT Token

```bash
curl -X GET http://localhost:3000/api/athlete/profile \
  -H "Authorization: Bearer invalid.token.here"

# Respuesta:
# { "error": "Unauthorized", "code": "UNAUTHORIZED" }
```

### 10c. Missing Required Fields in Workout

```bash
curl -X POST http://localhost:3000/api/workouts/push \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{ "athlete_ids": ["uuid"] }'

# Respuesta:
# { "error": "workout_name is required" }
```

### 10d. Non-Admin Accessing Admin Route

```bash
curl -X GET http://localhost:3000/api/audit-logs \
  -H "Authorization: Bearer $JWT_ATHLETE"

# Respuesta:
# { "error": "Forbidden - Admin access required", "code": "FORBIDDEN" }
```

## Test 11: Audit Log Verification

Luego de cada test, verificar que se creó un log:

```bash
curl -X GET "http://localhost:3000/api/audit-logs" \
  -H "Authorization: Bearer $JWT"
```

Buscar:
- `WORKOUT_PUSHED` después de Test 5
- `ATHLETE_SETTINGS_UPDATED` después de Test 6
- `ATHLETE_LOGIN` después de Test 2
- `API_KEY_ACCESSED` cuando se crea workout (internally)
- `COACH_COMMAND` después de Test 9

## Test 12: API Key Vault (Implicit in Test 5)

Cuando se ejecuta Test 5 (crear workout):

1. Sistema llama `getIntervalsApiKey()`
2. RPC `get_intervals_key()` desencripta desde Vault
3. Se usa en memoria temporal
4. Se descarta después de request
5. Log `API_KEY_ACCESSED` se inserta

Verificar:
```bash
curl -X GET "http://localhost:3000/api/audit-logs?limit=100" \
  -H "Authorization: Bearer $JWT" | grep "API_KEY_ACCESSED"
```

## Test 13: Postman Collection

Si prefieres Postman, importar:

```json
{
  "info": {
    "name": "ERRT API - Security Integration",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": { "type": "bearer", "bearer": [{ "key": "token", "value": "{{jwt}}" }] },
  "item": [
    {
      "name": "Health",
      "request": { "method": "GET", "url": "{{baseUrl}}/health" }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/auth/login",
        "body": { "mode": "raw", "raw": "{\"email\":\"coach@errt.com\",\"password\":\"pass123\"}" }
      }
    },
    {
      "name": "Create Workout",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/workouts/push",
        "header": [{ "key": "Authorization", "value": "Bearer {{jwt}}" }],
        "body": { "mode": "raw", "raw": "{\"workout_name\":\"5x1km\",\"athlete_ids\":[]}" }
      }
    }
  ]
}
```

## Checklist de Verificación

- [ ] POST /auth/login devuelve JWT válido
- [ ] JWT token expira en 24h
- [ ] POST /auth/refresh genera nuevo token
- [ ] GET /api/athlete/profile requiere JWT (401 sin token)
- [ ] GET /api/audit-logs solo accesible para admins (403 para no-admins)
- [ ] POST /api/workouts/push crea workout en DB
- [ ] POST /api/workouts/push pushea a Intervals.icu (si config válida)
- [ ] Cada acción se loguea en audit_logs con status correcto
- [ ] API Keys NUNCA se guardan en texto plano
- [ ] API Keys se desencriptan desde Vault en RPC
- [ ] Telegram auth funciona con X-Telegram-User-Id header
- [ ] Errores se loguean con status='FAILED' o 'DENIED'
- [ ] IP addresses se capturan en logs (x-forwarded-for, etc)
- [ ] Respuestas nunca incluyen password_hash o API keys en plaintext

## Troubleshooting

### "JWT_SECRET not set"
```bash
export JWT_SECRET=dev-secret-key-for-testing-only
```

### "Supabase credentials not found"
```bash
export SUPABASE_URL=your-project.supabase.co
export SUPABASE_ANON_KEY=eyJhbGc...
```

### "RPC get_intervals_key not found"
Verificar que AGENTE 1 creó la RPC function:
```sql
SELECT * FROM information_schema.routines 
WHERE routine_name = 'get_intervals_key';
```

### "Coach not found in Telegram test"
Verificar que:
1. Athlete existe en tabla `athletes`
2. `telegram_user_id` está seteado
3. `is_admin` es true

```sql
SELECT id, telegram_user_id, is_admin FROM athletes 
WHERE telegram_user_id = 123456789;
```
