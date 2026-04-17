-- ============================================================================
-- AUDIT LOGS TABLE - Multi-Tenant Secure Audit Trail
-- ============================================================================
-- Created: 2026-04-15
-- Purpose: Track all critical actions in the system with tenant isolation
-- Security: RLS enabled + Multi-tenant isolation via tenant_id
-- ============================================================================

-- 1. CREATE AUDIT_LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  -- Identificador único
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- QUÉ sucedió
  action VARCHAR(50) NOT NULL,        -- 'WORKOUT_PUSHED', 'KEY_STORED', 'ATHLETE_LOGIN', etc
  entity_type VARCHAR(50) NOT NULL,   -- 'athlete', 'workout', 'tenant', 'api_key'
  entity_id UUID,                      -- ID del objeto afectado

  -- QUIÉN lo hizo
  actor_id VARCHAR(100) NOT NULL,     -- telegram_user_id, google_user_id, o system
  actor_type VARCHAR(50) NOT NULL,    -- 'TELEGRAM_BOT', 'FRONTEND', 'SYSTEM', 'API'
  actor_name VARCHAR(150),             -- Nombre legible del actor

  -- CUÁNDO
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- DETALLES (changeset)
  before_values JSONB,                 -- Estado anterior (si aplica)
  after_values JSONB,                  -- Estado nuevo (si aplica)

  -- RESULTADO
  status VARCHAR(20) NOT NULL,         -- 'SUCCESS', 'FAILED', 'DENIED'
  error_message TEXT,                  -- Mensaje de error (si aplica)

  -- MULTI-TENANT (CRÍTICO 🔐)
  tenant_id UUID NOT NULL,

  -- Constraints
  CONSTRAINT fk_audit_tenant FOREIGN KEY (tenant_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Documentación de tabla
COMMENT ON TABLE audit_logs IS
'Audit trail for all critical actions. Multi-tenant isolated. Immutable records.
Each action is timestamped and includes context about the actor, entity, and outcome.';

COMMENT ON COLUMN audit_logs.id IS
'Unique identifier for this audit log entry';

COMMENT ON COLUMN audit_logs.action IS
'Type of action performed: WORKOUT_PUSHED, KEY_STORED, ATHLETE_LOGIN, etc.';

COMMENT ON COLUMN audit_logs.entity_type IS
'Type of entity affected: athlete, workout, tenant, api_key, etc.';

COMMENT ON COLUMN audit_logs.entity_id IS
'UUID of the specific entity affected (if applicable)';

COMMENT ON COLUMN audit_logs.actor_id IS
'Identifier of who performed the action: telegram_user_id, user_id, or "SYSTEM"';

COMMENT ON COLUMN audit_logs.actor_type IS
'Category of actor: TELEGRAM_BOT, FRONTEND, SYSTEM, API, MOBILE_APP, etc.';

COMMENT ON COLUMN audit_logs.actor_name IS
'Human-readable name of the actor (e.g., "Daniel Pérez", "Telegram Bot")';

COMMENT ON COLUMN audit_logs.created_at IS
'Timestamp when action was recorded (UTC)';

COMMENT ON COLUMN audit_logs.before_values IS
'JSONB snapshot of entity state BEFORE the action (if applicable)';

COMMENT ON COLUMN audit_logs.after_values IS
'JSONB snapshot of entity state AFTER the action (if applicable)';

COMMENT ON COLUMN audit_logs.status IS
'Outcome: SUCCESS, FAILED, DENIED, ROLLED_BACK';

COMMENT ON COLUMN audit_logs.error_message IS
'Error details if status=FAILED (null if successful)';

COMMENT ON COLUMN audit_logs.tenant_id IS
'CRITICAL: Every log belongs to a team. RLS enforces isolation.
Coach from ERRT sees only logs where tenant_id=ERRT_team_id.';

-- ============================================================================
-- 2. CREATE INDEXES (Performance)
-- ============================================================================

-- Index: búsquedas por tenant (RLS check)
CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_logs(tenant_id);

-- Index: búsquedas por timestamp (últimas acciones)
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(created_at DESC);

-- Index: búsquedas por actor (quién hizo qué)
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);

-- Index: búsquedas por acción + tenant (qué pasó en este team)
CREATE INDEX IF NOT EXISTS idx_audit_action_tenant ON audit_logs(action, tenant_id);

-- Index: búsquedas por resultado (solo errores)
CREATE INDEX IF NOT EXISTS idx_audit_status ON audit_logs(status);

-- Index: búsqueda por tenant + timestamp (auditoría rápida de team)
CREATE INDEX IF NOT EXISTS idx_audit_tenant_timestamp ON audit_logs(tenant_id, created_at DESC);

-- Index: búsqueda por entity (todos los cambios en un recurso)
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

COMMENT ON INDEX idx_audit_tenant IS 'Critical for RLS filtering';
COMMENT ON INDEX idx_audit_timestamp IS 'For "recent actions" queries';
COMMENT ON INDEX idx_audit_action_tenant IS 'For "what happened in this team" audits';
COMMENT ON INDEX idx_audit_status IS 'For error tracking and debugging';
COMMENT ON INDEX idx_audit_tenant_timestamp IS 'Combined query: team audit trail';
COMMENT ON INDEX idx_audit_entity IS 'For "complete history of resource" queries';

