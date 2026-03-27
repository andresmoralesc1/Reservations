-- ==========================================
-- FIX TIMEZONE FOR RESTAURANTS
-- Ejecutar esto en Supabase SQL Editor
-- https://supabase.com/dashboard
-- ==========================================

-- Primero veamos el estado actual
SELECT
  id,
  name,
  timezone,
  updated_at
FROM restaurants
ORDER BY updated_at DESC;

-- Actualizar timezone de America/Bogota a Europe/Madrid
UPDATE restaurants
SET
  timezone = 'Europe/Madrid',
  updated_at = NOW()
WHERE timezone = 'America/Bogota'
   OR timezone IS NULL;

-- Verificar el resultado
SELECT
  id,
  name,
  timezone,
  updated_at
FROM restaurants
ORDER BY updated_at DESC;
