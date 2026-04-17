-- PASO 11: ENABLE RLS EN EVENT_REGISTRATIONS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- PASO 12: POLICY - Users ver registrations solo de su tenant
CREATE POLICY "event_registrations_select_own_tenant"
ON event_registrations FOR SELECT
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);

-- PASO 13: POLICY - Users crear registrations solo en su tenant
CREATE POLICY "event_registrations_insert_own_tenant"
ON event_registrations FOR INSERT
WITH CHECK (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);
