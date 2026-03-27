-- ==========================================
-- FIX ALL BUGS - TIMEZONE & ENCODING
-- Ejecutar TODO en Supabase SQL Editor
-- https://supabase.com/dashboard
-- ==========================================

-- ==========================================
-- PARTE 1: TIMEZONE FIX
-- ==========================================

-- Verificar estado actual del timezone
SELECT
  'TIMEZONE ANTES' as info,
  id,
  name,
  timezone,
  updated_at
FROM restaurants
ORDER BY updated_at DESC;

-- Actualizar timezone
UPDATE restaurants
SET
  timezone = 'Europe/Madrid',
  updated_at = NOW()
WHERE timezone = 'America/Bogota'
   OR timezone IS NULL;

-- Verificar resultado del timezone
SELECT
  'TIMEZONE DESPUÉS' as info,
  id,
  name,
  timezone,
  updated_at
FROM restaurants
ORDER BY updated_at DESC;

-- ==========================================
-- PARTE 2: ENCODING FIX
-- ==========================================

-- Verificar estado actual de encoding
SELECT
  'ENCODING ANTES' as info,
  id,
  name,
  description,
  updated_at
FROM services
ORDER BY updated_at DESC;

-- Actualizar encoding
UPDATE services
SET
  description = REPLACE(description, 's_bados', 'sábados'),
  description = REPLACE(description, 'S_bados', 'Sábados'),
  description = REPLACE(description, 's\ufffdbados', 'sábados'),
  description = REPLACE(description, 's\\bados', 'sábados'),
  name = REPLACE(name, 's_bados', 'sábados'),
  name = REPLACE(name, 'S_bados', 'Sábados'),
  name = REPLACE(name, 's\ufffdbados', 'sábados'),
  name = REPLACE(name, 's\\bados', 'sábados'),
  updated_at = NOW()
WHERE description LIKE '%s_%'
   OR description LIKE '%S_%'
   OR name LIKE '%s_%'
   OR name LIKE '%S_%';

-- Verificar resultado del encoding
SELECT
  'ENCODING DESPUÉS' as info,
  id,
  name,
  description,
  updated_at
FROM services
ORDER BY updated_at DESC;

-- ==========================================
-- RESUMEN FINAL
-- ==========================================

SELECT
  '✅ MIGRACIÓN COMPLETADA' as status,
  'Revisa los resultados arriba' as message;
