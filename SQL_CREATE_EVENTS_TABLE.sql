-- ============================================
-- CREAR TABLA EVENTS CON RLS
-- ============================================

-- Crear tabla events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE,
  location VARCHAR(255),
  distance VARCHAR(50),
  capacity INT,
  status VARCHAR(50) DEFAULT 'active',
  created_by UUID REFERENCES athletes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comentarios
COMMENT ON TABLE events IS 'Running events created by teams (races, competitions)';
COMMENT ON COLUMN events.tenant_id IS 'Team that owns this event';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- ============================================
-- HABILITAR RLS EN EVENTS
-- ============================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Coach ve solo eventos de su tenant
CREATE POLICY "Events visible only to their tenant"
  ON events
  FOR SELECT
  USING (tenant_id = (
    SELECT tenant_id FROM athletes 
    WHERE id = auth.uid()
  ));

-- Policy: Coach crea eventos solo en su tenant
CREATE POLICY "Events creatable only in own tenant"
  ON events
  FOR INSERT
  WITH CHECK (tenant_id = (
    SELECT tenant_id FROM athletes 
    WHERE id = auth.uid()
  ));

-- Policy: Coach actualiza solo eventos de su tenant
CREATE POLICY "Events updateable only in own tenant"
  ON events
  FOR UPDATE
  USING (tenant_id = (
    SELECT tenant_id FROM athletes 
    WHERE id = auth.uid()
  ));

-- ============================================
-- ACTUALIZAR EVENT_REGISTRATIONS
-- ============================================

-- Agregar relaciones a event_registrations
ALTER TABLE event_registrations 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES teams(id) ON DELETE CASCADE;

-- Comentarios
COMMENT ON COLUMN event_registrations.event_id IS 'Event this registration belongs to';
COMMENT ON COLUMN event_registrations.tenant_id IS 'Team that created this event';

-- Índices
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_tenant_id ON event_registrations(tenant_id);

-- ============================================
-- HABILITAR RLS EN EVENT_REGISTRATIONS
-- ============================================

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Registrations visible only to their tenant
CREATE POLICY "Event registrations visible only to their tenant"
  ON event_registrations
  FOR SELECT
  USING (tenant_id = (
    SELECT tenant_id FROM athletes 
    WHERE id = auth.uid()
  ));

-- Policy: Insert registrations only in own tenant
CREATE POLICY "Event registrations creatable only in own tenant"
  ON event_registrations
  FOR INSERT
  WITH CHECK (tenant_id = (
    SELECT tenant_id FROM athletes 
    WHERE id = auth.uid()
  ));

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que RLS está habilitado
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('events', 'event_registrations')
ORDER BY relname;

-- Debería retornar 2 filas, ambas con relrowsecurity = true
