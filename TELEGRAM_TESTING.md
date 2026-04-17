# Testing Telegram Bot & Logging System

Este documento contiene los tests para validar la implementación del Telegram Bot y el sistema de auditoría.

## Prerequisites

Antes de ejecutar los tests, asegúrate de:

1. **Variables de entorno configuradas:**
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
DATABASE_URL=your_database_url (si usas RPC)
```

2. **Base de datos preparada:**
   - Tabla `athletes` con columnas: `id, tenant_id, name, email, is_admin, telegram_user_id`
   - Tabla `workouts` con columnas: `id, tenant_id, name, description, created_by, status, created_at`
   - Tabla `audit_logs` con columnas: `id, tenant_id, action, entity_type, entity_id, actor_id, actor_type, actor_name, status, error_message, created_at`
   - RPC function `log_action()` implementada (por AGENTE 2)

3. **Coach de prueba en la BD:**
```sql
INSERT INTO athletes (id, tenant_id, name, email, is_admin, telegram_user_id)
VALUES (
  'coach-test-001',
  'tenant-001',
  'Test Coach',
  'coach@example.com',
  true,
  '123456789'  -- Este es el telegram_user_id para los tests
);
```

## Test 1: Validación de usuario no autorizado

**Descripción:** El middleware debe rechazar requests con telegram_user_id no autorizados.

**Método:** POST
**URL:** `http://localhost:3000/api/telegram/test`
**Headers:**
```
X-Telegram-User-Id: 999999999
Content-Type: application/json
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/telegram/test \
  -H "X-Telegram-User-Id: 999999999" \
  -H "Content-Type: application/json"
```

**Resultado esperado:**
- Status: `403 Forbidden`
- Body:
```json
{
  "error": "Telegram user not authorized. Only coaches can use this bot.",
  "code": "NOT_AUTHORIZED"
}
```

**Validación en BD:**
```sql
SELECT action, actor_name, status, error_message
FROM audit_logs
WHERE action = 'COACH_COMMAND' AND status = 'DENIED'
ORDER BY created_at DESC LIMIT 1;
```

---

## Test 2: Validación de usuario autorizado (coach)

**Descripción:** El middleware debe aceptar requests con un telegram_user_id válido de coach.

**Requisito previo:** Crear coach en BD con `telegram_user_id = 123456789`

**Método:** POST
**URL:** `http://localhost:3000/api/telegram/test`
**Headers:**
```
X-Telegram-User-Id: 123456789
Content-Type: application/json
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/telegram/test \
  -H "X-Telegram-User-Id: 123456789" \
  -H "Content-Type: application/json"
```

**Resultado esperado:**
- Status: `200 OK`
- Body:
```json
{
  "success": true,
  "message": "Authorization successful",
  "coach": {
    "id": "coach-test-001",
    "name": "Test Coach",
    "email": "coach@example.com",
    "is_admin": true
  },
  "tenant_id": "tenant-001"
}
```

---

## Test 3: Crear entrenamiento vía API REST

**Descripción:** Coach autorizado puede crear entrenamientos a través del API.

**Método:** POST
**URL:** `http://localhost:3000/api/telegram/workout`
**Headers:**
```
X-Telegram-User-Id: 123456789
Content-Type: application/json
```
**Body:**
```json
{
  "name": "5x1km @ 3:45/km",
  "description": "Test workout from API"
}
```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/telegram/workout \
  -H "X-Telegram-User-Id: 123456789" \
  -H "Content-Type: application/json" \
  -d '{"name":"5x1km @ 3:45/km","description":"Test workout from API"}'
```

**Resultado esperado:**
- Status: `201 Created`
- Body:
```json
{
  "success": true,
  "message": "Workout created successfully",
  "workout": {
    "id": "workout-uuid-here",
    "name": "5x1km @ 3:45/km"
  }
}
```

**Validación en BD:**
```sql
-- Verificar workout creado
SELECT id, name, created_by, status
FROM workouts
WHERE name = '5x1km @ 3:45/km'
ORDER BY created_at DESC LIMIT 1;

