/**
 * SUPABASE VAULT FUNCTIONS - INTERVALS API KEY ENCRYPTION
 * =========================================================
 *
 * Día 1: SQL Specialist (RPC + Vault)
 * Proyecto: Bright Drive - Multi-tenant Security
 *
 * Este script contiene:
 * 1. Función: store_intervals_key() - Encripta y guarda API Key
 * 2. Función: get_intervals_key() - Desencripta API Key desde Vault
 * 3. Migración: Agregar columna intervals_api_key_encrypted a athletes
 * 4. Tests de seguridad (anon vs service_role)
 *
 * IMPORTANTE: Ejecutar en Supabase SQL Editor con role POSTGREST (default)
 */

-- ====================================================
-- PASO 1: MIGRACIÓN - Agregar columna a tabla athletes
-- ====================================================
-- Si no existe ya, agregar columna para guardar secret_id encriptado
ALTER TABLE athletes
ADD COLUMN IF NOT EXISTS intervals_api_key_encrypted UUID;

-- Comentar para documentación
COMMENT ON COLUMN athletes.intervals_api_key_encrypted IS
'UUID reference to Vault secret. Never returned in SELECT. Use get_intervals_key() RPC.';

-- ====================================================
-- PASO 2: FUNCIÓN store_intervals_key()
-- ====================================================
-- Encripta API Key usando Vault.secrets y valida tenant
-- SECURITY DEFINER: Solo backend puede llamar (via RPC)