-- ============================================================================
-- 3. ENABLE RLS (Row Level Security)
-- ============================================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE RLS POLICY - Multi-Tenant Isolation
-- ============================================================================

-- Policy: Solo puedes ver logs de tu tenant
CREATE POLICY "Logs visible only to own tenant"
  ON audit_logs
  FOR SELECT
  USING (
    tenant_id = (
      SELECT tenant_id FROM athletes
      WHERE id = auth.uid()
      LIMIT 1
    )
  );

COMMENT ON POLICY "Logs visible only to own tenant" ON audit_logs IS
'Enforces multi-tenant isolation. Each coach sees only their team logs.
- Coach of ERRT sees: logs where tenant_id = ERRT team_id
- Coach of runners58 sees: logs where tenant_id = runners58 team_id
- Admin/superuser requires special handling (via RLS bypass or admin query)
- Query: SELECT * FROM audit_logs WHERE tenant_id = (SELECT tenant_id FROM athletes WHERE id = auth.uid())';

-- Policy: System can insert logs (for triggers and backend)
CREATE POLICY "Allow system inserts"
  ON audit_logs
  FOR INSERT
  WITH CHECK (
    -- Validate tenant exists
    EXISTS (SELECT 1 FROM teams WHERE id = tenant_id)
  );

COMMENT ON POLICY "Allow system inserts" ON audit_logs IS
'Allows backend and triggers to insert audit logs. Validates tenant_id exists.';

-- ============================================================================
-- 5. CREATE HELPER FUNCTION: log_action()
-- ============================================================================

CREATE OR REPLACE FUNCTION log_action(
  p_tenant_id UUID,
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID DEFAULT NULL,
  p_actor_id VARCHAR DEFAULT 'SYSTEM',
  p_actor_type VARCHAR DEFAULT 'SYSTEM',
  p_actor_name VARCHAR DEFAULT 'System Process',
  p_before_values JSONB DEFAULT NULL,
  p_after_values JSONB DEFAULT NULL,
  p_status VARCHAR DEFAULT 'SUCCESS',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_tenant_exists BOOLEAN;
BEGIN
  -- Validar tenant existe
  SELECT EXISTS(SELECT 1 FROM teams WHERE id = p_tenant_id)
  INTO v_tenant_exists;

  IF NOT v_tenant_exists THEN
    RAISE EXCEPTION 'Invalid tenant_id: % (does not exist in teams table)', p_tenant_id;
  END IF;

  -- Validar action no está vacío
  IF p_action IS NULL OR p_action = '' THEN
    RAISE EXCEPTION 'action cannot be null or empty';
  END IF;

  -- Validar entity_type no está vacío
  IF p_entity_type IS NULL OR p_entity_type = '' THEN
    RAISE EXCEPTION 'entity_type cannot be null or empty';
  END IF;

  -- Insertar log
  INSERT INTO audit_logs (
    action, entity_type, entity_id,
    actor_id, actor_type, actor_name,
    before_values, after_values,
    status, error_message,
    tenant_id
  )
  VALUES (
    p_action, p_entity_type, p_entity_id,
    p_actor_id, p_actor_type, p_actor_name,
    p_before_values, p_after_values,
    p_status, p_error_message,
    p_tenant_id
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_action IS
'Helper function to safely insert audit logs with tenant validation.
Used by backend to log actions. Prevents invalid tenant_id records.

Params:
  p_tenant_id: UUID of the team (required)
  p_action: Action name (required, e.g., "WORKOUT_PUSHED")
  p_entity_type: Type of entity affected (required, e.g., "workout")
  p_entity_id: UUID of the affected entity (optional)
  p_actor_id: Who performed action (default: "SYSTEM")
  p_actor_type: Category of actor (default: "SYSTEM")
  p_actor_name: Human-readable name (default: "System Process")
  p_before_values: JSONB snapshot before (optional)
  p_after_values: JSONB snapshot after (optional)
  p_status: "SUCCESS", "FAILED", "DENIED" (default: "SUCCESS")
  p_error_message: Error details if failed (optional)

Returns: UUID of the created log entry

Example:
  SELECT log_action(
    ''errt-team-id''::UUID,
    ''WORKOUT_PUSHED'',
    ''workout'',
    ''workout-id''::UUID,
    ''telegram:123456'',
    ''TELEGRAM_BOT'',
    ''Daniel Pérez'',
    NULL,
    ''{\"name\": \"5x1km\", \"status\": \"published\"}''::JSONB,
    ''SUCCESS'',
    NULL
  );';

ALTER FUNCTION log_action OWNER TO postgres;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

-- Allow authenticated users to select their own tenant logs
GRANT SELECT ON audit_logs TO authenticated;

-- Allow service role to insert logs (backend)
GRANT INSERT ON audit_logs TO service_role;

-- Allow anon to read (if needed) - restrict in RLS policy
GRANT SELECT ON audit_logs TO anon;

-- Grant execute on helper function to all authenticated users
GRANT EXECUTE ON FUNCTION log_action(UUID, VARCHAR, VARCHAR, UUID, VARCHAR, VARCHAR, VARCHAR, JSONB, JSONB, VARCHAR, TEXT)
  TO authenticated, service_role;
