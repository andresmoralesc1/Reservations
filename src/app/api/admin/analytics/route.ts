import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations, tables, dailyAnalytics } from "@/drizzle/schema"
import { eq, and, gte, lte, desc, sql } from "drizzle-orm"
import { subDays } from "date-fns"
import { getCachedAnalytics } from "@/lib/cache"
import { redisEnabled } from "@/lib/redis"
import { getDashboardStats } from "@/lib/services/analytics.service"

// Tipo para datos diarios (compartido entre histórico y tiempo real)
type DailyStats = {
  date: string
  totalReservations: number
  confirmedCount: number
  pendingCount: number
  cancelledCount: number
  noShowCount: number
  totalCovers: number
  avgPartySize: number
  confirmationRate: number
  sourceBreakdown?: Record<string, number>
  hourlyBreakdown?: Array<{ hour: number; count: number; covers: number }>
}

// Tipo de respuesta de analíticas
interface AnalyticsResponse {
  period: {
    startDate: string
    endDate: string
    days: number
  }
  summary: {
    totalReservations: number
    confirmedCount: number
    pendingCount: number
    cancelledCount: number
    noShowCount: number
    totalCovers: number
    avgPartySize: number
    confirmationRate: number
    noShowRate: number
    avgOccupancy: number
    totalTables: number
    totalCapacity: number
  }
  dailyBreakdown: Array<{
    date: string
    total: number
    confirmed: number
    pending: number
    cancelled: number
    noShow: number
    covers: number
  }>
  hourlyBreakdown: Array<{
    hour: number
    count: number
    covers: number
  }>
  sourceBreakdown: Record<string, number>
}

/**
 * Obtiene analíticas usando datos pre-calculados de daily_analytics
 * Combina datos históricos pre-calculados con datos de hoy en tiempo real
 */
