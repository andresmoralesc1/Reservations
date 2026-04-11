import { db } from "@/lib/db"
import { services, tables, reservations } from "@/drizzle/schema"
import type { Table as SchemaTable } from "@/drizzle/schema"
import { eq, and, sql, or } from "drizzle-orm"
import { parse, format, addMinutes, isWeekend, isValid, parseISO } from "date-fns"
import { getCurrentSeason } from "@/lib/seasons"

export type ServiceType = 'comida' | 'cena'
export type Season = 'invierno' | 'primavera' | 'verano' | 'otoño' | 'todos'
export type DayType = 'weekday' | 'weekend' | 'all'

export interface ServiceAvailabilityResult {
  available: boolean
  availableTables: Table[]
  suggestedTables: string[]
  service: Service | null
  message?: string
  alternativeSlots?: string[]  // Solo horas disponibles como strings
  alternativeSlotsDetailed?: Array<{ time: string; available: boolean }>  // Con disponibilidad
  totalReservationsInSlot?: number
  availableTableIds?: string[]
}

export interface Service {
  id: string
  restaurantId: string
  name: string
  description: string | null
  isActive: boolean | null
  serviceType: ServiceType
  season: Season
  dayType: DayType
  startTime: string
  endTime: string
  defaultDurationMinutes: number
  bufferMinutes: number
  slotGenerationMode: 'auto' | 'manual'
  dateRange: { start: string; end: string } | null
  manualSlots: string[] | null
  availableTableIds: string[] | null
  createdAt: Date | null
  updatedAt: Date | null
}

// Re-export Table type from schema for convenience
export type Table = Pick<SchemaTable, | "id" | "restaurantId" | "tableNumber" | "tableCode" | "capacity" | "location" | "isAccessible">

