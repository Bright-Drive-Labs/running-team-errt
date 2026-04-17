-- PASO 1: ENABLE RLS EN ATHLETES
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- PASO 2: POLICY - Users ver solo athletes de su tenant
CREATE POLICY "athletes_select_own_tenant"
ON athletes FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);

-- PASO 3: POLICY - Users actualizar solo su propio record O si es admin
CREATE POLICY "athletes_update_own_record"
ON athletes FOR UPDATE
USING (
  id = auth.uid()
  OR
  (
    SELECT is_admin FROM athletes WHERE id = auth.uid()
  ) = true
);
