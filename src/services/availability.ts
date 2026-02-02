import { db } from "@/lib/db"
import { tables, reservations, restaurants } from "@/drizzle/schema"
import { eq, and, gte, lte, sql, inArray, or } from "drizzle-orm"
import { addMinutes, parse } from "date-fns"

export interface TimeSlot {
  time: string
  available: boolean
  availableTables: string[]
}

export interface AvailabilityResult {
  available: boolean
  suggestedTables?: string[]
  alternativeSlots?: TimeSlot[]
  reason?: string
}

// Standard reservation duration in minutes
const RESERVATION_DURATION_MINUTES = 120

export class AvailabilityChecker {
  /**
   * Check availability for a reservation request
   */
  async checkAvailability(params: {
    restaurantId: string
    date: string // YYYY-MM-DD
    time: string // HH:MM
    partySize: number
    excludeReservationId?: string // For modifications
  }): Promise<AvailabilityResult> {
    const { restaurantId, date, time, partySize, excludeReservationId } = params

    // Get restaurant
    const restaurant = await db.query.restaurants.findFirst({
      where: eq(restaurants.id, restaurantId),
    })

    if (!restaurant) {
      return { available: false, reason: "Restaurante no encontrado" }
    }

    // Get all tables for this restaurant with sufficient capacity
    const allTables = await db.query.tables.findMany({
      where: eq(tables.restaurantId, restaurantId),
    })

    // Filter tables that can accommodate the party size
    const suitableTables = allTables.filter((t) => t.capacity >= partySize)

    if (suitableTables.length === 0) {
      return {
        available: false,
        reason: `No hay mesas disponibles para ${partySize} personas`,
      }
    }

    // Calculate time range
    const startTime = parse(time, "HH:mm", new Date())
    const endTime = addMinutes(startTime, RESERVATION_DURATION_MINUTES)

    // Get conflicting reservations
    const conflictingReservations = await this.getConflictingReservations({
      restaurantId,
      date,
      startTime: time,
      endTime: `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`,
      excludeReservationId,
    })

    // Get occupied table IDs
    const occupiedTableIds = new Set<string>()
    for (const res of conflictingReservations) {
      if (res.tableIds) {
        res.tableIds.forEach((id) => occupiedTableIds.add(id))
      }
    }

    // Find available tables
    const availableTables = suitableTables.filter((t) => !occupiedTableIds.has(t.id))

    if (availableTables.length === 0) {
      // Find alternative time slots
      const alternatives = await this.findAlternativeSlots({
        restaurantId,
        date,
        time,
        partySize,
        excludeReservationId,
      })

      return {
        available: false,
        reason: "No hay mesas disponibles para la hora seleccionada",
        alternativeSlots: alternatives,
      }
    }

    // Prioritize tables by capacity (smallest suitable table first)
    availableTables.sort((a, b) => a.capacity - b.capacity)

    // For larger parties, combine tables if needed
    const selectedTables = this.selectOptimalTables(availableTables, partySize)

    return {
      available: true,
      suggestedTables: selectedTables,
    }
  }

  /**
   * Get reservations that conflict with the given time range
   */
  private async getConflictingReservations(params: {
    restaurantId: string
    date: string
    startTime: string
    endTime: string
    excludeReservationId?: string
  }) {
    const { restaurantId, date, startTime, endTime, excludeReservationId } = params

    const conditions = [
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.reservationDate, date),
      sql`${reservations.reservationTime} < ${endTime}`,
      sql`(
        ${reservations.reservationTime} || '+' || '120 minutes' > ${startTime}
      )`,
      or(
        eq(reservations.status, "PENDIENTE"),
        eq(reservations.status, "CONFIRMADO")
      ),
    ]

    if (excludeReservationId) {
      conditions.push(sql`${reservations.id} != ${excludeReservationId}`)
    }

    return db.query.reservations.findMany({
      where: and(...conditions),
    })
  }

  /**
   * Find alternative time slots near the requested time
   */
  async findAlternativeSlots(params: {
    restaurantId: string
    date: string
    time: string
    partySize: number
    excludeReservationId?: string
  }): Promise<TimeSlot[]> {
    const { restaurantId, date, time, partySize, excludeReservationId } = params

    const slots: TimeSlot[] = []
    const baseTime = parse(time, "HH:mm", new Date())

    // Check slots from 2 hours before to 4 hours after
    for (let offset = -120; offset <= 240; offset += 30) {
      const slotTime = addMinutes(baseTime, offset)
      const timeStr = `${String(slotTime.getHours()).padStart(2, "0")}:${String(slotTime.getMinutes()).padStart(2, "0")}`

      if (timeStr === time) continue // Skip the original time

      const availability = await this.checkAvailability({
        restaurantId,
        date,
        time: timeStr,
        partySize,
        excludeReservationId,
      })

      slots.push({
        time: timeStr,
        available: availability.available,
        availableTables: availability.suggestedTables || [],
      })
    }

    return slots
  }

  /**
   * Select optimal table assignment for a party
   */
  private selectOptimalTables(availableTables: typeof tables.$inferSelect[], partySize: number): string[] {
    // Try to find a single table that fits
    const perfectFit = availableTables.find((t) => t.capacity >= partySize && t.capacity <= partySize + 2)
    if (perfectFit) {
      return [perfectFit.id]
    }

    // Use smallest suitable table
    const smallestTable = availableTables[0]
    if (smallestTable.capacity >= partySize) {
      return [smallestTable.id]
    }

    // Combine tables for large parties
    const selectedTables: string[] = []
    let totalCapacity = 0

    for (const table of availableTables) {
      selectedTables.push(table.id)
      totalCapacity += table.capacity

      if (totalCapacity >= partySize) {
        break
      }
    }

    return selectedTables
  }

  /**
   * Get available tables for a specific date/time
   */
  async getAvailableTables(params: {
    restaurantId: string
    date: string
    time: string
  }) {
    const { restaurantId, date, time } = params

    const allTables = await db.query.tables.findMany({
      where: eq(tables.restaurantId, restaurantId),
    })

    const startTime = parse(time, "HH:mm", new Date())
    const endTime = addMinutes(startTime, RESERVATION_DURATION_MINUTES)
    const endTimeStr = `${String(endTime.getHours()).padStart(2, "0")}:${String(endTime.getMinutes()).padStart(2, "0")}`

    const conflictingReservations = await this.getConflictingReservations({
      restaurantId,
      date,
      startTime: time,
      endTime: endTimeStr,
    })

    const occupiedTableIds = new Set<string>()
    for (const res of conflictingReservations) {
      if (res.tableIds) {
        res.tableIds.forEach((id) => occupiedTableIds.add(id))
      }
    }

    return allTables.filter((t) => !occupiedTableIds.has(t.id))
  }
}

export const availabilityChecker = new AvailabilityChecker()