export class ServicesAvailability {
  /**
   * Parse time string "HH:MM" to minutes from midnight
   */
  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Format minutes from midnight to "HH:MM"
   */
  private formatMinutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }

  /**
   * Validate if time is within service bounds
   */
  isTimeWithinService(time: string, service: Service): boolean {
    const requestedMinutes = this.parseTimeToMinutes(time)
    const startMinutes = this.parseTimeToMinutes(service.startTime)
    const endMinutes = this.parseTimeToMinutes(service.endTime)

    return requestedMinutes >= startMinutes && requestedMinutes < endMinutes
  }

  /**
   * Check if date matches service's season and dayType
   */
  isDateMatchingService(date: string, service: Service): boolean {
    const dateObj = parseISO(date)

    if (!isValid(dateObj)) {
      return false
    }

    // Check date range if specified
    if (service.dateRange) {
      const start = parseISO(service.dateRange.start)
      const end = parseISO(service.dateRange.end)
      if (dateObj < start || dateObj > end) {
        return false
      }
    }

    // Check day type
    if (service.dayType === 'weekday' && isWeekend(dateObj)) {
      return false
    }
    if (service.dayType === 'weekend' && !isWeekend(dateObj)) {
      return false
    }

    // Check season - use automatic season detection
    if (service.season === 'todos') {
      return true
    }

    const currentSeason = getCurrentSeason(dateObj)
    return service.season === currentSeason
  }

  /**
   * Get active services for a specific date and time
   * Returns services ordered by creation date (first created wins)
   */
  async getActiveServicesForDateTime(
    date: string,
    time: string,
    restaurantId: string
  ): Promise<Service[]> {
    const allServices = await db.query.services.findMany({
      where: and(
        eq(services.restaurantId, restaurantId),
        eq(services.isActive, true)
      ),
      orderBy: (services, { asc }) => [asc(services.createdAt)],
    })

    // Filter services that match the date and time
    const matchingServices = allServices.filter((service) => {
      const dateMatches = this.isDateMatchingService(date, service as Service)
      const timeMatches = this.isTimeWithinService(time, service as Service)
      return dateMatches && timeMatches
    })

    return matchingServices as Service[]
  }

  /**
   * Generate automatic time slots based on service configuration
   */
  generateAutoSlots(service: Service): string[] {
    const slots: string[] = []
    const start = this.parseTimeToMinutes(service.startTime)
    const end = this.parseTimeToMinutes(service.endTime)
    const duration = service.defaultDurationMinutes
    const buffer = service.bufferMinutes

    let current = start
    while (current + duration <= end) {
      slots.push(this.formatMinutesToTime(current))
      current += duration + buffer
    }

    return slots
  }

  /**
   * Calculate release time for a reservation
   */
  calculateReleaseTime(reservationTime: string, durationMinutes: number): string {
    const time = parse(reservationTime, 'HH:mm', new Date())
    const endTime = addMinutes(time, durationMinutes)
    return format(endTime, 'HH:mm')
  }

  /**
   * Get conflicting reservations considering service duration
   */
  private async getConflictingReservations(params: {
    restaurantId: string
    date: string
    startTime: string
    endTime: string
    service: Service
    excludeReservationId?: string
  }) {
    const { restaurantId, date, startTime, endTime, service, excludeReservationId } = params

    // Use service duration for conflict calculation
    const durationMinutes = service.defaultDurationMinutes

    const conditions = [
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.reservationDate, date),
      sql`${reservations.reservationTime} < ${endTime}`,
      // Use service duration for overlap calculation
      sql`(${reservations.reservationTime}::time + (interval '1 minute') * ${durationMinutes} > ${startTime}::time)`,
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
   * Check availability with services validation
   */
  async checkAvailabilityWithServices(params: {
    date: string
    time: string
    partySize: number
    restaurantId: string
    excludeReservationId?: string
  }): Promise<ServiceAvailabilityResult> {
    const { date, time, partySize, restaurantId, excludeReservationId } = params

    // Early return for very large parties to avoid performance issues
    // For groups > 50, direct them to call the restaurant
    if (partySize > 50) {
      return {
        available: false,
        availableTables: [],
        suggestedTables: [],
        service: null,
        message: `Para grupos de más de 50 personas, por favor contacta directamente con el restaurante para coordinar tu evento.`,
      }
    }

    // Get active services for the requested date/time
    const activeServices = await this.getActiveServicesForDateTime(date, time, restaurantId)

    if (activeServices.length === 0) {
      return {
        available: false,
        availableTables: [],
        suggestedTables: [],
        service: null,
        message: 'No hay servicio configurado para esta fecha y hora',
      }
    }

    // Use first matching service (following "first created wins" rule)
    const service = activeServices[0]

    // Get all tables for this restaurant
    const allTables = await db.query.tables.findMany({
      where: eq(tables.restaurantId, restaurantId),
    })

    // Filter by service's available tables if specified
    let candidateTables = allTables
    if (service.availableTableIds && service.availableTableIds.length > 0) {
      candidateTables = allTables.filter((t) =>
        service.availableTableIds!.includes(t.id)
      )
    }

    // Filter tables that can accommodate the party size
    const suitableTables = candidateTables.filter((t) => t.capacity >= partySize)

    if (suitableTables.length === 0) {
      return {
        available: false,
        availableTables: [],
        suggestedTables: [],
        service,
        message: `No hay mesas disponibles para ${partySize} personas en este servicio`,
      }
    }

    // Calculate time range using service duration
    const startTime = parse(time, 'HH:mm', new Date())
    const endTime = addMinutes(startTime, service.defaultDurationMinutes)
    const endTimeStr = format(endTime, 'HH:mm')

    // Get conflicting reservations
    const conflictingReservations = await this.getConflictingReservations({
      restaurantId,
      date,
      startTime: time,
      endTime: endTimeStr,
      service,
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

    // Count total reservations for this slot (demand indicator)
    const totalReservationsInSlot = conflictingReservations.length

    if (availableTables.length === 0) {
      // Find alternative slots within this service
      const alternativeSlotsDetailed = await this.findAlternativeSlotsWithinService({
        service,
        date,
        time,
        partySize,
        restaurantId,
      })

      // Filter to only available slots as strings
      const alternativeSlots = alternativeSlotsDetailed
        .filter(slot => slot.available)
        .map(slot => slot.time)

      return {
        available: false,
        availableTables: [],
        suggestedTables: [],
        service,
        message: `No hay mesas disponibles para las ${time}`,
        alternativeSlots,
        alternativeSlotsDetailed,
      }
    }

    // Sort tables by capacity (smallest first)
    availableTables.sort((a, b) => a.capacity - b.capacity)

    // Filter to only show "reasonable" tables (avoid showing huge tables for small parties)
    const reasonableTables = this.filterReasonableTables(availableTables, partySize)

    // Select optimal tables from reasonable options
    const selectedTables = this.selectOptimalTables(reasonableTables, partySize)

    return {
      available: true,
      availableTables: reasonableTables,
      suggestedTables: selectedTables,
      service,
      totalReservationsInSlot: totalReservationsInSlot,
      availableTableIds: reasonableTables.map(t => t.id),
    }
  }

  /**
   * Find alternative time slots within a service
   */
  private async findAlternativeSlotsWithinService(params: {
    service: Service
    date: string
    time: string
    partySize: number
    restaurantId: string
  }): Promise<Array<{ time: string; available: boolean }>> {
    const { service, date, time, partySize, restaurantId } = params

    // Generate all possible slots for this service
    const allSlots = service.slotGenerationMode === 'auto'
      ? this.generateAutoSlots(service)
      : (service.manualSlots || [])

    const baseTime = parse(time, 'HH:mm', new Date())
    const baseMinutes = this.parseTimeToMinutes(time)

    // Find nearby slots (within 2 hours before/after)
    // Limit to 5 closest alternatives to avoid slow recursive calls
    const nearbySlots = allSlots
      .map(slotTime => {
        const slotMinutes = this.parseTimeToMinutes(slotTime)
        const diff = slotMinutes - baseMinutes
        return { time: slotTime, diff }
      })
      .filter(slot => Math.abs(slot.diff) <= 120 && slot.diff !== 0)
      .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))
      .slice(0, 5) // Reduced from 10 to 5 for better performance
      .map(s => s.time)

    // Check availability for each slot using a simplified check
    // This avoids recursive calls that can be slow for large parties
    const results: Array<{ time: string; available: boolean }> = []

    for (const slotTime of nearbySlots) {
      // Quick check: just verify tables exist for this party size
      // Don't do full availability check to avoid slow recursion
      const slotStartTime = parse(slotTime, 'HH:mm', new Date())
      const slotEndTime = addMinutes(slotStartTime, service.defaultDurationMinutes)
      const slotEndTimeStr = format(slotEndTime, 'HH:mm')

      // Get conflicting reservations for this slot
      const conflictingReservations = await this.getConflictingReservations({
        restaurantId,
        date,
        startTime: slotTime,
        endTime: slotEndTimeStr,
        service,
      })

      // Get occupied table IDs
      const occupiedTableIds = new Set<string>()
      for (const res of conflictingReservations) {
        if (res.tableIds) {
          res.tableIds.forEach((id) => occupiedTableIds.add(id))
        }
      }

      // Get all tables and filter by service/size
      const allTables = await db.query.tables.findMany({
        where: eq(tables.restaurantId, restaurantId),
      })

      let candidateTables = allTables
      if (service.availableTableIds && service.availableTableIds.length > 0) {
        candidateTables = allTables.filter((t) =>
          service.availableTableIds!.includes(t.id)
        )
      }

      const suitableTables = candidateTables.filter((t) => t.capacity >= partySize)
      const availableTables = suitableTables.filter((t) => !occupiedTableIds.has(t.id))

      results.push({
        time: slotTime,
        available: availableTables.length > 0,
      })
    }

    return results
  }

  /**
   * Score a table for a given party size.
   * Lower score = better fit.
   * Perfect match (capacity == partySize) = 0
   * Slight overcapacity (partySize + 1-2) = 1
   * Moderate overcapacity (partySize + 3-4) = 2
   * Large overcapacity (partySize + 5+) = 3
   */
  private scoreTable(table: Table, partySize: number): number {
    const overcapacity = table.capacity - partySize

    if (overcapacity < 0) return Infinity // Cannot accommodate
    if (overcapacity === 0) return 0 // Perfect fit
    if (overcapacity <= 2) return 1 // Slight overcapacity
    if (overcapacity <= 4) return 2 // Moderate overcapacity
    return 3 // Large overcapacity (wasteful)
  }

  /**
   * Filter tables to only include "reasonable" options.
   * A table is unreasonable if there's a much better option available.
   * For example: don't offer a table of 8 for 2 people if tables of 2-4 exist.
   */
  private filterReasonableTables(availableTables: Table[], partySize: number): Table[] {
    if (availableTables.length === 0) return []

    // Score all tables
    const scoredTables = availableTables.map(t => ({
      table: t,
      score: this.scoreTable(t, partySize)
    }))

    // Find the best score (lowest)
    const bestScore = Math.min(...scoredTables.map(s => s.score))

    // Only include tables with score <= bestScore + 1
    // This means we include tables that are at most one level worse than the best option
    return scoredTables
      .filter(s => s.score <= bestScore + 1)
      .map(s => s.table)
  }

  /**
   * Count total reservations for a given slot (demand indicator)
   */
  private async countReservationsInSlot(params: {
    restaurantId: string
    date: string
    time: string
    service: Service
  }): Promise<number> {
    const { restaurantId, date, time, service } = params

    const startTime = parse(time, 'HH:mm', new Date())
    const endTime = addMinutes(startTime, service.defaultDurationMinutes)
    const endTimeStr = format(endTime, 'HH:mm')

    const conflictingReservations = await this.getConflictingReservations({
      restaurantId,
      date,
      startTime: time,
      endTime: endTimeStr,
      service,
    })

    return conflictingReservations.length
  }

  /**
   * Select optimal table assignment for a party
   */
  private selectOptimalTables(availableTables: Table[], partySize: number): string[] {
    // Try to find a single table that fits well
    const perfectFit = availableTables.find((t) =>
      t.capacity >= partySize && t.capacity <= partySize + 2
    )

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
   * Validate service configuration before saving
   */
  validateServiceConfig(service: Partial<Service>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate service type
    if (service.serviceType && !['comida', 'cena'].includes(service.serviceType)) {
      errors.push('El tipo de servicio debe ser "comida" o "cena"')
    }

    // Validate time ranges
    if (service.startTime && service.endTime) {
      const start = this.parseTimeToMinutes(service.startTime)
      const end = this.parseTimeToMinutes(service.endTime)

      if (start >= end) {
        errors.push('La hora de inicio debe ser anterior a la hora de fin')
      }

      if (service.serviceType === 'comida') {
        const comidaStart = this.parseTimeToMinutes('13:00')
        const comidaEnd = this.parseTimeToMinutes('16:00')
        if (start < comidaStart || end > comidaEnd) {
          errors.push('El servicio de comida debe estar entre 13:00 y 16:00')
        }
      }

      if (service.serviceType === 'cena') {
        const cenaStart = this.parseTimeToMinutes('20:00')
        const cenaEnd = this.parseTimeToMinutes('23:00')
        if (start < cenaStart || end > cenaEnd) {
          errors.push('El servicio de cena debe estar entre 20:00 y 23:00')
        }
      }
    }

    // Validate duration
    if (service.defaultDurationMinutes !== undefined) {
      if (service.defaultDurationMinutes < 60 || service.defaultDurationMinutes > 180) {
        errors.push('La duración debe estar entre 60 y 180 minutos')
      }
    }

    // Validate buffer
    if (service.bufferMinutes !== undefined) {
      if (service.bufferMinutes < 10 || service.bufferMinutes > 30) {
        errors.push('El tiempo de buffer debe estar entre 10 y 30 minutos')
      }
    }

    // Validate slot generation mode
    if (service.slotGenerationMode && !['auto', 'manual'].includes(service.slotGenerationMode)) {
      errors.push('El modo de generación debe ser "auto" o "manual"')
    }

    // If manual mode, manual slots are required
    if (service.slotGenerationMode === 'manual' && (!service.manualSlots || service.manualSlots.length === 0)) {
      errors.push('En modo manual, debes especificar los turnos')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

// Singleton instance
export const servicesAvailability = new ServicesAvailability()
