-- ============================================
-- PERFORMANCE OPTIMIZATION - Indexes for RLS
-- ============================================
-- Execute this in Supabase SQL Editor
-- These indexes optimize RLS policy evaluation on large datasets

-- Create indexes on tenant_id columns for RLS filtering
CREATE INDEX IF NOT EXISTS idx_athletes_tenant ON athletes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_tenant ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_tenant ON event_registrations(tenant_id);

-- Composite index for workout_assignments filtering
CREATE INDEX IF NOT EXISTS idx_workout_assignments_athlete_tenant
ON workout_assignments(athlete_id, tenant_id);

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_athletes_email ON athletes(email);
CREATE INDEX IF NOT EXISTS idx_athletes_tenant_email ON athletes(tenant_id, email);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- List all new indexes
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'events', 'event_registrations', 'workout_assignments')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check index size
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'events', 'event_registrations', 'workout_assignments')
ORDER BY tablename, indexname;

-- Verify indexes are being used
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
AND tablename IN ('athletes', 'events', 'event_registrations', 'workout_assignments')
ORDER BY idx_scan DESC;
