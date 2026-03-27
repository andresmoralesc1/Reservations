import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations, reservationHistory, tables, customers, services } from "@/drizzle/schema"
import { eq, and, gte, lte, desc, sql, or, inArray } from "drizzle-orm"
import { startOfDay, endOfDay } from "date-fns"
import { generateReservationCode } from "@/lib/utils"

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

    // Get tables for all reservations (handle corrupt data)
    const allTableIds = new Set<string>()
    resultList.forEach((r) => {
      if (r.tableIds) {
        // Handle both array and string formats (migration artifacts)
        const ids = Array.isArray(r.tableIds) ? r.tableIds : []
        ids.forEach((id) => {
          if (typeof id === 'string' && id.length > 0) {
            allTableIds.add(id)
          }
        })
      }
    })

    // Only fetch tables if we have valid IDs
    let tablesMap = new Map()
    if (allTableIds.size > 0) {
      const tablesData = await db.query.tables.findMany({
        where: inArray(tables.id, Array.from(allTableIds)),
      })
      tablesMap = new Map(tablesData.map((t) => [t.id, t]))
    }

    // Attach tables to each reservation (handle corrupt data)
    const reservationsWithTables = resultList.map((reservation) => {
      // Ensure tableIds is an array
      const tableIds = Array.isArray(reservation.tableIds) ? reservation.tableIds : []

      return {
        ...reservation,
        tableIds, // Use the cleaned array
        tables: tableIds
          .map((id) => typeof id === 'string' ? tablesMap.get(id) : undefined)
          .filter((t): t is typeof tables.$inferSelect => t !== undefined),
      }
    })

    // Get pending count
    const pendingResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(eq(reservations.status, "PENDIENTE"))

    return NextResponse.json({
      reservations: reservationsWithTables,
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

// POST /api/admin/reservations - Create a new reservation (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      customerName,
      customerPhone,
      restaurantId,
      reservationDate,
      reservationTime,
      partySize,
      preferredLocation,
      specialRequests,
      source = "MANUAL",
      confirmImmediately = false,
    } = body

    // Validate required fields
    if (!customerName || !customerPhone || !restaurantId || !reservationDate || !reservationTime || !partySize) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Find or create customer
    let customer = await db.query.customers.findFirst({
      where: eq(customers.phoneNumber, customerPhone),
    })

    if (!customer) {
      const [newCustomer] = await db.insert(customers).values({
        phoneNumber: customerPhone,
        name: customerName,
      }).returning()
      customer = newCustomer
    }

    // Find active service for the date/time
    const dayOfWeek = new Date(reservationDate).getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    const service = await db.query.services.findFirst({
      where: and(
        eq(services.restaurantId, restaurantId),
        eq(services.isActive, true),
        or(
          eq(services.dayType, "all"),
          eq(services.dayType, isWeekend ? "weekend" : "weekday")
        ),
        sql`${services.startTime}::time <= ${reservationTime}::time`,
        sql`${services.endTime}::time > ${reservationTime}::time`
      ),
    })

    // Find suitable tables
    const allTables = await db.query.tables.findMany({
      where: eq(tables.restaurantId, restaurantId),
    })

    // Filter by capacity and preferred location
    const suitableTables = allTables.filter((t) =>
      t.capacity >= partySize &&
      (!preferredLocation || t.location === preferredLocation)
    )

    if (suitableTables.length === 0) {
      const locationMsg = preferredLocation
        ? ` en ${preferredLocation}`
        : ""
      return NextResponse.json(
        { error: `No hay mesas disponibles${locationMsg} para ${partySize} personas` },
        { status: 400 }
      )
    }

    // Assign the smallest suitable table
    const assignedTable = suitableTables.sort((a, b) => a.capacity - b.capacity)[0]

    // Generate reservation code
    const reservationCode = generateReservationCode()

    // Determine status
    const status = confirmImmediately ? "CONFIRMADO" : "PENDIENTE"

    // Create reservation
    const [newReservation] = await db.insert(reservations).values({
      reservationCode,
      customerId: customer.id,
      customerName,
      customerPhone,
      restaurantId,
      reservationDate,
      reservationTime,
      partySize,
      tableIds: [assignedTable.id],
      status,
      source,
      serviceId: service?.id,
      estimatedDurationMinutes: service?.defaultDurationMinutes || 90,
      specialRequests,
      confirmedAt: confirmImmediately ? new Date() : undefined,
    }).returning()

    // Create history entry
    if (confirmImmediately) {
      await db.insert(reservationHistory).values({
        reservationId: newReservation.id,
        oldStatus: null,
        newStatus: "CONFIRMADO",
        changedBy: "admin",
        metadata: { method: "create_immediately" },
      })
    }

    return NextResponse.json({
      reservation: {
        ...newReservation,
        tables: [assignedTable],
      },
    }, { status: 201 })
  } catch (error) {
    console.error("[Admin Reservations POST] Error:", error)
    return NextResponse.json(
      { error: "Error al crear reserva" },
      { status: 500 }
    )
  }
}
