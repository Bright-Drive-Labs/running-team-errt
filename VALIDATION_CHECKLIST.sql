/**
 * VALIDATION CHECKLIST - Run after deploying supabase_functions_vault.sql
 * ========================================================================
 *
 * Este script verifica que todas las funciones y cambios de BD se ejecutaron correctamente.
 * Cópialo y ejecuta en Supabase SQL Editor después de ejecutar supabase_functions_vault.sql
 *
 * Resultado esperado: Todas las queries retornan datos (no errores)
 */

-- =======================================================
-- VALIDACIÓN 1: Verificar que la columna fue creada
-- =======================================================
-- Expected: 1 row with column_name = 'intervals_api_key_encrypted', data_type = 'uuid'

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'athletes'
AND column_name = 'intervals_api_key_encrypted';

-- Result format:
-- column_name                    | data_type | is_nullable
-- ----------------------------------------------------------
-- intervals_api_key_encrypted    | uuid      | YES


-- =======================================================
-- VALIDACIÓN 2: Verificar que la función store_intervals_key existe
-- =======================================================
-- Expected: 1 row with routine_name = 'store_intervals_key'

SELECT
  routine_name,
  routine_type,
  routine_schema,
  data_type
FROM information_schema.routines
WHERE routine_name = 'store_intervals_key'
AND routine_schema = 'public';

-- Result format:
-- routine_name        | routine_type | routine_schema | data_type
-- ---------------------------------------------------------------
-- store_intervals_key | FUNCTION     | public         | boolean


-- =======================================================
-- VALIDACIÓN 3: Verificar que la función get_intervals_key existe
-- =======================================================
-- Expected: 1 row with routine_name = 'get_intervals_key'

SELECT
  routine_name,
  routine_type,
  routine_schema,
  data_type
FROM information_schema.routines
WHERE routine_name = 'get_intervals_key'
AND routine_schema = 'public';

-- Result format:
-- routine_name        | routine_type | routine_schema | data_type
-- ---------------------------------------------------------------
-- get_intervals_key   | FUNCTION     | public         | text


-- =======================================================
-- VALIDACIÓN 4: Verificar que la función revoke_intervals_key existe
-- =======================================================
-- Expected: 1 row with routine_name = 'revoke_intervals_key'

SELECT
  routine_name,
  routine_type,
  routine_schema,
  data_type
FROM information_schema.routines
WHERE routine_name = 'revoke_intervals_key'
AND routine_schema = 'public';

-- Result format:
-- routine_name          | routine_type | routine_schema | data_type
-- ------------------------------------------------------------------
-- revoke_intervals_key  | FUNCTION     | public         | boolean


-- =======================================================
-- VALIDACIÓN 5: Verificar que todas las 3 funciones existen
-- =======================================================
-- Expected: 3 rows

SELECT
  count(*) as function_count,
  'Functions created successfully' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'store_intervals_key',
  'get_intervals_key',
  'revoke_intervals_key'
);

-- Result format:
-- function_count | status
-- -------------------------------------------------------
--      3         | Functions created successfully


-- =======================================================
-- VALIDACIÓN 6: Verificar seguridad - SECURITY DEFINER
-- =======================================================
-- Expected: 3 rows with security_type = 'DEFINER'

SELECT
  routine_name,
  routine_schema,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'store_intervals_key',
  'get_intervals_key',
  'revoke_intervals_key'
)
ORDER BY routine_name;

-- Result format:
-- routine_name          | routine_schema | security_type
-- -------------------------------------------------------
-- get_intervals_key     | public         | DEFINER
-- revoke_intervals_key  | public         | DEFINER
-- store_intervals_key   | public         | DEFINER


-- =======================================================
-- VALIDACIÓN 7: Ver comentarios de función (documentation)
-- =======================================================
-- Expected: 3 rows con comentarios de las funciones

SELECT
  routine_name,
  routine_schema,
  routine_comment
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'store_intervals_key',
  'get_intervals_key',
  'revoke_intervals_key'
)
AND routine_comment IS NOT NULL
ORDER BY routine_name;

-- Result format:
-- routine_name        | routine_schema | routine_comment
-- ---------------------------------------------------------------
-- get_intervals_key   | public         | Retrieves and decrypts API key from Vault...
-- store_intervals_key | public         | Encrypts and stores Intervals API key in Vault...
-- ...


