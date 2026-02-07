import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations, tables } from "@/drizzle/schema"
import { eq, and, gte, lte, sql, desc } from "drizzle-orm"

// GET /api/admin/dashboard/stats - Get enhanced dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get("restaurantId")
    const date = searchParams.get("date") // Format: YYYY-MM-DD

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Se requiere restaurantId" },
        { status: 400 }
      )
    }

    const today = date || new Date().toISOString().split("T")[0]

    // Get all reservations for the date
    const todayReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.restaurantId, restaurantId),
        eq(reservations.reservationDate, today)
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

    const totalToday = confirmedCount + pendingCount
    const confirmationRate = totalToday > 0
      ? Math.round((confirmedCount / totalToday) * 100)
      : 0

    // Average party size
    const validReservations = todayReservations.filter((r) =>
      r.status !== "CANCELADO"
    )
    const avgPartySize = validReservations.length > 0
      ? Math.round(
          (validReservations.reduce((sum, r) => sum + r.partySize, 0) /
            validReservations.length) *
            10
        ) / 10
      : 0

    // Occupancy rate (tables with reservations / total tables)
    const occupiedTableIds = new Set<string>()
    for (const res of todayReservations) {
      if (res.tableIds && res.status !== "CANCELADO") {
        for (const tableId of res.tableIds) {
          occupiedTableIds.add(tableId)
        }
      }
    }
    const occupancyRate = allTables.length > 0
      ? Math.round((occupiedTableIds.size / allTables.length) * 100)
      : 0

    // Get pending stats for all future reservations
    const futureReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.restaurantId, restaurantId),
        sql`${reservations.reservationDate} >= ${today}`
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

    // Total covers (people) today
    const totalCovers = validReservations.reduce((sum, r) => sum + r.partySize, 0)

    return NextResponse.json({
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
      totalCapacity: allTables.reduce((sum, t) => sum + t.capacity, 0),
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}
