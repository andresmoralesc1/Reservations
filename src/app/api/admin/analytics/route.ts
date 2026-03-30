import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations, tables } from "@/drizzle/schema"
import { eq, and, gte, lte, desc } from "drizzle-orm"
import { subDays } from "date-fns"
import { getCachedAnalytics } from "@/lib/cache"
import { redisEnabled } from "@/lib/redis"

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

// Función para obtener analíticas (extraída para usar con caché)
async function fetchAnalytics(
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

  console.log(`📊 Found ${allReservations.length} reservations from ${startDateStr} to ${endDateStr}`)

  // Get tables
  const allTables = await db.query.tables.findMany({
    where: eq(tables.restaurantId, restaurantId),
  })

  console.log(`📊 Found ${allTables.length} tables`)

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