async function fetchAnalyticsOptimized(
  restaurantId: string,
  startDateStr: string,
  endDateStr: string
): Promise<AnalyticsResponse> {
  const today = new Date().toISOString().split("T")[0]
  const needsTodayData = startDateStr <= today && today <= endDateStr

  console.log(`📊 [OPTIMIZED] Fetching analytics from ${startDateStr} to ${endDateStr}`)

  // Obtener datos pre-calculados para el rango (excluyendo hoy si está en el rango)
  const historicalDateEnd = needsTodayData
    ? new Date(new Date(today).getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : endDateStr

  const historicalData = await db.query.dailyAnalytics.findMany({
    where: and(
      eq(dailyAnalytics.restaurantId, restaurantId),
      sql`${dailyAnalytics.date} >= ${startDateStr} AND ${dailyAnalytics.date} <= ${historicalDateEnd}`
    ),
    orderBy: [desc(dailyAnalytics.date)],
  })

  console.log(`📊 [OPTIMIZED] Found ${historicalData.length} pre-calculated days`)

  // Si hoy está en el rango, obtener datos en tiempo real
  let todayData: DailyStats | null = null
  if (needsTodayData) {
    const stats = await getDashboardStats({ restaurantId, date: today })
    todayData = {
      date: today,
      totalReservations: stats.totalToday,
      confirmedCount: stats.confirmedCount,
      pendingCount: stats.pendingCount,
      cancelledCount: stats.cancelledCount,
      noShowCount: stats.noShowCount,
      totalCovers: stats.totalCovers,
      avgPartySize: stats.avgPartySize,
      confirmationRate: stats.confirmationRate,
    }
    console.log(`📊 [OPTIMIZED] Today's stats calculated in real-time`)
  }

  // Combinar datos históricos con hoy
  // historicalData tiene campos de BD, todayData solo campos de stats
  const allDailyData = [...historicalData] as Array<DailyStats | typeof historicalData[number]>
  if (todayData) {
    allDailyData.push(todayData)
  }

  // Calcular resumen agregado
  const totalReservations = allDailyData.reduce((sum, d) => sum + d.totalReservations, 0)
  const confirmedCount = allDailyData.reduce((sum, d) => sum + d.confirmedCount, 0)
  const pendingCount = allDailyData.reduce((sum, d) => sum + d.pendingCount, 0)
  const cancelledCount = allDailyData.reduce((sum, d) => sum + d.cancelledCount, 0)
  const noShowCount = allDailyData.reduce((sum, d) => sum + d.noShowCount, 0)
  const totalCovers = allDailyData.reduce((sum, d) => sum + d.totalCovers, 0)

  const nonCancelledTotal = allDailyData.reduce((sum, d) => {
    return sum + d.totalReservations - d.cancelledCount
  }, 0)

  const avgPartySize = nonCancelledTotal > 0
    ? Math.round((totalCovers / nonCancelledTotal) * 10) / 10
    : 0

  // Desglose por hora (agregado de todos los días)
  const hourlyMap = new Map<number, { count: number; covers: number }>()
  for (let h = 13; h <= 23; h++) {
    hourlyMap.set(h, { count: 0, covers: 0 })
  }

  for (const day of allDailyData) {
    if (day.hourlyBreakdown) {
      for (const hourData of day.hourlyBreakdown) {
        const current = hourlyMap.get(hourData.hour) || { count: 0, covers: 0 }
        current.count += hourData.count
        current.covers += hourData.covers
        hourlyMap.set(hourData.hour, current)
      }
    }
  }

  const hourlyBreakdown = Array.from(hourlyMap.entries())
    .filter(([_, data]) => data.count > 0)
    .map(([hour, data]) => ({ hour, ...data }))
    .sort((a, b) => a.hour - b.hour)

  // Desglose por origen (agregado de todos los días)
  const sourceBreakdown: Record<string, number> = {}
  for (const day of allDailyData) {
    if (day.sourceBreakdown) {
      for (const [source, count] of Object.entries(day.sourceBreakdown)) {
        sourceBreakdown[source] = (sourceBreakdown[source] || 0) + count
      }
    }
  }

  // Obtener info de mesas
  const allTables = await db.query.tables.findMany({
    where: eq(tables.restaurantId, restaurantId),
  })

  const totalCapacity = allTables.reduce((sum, t) => sum + t.capacity, 0)
  const daysWithData = allDailyData.length
  const avgOccupancy = (totalCapacity > 0 && daysWithData > 0)
    ? Math.round((totalCovers / (totalCapacity * daysWithData)) * 100)
    : 0

  const noShowRate = confirmedCount > 0
    ? Math.round((noShowCount / confirmedCount) * 100)
    : 0

  const confirmationRate = (confirmedCount + pendingCount) > 0
    ? Math.round((confirmedCount / (confirmedCount + pendingCount)) * 100)
    : 0

  return {
    period: {
      startDate: startDateStr,
      endDate: endDateStr,
      days: daysWithData,
    },
    summary: {
      totalReservations,
      confirmedCount,
      pendingCount,
      cancelledCount,
      noShowCount,
      totalCovers,
      avgPartySize,
      confirmationRate,
      noShowRate,
      avgOccupancy,
      totalTables: allTables.length,
      totalCapacity,
    },
    dailyBreakdown: allDailyData.map((d) => ({
      date: d.date,
      total: d.totalReservations,
      confirmed: d.confirmedCount,
      pending: d.pendingCount,
      cancelled: d.cancelledCount,
      noShow: d.noShowCount,
      covers: d.totalCovers,
    })).sort((a, b) => b.date.localeCompare(a.date)),
    hourlyBreakdown,
    sourceBreakdown,
  }
}

/**
 * Fallback: Obtiene analíticas calculando en tiempo real (sin daily_analytics)
 * Se usa si no hay datos pre-calculados disponibles
 */
async function fetchAnalyticsRealtime(
  restaurantId: string,
  startDateStr: string,
  endDateStr: string
): Promise<AnalyticsResponse> {
  // Get all reservations in range
  const allReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      gte(reservations.reservationDate, startDateStr),
      lte(reservations.reservationDate, endDateStr)
    ),
    orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
  })

  console.log(`📊 [REALTIME] Found ${allReservations.length} reservations from ${startDateStr} to ${endDateStr}`)

  // Get tables
  const allTables = await db.query.tables.findMany({
    where: eq(tables.restaurantId, restaurantId),
  })

  // Calculate metrics
  const totalReservations = allReservations.length
  const confirmedCount = allReservations.filter((r) => r.status === "CONFIRMADO").length
  const pendingCount = allReservations.filter((r) => r.status === "PENDIENTE").length
  const cancelledCount = allReservations.filter((r) => r.status === "CANCELADO").length
  const noShowCount = allReservations.filter((r) => r.status === "NO_SHOW").length

  const totalCovers = allReservations
    .filter((r) => r.status !== "CANCELADO")
    .reduce((sum, r) => sum + r.partySize, 0)

  const avgPartySize = allReservations.length > 0
    ? Math.round(
      (allReservations
        .filter((r) => r.status !== "CANCELADO")
        .reduce((sum, r) => sum + r.partySize, 0) /
        allReservations.filter((r) => r.status !== "CANCELADO").length) * 10
    ) / 10
    : 0

  // Daily breakdown
  const dailyBreakdown: Record<string, {
    date: string
    total: number
    confirmed: number
    pending: number
    cancelled: number
    noShow: number
    covers: number
  }> = {}

  for (const res of allReservations) {
    if (!dailyBreakdown[res.reservationDate]) {
      dailyBreakdown[res.reservationDate] = {
        date: res.reservationDate,
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        noShow: 0,
        covers: 0,
      }
    }

    dailyBreakdown[res.reservationDate].total += 1
    if (res.status === "CONFIRMADO") dailyBreakdown[res.reservationDate].confirmed += 1
    else if (res.status === "PENDIENTE") dailyBreakdown[res.reservationDate].pending += 1
    else if (res.status === "CANCELADO") dailyBreakdown[res.reservationDate].cancelled += 1
    else if (res.status === "NO_SHOW") dailyBreakdown[res.reservationDate].noShow += 1

    if (res.status !== "CANCELADO") {
      dailyBreakdown[res.reservationDate].covers += res.partySize
    }
  }

  // Hourly distribution
  const hourlyBreakdown: Record<number, {
    hour: number
    count: number
    covers: number
  }> = {}

  for (const res of allReservations) {
    const hour = parseInt(res.reservationTime.split(":")[0], 10)
    if (!hourlyBreakdown[hour]) {
      hourlyBreakdown[hour] = { hour, count: 0, covers: 0 }
    }
    hourlyBreakdown[hour].count += 1
    if (res.status !== "CANCELADO") {
      hourlyBreakdown[hour].covers += res.partySize
    }
  }

  // Source breakdown
  const sourceBreakdown: Record<string, number> = {}
  for (const res of allReservations) {
    sourceBreakdown[res.source] = (sourceBreakdown[res.source] || 0) + 1
  }

  // Table utilization
  const totalCapacity = allTables.reduce((sum, t) => sum + t.capacity, 0)
  const daysWithData = Object.keys(dailyBreakdown).length
  const avgOccupancy = (totalCapacity > 0 && daysWithData > 0)
    ? Math.round((totalCovers / (totalCapacity * daysWithData)) * 100)
    : 0

  // No show rate
  const noShowRate = confirmedCount > 0
    ? Math.round((noShowCount / confirmedCount) * 100)
    : 0

  // Confirmation rate
  const confirmationRate = (confirmedCount + pendingCount) > 0
    ? Math.round((confirmedCount / (confirmedCount + pendingCount)) * 100)
    : 0

  return {
    period: {
      startDate: startDateStr,
      endDate: endDateStr,
      days: Object.keys(dailyBreakdown).length,
    },
    summary: {
      totalReservations,
      confirmedCount,
      pendingCount,
      cancelledCount,
      noShowCount,
      totalCovers,
      avgPartySize,
      confirmationRate,
      noShowRate,
      avgOccupancy,
      totalTables: allTables.length,
      totalCapacity,
    },
    dailyBreakdown: Object.values(dailyBreakdown).sort((a, b) =>
      b.date.localeCompare(a.date)
    ),
    hourlyBreakdown: Object.values(hourlyBreakdown).sort((a, b) => a.hour - b.hour),
    sourceBreakdown,
  }
}

