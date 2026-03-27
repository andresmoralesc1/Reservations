import { db } from "@/lib/db"
import { tables, reservations, services, tableBlocks } from "@/drizzle/schema"
import { eq, and, or, gte, lte, sql, inArray } from "drizzle-orm"
import { addMinutes, parse, format } from "date-fns"

// =====================================================
// TYPES
// =====================================================

export interface AvailabilityResult {
  available: boolean
  reason?: 'no_service' | 'outside_hours' | 'no_tables' | 'fully_booked'
  tables?: TableInfo[]
  count?: number
  suggestedTimes?: string[]
  service?: ServiceInfo
  activeServices?: ServiceInfo[]
  message: string
}

export interface ServiceInfo {
  id: string
  name: string
  start: string
  end: string
  duration: number
  type: string
}

export interface TableInfo {
  id: string
  tableNumber: string
  tableCode: string
  capacity: number
  location: string
}

// =====================================================
// FUNCTION 1: getActiveServicesForDate
// =====================================================

export async function getActiveServicesForDate(
  restaurantId: string,
  date: string
): Promise<ServiceInfo[]> {
  // Get all active services for the restaurant
  const allServices = await db.query.services.findMany({
    where: and(
      eq(services.restaurantId, restaurantId),
      eq(services.isActive, true)
    ),
  })

  // Parse the requested date
  const requestedDate = new Date(date)
  const dayOfWeek = requestedDate.getDay() // 0 = Sunday, 6 = Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const month = requestedDate.getMonth() + 1 // 1-12

  // Determine season from month (northern hemisphere)
  const season = getSeasonFromMonth(month)

  // Filter services that apply to this date
  const applicableServices = allServices.filter((service) => {
    // Check day type
    if (service.dayType === 'weekday' && isWeekend) return false
    if (service.dayType === 'weekend' && !isWeekend) return false

    // Check season
    if (service.season && service.season !== 'todos') {
      if (service.season !== season) return false
    }

    // Check date range if specified
    if (service.dateRange) {
      const { start, end } = service.dateRange
      if (date < start || date > end) return false
    }

    return true
  })

  // Return formatted services
  return applicableServices.map((s) => ({
    id: s.id,
    name: s.name,
    start: s.startTime,
    end: s.endTime,
    duration: s.defaultDurationMinutes,
    type: s.serviceType,
  }))
}

function getSeasonFromMonth(month: number): string {
  if (month >= 3 && month <= 5) return 'primavera'
  if (month >= 6 && month <= 8) return 'verano'
  if (month >= 9 && month <= 11) return 'otoño'
  return 'invierno'
}

// =====================================================
// FUNCTION 2: getAvailableTablesForSlot
// =====================================================

export async function getAvailableTablesForSlot(
  restaurantId: string,
  date: string,
  time: string,
  partySize: number,
  durationMinutes: number
): Promise<TableInfo[]> {
  // Get all tables for the restaurant with sufficient capacity
  const allTables = await db.query.tables.findMany({
    where: eq(tables.restaurantId, restaurantId),
  })

  // Filter by capacity
  const suitableTables = allTables.filter((t) => t.capacity >= partySize)

  if (suitableTables.length === 0) {
    return []
  }

  // Calculate time window for the requested slot
  const startTime = parse(time, 'HH:mm', new Date())
  const endTime = addMinutes(startTime, durationMinutes)
  const endTimeStr = format(endTime, 'HH:mm')

  // Get table blocks for this date
  const blockedTableIds = new Set<string>()
  const blocks = await db.query.tableBlocks.findMany({
    where: eq(tableBlocks.blockDate, date),
  })

  // Filter blocks that overlap with requested time
  for (const block of blocks) {
    const blockStart = block.startTime
    const blockEnd = block.endTime

    // Check overlap: start_A < end_B AND start_B < end_A
    if (time < blockEnd && endTimeStr > blockStart) {
      blockedTableIds.add(block.tableId)
    }
  }

  // Get conflicting reservations
  const conflictingReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.reservationDate, date),
      sql`${reservations.reservationTime} < ${endTimeStr}`,
      sql`(${reservations.reservationTime}::time + interval '1 minute' * ${reservations.estimatedDurationMinutes} > ${time}::time)`,
      or(
        eq(reservations.status, 'PENDIENTE'),
        eq(reservations.status, 'CONFIRMADO')
      )
    ),
  })

  // Get occupied table IDs from reservations
  const occupiedTableIds = new Set<string>()
  for (const res of conflictingReservations) {
    if (res.tableIds) {
      res.tableIds.forEach((id) => occupiedTableIds.add(id))
    }
  }

  // Filter tables: not blocked and not occupied
  const availableTables = suitableTables.filter((t) =>
    !blockedTableIds.has(t.id) && !occupiedTableIds.has(t.id)
  )

  return availableTables.map((t) => ({
    id: t.id,
    tableNumber: t.tableNumber,
    tableCode: t.tableCode,
    capacity: t.capacity,
    location: t.location || 'interior',
  }))
}

// =====================================================
// FUNCTION 3: findAlternativeSlots
// =====================================================

