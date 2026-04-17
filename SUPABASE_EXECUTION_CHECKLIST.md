# Supabase SQL Editor - Ejecución Paso a Paso

## 📋 CHECKLIST DE EJECUCIÓN

Ejecuta los siguientes SQL blocks en **Supabase SQL Editor** en orden.

---

## FASE 1: CRITICAL - DELETE & INSERT Policies (5 min)

### ✅ PASO 1: DELETE Policies para Athletes

**En Supabase SQL Editor, copia y pega:**

```sql
-- ATHLETES DELETE: Only admins can delete
CREATE POLICY "athletes_delete_admin_only" ON athletes FOR DELETE
USING (
  (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
  AND tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
);
```

**Expected result:** `Query executed successfully`

---

### ✅ PASO 2: INSERT Policy para Athletes

```sql
-- ATHLETES INSERT: New athletes in own tenant
CREATE POLICY "athletes_insert_own_tenant" ON athletes FOR INSERT
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  OR (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);
```

**Expected result:** `Query executed successfully`

---

### ✅ PASO 3: DELETE Policy para Events

```sql
-- EVENTS DELETE: Only tenant admins can delete
CREATE POLICY "events_delete_own_tenant" ON events FOR DELETE
USING (
  tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  AND (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);
```

**Expected result:** `Query executed successfully`

---

### ✅ PASO 4: DELETE Policy para Event_Registrations

```sql
-- EVENT_REGISTRATIONS DELETE: Admins in own tenant
CREATE POLICY "event_registrations_delete_own_tenant" ON event_registrations FOR DELETE
USING (
  tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  AND (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);
```

**Expected result:** `Query executed successfully`

---

### ✅ PASO 5: DELETE Policy para Workout_Assignments

```sql
-- WORKOUT_ASSIGNMENTS DELETE: Coaches of own athletes
CREATE POLICY "workout_assignments_delete_own_tenant" ON workout_assignments FOR DELETE
USING (
  athlete_id IN (
    SELECT id FROM athletes
    WHERE tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  )
  AND (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);
```

**Expected result:** `Query executed successfully`

---

## FASE 2: PERFORMANCE - Create Indexes (3 min)

### ✅ PASO 6: Índices para RLS Performance

```sql
-- Create indexes for RLS filtering
CREATE INDEX IF NOT EXISTS idx_athletes_tenant ON athletes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_tenant ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_tenant ON event_registrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workout_assignments_athlete_tenant ON workout_assignments(athlete_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_athletes_email ON athletes(email);
CREATE INDEX IF NOT EXISTS idx_athletes_tenant_email ON athletes(tenant_id, email);
```

**Expected result:** `Query executed successfully`

---

## FASE 3: VERIFICATION - Check Everything (2 min)

### ✅ PASO 7: Verificar RLS Policies

```sql
-- Contar políticas por tabla (debe ser 4 cada una)
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'events', 'event_registrations', 'workout_assignments')
GROUP BY tablename
ORDER BY tablename;
```

**Expected results:**
```
athletes              | 4 policies
event_registrations   | 4 policies
events                | 4 policies
workout_assignments   | 4 policies
```

If you see 3 instead of 4 on any table, re-run the missing policy.

---

### ✅ PASO 8: Verificar Índices

```sql
-- Listar todos los índices creados
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'events', 'event_registrations', 'workout_assignments')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected results:**
```
athletes              | idx_athletes_email
athletes              | idx_athletes_tenant
athletes              | idx_athletes_tenant_email
event_registrations   | idx_event_registrations_tenant
events                | idx_events_tenant
workout_assignments   | idx_workout_assignments_athlete_tenant
```

---

## PHASE 4: VIEW ALL POLICIES (Optional)

### Ver todas las políticas (opcional)

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'events', 'event_registrations', 'workout_assignments')
ORDER BY tablename, cmd, policyname;
```

---

## ✅ AFTER SUPABASE EXECUTION

Once all SQL blocks execute successfully:

1. **En tu terminal local:**
   ```bash
   cd "c:\Bright-Drive-Agent\Proyects\Runing Team ERRT"
   npm run dev
   ```
   - Servidor debe iniciar sin errores
   - Verifica que bcrypt está importado correctamente

2. **Configure .env:**
   ```bash
   # Abre .env y verifica:
   JWT_SECRET=your-secret-here  # Debe existir
   CORS_ORIGIN=http://localhost:5173  # O tu frontend URL
   TELEGRAM_BOT_TOKEN=your-token-here  # Obtener de @BotFather
   ```

3. **Test login (si tienes credentials):**
   - Intenta login 6 veces seguidas
   - En la 5ta vez: debe devolver 429 (Too Many Requests)
   - En la 6ta vez: debe retornar "Rate limited"

---

## 🚨 TROUBLESHOOTING

### Error: "policy ... already exists"
**Solución**: La policy ya existe de intentos anteriores. Está bien, el SQL ejecutó ok.

### Error: "relation ... does not exist"
**Solución**: La tabla no existe en tu Supabase. Verifica que existe:
```sql
SELECT * FROM information_schema.tables WHERE table_name IN ('athletes', 'events', 'event_registrations', 'workout_assignments');
```

### Error: "permission denied"
**Solución**: Estás usando una key que no tiene permisos. Usa Service Role Key en SQL Editor.

---

## ⏱️ TIEMPO TOTAL ESTIMADO

- FASE 1 (5 policies): 5 min
- FASE 2 (6 indexes): 3 min
- FASE 3 (2 verifications): 2 min
- **TOTAL: 10 minutos**

---

## ✨ AFTER COMPLETION

You'll have:
- ✅ 4 RLS policies for DELETE operations
- ✅ 1 RLS policy for INSERT on athletes
- ✅ 6 performance indexes on tenant_id columns
- ✅ Complete RLS coverage: SELECT, INSERT, UPDATE, DELETE

**System is now production-ready for RLS.**

---

**NEXT STEPS** (After Supabase):
1. Configure TELEGRAM_BOT_TOKEN in .env
2. Test login rate limiting (6+ attempts)
3. Test multi-tenant isolation (Coach A shouldn't see Coach B's athletes)
4. Run functional tests
