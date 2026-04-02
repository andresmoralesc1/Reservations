/**
 * Table Service
 *
 * Gestión de mesas - CRUD básico y disponibilidad
 *
 * NOTA: La lógica de disponibilidad está centralizada en
 * @/lib/availability/services-availability.ts para mantener
 * un único algoritmo de asignación de mesas.
 */

import { db } from "@/lib/db"
import { tables, reservations } from "@/drizzle/schema"
import { eq, and, inArray, isNull } from "drizzle-orm"
import { servicesAvailability, type Table as AvailabilityTable } from "@/lib/availability/services-availability"

export interface TableAvailability {
  tableId: string
  tableCode: string
  capacity: number
  location: string | null
  isAvailable: boolean
  currentReservation?: {
    id: string
    reservationCode: string
    customerName: string
    partySize: number
    reservationTime: string
  }
}

export interface AssignTableInput {
  reservationId: string
  tableIds: string[]
}

/**
 * Obtener todas las mesas de un restaurante
 */
export async function getTables(restaurantId: string) {
  return await db.query.tables.findMany({
    where: and(eq(tables.restaurantId, restaurantId), isNull(tables.deletedAt)),
    orderBy: [tables.tableNumber],
  })
}

/**
 * Obtener una mesa por ID
 */
export async function getTableById(id: string) {
  const table = await db.query.tables.findFirst({
    where: eq(tables.id, id),
  })

  if (!table) {
    throw new Error("Mesa no encontrada")
  }

  return table
}

/**
 * Obtener mesas disponibles para una fecha/hora específica.
 *
 * DELEGADO a services-availability.ts para mantener un único
 * algoritmo de disponibilidad que considere:
 * - Servicios activos (comida/cena)
 * - Temporadas y días
 * - Scoring de mesas (perfect fit, overcapacity)
 * - Bloqueos y reservas existentes
 *
 * @param restaurantId ID del restaurante
 * @param date Fecha en formato YYYY-MM-DD
 * @param time Hora en formato HH:MM
 * @param partySize Número de personas
 * @param duration Duración en minutos (ignorado, se usa service.duration)
 * @returns Array de mesas disponibles ordenadas por mejor ajuste
 */
export async function getAvailableTables(
  restaurantId: string,
  date: string,
  time: string,
  partySize: number,
  duration?: number // Ignorado - se usa service.defaultDurationMinutes
) {
  const result = await servicesAvailability.checkAvailabilityWithServices({
    restaurantId,
    date,
    time,
    partySize,
  })

  if (!result.available) {
    return []
  }

  return result.availableTables
}

/**
 * Obtener disponibilidad detallada con estado actual.
 *
 * Combina la lista completa de mesas con su estado de disponibilidad
 * calculado por services-availability.ts
 */
export async function getTablesWithAvailability(
  restaurantId: string,
  date: string,
  time: string
): Promise<TableAvailability[]> {
  const allTables = await getTables(restaurantId)

  // Obtener mesas disponibles usando el algoritmo unificado
  const availabilityResult = await servicesAvailability.checkAvailabilityWithServices({
    restaurantId,
    date,
    time,
    partySize: 1, // Usamos 1 para ver todas las mesas que podrían estar disponibles
  })

  const availableIds = new Set(availabilityResult.availableTableIds || [])

  // Obtener reservas actuales en este horario
  const currentReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.reservationDate, date),
      eq(reservations.reservationTime, time),
      inArray(reservations.status, ["CONFIRMADO", "PENDIENTE"])
    ),
  })

  return allTables.map((table) => {
    const currentRes = currentReservations.find((r) => r.tableIds?.includes(table.id))
    return {
      tableId: table.id,
      tableCode: table.tableCode,
      capacity: table.capacity,
      location: table.location,
      isAvailable: availableIds.has(table.id),
      currentReservation: currentRes ? {
        id: currentRes.id,
        reservationCode: currentRes.reservationCode,
        customerName: currentRes.customerName,
        partySize: currentRes.partySize,
        reservationTime: currentRes.reservationTime,
      } : undefined,
    }
  })
}

/**
 * Asignar mesas a una reserva
 */
export async function assignTablesToReservation(input: AssignTableInput) {
  const [updated] = await db
    .update(reservations)
    .set({
      tableIds: input.tableIds,
      updatedAt: new Date(),
    })
    .where(eq(reservations.id, input.reservationId))
    .returning()

  return updated
}

/**
 * Crear nueva mesa
 */
export async function createTable(data: {
  restaurantId: string
  tableNumber: string
  tableCode: string
  capacity: number
  location?: string
  shape?: string
  positionX?: number
  positionY?: number
}) {
  const [newTable] = await db.insert(tables).values(data).returning()
  return newTable
}

/**
 * Actualizar mesa
 */
export async function updateTable(id: string, data: Partial<typeof tables.$inferInsert>) {
  const [updated] = await db
    .update(tables)
    .set(data)
    .where(eq(tables.id, id))
    .returning()

  return updated
}

/**
 * Eliminar mesa (soft delete)
 */
export async function deleteTable(id: string, deletedBy: string) {
  await db
    .update(tables)
    .set({
      deletedAt: new Date(),
      deletedBy,
    })
    .where(eq(tables.id, id))

  return { success: true }
}

/**
 * Crear múltiples mesas (bulk)
 */
export async function createBulkTables(
  tableList: Array<{
    restaurantId: string
    tableNumber: string
    tableCode: string
    capacity: number
    location?: string
  }>
) {
  const result = await db.insert(tables).values(tableList).returning()
  return result
}

/**
 * Encuentra la mejor mesa para un grupo.
 *
 * DELEGADO a services-availability.ts que implementa
 * el algoritmo de scoring (perfect fit, overcapacity).
 *
 * @returns La mejor mesa o null si no hay disponibilidad
 */
export async function findBestTable(
  restaurantId: string,
  date: string,
  time: string,
  partySize: number
) {
  const result = await servicesAvailability.checkAvailabilityWithServices({
    restaurantId,
    date,
    time,
    partySize,
  })

  if (!result.available || result.suggestedTables.length === 0) {
    return null
  }

  // suggestedTables ya contiene los IDs de las mejores mesas
  // según el algoritmo de scoring de services-availability
  const bestTableId = result.suggestedTables[0]

  return result.availableTables.find((t) => t.id === bestTableId) || null
}

// Re-export types from services-availability for convenience
export type { Service, ServiceAvailabilityResult } from "@/lib/availability/services-availability"
