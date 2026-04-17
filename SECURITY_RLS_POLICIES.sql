-- ===================================
-- RLS POLICIES FOR CRITICAL TABLES
-- ===================================
-- Execute this in Supabase SQL Editor
-- These policies ensure multi-tenant data isolation

-- 1. ATHLETES TABLE - RLS
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view athletes from their tenant
CREATE POLICY "athletes_select_own_tenant"
ON athletes FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);

-- Policy: Users can only update their own athlete record
CREATE POLICY "athletes_update_own_record"
ON athletes FOR UPDATE
USING (
  id = auth.uid()
  OR
  (
    SELECT is_admin FROM athletes WHERE id = auth.uid()
  ) = true
);

-- Policy: Admins can update any athlete in their tenant
CREATE POLICY "athletes_admin_update"
ON athletes FOR UPDATE
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
  AND
  (
    SELECT is_admin FROM athletes WHERE id = auth.uid()
  ) = true
);

-- 2. WORKOUTS TABLE - RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view workouts from their tenant
CREATE POLICY "workouts_select_own_tenant"
ON workouts FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);

-- Policy: Users can only create workouts in their tenant
CREATE POLICY "workouts_insert_own_tenant"
ON workouts FOR INSERT
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
);

-- Policy: Users can only update their own workouts or if admin
CREATE POLICY "workouts_update_own"
ON workouts FOR UPDATE
USING (
  tenant_id = (
    SELECT tenant_id FROM athletes WHERE id = auth.uid()
  )
  AND (
    created_by = auth.uid()
    OR
    (
      SELECT is_admin FROM athletes WHERE id = auth.uid()
    ) = true
  )
);

-- 3. ATHLETE_SUBSCRIPTIONS TABLE - RLS
ALTER TABLE athlete_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view subscriptions from their tenant
CREATE POLICY "athlete_subscriptions_select_own_tenant"
ON athlete_subscriptions FOR SELECT
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);

-- Policy: Users can only update subscriptions in their tenant
CREATE POLICY "athlete_subscriptions_update_own_tenant"
ON athlete_subscriptions FOR UPDATE
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);

-- 4. WORKOUT_ASSIGNMENTS TABLE - RLS
ALTER TABLE workout_assignments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view assignments from their tenant
CREATE POLICY "workout_assignments_select_own_tenant"
ON workout_assignments FOR SELECT
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);

-- Policy: Users can only update assignments in their tenant
CREATE POLICY "workout_assignments_update_own_tenant"
ON workout_assignments FOR UPDATE
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE tenant_id = (
      SELECT tenant_id FROM athletes WHERE id = auth.uid()
    )
  )
);

-- ===================================
-- VERIFICATION QUERIES
-- ===================================
-- Run these to verify RLS is active:

-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public'
-- AND rowsecurity = true;

-- SELECT * FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('athletes', 'workouts', 'athlete_subscriptions', 'workout_assignments');
