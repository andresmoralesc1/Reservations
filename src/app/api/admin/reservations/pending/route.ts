import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations } from "@/drizzle/schema"
import { eq, and, gte, lte, desc, sql } from "drizzle-orm"
import { startOfDay, endOfDay, addDays } from "date-fns"

// GET /api/admin/reservations/pending - Get pending reservations queue
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const daysAhead = parseInt(searchParams.get("daysAhead") || "7")

    const today = startOfDay(new Date())
    const futureDate = addDays(today, daysAhead)

    // Get pending reservations within date range
    const resultList = await db.query.reservations.findMany({
      where: and(
        eq(reservations.status, "PENDIENTE"),
        sql`${reservations.reservationDate} >= ${today.toISOString().split("T")[0]}`,
        sql`${reservations.reservationDate} <= ${futureDate.toISOString().split("T")[0]}`
      ),
      with: {
        restaurant: true,
        customer: true,
      },
      orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
    })

    // Check for any expired sessions that should be released
    const now = new Date()
    const expired = resultList.filter((r) => {
      if (r.sessionExpiresAt && new Date(r.sessionExpiresAt) < now) {
        return true
      }
      return false
    })

    // Get statistics
    const todayStr = today.toISOString().split("T")[0]
    const todayPending = resultList.filter((r) => r.reservationDate === todayStr)

    const stats = {
      totalPending: resultList.length,
      todayPending: todayPending.length,
      expiredSessions: expired.length,
      nextHour: resultList.filter((r) => {
        const reservationDateTime = new Date(`${r.reservationDate}T${r.reservationTime}`)
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
        return reservationDateTime <= oneHourFromNow
      }).length,
    }

    return NextResponse.json({
      reservations: resultList,
      stats,
      expiredSessions: expired.map((r) => r.id),
    })
  } catch (error) {
    console.error("Error fetching pending reservations:", error)
    return NextResponse.json(
      { error: "Error al obtener reservas pendientes" },
      { status: 500 }
    )
  }
}
