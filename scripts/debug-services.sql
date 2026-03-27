-- ==========================================
-- DIAGNÓSTICO COMPLETO
-- Copia y pega TODO esto en Supabase SQL Editor
-- ==========================================

-- 1. VER TODOS LOS RESTAURANTES
SELECT '🏪 RESTAURANTES' as section, name as nombre, timezone as zona_horaria, phone as telefono, address as direccion
FROM restaurants;

-- 2. VER TODOS LOS SERVICIOS CON DETALLE
SELECT '🍽️ SERVICIOS' as section, name as nombre, description as descripcion, is_active as activo
FROM services
ORDER BY name;

-- 3. BUSCAR SERVICIOS CON TEXTO CORRUPTO
SELECT '❌ POSIBLES ERRORES DE ENCODING' as section,
       name as nombre,
       description as descripcion,
       CASE
         WHEN description LIKE '%s_%' THEN 'Contiene s_ (posible error)'
         WHEN description LIKE '%S_%' THEN 'Contiene S_ (posible error)'
         WHEN description LIKE '%á%' THEN 'Tiene acentos OK'
         WHEN description IS NULL THEN 'Sin descripción'
         ELSE 'Sin errores visibles'
       END as estado
FROM services
ORDER BY name;

-- 4. CONTAR CUÁNTOS SERVICIOS HAY
SELECT '📊 CONTADORES' as section,
       COUNT(*) as total_servicios,
       COUNT(CASE WHEN description IS NOT NULL THEN 1 END) as con_descripcion,
       COUNT(CASE WHEN description IS NULL THEN 1 END) as sin_descripcion,
       COUNT(CASE WHEN description LIKE '%s_%' THEN 1 END) con_posibles_errores
FROM services;
