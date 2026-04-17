-- ============================================
-- BLOQUE 1: ATHLETES TABLE RLS
-- ============================================
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athletes_select_own_tenant"
ON athletes FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid()));

CREATE POLICY "athletes_update_own_record"
ON athletes FOR UPDATE
USING (id = auth.uid() OR (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true);

-- ============================================
-- BLOQUE 2: WORKOUT_ASSIGNMENTS TABLE RLS
-- ============================================
ALTER TABLE workout_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workout_assignments_select_own_tenant"
ON workout_assignments FOR SELECT
USING (athlete_id IN (SELECT id FROM athletes WHERE tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())));

CREATE POLICY "workout_assignments_update_own_tenant"
ON workout_assignments FOR UPDATE
USING (athlete_id IN (SELECT id FROM athletes WHERE tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())));

-- ============================================
-- BLOQUE 3: EVENTS TABLE RLS
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_select_own_tenant"
ON events FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid()));

CREATE POLICY "events_insert_own_tenant"
ON events FOR INSERT
WITH CHECK (tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid()));

CREATE POLICY "events_update_own_tenant"
ON events FOR UPDATE
USING (tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid()));

-- ============================================
-- BLOQUE 4: EVENT_REGISTRATIONS TABLE RLS
-- ============================================
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event_registrations_select_own_tenant"
ON event_registrations FOR SELECT
USING (tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid()));

CREATE POLICY "event_registrations_insert_own_tenant"
ON event_registrations FOR INSERT
WITH CHECK (tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid()));

CREATE POLICY "event_registrations_update_own_tenant"
ON event_registrations FOR UPDATE
USING (tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid()));

-- ============================================
-- VERIFICACIÓN (ejecuta después de los 4 bloques)
-- ============================================
-- Ver tablas con RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'workout_assignments', 'events', 'event_registrations')
ORDER BY tablename;

-- Ver todas las policies creadas
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'workout_assignments', 'events', 'event_registrations')
ORDER BY tablename, policyname;
