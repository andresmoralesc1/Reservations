import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tables, reservations } from "@/drizzle/schema"
import { eq, and, sql, or, desc } from "drizzle-orm"

interface TableStatus {
  id: string
  tableCode: string
  tableNumber: string
  capacity: number
  location: string
  // Visual layout
  shape: string
  positionX: number
  positionY: number
  width: number
  height: number
  diameter: number
  rotation: number
  // Status
  status: "available" | "occupied" | "reserved" | "blocked"
  // Reservations for this day
  reservations: Array<{
    id: string
    reservationCode: string
    customerName: string
    customerPhone: string
    reservationTime: string
    partySize: number
    status: string
    estimatedDurationMinutes: number
  }>
}

interface FloorPlanResponse {
  date: string
  tables: TableStatus[]
  summary: {
    total: number
    available: number
    occupied: number
    reserved: number
    blocked: number
  }
}

// GET /api/admin/floor-plan?date=YYYY-MM-DD&restaurantId=uuid
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date") // YYYY-MM-DD
    const restaurantId = searchParams.get("restaurantId")

    if (!date || !restaurantId) {
      return NextResponse.json(
        { error: "Faltan parámetros: date y restaurantId" },
        { status: 400 }
      )
    }

    // Get all tables for this restaurant
    const allTables = await db.query.tables.findMany({
      where: eq(tables.restaurantId, restaurantId),
      orderBy: [tables.location, tables.tableNumber],
    })

    // Get all reservations for this date
    const dayReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.restaurantId, restaurantId),
        eq(reservations.reservationDate, date),
        or(
          eq(reservations.status, "PENDIENTE"),
          eq(reservations.status, "CONFIRMADO")
        )
      ),
      orderBy: [reservations.reservationTime, desc(reservations.partySize)],
    })

    // Helper to check if a table is occupied at current time
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    // Build tables with status
    const tablesWithStatus: TableStatus[] = allTables.map((table) => {
      // Find reservations for this table
      const tableReservations = dayReservations.filter((res) =>
        res.tableIds?.includes(table.id)
      )

      // Check if currently occupied
      const isCurrentlyOccupied = tableReservations.some((res) => {
        const reservationTime = res.reservationTime
        const duration = res.estimatedDurationMinutes || 90
        const endTime = addMinutes(reservationTime, duration)

        return currentTime >= reservationTime && currentTime < endTime
      })

      // Determine status
      let status: "available" | "occupied" | "reserved" | "blocked" = "available"

      if (isCurrentlyOccupied) {
        status = "occupied"
      } else if (tableReservations.length > 0) {
        status = "reserved"
      }

      return {
        id: table.id,
        tableCode: table.tableCode,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        location: table.location || "interior",
        shape: table.shape || "rectangular",
        positionX: table.positionX || 0,
        positionY: table.positionY || 0,
        width: table.width || 100,
        height: table.height || 80,
        diameter: table.diameter || 80,
        rotation: table.rotation || 0,
        status,
        reservations: tableReservations.map((res) => ({
          id: res.id,
          reservationCode: res.reservationCode,
          customerName: res.customerName,
          customerPhone: res.customerPhone,
          reservationTime: res.reservationTime,
          partySize: res.partySize,
          status: res.status,
          estimatedDurationMinutes: res.estimatedDurationMinutes || 90,
        })),
      }
    })

    // Calculate summary
    const summary = {
      total: tablesWithStatus.length,
      available: tablesWithStatus.filter((t) => t.status === "available").length,
      occupied: tablesWithStatus.filter((t) => t.status === "occupied").length,
      reserved: tablesWithStatus.filter((t) => t.status === "reserved").length,
      blocked: tablesWithStatus.filter((t) => t.status === "blocked").length,
    }

    return NextResponse.json({
      date,
      tables: tablesWithStatus,
      summary,
    } satisfies FloorPlanResponse)
  } catch (error) {
    console.error("[Floor Plan API] Error:", error)
    return NextResponse.json(
      { error: "Error al obtener floor plan" },
      { status: 500 }
    )
  }
}

// Helper: Add minutes to HH:MM time
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, mins + minutes)
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}