-- Verificar audit log
SELECT action, actor_name, status, entity_id
FROM audit_logs
WHERE action = 'WORKOUT_PUSHED' AND status = 'SUCCESS'
ORDER BY created_at DESC LIMIT 1;
```

---

## Test 4: Listar entrenamientos del equipo

**Descripción:** Coach puede listar los entrenamientos de su equipo.

**Método:** GET
**URL:** `http://localhost:3000/api/telegram/workouts?limit=10&offset=0`
**Headers:**
```
X-Telegram-User-Id: 123456789
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/telegram/workouts?limit=10&offset=0" \
  -H "X-Telegram-User-Id: 123456789"
```

**Resultado esperado:**
- Status: `200 OK`
- Body:
```json
{
  "success": true,
  "workouts": [
    {
      "id": "workout-1",
      "name": "5x1km @ 3:45/km",
      "description": "Test workout from API",
      "created_at": "2026-04-15T10:30:00Z",
      "status": "published"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

---

## Test 5: Obtener estadísticas del equipo

**Descripción:** Coach puede obtener estadísticas del equipo (número de atletas, entrenamientos).

**Método:** GET
**URL:** `http://localhost:3000/api/telegram/stats`
**Headers:**
```
X-Telegram-User-Id: 123456789
```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/telegram/stats \
  -H "X-Telegram-User-Id: 123456789"
```

**Resultado esperado:**
- Status: `200 OK`
- Body:
```json
{
  "success": true,
  "stats": {
    "athletes": 5,
    "workouts": 10,
    "timestamp": "2026-04-15T10:35:00Z"
  }
}
```

---

## Test 6: Listar atletas del equipo

**Descripción:** Coach puede listar los atletas de su equipo.

**Método:** GET
**URL:** `http://localhost:3000/api/telegram/athletes?limit=20&offset=0`
**Headers:**
```
X-Telegram-User-Id: 123456789
```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/telegram/athletes?limit=20&offset=0" \
  -H "X-Telegram-User-Id: 123456789"