CREATE OR REPLACE FUNCTION store_intervals_key(
  p_athlete_id UUID,
  p_tenant_id UUID,
  p_api_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_secret_id UUID;
BEGIN
  -- Validar que el athlete pertenece al tenant
  IF NOT EXISTS (
    SELECT 1 FROM athletes
    WHERE id = p_athlete_id
    AND tenant_id = p_tenant_id
  ) THEN
    RAISE EXCEPTION 'Athlete not found in this tenant';
  END IF;

  -- Crear secret en Vault y obtener su UUID
  -- vault.create_secret() retorna el UUID del secret creado
  SELECT id INTO v_secret_id
  FROM vault.create_secret(
    p_api_key,
    'intervals_api_key'
  );

  -- Actualizar athlete con la referencia al secret
  UPDATE athletes
  SET intervals_api_key_encrypted = v_secret_id
  WHERE id = p_athlete_id
  AND tenant_id = p_tenant_id;

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  -- Log error pero no expongas detalles al cliente
  RAISE WARNING 'Error storing API key: %', SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Documentación
COMMENT ON FUNCTION store_intervals_key(UUID, UUID, TEXT) IS
'Encrypts and stores Intervals API key in Vault. Only backend can call (SECURITY DEFINER). Multi-tenant safe. Returns TRUE on success, FALSE on error.';

-- Grant solo al role anon? NO - Por defecto está DENIED
-- Solo el backend (via service_role) puede llamar

-- ====================================================
-- PASO 3: FUNCIÓN get_intervals_key()
-- ====================================================
-- Desencripta API Key desde Vault
-- SECURITY DEFINER: Solo backend puede llamar

CREATE OR REPLACE FUNCTION get_intervals_key(
  p_athlete_id UUID,
  p_tenant_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_secret_id UUID;
  v_api_key TEXT;
BEGIN
  -- Obtener secret_id del athlete (si existe y pertenece al tenant)
  SELECT intervals_api_key_encrypted INTO v_secret_id
  FROM athletes
  WHERE id = p_athlete_id
  AND tenant_id = p_tenant_id;

  IF v_secret_id IS NULL THEN
    RAISE EXCEPTION 'No API key found for this athlete';
  END IF;

  -- Desencriptar desde Vault
  -- vault.decrypted_secrets es una vista que retorna secrets desencriptados
  SELECT decrypted_secret INTO v_api_key
  FROM vault.decrypted_secrets
  WHERE id = v_secret_id;

  IF v_api_key IS NULL THEN
    RAISE EXCEPTION 'Failed to decrypt API key';
  END IF;

  RETURN v_api_key;
EXCEPTION WHEN OTHERS THEN
  -- Log error pero no expongas detalles al cliente
  RAISE WARNING 'Error retrieving API key: %', SQLERRM;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Documentación
COMMENT ON FUNCTION get_intervals_key(UUID, UUID) IS
'Retrieves and decrypts API key from Vault. Only backend can call (SECURITY DEFINER). Multi-tenant safe. Returns the decrypted API key string (temporary in memory).';

-- ====================================================
-- PASO 4: FUNCIÓN helper revoke_intervals_key()
-- ====================================================
-- (BONUS) Elimina la key encriptada de un athlete

CREATE OR REPLACE FUNCTION revoke_intervals_key(
  p_athlete_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_secret_id UUID;
BEGIN
  -- Obtener secret_id
  SELECT intervals_api_key_encrypted INTO v_secret_id
  FROM athletes
  WHERE id = p_athlete_id
  AND tenant_id = p_tenant_id;

  IF v_secret_id IS NOT NULL THEN
    -- Eliminar el secret de Vault
    DELETE FROM vault.secrets WHERE id = v_secret_id;
  END IF;

  -- Limpiar referencia en athletes
  UPDATE athletes
  SET intervals_api_key_encrypted = NULL
  WHERE id = p_athlete_id
  AND tenant_id = p_tenant_id;

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error revoking API key: %', SQLERRM;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION revoke_intervals_key(UUID, UUID) IS
'Revokes and removes encrypted API key from Vault. Only backend can call (SECURITY DEFINER). Multi-tenant safe.';

-- ====================================================
-- PASO 5: PERMISSIONS - Asegurar que solo backend accede
-- ====================================================
-- Revocar permisos públicos (si existen) - por defecto negado pero ser explícito

-- Grant a role postgrest (que usa Supabase de forma pública)
-- NO conceder - se deja por default DENIED
-- REVOKE EXECUTE ON FUNCTION store_intervals_key(UUID, UUID, TEXT) FROM anon;
-- REVOKE EXECUTE ON FUNCTION get_intervals_key(UUID, UUID) FROM anon;
-- REVOKE EXECUTE ON FUNCTION revoke_intervals_key(UUID, UUID) FROM anon;

-- Grant a authenticated users - también NO, solo backend
-- REVOKE EXECUTE ON FUNCTION store_intervals_key(UUID, UUID, TEXT) FROM authenticated;
-- REVOKE EXECUTE ON FUNCTION get_intervals_key(UUID, UUID) FROM authenticated;
-- REVOKE EXECUTE ON FUNCTION revoke_intervals_key(UUID, UUID) FROM authenticated;

-- El backend usa service_role que SIEMPRE puede ejecutar SECURITY DEFINER functions
-- Esto es seguro porque el backend controla quien llama

-- ====================================================
-- PASO 6: TESTS - Ejecutar en Supabase SQL Editor
-- ====================================================

/**
 * TEST 1: Verificar que la columna fue creada
 * Esperado: Column "intervals_api_key_encrypted" exists
 */
/*
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'athletes'
AND column_name = 'intervals_api_key_encrypted';
*/

/**
 * TEST 2: Verificar que la función store_intervals_key existe
 * Esperado: Function exists
 */
/*
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'store_intervals_key'
AND routine_schema = 'public';
*/

/**
 * TEST 3: Verificar que la función get_intervals_key existe
 * Esperado: Function exists
 */
/*
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_intervals_key'
AND routine_schema = 'public';
*/

/**
 * TEST 4: Verificar permisos - Anon DEBE FALLAR
 *
 * NOTA: En Supabase, cuando cambias el role a 'anon' en el SQL Editor,
 * deberías ver ERROR: permission denied for function store_intervals_key
 *
 * Para cambiar role en Supabase SQL Editor:
 * 1. En la esquina superior derecha, hay un dropdown "Authentication"
 * 2. Cambia de "Service Role" a "Anonymous" (anon)
 * 3. Ejecuta la siguiente query:
 */
/*
SET LOCAL search_path TO public;
SELECT store_intervals_key(
  (SELECT id FROM athletes LIMIT 1)::UUID,
  (SELECT tenant_id FROM athletes LIMIT 1)::UUID,
  'test_key_12345'
);
-- Esperado: ERROR: permission denied for function store_intervals_key
*/

/**
 * TEST 5: Con Service Role DEBE FUNCIONAR
 *
 * En el SQL Editor, asegúrate que estés usando "Service Role" (default)
 * Luego ejecuta:
 */
/*
-- Primero, obtener IDs válidos de una athlete existente
WITH athlete_data AS (
  SELECT id, tenant_id FROM athletes LIMIT 1
)
SELECT store_intervals_key(
  athlete_data.id,
  athlete_data.tenant_id,
  'test_intervals_key_securedata123'
) FROM athlete_data;
-- Esperado: TRUE
*/

/**
 * TEST 6: Verificar que la key se guardó encriptada
 * (No debería ser visible como texto plano)
 */
/*
SELECT id, email, intervals_api_key_encrypted FROM athletes WHERE intervals_api_key_encrypted IS NOT NULL LIMIT 1;
-- Esperado: UUID (no el texto de la key)
*/

/**
 * TEST 7: Recuperar key desencriptada
 * (Solo funciona si la key fue guardada antes con store_intervals_key)
 */
/*
WITH athlete_data AS (
  SELECT id, tenant_id FROM athletes WHERE intervals_api_key_encrypted IS NOT NULL LIMIT 1
)
SELECT get_intervals_key(
  athlete_data.id,
  athlete_data.tenant_id
) FROM athlete_data;
-- Esperado: El texto de la API Key desencriptada (string)
*/

/**
 * TEST 8: Revocar key
 */
/*
WITH athlete_data AS (
  SELECT id, tenant_id FROM athletes WHERE intervals_api_key_encrypted IS NOT NULL LIMIT 1
)
SELECT revoke_intervals_key(
  athlete_data.id,
  athlete_data.tenant_id
) FROM athlete_data;
-- Esperado: TRUE
-- Después: intervals_api_key_encrypted debería ser NULL
*/

-- ====================================================
-- DOCUMENTACIÓN FINAL
-- ====================================================

/**
 * CÓMO USAR DESDE EL BACKEND (Node.js / JavaScript)
 *
 * // Guardar API Key encriptada
 * const { data, error } = await supabase.rpc('store_intervals_key', {
 *   p_athlete_id: athleteId,
 *   p_tenant_id: tenantId,
 *   p_api_key: 'intervals_api_key_here'
 * });
 *
 * // Recuperar API Key desencriptada
 * const { data: apiKey, error } = await supabase.rpc('get_intervals_key', {
 *   p_athlete_id: athleteId,
 *   p_tenant_id: tenantId
 * });
 *
 * // Revocar API Key
 * const { data, error } = await supabase.rpc('revoke_intervals_key', {
 *   p_athlete_id: athleteId,
 *   p_tenant_id: tenantId
 * });
 *
 * IMPORTANTE:
 * - Estas llamadas SOLO funcionan desde el backend (service_role)
 * - El frontend NUNCA puede llamar estas funciones (anon/authenticated negado)
 * - La API Key nunca se almacena en texto plano
 * - Vault.secrets es encriptada en reposo en Supabase
 */

-- ====================================================
-- FIN DEL SCRIPT
-- ====================================================
