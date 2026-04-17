-- PASO 4: ENABLE RLS EN WORKOUT_ASSIGNMENTS
ALTER TABLE workout_assignments ENABLE ROW LEVEL SECURITY;

-- PASO 5: POLICY - Users ver solo assignments de su tenant
CREATE POLICY "workout_assignments_select_own_tenant"
ON workout_assignments FOR SELECT
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);

-- PASO 6: POLICY - Users actualizar solo en su tenant
CREATE POLICY "workout_assignments_update_own_tenant"
ON workout_assignments FOR UPDATE
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);
