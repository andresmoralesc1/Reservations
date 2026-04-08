/**
 * Analytics Service
 *
 * Estadísticas y métricas del dashboard
 */

import { db } from "@/lib/db"
import { reservations, tables } from "@/drizzle/schema"
import { eq, and, gte, lte, sql, desc } from "drizzle-orm"

export interface DashboardStatsOptions {
  restaurantId: string
  date: string // YYYY-MM-DD
}

export interface EnhancedStats {
  // Today's stats
  totalToday: number
  confirmedCount: number
  pendingCount: number
  cancelledCount: number
  noShowCount: number
  confirmationRate: number
  avgPartySize: number
  occupancyRate: number
  totalCovers: number

  // Queue stats
  totalPending: number
  expiredSessions: number
  nextHourCount: number

  // Restaurant info
  totalTables: number
  totalCapacity: number
}

export interface ChartData {
  hourly: {
    data: Array<{
      hour: number
      label: string
      count: number
      confirmed: number
      pending: number
      cancelled: number
      covers: number
    }>
    maxCount: number
  }
  statusDistribution: {
    data: {
      PENDIENTE: number
      CONFIRMADO: number
      CANCELADO: number
      NO_SHOW: number
    }
    total: number
    percentages: {
      PENDIENTE: number
      CONFIRMADO: number
      CANCELADO: number
      NO_SHOW: number
    }
  }
}

/**
 * Obtener estadísticas del dashboard
 */
export async function getDashboardStats({ restaurantId, date }: DashboardStatsOptions): Promise<EnhancedStats> {
  // Get all reservations for the date
  const todayReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.reservationDate, date)
    ),
  })

  // Get all tables for the restaurant
  const allTables = await db.query.tables.findMany({
    where: eq(tables.restaurantId, restaurantId),
  })

  // Calculate KPIs
  const confirmedCount = todayReservations.filter((r) => r.status === "CONFIRMADO").length
  const pendingCount = todayReservations.filter((r) => r.status === "PENDIENTE").length
  const cancelledCount = todayReservations.filter((r) => r.status === "CANCELADO").length
  const noShowCount = todayReservations.filter((r) => r.status === "NO_SHOW").length

  // Total hoy incluye todas las reservas activas (confirmadas, pendientes, no-show)
  // Excluye canceladas porque no ocupan espacio ni generan ingresos
  const totalToday = confirmedCount + pendingCount + noShowCount
  const confirmationRate = totalToday > 0
    ? Math.round((confirmedCount / totalToday) * 100)
    : 0

  // Average party size
  const validReservations = todayReservations.filter((r) => r.status !== "CANCELADO")
  const avgPartySize = validReservations.length > 0
    ? Math.round(
        (validReservations.reduce((sum, r) => sum + r.partySize, 0) / validReservations.length) * 10
      ) / 10
    : 0

  // Occupancy rate - Mejorado: considera que cada mesa puede usarse múltiples veces por día
  // Dividimos en turnos: comida (13:00-17:00) y cena (19:00-23:00)
  const totalCapacity = allTables.reduce((sum, t) => sum + t.capacity, 0)

  // Filtrar reservas activas por turno
  const lunchReservations = todayReservations.filter((r) => {
    const hour = parseInt(r.reservationTime.split(":")[0])
    return r.status !== "CANCELADO" && hour >= 13 && hour < 17
  })
  const dinnerReservations = todayReservations.filter((r) => {
    const hour = parseInt(r.reservationTime.split(":")[0])
    return r.status !== "CANCELADO" && hour >= 19 && hour < 24
  })

  const lunchCovers = lunchReservations.reduce((sum, r) => sum + r.partySize, 0)
  const dinnerCovers = dinnerReservations.reduce((sum, r) => sum + r.partySize, 0)

  // Ocupación por turno (máximo 100% cada uno)
  const lunchOccupancy = totalCapacity > 0 ? Math.min(100, (lunchCovers / totalCapacity) * 100) : 0
  const dinnerOccupancy = totalCapacity > 0 ? Math.min(100, (dinnerCovers / totalCapacity) * 100) : 0

  // Promedio de ocupación entre los dos turnos
  const occupancyRate = Math.round((lunchOccupancy + dinnerOccupancy) / 2)

  // Total covers del día (para el KPI de cubiertos)
  const totalCovers = todayReservations
    .filter((r) => r.status !== "CANCELADO")
    .reduce((sum, r) => sum + r.partySize, 0)

  // Get pending stats for all future reservations
  const futureReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      sql`${reservations.reservationDate} >= ${date}`
    ),
  })

  const totalPending = futureReservations.filter((r) => r.status === "PENDIENTE").length

  // Check for expired sessions
  const now = new Date()
  const expiredSessions = futureReservations.filter((r) => {
    if (r.sessionExpiresAt && new Date(r.sessionExpiresAt) < now) {
      return true
    }
    return false
  }).length

  // Next hour reservations
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
  const nextHourCount = todayReservations.filter((r) => {
    const reservationDateTime = new Date(`${r.reservationDate}T${r.reservationTime}`)
    return reservationDateTime <= oneHourFromNow && r.status !== "CANCELADO"
  }).length

  return {
    // Today's stats
    totalToday,
    confirmedCount,
    pendingCount,
    cancelledCount,
    noShowCount,
    confirmationRate,
    avgPartySize,
    occupancyRate,
    totalCovers,

    // Queue stats
    totalPending,
    expiredSessions,
    nextHourCount,

    // Restaurant info
    totalTables: allTables.length,
    totalCapacity,
  }
}

