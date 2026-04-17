-- PASO 2A: ENABLE RLS EN ATHLETES
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- PASO 2B: CREAR POLICY - Users ver athletes de su tenant
CREATE POLICY "athletes_select_own_tenant"
ON athletes FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);

-- PASO 2C: CREAR POLICY - Users actualizar solo su propio record
CREATE POLICY "athletes_update_own_record"
ON athletes FOR UPDATE
USING (
  id = auth.uid()
  OR
  (
    SELECT is_admin FROM athletes WHERE id = auth.uid()
  ) = true
);
