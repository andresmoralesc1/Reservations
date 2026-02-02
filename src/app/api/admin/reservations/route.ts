import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations, reservationHistory } from "@/drizzle/schema"
import { eq, and, gte, lte, desc, sql, or } from "drizzle-orm"
import { startOfDay, endOfDay } from "date-fns"

// GET /api/admin/reservations - Admin reservation list with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const date = searchParams.get("date")
    const restaurantId = searchParams.get("restaurantId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const conditions = []

    // Filter by status
    if (status) {
      conditions.push(eq(reservations.status, status))
    }

    // Filter by date
    if (date) {
      conditions.push(eq(reservations.reservationDate, date))
    }

    // Filter by restaurant
    if (restaurantId) {
      conditions.push(eq(reservations.restaurantId, restaurantId))
    }

    // Get reservations
    const resultList = await db.query.reservations.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        restaurant: true,
        customer: true,
      },
      orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
      limit,
      offset,
    })

    // Get pending count
    const pendingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(eq(reservations.status, "PENDIENTE"))

    return NextResponse.json({
      reservations: resultList,
      meta: {
        limit,
        offset,
        count: resultList.length,
        pendingCount: pendingResult[0]?.count || 0,
      },
    })
  } catch (error) {
    console.error("Error fetching admin reservations:", error)
    return NextResponse.json(
      { error: "Error al obtener reservas" },
      { status: 500 }
    )
  }
}