/**
 * Obtener datos para gráficos del dashboard
 */
export async function getChartData({ restaurantId, date }: DashboardStatsOptions): Promise<ChartData> {
  const todayReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.reservationDate, date)
    ),
  })

  // Hourly distribution
  const hourlyMap = new Map<number, {
    count: number
    confirmed: number
    pending: number
    cancelled: number
    covers: number
  }>()

  // Initialize hours 13-23 (1PM-11PM)
  for (let h = 13; h <= 23; h++) {
    hourlyMap.set(h, { count: 0, confirmed: 0, pending: 0, cancelled: 0, covers: 0 })
  }

  todayReservations.forEach((r) => {
    const hour = parseInt(r.reservationTime.split(":")[0])
    const current = hourlyMap.get(hour) || {
      count: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      covers: 0,
    }

    current.count++
    current.covers += r.partySize

    if (r.status === "CONFIRMADO") current.confirmed++
    else if (r.status === "PENDIENTE") current.pending++
    else if (r.status === "CANCELADO") current.cancelled++

    hourlyMap.set(hour, current)
  })

  const hourlyData = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    label: `${hour}:00`,
    ...data,
  }))

  const maxCount = Math.max(...hourlyData.map((h) => h.count), 1)

  // Status distribution
  const statusCounts = {
    PENDIENTE: 0,
    CONFIRMADO: 0,
    CANCELADO: 0,
    NO_SHOW: 0,
  }

  todayReservations.forEach((r) => {
    if (r.status in statusCounts) {
      statusCounts[r.status as keyof typeof statusCounts]++
    }
  })

  const total = todayReservations.length
  const percentages = {
    PENDIENTE: total > 0 ? Math.round((statusCounts.PENDIENTE / total) * 100) : 0,
    CONFIRMADO: total > 0 ? Math.round((statusCounts.CONFIRMADO / total) * 100) : 0,
    CANCELADO: total > 0 ? Math.round((statusCounts.CANCELADO / total) * 100) : 0,
    NO_SHOW: total > 0 ? Math.round((statusCounts.NO_SHOW / total) * 100) : 0,
  }

  return {
    hourly: {
      data: hourlyData,
      maxCount,
    },
    statusDistribution: {
      data: statusCounts,
      total,
      percentages,
    },
  }
}

/**
 * Obtener estadísticas de ocupación
 */
export async function getOccupancyStats(
  restaurantId: string,
  startDate: string,
  endDate: string
) {
  const reservationList = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      sql`${reservations.reservationDate} >= ${startDate} AND ${reservations.reservationDate} <= ${endDate}`
    ),
  })

  const allTables = await db.query.tables.findMany({
    where: eq(tables.restaurantId, restaurantId),
  })

  const totalCapacity = allTables.reduce((sum, t) => sum + t.capacity, 0)

  // Group by date
  const byDate = new Map<string, number>()

  reservationList
    .filter((r) => r.status !== "CANCELADO")
    .forEach((r) => {
      const current = byDate.get(r.reservationDate) || 0
      byDate.set(r.reservationDate, current + r.partySize)
    })

  return {
    totalCapacity,
    daily: Object.fromEntries(byDate),
  }
}

/**
 * Obtener métricas de no-shows por cliente
 */
export async function getTopNoShows(restaurantId: string, limit = 10) {
  const result = await db
    .select({
      customerPhone: reservations.customerPhone,
      customerName: reservations.customerName,
      noShowCount: sql<number>`count(*)`.as("no_show_count"),
    })
    .from(reservations)
    .where(eq(reservations.status, "NO_SHOW"))
    .groupBy(reservations.customerPhone, reservations.customerName)
    .orderBy(desc(sql`count(*)`))
    .limit(limit)

  return result
}

/**
 * Obtener tendencias de reservas (últimos X días)
 */
export async function getReservationTrends(
  restaurantId: string,
  days = 30
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const result = await db
    .select({
      date: reservations.reservationDate,
      count: sql<number>`count(*)`.as("reservations"),
      confirmed: sql<number>`sum(case when status = 'CONFIRMADO' then 1 else 0 end)`.as("confirmed"),
      cancelled: sql<number>`sum(case when status = 'CANCELADO' then 1 else 0 end)`.as("cancelled"),
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.restaurantId, restaurantId),
        sql`${reservations.reservationDate} >= ${startDate.toISOString().split("T")[0]}`
      )
    )
    .groupBy(reservations.reservationDate)
    .orderBy(reservations.reservationDate)

  return result
}