```

**Resultado esperado:**
- Status: `200 OK`
- Body:
```json
{
  "success": true,
  "athletes": [
    {
      "id": "athlete-1",
      "name": "Athlete One",
      "email": "athlete1@example.com",
      "created_at": "2026-04-15T09:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 5
  }
}
```

---

## Test 7: Validación de audit logs

**Descripción:** Todos los logs deben incluir tenant_id para aislamiento multi-tenant.

**Query SQL:**
```sql
-- Ver los últimos 10 logs
SELECT
  id,
  created_at,
  action,
  actor_name,
  actor_type,
  status,
  error_message,
  tenant_id
FROM audit_logs
WHERE action IN ('WORKOUT_PUSHED', 'COACH_COMMAND')
ORDER BY created_at DESC
LIMIT 10;
```

**Validación esperada:**
- ✓ Todos los registros tienen `tenant_id` correcto
- ✓ `actor_type` es uno de: TELEGRAM_BOT, FRONTEND, SYSTEM, API, WEBHOOK
- ✓ `status` es uno de: SUCCESS, FAILED, DENIED
- ✓ Los logs exitosos tienen `error_message = NULL`
- ✓ Los logs fallidos tienen `error_message` con descripción

---

## Test 8: Comandos del Telegram Bot

**Descripción:** Validar que el bot Telegram funciona con autorización y logging.

**Prerequisito:** Bot iniciado con `npm run bot` o similar

**Comando 1: /start**
```
/start
```
**Respuesta esperada:**
```
¡Hola Test Coach! 👋

Soy tu asistente de entrenamientos ERRT.

Comandos disponibles:
• /workout - Crear nuevo entrenamiento
• /list - Ver entrenamientos recientes
• /help - Ver ayuda
• /stats - Ver estadísticas del equipo
```

**Comando 2: /workout**
```
/workout 10x400m @ 60s + 90s recovery
```
**Respuesta esperada:**
```
✅ Entrenamiento creado

📝 Nombre: 10x400m @ 60s + 90s recovery
🆔 ID: <workout-id>

El entrenamiento está listo para ser asignado a los atletas.
```

**Comando 3: /list**
```
/list
```
**Respuesta esperada:**
```
📋 Últimos 10 Entrenamientos

1. 5x1km @ 3:45/km
2. 10x400m @ 60s + 90s recovery
```

**Comando 4: /stats**
```
/stats
```
**Respuesta esperada:**
```
📊 Estadísticas del Equipo

👥 Atletas: 5
📝 Entrenamientos: 10
```

---

## Test 9: Multi-tenant Isolation

**Descripción:** Verificar que los coaches solo ven los datos de su tenant.

**Setup:**
```sql
-- Tenant 1
INSERT INTO athletes (id, tenant_id, name, email, is_admin, telegram_user_id)
VALUES ('coach-tenant1', 'tenant-1', 'Coach A', 'coachA@test.com', true, '111111111');

INSERT INTO workouts (id, tenant_id, name, created_by)
VALUES ('workout-t1-1', 'tenant-1', 'Workout A1', 'coach-tenant1'),
       ('workout-t1-2', 'tenant-1', 'Workout A2', 'coach-tenant1');

-- Tenant 2
INSERT INTO athletes (id, tenant_id, name, email, is_admin, telegram_user_id)
VALUES ('coach-tenant2', 'tenant-2', 'Coach B', 'coachB@test.com', true, '222222222');

INSERT INTO workouts (id, tenant_id, name, created_by)
VALUES ('workout-t2-1', 'tenant-2', 'Workout B1', 'coach-tenant2');
```

**Test:** Coach A lista sus entrenamientos
```bash
curl -X GET "http://localhost:3000/api/telegram/workouts" \
  -H "X-Telegram-User-Id: 111111111"
```

**Validación esperada:**
- Solo muestra 2 workouts (Workout A1 y A2)
- No muestra Workout B1 de tenant-2
- tenant_id en respuesta es 'tenant-1'

---

## Test 10: Error Handling

**Test A: Missing telegram_user_id header**
```bash
curl -X GET http://localhost:3000/api/telegram/workouts \
  -H "Content-Type: application/json"
```
**Esperado:** 401 Unauthorized con mensaje "Missing X-Telegram-User-Id header"

**Test B: Invalid request body**
```bash
curl -X POST http://localhost:3000/api/telegram/workout \
  -H "X-Telegram-User-Id: 123456789" \
  -H "Content-Type: application/json" \
  -d '{"name":""}'
```
**Esperado:** 400 Bad Request con mensaje "Missing required field: name"

**Test C: Database error simulation**
Si la BD está offline:
```bash
curl -X GET "http://localhost:3000/api/telegram/workouts" \
  -H "X-Telegram-User-Id: 123456789"
```
**Esperado:** 500 Internal Server Error, log creado con status='FAILED'

---

## Validación Final de Auditoría

Ejecuta esta query para validar toda la auditoría:

```sql
SELECT
  COUNT(*) as total_logs,
  action,
  status,
  COUNT(*) as count
FROM audit_logs
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY action, status
ORDER BY created_at DESC;
```

**Resultado esperado:**
```
total_logs | action           | status  | count
-----------|------------------|---------|-------
   15      | COACH_COMMAND    | SUCCESS |  10
   15      | WORKOUT_PUSHED   | SUCCESS |   3
   15      | COACH_COMMAND    | DENIED  |   2
```

---

## Notas Importantes

1. **Logging no debe romper la app:** Si el RPC `log_action()` falla, los endpoints siguen respondiendo normalmente (logging es best-effort)

2. **Multi-tenant:** Cada log tiene `tenant_id`. Verifica que los coaches no vean logs de otros tenants.

3. **TypeScript:** Todo el código está tipado correctamente. Compila sin warnings:
```bash
npm run build
```

4. **Performance:** Los logs se insertan asincronamente sin bloquear responses HTTP.

5. **Seguridad:** 
   - Solo coaches (is_admin=true) pueden usar endpoints
   - telegram_user_id es la clave de validación
   - Todos los logs incluyen timestamp para auditoría
