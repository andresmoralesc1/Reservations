import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tables, services, tableBlocks } from "@/drizzle/schema"
import { eq, and, gte, lte, sql, or } from "drizzle-orm"
import { addMinutes, parse, format } from "date-fns"

const STANDARD_TIME_SLOTS = [
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00",
]

interface TimeSlot {
  value: string
  label: string
  available: boolean
}

// GET /api/admin/availability/slots - Get available time slots for a date and party size
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get("restaurantId")
    const date = searchParams.get("date") // YYYY-MM-DD
    const partySizeParam = searchParams.get("partySize")

    if (!restaurantId || !date || !partySizeParam) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      )
    }

    const partySize = parseInt(partySizeParam)

    // Get all tables for this restaurant
    const allTables = await db.query.tables.findMany({
      where: eq(tables.restaurantId, restaurantId),
    })

    // Filter tables that can accommodate the party size
    const suitableTables = allTables.filter((t) => t.capacity >= partySize)

    if (suitableTables.length === 0) {
      return NextResponse.json({
        slots: STANDARD_TIME_SLOTS.map((time) => ({
          value: time,
          label: time,
          available: false,
        })),
      })
    }

    // Get active services for the date
    const dayOfWeek = new Date(date).getDay() // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    const activeServices = await db.query.services.findMany({
      where: and(
        eq(services.restaurantId, restaurantId),
        eq(services.isActive, true),
        or(
          eq(services.dayType, "all"),
          eq(services.dayType, isWeekend ? "weekend" : "weekday")
        )
      ),
    })

    // Filter services by date range if specified
    const validServices = activeServices.filter((service) => {
      if (!service.dateRange) return true

      const serviceStart = new Date(service.dateRange.start)
      const serviceEnd = new Date(service.dateRange.end)
      const requestedDate = new Date(date)

      return requestedDate >= serviceStart && requestedDate <= serviceEnd
    })

    if (validServices.length === 0) {
      return NextResponse.json({
        slots: STANDARD_TIME_SLOTS.map((time) => ({
          value: time,
          label: time,
          available: false,
        })),
      })
    }

    // Get all table blocks for this date
    const blockedTableIds = new Set<string>()
    const blocks = await db.query.tableBlocks.findMany({
      where: eq(tableBlocks.blockDate, date),
    })

    blocks.forEach((block) => {
      blockedTableIds.add(block.tableId)
    })

    // Get suitable tables that are NOT blocked
    const availableSuitableTables = suitableTables.filter((t) => !blockedTableIds.has(t.id))

    // Check availability for each time slot
    const slots: TimeSlot[] = await Promise.all(
      STANDARD_TIME_SLOTS.map(async (time) => {
        const availability = await checkSlotAvailability({
          restaurantId,
          date,
          time,
          partySize,
          availableTables: availableSuitableTables,
          validServices,
        })

        return {
          value: time,
          label: time,
          available: availability,
        }
      })
    )

    return NextResponse.json({ slots })
  } catch (error) {
    console.error("Error checking availability slots:", error)
    return NextResponse.json(
      { error: "Error al verificar disponibilidad" },
      { status: 500 }
    )
  }
}

async function checkSlotAvailability(params: {
  restaurantId: string
  date: string
  time: string
  partySize: number
  availableTables: typeof tables.$inferSelect[]
  validServices: typeof services.$inferSelect[]
}): Promise<boolean> {
  const { restaurantId, date, time, partySize, availableTables, validServices } = params

  // Check if time falls within any service window
  const matchingService = validServices.find((service) => {
    return time >= service.startTime && time < service.endTime
  })

  if (!matchingService) {
    return false
  }

  const startTime = parse(time, "HH:mm", new Date())
  const duration = matchingService.defaultDurationMinutes || 120
  const endTime = addMinutes(startTime, duration)
  const endTimeStr = format(endTime, "HH:mm")

  // Get conflicting reservations
  const { reservations } = await import("@/drizzle/schema")

  const conflicting = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, params.restaurantId),
      eq(reservations.reservationDate, date),
      sql`${reservations.reservationTime} < ${endTimeStr}`,
      sql`(${reservations.reservationTime}::time + interval '120 minutes' > ${time}::time)`,
      or(
        eq(reservations.status, "PENDIENTE"),
        eq(reservations.status, "CONFIRMADO")
      )
    ),
  })

  // Get occupied table IDs
  const occupiedTableIds = new Set<string>()
  for (const res of conflicting) {
    if (res.tableIds) {
      res.tableIds.forEach((id) => occupiedTableIds.add(id))
    }
  }

  // Find available tables
  const freeTables = availableTables.filter((t) => !occupiedTableIds.has(t.id))

  if (freeTables.length === 0) {
    return false
  }

  // Check if we can accommodate the party size
  const totalCapacity = freeTables.reduce((sum, t) => sum + t.capacity, 0)
  return totalCapacity >= partySize
}
