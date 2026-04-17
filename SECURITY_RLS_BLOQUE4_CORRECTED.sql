-- BLOQUE 4 CORREGIDO: EVENT_REGISTRATIONS TABLE
-- Esta tabla tiene tenant_id directamente, no athlete_id

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- POLICY: Users ver registrations solo de su tenant
CREATE POLICY "event_registrations_select_own_tenant"
ON event_registrations FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);

-- POLICY: Users crear registrations solo en su tenant
CREATE POLICY "event_registrations_insert_own_tenant"
ON event_registrations FOR INSERT
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);

-- POLICY: Users actualizar registrations solo en su tenant
CREATE POLICY "event_registrations_update_own_tenant"
ON event_registrations FOR UPDATE
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);
