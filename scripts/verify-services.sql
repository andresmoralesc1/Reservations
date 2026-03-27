-- ==========================================
-- VER TODOS LOS SERVICIOS
-- Ejecutar esto PRIMERO para ver qué tienes
-- ==========================================

SELECT
  id,
  name,
  description,
  is_active,
  service_type,
  day_type,
  start_time,
  end_time
FROM services
ORDER BY name;
