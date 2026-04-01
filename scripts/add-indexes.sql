-- ============================================================================
-- Optimización de Índices - Reservations System
-- ============================================================================
-- Este script crea índices para optimizar las queries más frecuentes.
-- Usa CREATE INDEX IF NOT EXISTS para ser seguro de ejecutar múltiples veces.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabla: reservations
-- ----------------------------------------------------------------------------

-- idx_reservations_date_restaurant
-- Para filtrar reservas por fecha y restaurante (Dashboard, listas diarias)
CREATE INDEX IF NOT EXISTS idx_reservations_date_restaurant
ON reservations (reservation_date, restaurant_id)
WHERE deleted_at IS NULL;

-- idx_reservations_status_date
-- Para agrupar por estado y fecha (Analíticas, gráficos)
CREATE INDEX IF NOT EXISTS idx_reservations_status_date
ON reservations (status, reservation_date)
WHERE deleted_at IS NULL;

-- idx_reservations_code
-- Para búsqueda rápida por código RES-XXXXX
CREATE INDEX IF NOT EXISTS idx_reservations_code
ON reservations (reservation_code)
WHERE deleted_at IS NULL;

-- idx_reservations_customer_status
-- Para contar no-shows y historial por cliente
CREATE INDEX IF NOT EXISTS idx_reservations_customer_status
ON reservations (customer_id, status)
WHERE deleted_at IS NULL;

-- idx_reservations_source_date
-- Para analíticas por canal de origen
CREATE INDEX IF NOT EXISTS idx_reservations_source_date
ON reservations (source, reservation_date)
WHERE deleted_at IS NULL;

-- idx_reservations_datetime_restaurant
-- Para búsqueda por fecha + hora específica (availability check)
CREATE INDEX IF NOT EXISTS idx_reservations_datetime_restaurant
ON reservations (reservation_date, reservation_time, restaurant_id)
WHERE deleted_at IS NULL AND status = 'CONFIRMADO';

-- ----------------------------------------------------------------------------
-- 2. Tabla: tables
-- ----------------------------------------------------------------------------

-- idx_tables_restaurant_status
-- Para obtener mesas activas por restaurante
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_status
ON tables (restaurant_id)
WHERE deleted_at IS NULL;

-- idx_tables_location_capacity
-- Para buscar mesas por ubicación y capacidad (asignación inteligente)
CREATE INDEX IF NOT EXISTS idx_tables_location_capacity
ON tables (location, capacity)
WHERE deleted_at IS NULL;

-- idx_tables_restaurant_location
-- Para mesas por restaurante y ubicación (filtros de terraza/interior)
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_location
ON tables (restaurant_id, location)
WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 3. Tabla: customers
-- ----------------------------------------------------------------------------

-- idx_customers_phone_search
-- Para búsqueda rápida por teléfono (login/check-in)
CREATE INDEX IF NOT EXISTS idx_customers_phone_search
ON customers (phone_number);

-- idx_customers_noshow_count
-- Para clientes con alto índice de no-shows (lista negra)
CREATE INDEX IF NOT EXISTS idx_customers_noshow_count
ON customers (no_show_count DESC)
WHERE no_show_count > 0;

-- ----------------------------------------------------------------------------
-- 4. Tabla: daily_analytics
-- ----------------------------------------------------------------------------

-- idx_daily_analytics_date_restaurant
-- Para consultar analíticas pre-calculadas por fecha y restaurante
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date_restaurant
ON daily_analytics (date, restaurant_id);

-- idx_daily_analytics_restaurant_date_range
-- Para consultas de rango de fechas (gráficos de tendencias)
CREATE INDEX IF NOT EXISTS idx_daily_analytics_restaurant_date_range
ON daily_analytics (restaurant_id, date DESC);

-- ----------------------------------------------------------------------------
-- 5. Tabla: services
-- ----------------------------------------------------------------------------

-- idx_services_restaurant_active
-- Para servicios activos por restaurante
CREATE INDEX IF NOT EXISTS idx_services_restaurant_active
ON services (restaurant_id)
WHERE is_active = true AND deleted_at IS NULL;

-- idx_services_day_type_time
-- Para buscar servicio por día y hora
CREATE INDEX IF NOT EXISTS idx_services_day_type_time
ON services (day_type, start_time, end_time)
WHERE is_active = true AND deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- 6. Tabla: call_logs
-- ----------------------------------------------------------------------------

-- idx_call_logs_restaurant_date
-- Para logs de llamadas por restaurante y fecha
CREATE INDEX IF NOT EXISTS idx_call_logs_restaurant_date
ON call_logs (restaurant_id, call_started_at DESC);

-- idx_call_logs_caller_phone
-- Para historial de llamadas de un cliente
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_phone
ON call_logs (caller_phone, call_started_at DESC);

-- ----------------------------------------------------------------------------
-- 7. Tabla: whatsapp_messages
-- ----------------------------------------------------------------------------

-- idx_whatsapp_reservation_messages
-- Para mensajes de una reserva
CREATE INDEX IF NOT EXISTS idx_whatsapp_reservation_messages
ON whatsapp_messages (reservation_id, sent_at DESC);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Mostrar todos los índices creados en este script
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Conteo de índices por tabla
SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- NOTAS DE MANTENIMIENTO
-- ============================================================================
--
-- Para verificar el tamaño de los índices:
-- SELECT schemaname, tablename, indexname,
--        pg_size_pretty(pg_relation_size(indexname::text)) as size
-- FROM pg_indexes WHERE indexname LIKE 'idx_%';
--
-- Para analizar el uso de índices:
-- SELECT * FROM pg_stat_user_indexes WHERE indexname LIKE 'idx_%';
--
-- Para recrear índices (después de INSERT masivos):
-- REINDEX INDEX idx_reservations_date_restaurant;
--
-- ============================================================================