export async function findAlternativeSlots(
  restaurantId: string,
  date: string,
  partySize: number,
  service: ServiceInfo,
  excludeTime?: string
): Promise<string[]> {
  const availableSlots: string[] = []

  // Parse service start and end times
  const serviceStart = parse(service.start, 'HH:mm', new Date())
  const serviceEnd = parse(service.end, 'HH:mm', new Date())

  // Generate 30-minute slots within service hours
  let currentSlot = serviceStart

  while (currentSlot < serviceEnd) {
    const slotTimeStr = format(currentSlot, 'HH:mm')

    // Calculate when this slot would end
    const slotEndTime = addMinutes(currentSlot, service.duration)

    // Skip if slot would end after service closes
    if (slotEndTime > serviceEnd) {
      currentSlot = addMinutes(currentSlot, 30)
      continue
    }

    // Skip the excluded time
    if (slotTimeStr === excludeTime) {
      currentSlot = addMinutes(currentSlot, 30)
      continue
    }

    // Check availability for this slot
    const tables = await getAvailableTablesForSlot(
      restaurantId,
      date,
      slotTimeStr,
      partySize,
      service.duration
    )

    if (tables.length > 0) {
      availableSlots.push(slotTimeStr)

      // Return first 3 available slots
      if (availableSlots.length >= 3) {
        break
      }
    }

    currentSlot = addMinutes(currentSlot, 30)
  }

  return availableSlots
}

// =====================================================
// FUNCTION 4: checkAvailability (MAIN ORCHESTRATOR)
// =====================================================

export async function checkAvailability(params: {
  restaurantId: string
  date: string
  time: string
  partySize: number
}): Promise<AvailabilityResult> {
  const { restaurantId, date, time, partySize } = params

  try {
    // Step 1: Get active services for the date
    const activeServices = await getActiveServicesForDate(restaurantId, date)

    if (activeServices.length === 0) {
      return {
        available: false,
        reason: 'no_service',
        message: 'No hay servicio para esa fecha',
        activeServices: [],
      }
    }

    // Step 2: Check if requested time falls within any service
    const matchingService = findServiceForTime(activeServices, time)

    if (!matchingService) {
      const hoursList = activeServices
        .map((s) => `${s.name}: ${s.start} - ${s.end}`)
        .join(', ')

      return {
        available: false,
        reason: 'outside_hours',
        message: `No hay servicio a las ${time}. Horarios disponibles: ${hoursList}`,
        activeServices,
      }
    }

    // Step 3: Check for available tables
    const availableTables = await getAvailableTablesForSlot(
      restaurantId,
      date,
      time,
      partySize,
      matchingService.duration
    )

    if (availableTables.length > 0) {
      return {
        available: true,
        tables: availableTables,
        count: availableTables.length,
        service: matchingService,
        message: `Hay ${availableTables.length} mesa(s) disponible(s)`,
      }
    }

    // Step 4: No tables available, find alternatives
    const alternativeSlots = await findAlternativeSlots(
      restaurantId,
      date,
      partySize,
      matchingService,
      time
    )

    if (alternativeSlots.length > 0) {
      return {
        available: false,
        reason: 'no_tables',
        suggestedTimes: alternativeSlots,
        service: matchingService,
        message: `No hay disponibilidad a las ${time}. Horarios alternativos: ${alternativeSlots.join(', ')}`,
      }
    }

    // Step 5: Fully booked
    return {
      available: false,
      reason: 'fully_booked',
      suggestedTimes: [],
      service: matchingService,
      message: 'No hay disponibilidad para esa fecha. Prueba otro día.',
    }

  } catch (error) {
    console.error('[checkAvailability] Error:', error)
    return {
      available: false,
      message: 'Error al verificar disponibilidad',
    }
  }
}

// Helper: Find which service covers the requested time
function findServiceForTime(
  services: ServiceInfo[],
  time: string
): ServiceInfo | null {
  for (const service of services) {
    if (time >= service.start && time < service.end) {
      return service
    }
  }
  return null
}

// =====================================================
// BONUS: Function for cross-selling (ready for future)
// =====================================================

export async function checkAvailabilityWithCrossSelling(params: {
  restaurantId: string
  date: string
  time: string
  partySize: number
  maxRestaurants?: number
}): Promise<AvailabilityResult & { alternatives?: Array<{ restaurant: { id: string; name: string } } & AvailabilityResult> }> {
  // Check main restaurant first
  const result = await checkAvailability(params)

  // If available, return early
  if (result.available) {
    return result
  }

  // Get other restaurants in the group
  // TODO: Implement when multi-restaurant support is needed
  // const otherRestaurants = await getOtherActiveRestaurants(params.restaurantId)
  // const alternatives = []

  // for (const restaurant of otherRestaurants.slice(0, params.maxRestaurants || 3)) {
  //   const altResult = await checkAvailability({
  //     ...params,
  //     restaurantId: restaurant.id
  //   })
  //   if (altResult.available) {
  //     alternatives.push({
  //       restaurant: { id: restaurant.id, name: restaurant.name },
  //       ...altResult
  //     })
  //   }
  // }

  return {
    ...result,
    alternatives: [],
  }
}
