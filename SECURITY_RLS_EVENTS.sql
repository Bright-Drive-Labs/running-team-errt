-- PASO 7: ENABLE RLS EN EVENTS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- PASO 8: POLICY - Users ver solo events de su tenant
CREATE POLICY "events_select_own_tenant"
ON events FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);

-- PASO 9: POLICY - Users crear events solo en su tenant
CREATE POLICY "events_insert_own_tenant"
ON events FOR INSERT
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);

-- PASO 10: POLICY - Users actualizar eventos en su tenant
CREATE POLICY "events_update_own_tenant"
ON events FOR UPDATE
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);
