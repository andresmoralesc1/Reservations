/**
 * Redis Cache Service
 *
 * Caché inteligente con TTLs configurados por tipo de dato
 * - Dashboard KPIs: 30s (se consultan constantemente)
 * - Analíticas: 5min (rango de 7 días no cambia cada segundo)
 * - Disponibilidad: 10s (cambia frecuentemente pero no cada segundo)
 */

import { getRedis, redisEnabled } from "./redis"

// TTLs en segundos
export const CacheTTL = {
  DASHBOARD_KPI: 30,      // 30 segundos - KPIs del dashboard
  ANALYTICS: 5 * 60,      // 5 minutos - Analíticas de varios días
  AVAILABILITY: 10,       // 10 segundos - Disponibilidad de mesas
  CHART_DATA: 60,         // 1 minuto - Datos de gráficos
  OCCUPANCY: 60,          // 1 minuto - Estadísticas de ocupación
}

// Prefijos de keys para organización
const CachePrefix = {
  DASHBOARD: "dashboard",
  ANALYTICS: "analytics",
  AVAILABILITY: "availability",
  CHART: "chart",
  OCCUPANCY: "occupancy",
}

/**
 * Generar key de caché con prefijo y parámetros
 */
function buildKey(prefix: string, params: Record<string, string | number>): string {
  const paramString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|")

  return `${prefix}:${paramString}`
}

/**
 * Obtener dato de caché
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redisEnabled()) return null

  try {
    const redis = getRedis()
    const data = await redis.get(key)

    if (!data) return null

    return JSON.parse(data) as T
  } catch (error) {
    console.warn(`[Cache] Error getting key ${key}:`, error)
    return null
  }
}

/**
 * Guardar dato en caché con TTL
 */
export async function setCache<T>(key: string, data: T, ttl: number): Promise<void> {
  if (!redisEnabled()) return

  try {
    const redis = getRedis()
    await redis.setex(key, ttl, JSON.stringify(data))
  } catch (error) {
    console.warn(`[Cache] Error setting key ${key}:`, error)
  }
}

/**
 * Eliminar key(s) de caché
 */
export async function deleteCache(...keys: string[]): Promise<void> {
  if (!redisEnabled()) return

  try {
    const redis = getRedis()
    await redis.del(...keys)
  } catch (error) {
    console.warn(`[Cache] Error deleting keys:`, error)
  }
}

/**
 * Eliminar keys por patrón (usar con cuidado)
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!redisEnabled()) return

  try {
    const redis = getRedis()
    const keys = await redis.keys(pattern)

    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.warn(`[Cache] Error deleting pattern ${pattern}:`, error)
  }
}

/**
 * Wrapper para caché de funciones asíncronas
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  // Intentar obtener del caché
  const cached = await getCache<T>(key)
  if (cached !== null) {
    return cached
  }

  // Ejecutar función y guardar resultado
  const result = await fn()
  await setCache(key, result, ttl)

  return result
}

// ============ Helpers específicos por dominio ============

/**
 * Caché para KPIs del Dashboard
 */
export async function getCachedDashboardKPIs(
  restaurantId: string,
  date: string,
  fn: () => Promise<unknown>
) {
  const key = buildKey(CachePrefix.DASHBOARD, { restaurantId, date })
  return withCache(key, CacheTTL.DASHBOARD_KPI, fn)
}

/**
 * Caché para Analíticas
 */
export async function getCachedAnalytics(
  restaurantId: string,
  startDate: string,
  endDate: string,
  fn: () => Promise<unknown>
) {
  const key = buildKey(CachePrefix.ANALYTICS, { restaurantId, startDate, endDate })
  return withCache(key, CacheTTL.ANALYTICS, fn)
}

/**
 * Caché para Disponibilidad
 */
export async function getCachedAvailability(
  restaurantId: string,
  date: string,
  serviceType: string,
  fn: () => Promise<unknown>
) {
  const key = buildKey(CachePrefix.AVAILABILITY, { restaurantId, date, serviceType })
  return withCache(key, CacheTTL.AVAILABILITY, fn)
}

/**
 * Caché para Chart Data
 */
export async function getCachedChartData(
  restaurantId: string,
  date: string,
  fn: () => Promise<unknown>
) {
  const key = buildKey(CachePrefix.CHART, { restaurantId, date })
  return withCache(key, CacheTTL.CHART_DATA, fn)
}

// ============ Invalidación de caché ============

/**
 * Invalidar caché cuando se crea/modifica una reserva
 */
export async function invalidateReservationCache(
  restaurantId: string,
  reservationDate: string
): Promise<void> {
  if (!redisEnabled()) return

  const patterns = [
    `dashboard:*restaurantId:${restaurantId}*`,
    `analytics:*restaurantId:${restaurantId}*`,
    `availability:*restaurantId:${restaurantId}*date:${reservationDate}*`,
    `chart:*restaurantId:${restaurantId}*`,
    `occupancy:*restaurantId:${restaurantId}*`,
  ]

  for (const pattern of patterns) {
    await deleteCachePattern(pattern)
  }

  console.log(`[Cache] Invalidated for restaurant ${restaurantId}, date ${reservationDate}`)
}

/**
 * Invalidar todo el caché de un restaurante
 */
export async function invalidateRestaurantCache(restaurantId: string): Promise<void> {
  if (!redisEnabled()) return

  await deleteCachePattern(`*restaurantId:${restaurantId}*`)
  console.log(`[Cache] Invalidated all cache for restaurant ${restaurantId}`)
}
