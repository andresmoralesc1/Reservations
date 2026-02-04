import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tables, reservations } from "@/drizzle/schema"
import { eq, and, sql, desc } from "drizzle-orm"

// GET /api/admin/tables/stats - Get table statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Se requiere restaurantId" },
        { status: 400 }
      )
    }

    // Get all tables for the restaurant
    const allTables = await db.query.tables.findMany({
      where: eq(tables.restaurantId, restaurantId),
    })

    // Calculate location stats
    const byLocation = {
      patio: allTables.filter((t) => t.location === "patio").length,
      interior: allTables.filter((t) => t.location === "interior").length,
      terraza: allTables.filter((t) => t.location === "terraza").length,
    }

    // Calculate capacity stats
    const totalCapacity = allTables.reduce((sum, t) => sum + t.capacity, 0)
    const accessibleCount = allTables.filter((t) => t.isAccessible).length

    // Calculate utilization (tables with active reservations today)
    const today = new Date().toISOString().split("T")[0]
    const todayReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.restaurantId, restaurantId),
        eq(reservations.reservationDate, today),
        sql`${reservations.status} != ${sql`'CANCELADO'`}`
      ),
    })

    const occupiedTableIds = new Set<string>()
    for (const res of todayReservations) {
      if (res.tableIds) {
        for (const tableId of res.tableIds) {
          occupiedTableIds.add(tableId)
        }
      }
    }

    const utilizationRate = allTables.length > 0
      ? Math.round((occupiedTableIds.size / allTables.length) * 100)
      : 0

    // Get tables grouped by location with details
    const byLocationDetails = {
      patio: allTables.filter((t) => t.location === "patio"),
      interior: allTables.filter((t) => t.location === "interior"),
      terraza: allTables.filter((t) => t.location === "terraza"),
    }

    return NextResponse.json({
      total: allTables.length,
      byLocation,
      totalCapacity,
      accessibleCount,
      utilizationRate,
      occupiedTables: occupiedTableIds.size,
      byLocationDetails: {
        patio: {
          count: byLocationDetails.patio.length,
          capacity: byLocationDetails.patio.reduce((sum, t) => sum + t.capacity, 0),
          tables: byLocationDetails.patio,
        },
        interior: {
          count: byLocationDetails.interior.length,
          capacity: byLocationDetails.interior.reduce((sum, t) => sum + t.capacity, 0),
          tables: byLocationDetails.interior,
        },
        terraza: {
          count: byLocationDetails.terraza.length,
          capacity: byLocationDetails.terraza.reduce((sum, t) => sum + t.capacity, 0),
          tables: byLocationDetails.terraza,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching table stats:", error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    )
  }
}
