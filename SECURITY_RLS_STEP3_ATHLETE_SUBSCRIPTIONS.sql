-- PASO 3: RLS PARA ATHLETE_SUBSCRIPTIONS
ALTER TABLE athlete_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users solo ver suscripciones de su tenant
CREATE POLICY "athlete_subscriptions_select_own_tenant"
ON athlete_subscriptions FOR SELECT
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);

-- Users solo actualizar en su tenant
CREATE POLICY "athlete_subscriptions_update_own_tenant"
ON athlete_subscriptions FOR UPDATE
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);
