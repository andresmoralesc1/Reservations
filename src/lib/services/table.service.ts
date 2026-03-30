/**
 * Table Service
 *
 * Gestión de mesas - asignación, liberación, disponibilidad
 */

import { db } from "@/lib/db"
import { tables, reservations } from "@/drizzle/schema"
import { eq, and, inArray, sql, isNull } from "drizzle-orm"

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
 * Obtener mesas disponibles para una fecha/hora específica
 */
export async function getAvailableTables(
  restaurantId: string,
  date: string,
  time: string,
  partySize: number,
  duration: number = 90 // minutos
) {
  // 1. Obtener todas las mesas activas del restaurante
  const allTables = await db.query.tables.findMany({
    where: and(
      eq(tables.restaurantId, restaurantId),
      isNull(tables.deletedAt)
    ),
  })

  // 2. Filtrar por capacidad
  const suitableTables = allTables.filter((t) => t.capacity >= partySize)

  // 3. Obtener reservas confirmadas para esa fecha
  const dayReservations = await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.reservationDate, date),
      inArray(reservations.status, ["CONFIRMADO", "PENDIENTE"])
    ),
  })

  // 4. Calcular mesas ocupadas en el horario
  const reservedTableIds = new Set<string>()

  for (const reservation of dayReservations) {
    const resTime = reservation.reservationTime // HH:MM
    const resDuration = reservation.estimatedDurationMinutes || 90

    // Convertir a minutos desde las 00:00
    const [hours, minutes] = resTime.split(":").map(Number)
    const reservationStart = hours * 60 + minutes
    const reservationEnd = reservationStart + resDuration

    // Convertir la hora solicitada a minutos
    const [reqHours, reqMinutes] = time.split(":").map(Number)
    const requestStart = reqHours * 60 + reqMinutes
    const requestEnd = requestStart + duration

    // Verificar si hay solapamiento
    const overlaps = (
      reservationStart < requestEnd && reservationEnd > requestStart
    )

    if (overlaps && reservation.tableIds) {
      reservation.tableIds.forEach((id) => reservedTableIds.add(id))
    }
  }

  // 5. Retornar mesas disponibles
  return suitableTables.filter((t) => !reservedTableIds.has(t.id))
}

/**
 * Obtener disponibilidad detallada con estado actual
 */
export async function getTablesWithAvailability(
  restaurantId: string,
  date: string,
  time: string
): Promise<TableAvailability[]> {
  const allTables = await getTables(restaurantId)
  const availableTables = await getAvailableTables(restaurantId, date, time, 1)

  const availableIds = new Set(availableTables.map((t) => t.id))

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
  // Drizzle ORM bulk insert
  const result = await db.insert(tables).values(tableList).returning()
  return result
}