-- =======================================================
-- VALIDACIÓN 8: Ver comentario de la columna
-- =======================================================
-- Expected: 1 row con comentario de la columna

SELECT
  column_name,
  table_name,
  col_description(
    (table_schema||'.'||table_name)::regclass::oid,
    ordinal_position
  ) as column_comment
FROM information_schema.columns
WHERE table_name = 'athletes'
AND column_name = 'intervals_api_key_encrypted';

-- Result format:
-- column_name                    | table_name | column_comment
-- ---------------------------------------------------------------
-- intervals_api_key_encrypted    | athletes   | UUID reference to Vault secret...


-- =======================================================
-- VALIDACIÓN 9: SECURITY TEST - Intentar llamar con anon role
-- =======================================================
-- IMPORTANTE: Cambiar Authentication a "Anonymous" en Supabase SQL Editor ANTES de correr esto
-- Expected: ERROR: permission denied for function store_intervals_key

/*
SELECT store_intervals_key(
  '00000000-0000-0000-0000-000000000000'::UUID,
  '00000000-0000-0000-0000-000000000000'::UUID,
  'test_key'
);

-- Esperado resultado:
-- ERROR: permission denied for function store_intervals_key
-- (Esto es CORRECTO - significa que la seguridad funciona)
*/


-- =======================================================
-- VALIDACIÓN 10: SECURITY TEST - Llamar con service role
-- =======================================================
-- IMPORTANTE: Cambiar Authentication de vuelta a "Service Role" ANTES de correr esto
-- Expected: TRUE (si existe athlete con esos IDs) o FALSE (si validation falla)

/*
WITH test_athlete AS (
  SELECT
    id,
    tenant_id
  FROM athletes
  WHERE tenant_id IS NOT NULL
  LIMIT 1
)
SELECT
  store_intervals_key(
    test_athlete.id,
    test_athlete.tenant_id,
    'test_api_key_validation'
  ) as result
FROM test_athlete;

-- Esperado resultado:
-- result
-- ------
-- t      (true - éxito)
--
-- Si no hay athletes: (0 rows) - es normal
*/


-- =======================================================
-- RESUMEN: Checklist de validación
-- =======================================================
-- Copia esta tabla y marca cuando cada validación pase:

/*
VALIDATION CHECKLIST:

[ ] VAL 1: Columna intervals_api_key_encrypted existe (type: UUID)
[ ] VAL 2: Función store_intervals_key existe
[ ] VAL 3: Función get_intervals_key existe
[ ] VAL 4: Función revoke_intervals_key existe
[ ] VAL 5: Todas las 3 funciones existen (count = 3)
[ ] VAL 6: Las 3 funciones tienen SECURITY DEFINER
[ ] VAL 7: Las 3 funciones tienen comentarios documentados
[ ] VAL 8: La columna tiene comentario documentado
[ ] VAL 9: Anon role FALLA con "permission denied" (seguridad funciona)
[ ] VAL 10: Service role PUEDE llamar funciones (retorna boolean)

Si todos los checks pasan ✅, la instalación está correcta.
*/


-- =======================================================
-- INFORMACIÓN ÚTIL
-- =======================================================

-- Ver definición de la función
SELECT pg_get_functiondef('public.store_intervals_key(UUID, UUID, TEXT)'::regprocedure);

-- Ver si Vault está disponible
SELECT * FROM vault.secrets LIMIT 1; -- Si error = Vault no disponible (upgrade a Pro+)

-- Ver estadísticas de la tabla athletes
SELECT count(*) as total_athletes FROM athletes;

-- Ver si hay athletes con keys almacenadas
SELECT count(*) as athletes_with_keys
FROM athletes
WHERE intervals_api_key_encrypted IS NOT NULL;

-- =======================================================
-- NOTAS FINALES
-- =======================================================

/*
1. Si todas las validaciones pasan, la instalación está completa ✅

2. Para usar desde el backend, ver: backend_integration_example.js

3. Si algo falla, ver: SQL_DEPLOYMENT_GUIDE.md (sección Troubleshooting)

4. Las funciones usan Vault nativo de Supabase (Pro plan required)

5. Multi-tenant validation es crítico - nunca accedas datos de otro tenant
*/
