# 🚀 ACCIONES INMEDIATAS - LO QUE TIENES QUE HACER AHORA

## ✅ YA HECHO
- [x] bcrypt instalado (`npm install bcrypt` ✓)
- [x] 7 security fixes implementados en código
- [x] RLS policies (SELECT, INSERT, UPDATE) ejecutadas en Supabase
- [x] .env.example creado

---

## 🔴 PASO 1: Ejecutar SQL en Supabase (10 min)

**Abre Supabase → SQL Editor y copia-pega LOS 5 BLOQUES en orden:**

### BLOQUE 1:
```sql
CREATE POLICY "athletes_delete_admin_only" ON athletes FOR DELETE
USING (
  (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
  AND tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
);
```

### BLOQUE 2:
```sql
CREATE POLICY "athletes_insert_own_tenant" ON athletes FOR INSERT
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  OR (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);
```

### BLOQUE 3:
```sql
CREATE POLICY "events_delete_own_tenant" ON events FOR DELETE
USING (
  tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  AND (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);
```

### BLOQUE 4:
```sql
CREATE POLICY "event_registrations_delete_own_tenant" ON event_registrations FOR DELETE
USING (
  tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  AND (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);
```

### BLOQUE 5:
```sql
CREATE POLICY "workout_assignments_delete_own_tenant" ON workout_assignments FOR DELETE
USING (
  athlete_id IN (
    SELECT id FROM athletes
    WHERE tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  )
  AND (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);
```

**Después de cada BLOQUE:**
- Presiona Execute ▶️
- Debe decir "Query executed successfully"
- Si dice "already exists" → está bien, continúa

---

## 🟡 PASO 2: Crear Índices (3 min)

**Después de los 5 BLOQUES anteriores, ejecuta esto en Supabase:**

```sql
CREATE INDEX IF NOT EXISTS idx_athletes_tenant ON athletes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_tenant ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_tenant ON event_registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workout_assignments_athlete_tenant ON workout_assignments(athlete_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_athletes_email ON athletes(email);
CREATE INDEX IF NOT EXISTS idx_athletes_tenant_email ON athletes(tenant_id, email);
```

---

## 🔵 PASO 3: Verificar en Supabase (1 min)

**Ejecuta esto para verificar que todo está ok:**

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'events', 'event_registrations', 'workout_assignments')
GROUP BY tablename
ORDER BY tablename;
```

**Debe retornar:**
```
athletes              | 4
event_registrations   | 4
events                | 4
workout_assignments   | 4
```

Si ves 3 en alguna tabla, re-ejecuta la policy que falta.

---

## 🟢 PASO 4: Configurar .env (2 min)

**Abre o crea `.env` en la raíz del proyecto:**

```bash
c:\Bright-Drive-Agent\Proyects\Runing Team ERRT\.env
```

**Copia esto:**
```
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CRÍTICO - Genera con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=tu-secret-aqui-min-32-chars

# CORS
CORS_ORIGIN=http://localhost:5173

# Telegram - Obtener de @BotFather
TELEGRAM_BOT_TOKEN=your-bot-token-here

# Server
PORT=3000
LOG_LEVEL=info
```

**Reemplaza los valores con los tuyos reales.**

---

## 🟣 PASO 5: Test del servidor (3 min)

**En terminal:**

```bash
cd "c:\Bright-Drive-Agent\Proyects\Runing Team ERRT"
npm run dev
```

**Debe imprimir algo como:**
```
[servidor] Server is running on port 3000
[servidor] Middleware registered: JWT, CORS
[servidor] Available endpoints:
  - GET  /health
  - POST /auth/login
  - ...
```

**Si hay error sobre bcrypt o JWT_SECRET:**
- Cierra el servidor (Ctrl+C)
- Verifica que bcrypt está en package.json: `npm ls bcrypt`
- Verifica que JWT_SECRET está en .env: `echo $env:JWT_SECRET`

---

## 🧪 PASO 6: Test Rate Limiting (2 min)

**En otra terminal o con Postman/curl, haz login 6 veces:**

```bash
# Login intentos 1-5 (deben pasar)
for i in {1..5}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -s | grep -o '"error":"[^"]*"'
done

# Login intento 6 (debe ser bloqueado)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' \
  -s | grep -o '"code":"[^"]*"'
# Debe retornar: "code":"RATE_LIMITED"
```

---

## ✨ PASO 7: Test Multi-Tenant (2 min)

**En AthletePortal:**

1. Login como Coach A (tenant ERRT)
2. Abre tab "COACH"
3. Debe ver solo athletes de ERRT ✅

**Si vieras athletes de otros tenants:**
- [ ] RLS no aplicó correctamente
- [ ] Vuelve a ejecutar las policies en Supabase

---

## 📋 SUMMARY

| Paso | Acción | Tiempo | Status |
|------|--------|--------|--------|
| 1 | Ejecutar 5 DELETE/INSERT policies en Supabase | 5 min | 🔴 HACES AHORA |
| 2 | Crear 6 índices en Supabase | 3 min | 🔴 HACES AHORA |
| 3 | Verificar políticas (SELECT count) | 1 min | 🔴 HACES AHORA |
| 4 | Configurar .env con valores reales | 2 min | 🔴 HACES AHORA |
| 5 | `npm run dev` - iniciar servidor | 3 min | 🔴 HACES AHORA |
| 6 | Test rate limiting (login 6 veces) | 2 min | ✅ DESPUÉS |
| 7 | Test multi-tenant (Coach view) | 2 min | ✅ DESPUÉS |

**TIEMPO TOTAL: ~15-20 minutos**

---

## 🎯 DONE!

Si todos los pasos pasan:
- ✅ Bcrypt instalado y funcionando
- ✅ DELETE/INSERT policies activas
- ✅ RLS completo en 4 tablas (SELECT, INSERT, UPDATE, DELETE)
- ✅ Índices de performance creados
- ✅ Rate limiting activo
- ✅ JWT secret en env var
- ✅ CORS restringido
- ✅ Telegram HMAC habilitado

**Sistema está PRODUCTION-READY** 🚀

---

## 🆘 HELP

Si algo falla:

**"Query executed successfully" pero dice "already exists"**
→ Está bien, la policy ya estaba. Continúa.

**bcrypt error al iniciar**
→ `npm install bcrypt` no corrió. Intenta de nuevo.

**"JWT_SECRET not set"**
→ No agregaste JWT_SECRET a .env

**Rate limiting no bloquea en intento 6**
→ Intenta 7-10 veces para estar seguro (con pequeños delays)

**Coach ve athletes de otro tenant**
→ RLS policies no ejecutaron ok. Verifica con:
```sql
SELECT tablename, COUNT(*) FROM pg_policies WHERE schemaname='public' GROUP BY tablename;
```

---

¿Empezamos con Supabase? Abre SQL Editor y ejecuta el BLOQUE 1. 👆