// Función principal que decide usar datos pre-calculados o tiempo real
async function fetchAnalytics(
  restaurantId: string,
  startDateStr: string,
  endDateStr: string
): Promise<AnalyticsResponse> {
  // Verificar si hay datos pre-calculados disponibles para el rango
  const preCalculatedCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(dailyAnalytics)
    .where(
      and(
        eq(dailyAnalytics.restaurantId, restaurantId),
        sql`${dailyAnalytics.date} >= ${startDateStr} AND ${dailyAnalytics.date} <= ${endDateStr}`
      )
    )
    .then((res) => res[0]?.count ?? 0)

  // Si hay suficientes datos pre-calculados, usar la versión optimizada
  // Usar optimizada si el rango es > 2 días o si hay datos para todo el rango
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)
  const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

  if (preCalculatedCount >= daysInRange - 1) { // -1 porque hoy se calcula en tiempo real
    console.log(`📊 Using pre-calculated data (${preCalculatedCount} days)`)
    return fetchAnalyticsOptimized(restaurantId, startDateStr, endDateStr)
  }

  console.log(`📊 Using realtime calculation (only ${preCalculatedCount} pre-calculated days available)`)
  return fetchAnalyticsRealtime(restaurantId, startDateStr, endDateStr)
}

// GET /api/admin/analytics - Get comprehensive analytics data (con caché)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get("restaurantId")
    const period = searchParams.get("period") || "7" // days
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    console.log("📊 Analytics request:", { restaurantId, period, startDate, endDate })

    if (!restaurantId) {
      console.log("❌ Missing restaurantId")
      return NextResponse.json(
        { error: "Se requiere restaurantId" },
        { status: 400 }
      )
    }

    // Determine date range
    let startDateObj: Date
    let endDateObj: Date

    if (startDate && endDate) {
      startDateObj = new Date(startDate)
      endDateObj = new Date(endDate)
    } else {
      endDateObj = new Date()
      startDateObj = subDays(endDateObj, parseInt(period))
    }

    const startDateStr = startDateObj.toISOString().split("T")[0]
    const endDateStr = endDateObj.toISOString().split("T")[0]

    // Usar caché si Redis está disponible
    const data = await getCachedAnalytics(
      restaurantId,
      startDateStr,
      endDateStr,
      () => fetchAnalytics(restaurantId, startDateStr, endDateStr)
    )

    console.log(`📊 Analytics response (cached:${redisEnabled()})`)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      {
        error: "Error al obtener analíticas",
        details: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    )
  }
}
