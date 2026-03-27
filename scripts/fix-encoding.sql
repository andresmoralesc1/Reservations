-- ==========================================
-- FIX ENCODING IN SERVICES
-- Ejecutar esto en Supabase SQL Editor
-- https://supabase.com/dashboard
-- ==========================================

-- Primero veamos el estado actual
SELECT
  id,
  name,
  description,
  updated_at
FROM services
ORDER BY updated_at DESC;

-- Actualizar encoding de caracteres corruptos
UPDATE services
SET
  description = REPLACE(description, 's_bados', 'sábados'),
  description = REPLACE(description, 'S_bados', 'Sábados'),
  description = REPLACE(description, 's\ufffdbados', 'sábados'),
  name = REPLACE(name, 's_bados', 'sábados'),
  name = REPLACE(name, 'S_bados', 'Sábados'),
  updated_at = NOW()
WHERE description LIKE '%s_%'
   OR description LIKE '%S_%'
   OR name LIKE '%s_%'
   OR name LIKE '%S_%';

-- Verificar el resultado
SELECT
  id,
  name,
  description,
  updated_at
FROM services
ORDER BY updated_at DESC;
