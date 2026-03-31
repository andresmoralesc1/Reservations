/**
 * Analytics Aggregation Service
 *
 * Pre-calcula métricas diarias y las almacena en daily_analytics
 * para optimizar consultas de analíticas de 7+ días.
 */

import { db } from "@/lib/db"
import { reservations, dailyAnalytics, tables } from "@/drizzle/schema"
import { eq, and, sql } from "drizzle-orm"

export interface DailyAnalyticsInput {
  restaurantId: string
  date: string // YYYY-MM-DD
}

/**
 * Calcula y almacena las analíticas diarias para un restaurante y fecha específicos
 */
export async function calculateAndStoreDailyAnalytics(
  { restaurantId, date }: DailyAnalyticsInput
): Promise<void> {
  console.log(`📊 Calculating daily analytics for restaurant ${restaurantId}, date ${date}`)

  // Obtener todas las reservas del día
  const dayReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.reservationDate, date)
    ),
  })

  console.log(`📊 Found ${dayReservations.length} reservations`)

  // Calcular conteos por estado
  const confirmedCount = dayReservations.filter((r) => r.status === "CONFIRMADO").length
  const pendingCount = dayReservations.filter((r) => r.status === "PENDIENTE").length
  const cancelledCount = dayReservations.filter((r) => r.status === "CANCELADO").length
  const noShowCount = dayReservations.filter((r) => r.status === "NO_SHOW").length

  // Calcular covers y party size
  const nonCancelled = dayReservations.filter((r) => r.status !== "CANCELADO")
  const totalCovers = nonCancelled.reduce((sum, r) => sum + r.partySize, 0)
  const avgPartySize = nonCancelled.length > 0
    ? Math.round((totalCovers / nonCancelled.length) * 10)
    : null

  // Desglose por origen
  const sourceBreakdown: Record<string, number> = {}
  for (const res of dayReservations) {
    sourceBreakdown[res.source] = (sourceBreakdown[res.source] || 0) + 1
  }

  // Desglose por hora (13-23)
  const hourlyMap = new Map<number, { count: number; covers: number }>()
  for (let h = 13; h <= 23; h++) {
    hourlyMap.set(h, { count: 0, covers: 0 })
  }

  for (const res of dayReservations) {
    const hour = parseInt(res.reservationTime.split(":")[0], 10)
    const current = hourlyMap.get(hour) || { count: 0, covers: 0 }
    current.count++
    if (res.status !== "CANCELADO") {
      current.covers += res.partySize
    }
    hourlyMap.set(hour, current)
  }

  const hourlyBreakdown = Array.from(hourlyMap.entries())
    .filter(([_, data]) => data.count > 0)
    .map(([hour, data]) => ({ hour, ...data }))

  // Calcular tasas
  const totalActive = confirmedCount + pendingCount
  const confirmationRate = totalActive > 0
    ? Math.round((confirmedCount / totalActive) * 100)
    : 0

  const noShowRate = confirmedCount > 0
    ? Math.round((noShowCount / confirmedCount) * 100)
    : 0

  // Upsert en daily_analytics
  await db.insert(dailyAnalytics)
    .values({
      restaurantId,
      date,
      totalReservations: dayReservations.length,
      confirmedCount,
      pendingCount,
      cancelledCount,
      noShowCount,
      totalCovers,
      avgPartySize,
      sourceBreakdown,
      hourlyBreakdown,
      confirmationRate,
      noShowRate,
      calculatedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [dailyAnalytics.restaurantId, dailyAnalytics.date],
      set: {
        totalReservations: dayReservations.length,
        confirmedCount,
        pendingCount,
        cancelledCount,
        noShowCount,
        totalCovers,
        avgPartySize,
        sourceBreakdown,
        hourlyBreakdown,
        confirmationRate,
        noShowRate,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      },
    })

  console.log(`✅ Stored daily analytics for ${date}`)
}

/**
 * Calcula y almacena analíticas para un rango de fechas
 * Útil para backfill de datos históricos
 */
export async function backfillDailyAnalytics(
  restaurantId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const start = new Date(startDate)
  const end = new Date(endDate)

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    await calculateAndStoreDailyAnalytics({ restaurantId, date: dateStr })
  }

  console.log(`✅ Backfill complete from ${startDate} to ${endDate}`)
}

/**
 * Obtiene analíticas pre-calculadas de daily_analytics
 */
export async function getPreCalculatedAnalytics(
  restaurantId: string,
  startDate: string,
  endDate: string
) {
  const result = await db.query.dailyAnalytics.findMany({
    where: and(
      eq(dailyAnalytics.restaurantId, restaurantId),
      sql`${dailyAnalytics.date} >= ${startDate} AND ${dailyAnalytics.date} <= ${endDate}`
    ),
    orderBy: [dailyAnalytics.date],
  })

  return result
}

/**
 * Combina datos pre-calculados con datos de hoy en tiempo real
 */
export async function getHybridAnalytics(
  restaurantId: string,
  startDate: string,
  endDate: string
) {
  const today = new Date().toISOString().split("T")[0]

  // Obtener datos pre-calculados para fechas anteriores
  const preCalculated = await getPreCalculatedAnalytics(restaurantId, startDate, endDate)

  // Si hoy está en el rango, calcularlo en tiempo real
  const needsTodayCalculation = startDate <= today && today <= endDate

  let todayData: any = null
  if (needsTodayCalculation) {
    // Usar la función existente de analytics.service.ts para hoy
    const { getDashboardStats } = await import("./analytics.service")
    const stats = await getDashboardStats({ restaurantId, date: today })

    // Formatear al mismo formato que daily_analytics
    todayData = {
      date: today,
      totalReservations: stats.totalToday,
      confirmedCount: stats.confirmedCount,
      pendingCount: stats.pendingCount,
      cancelledCount: stats.cancelledCount,
      noShowCount: stats.noShowCount,
      totalCovers: stats.totalCovers,
      avgPartySize: stats.avgPartySize ? Math.round(stats.avgPartySize * 10) : null,
      sourceBreakdown: {}, // Se llena si se necesita
      hourlyBreakdown: [], // Se llena si se necesita
      confirmationRate: stats.confirmationRate,
      noShowRate: 0, // Se calcula si se necesita
    }
  }

  // Combinar datos pre-calculados con datos de hoy
  const allData = preCalculated.filter((d) => d.date !== today)
  if (todayData) {
    allData.push(todayData)
  }

  return allData.sort((a, b) => a.date.localeCompare(b.date))
}
