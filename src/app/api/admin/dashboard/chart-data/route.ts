import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations } from "@/drizzle/schema"
import { eq, and, sql } from "drizzle-orm"

// GET /api/admin/dashboard/chart-data - Get data for charts
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

    // Hourly distribution data
    const hourlyData: Record<number, {
      hour: number
      label: string
      count: number
      confirmed: number
      pending: number
      cancelled: number
      covers: number
    }> = {}

    // Initialize all hours (12:00 to 23:00)
    for (let h = 12; h <= 23; h++) {
      hourlyData[h] = {
        hour: h,
        label: `${h}:00`,
        count: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        covers: 0,
      }
    }

    // Fill in the data
    for (const res of todayReservations) {
      const hour = parseInt(res.reservationTime.split(":")[0], 10)
      if (!hourlyData[hour]) continue

      hourlyData[hour].count += 1
      hourlyData[hour].covers += res.partySize

      if (res.status === "CONFIRMADO") hourlyData[hour].confirmed += 1
      else if (res.status === "PENDIENTE") hourlyData[hour].pending += 1
      else if (res.status === "CANCELADO") hourlyData[hour].cancelled += 1
    }

    // Convert to array and find max for scaling
    const hourlyArray = Object.values(hourlyData)
    const maxCount = Math.max(...hourlyArray.map((h) => h.count), 1)

    // Status distribution
    const statusCounts = {
      PENDIENTE: todayReservations.filter((r) => r.status === "PENDIENTE").length,
      CONFIRMADO: todayReservations.filter((r) => r.status === "CONFIRMADO").length,
      CANCELADO: todayReservations.filter((r) => r.status === "CANCELADO").length,
      NO_SHOW: todayReservations.filter((r) => r.status === "NO_SHOW").length,
    }

    const totalStatus = Object.values(statusCounts).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      hourly: {
        data: hourlyArray,
        maxCount,
      },
      statusDistribution: {
        data: statusCounts,
        total: totalStatus,
        percentages: {
          PENDIENTE: totalStatus > 0 ? Math.round((statusCounts.PENDIENTE / totalStatus) * 100) : 0,
          CONFIRMADO: totalStatus > 0 ? Math.round((statusCounts.CONFIRMADO / totalStatus) * 100) : 0,
          CANCELADO: totalStatus > 0 ? Math.round((statusCounts.CANCELADO / totalStatus) * 100) : 0,
          NO_SHOW: totalStatus > 0 ? Math.round((statusCounts.NO_SHOW / totalStatus) * 100) : 0,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json(
      { error: "Error al obtener datos de gráficos" },
      { status: 500 }
    )
  }
}
