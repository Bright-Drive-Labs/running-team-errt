-- ============================================
-- MISSING RLS POLICIES - DELETE & INSERT
-- ============================================
-- Execute this in Supabase SQL Editor
-- These complete the RLS coverage for all 4 tables

-- ============================================
-- ATHLETES TABLE - Missing Policies
-- ============================================

-- DELETE: Only admins can delete athletes from their tenant
CREATE POLICY "athletes_delete_admin_only" ON athletes FOR DELETE
USING (
  (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
  AND tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
);

-- INSERT: New athletes must be created in own tenant
CREATE POLICY "athletes_insert_own_tenant" ON athletes FOR INSERT
WITH CHECK (
  tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  OR (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);

-- ============================================
-- EVENTS TABLE - Missing Policy
-- ============================================

-- DELETE: Only tenant admins can delete events
CREATE POLICY "events_delete_own_tenant" ON events FOR DELETE
USING (
  tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  AND (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);

-- ============================================
-- EVENT_REGISTRATIONS TABLE - Missing Policy
-- ============================================

-- DELETE: Admins can delete registrations in their tenant
CREATE POLICY "event_registrations_delete_own_tenant" ON event_registrations FOR DELETE
USING (
  tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  AND (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);

-- ============================================
-- WORKOUT_ASSIGNMENTS TABLE - Missing Policy
-- ============================================

-- DELETE: Coaches can delete assignments of their athletes
CREATE POLICY "workout_assignments_delete_own_tenant" ON workout_assignments FOR DELETE
USING (
  athlete_id IN (
    SELECT id FROM athletes
    WHERE tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())
  )
  AND (SELECT is_admin FROM athletes WHERE id = auth.uid()) = true
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify all policies are created:

-- Check all RLS policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'events', 'event_registrations', 'workout_assignments')
ORDER BY tablename, policyname;

-- Count policies by table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'events', 'event_registrations', 'workout_assignments')
GROUP BY tablename
ORDER BY tablename;

-- Should show:
-- athletes: 4 policies (select, update, insert, delete)
-- events: 4 policies (select, insert, update, delete)
-- event_registrations: 4 policies (select, insert, update, delete)
-- workout_assignments: 4 policies (select, update, delete, insert if added)
