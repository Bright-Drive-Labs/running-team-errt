-- PASO 1: VERIFICAR QÚALES TABLAS EXISTEN
-- Ejecuta esto primero para ver qué tienes

SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
