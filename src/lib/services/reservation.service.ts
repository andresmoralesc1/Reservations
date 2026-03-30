/**
 * Reservation Service
 *
 * Lógica de negocio centralizada para gestión de reservas.
 * Las API routes deben ser solo una capa fina que valida input → llama a este servicio → devuelve response.
 */

import { db } from "@/lib/db"
import { reservations, customers } from "@/drizzle/schema"
import { eq, and, gte, lte, sql, desc, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"

// Types
export interface CreateReservationInput {
  customerName: string
  customerPhone: string
  reservationDate: string // YYYY-MM-DD
  reservationTime: string // HH:MM
  partySize: number
  restaurantId: string
  source?: string
  specialRequests?: string
  tableIds?: string[]
  serviceId?: string
}

export interface UpdateReservationInput {
  status?: string
  specialRequests?: string
  tableIds?: string[]
  estimatedDurationMinutes?: number
}

export interface ReservationFilters {
  restaurantId: string
  date?: string
  status?: string
  startDate?: string
  endDate?: string
  limit?: number
}

// Errors
export class ReservationError extends Error {
  constructor(message: string, public code: string = "RESERVATION_ERROR") {
    super(message)
    this.name = "ReservationError"
  }
}

export class ReservationNotFoundError extends ReservationError {
  constructor(message = "Reserva no encontrada") {
    super(message, "NOT_FOUND")
    this.name = "ReservationNotFoundError"
  }
}

/**
 * Crear una nueva reserva
 */
export async function createReservation(input: CreateReservationInput) {
  // 1. Buscar o crear cliente
  let customer = await db.query.customers.findFirst({
    where: eq(customers.phoneNumber, input.customerPhone),
  })

  if (!customer) {
    const [newCustomer] = await db
      .insert(customers)
      .values({
        phoneNumber: input.customerPhone,
        name: input.customerName,
        gdprConsentedAt: new Date(),
      })
      .returning()
    customer = newCustomer
  }

  // 2. Generar código único
  const reservationCode = `RES-${nanoid(5).toUpperCase()}`

  // 3. Crear reserva
  const [reservation] = await db
    .insert(reservations)
    .values({
      reservationCode,
      customerId: customer.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      restaurantId: input.restaurantId,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      partySize: input.partySize,
      status: "PENDIENTE",
      source: input.source || "MANUAL",
      specialRequests: input.specialRequests,
      tableIds: input.tableIds,
      serviceId: input.serviceId,
    })
    .returning()

  return reservation
}

/**
 * Buscar reserva por código
 */
export async function getReservationByCode(code: string) {
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.reservationCode, code),
    with: {
      tables: true,
    },
  })

  if (!reservation) {
    throw new ReservationNotFoundError(`Reserva con código ${code} no encontrada`)
  }

  return reservation
}

/**
 * Buscar reserva por ID
 */
export async function getReservationById(id: string) {
  const reservation = await db.query.reservations.findFirst({
    where: eq(reservations.id, id),
    with: {
      tables: true,
    },
  })

  if (!reservation) {
    throw new ReservationNotFoundError()
  }

  return reservation
}

/**
 * Listar reservas con filtros
 */
export async function listReservations(filters: ReservationFilters) {
  const { restaurantId, date, status, startDate, endDate, limit = 50 } = filters

  const conditions = [eq(reservations.restaurantId, restaurantId)]

  if (date) {
    conditions.push(eq(reservations.reservationDate, date))
  }

  if (status) {
    conditions.push(eq(reservations.status, status))
  }

  if (startDate && endDate) {
    conditions.push(
      sql`${reservations.reservationDate} >= ${startDate} AND ${reservations.reservationDate} <= ${endDate}`
    )
  }

  const results = await db.query.reservations.findMany({
    where: and(...conditions),
    orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
    limit,
  })

  return results
}

/**
 * Aprobar reserva
 */
export async function approveReservation(id: string) {
  const existing = await getReservationById(id)

  if (existing.status === "CONFIRMADO") {
    return existing // Ya está aprobada
  }

  const [updated] = await db
    .update(reservations)
    .set({
      status: "CONFIRMADO",
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reservations.id, id))
    .returning()

  return updated
}

/**
 * Rechazar reserva
 */
export async function rejectReservation(id: string, reason?: string) {
  const existing = await getReservationById(id)

  const [updated] = await db
    .update(reservations)
    .set({
      status: "CANCELADO",
      cancelledAt: new Date(),
      updatedAt: new Date(),
      specialRequests: existing.specialRequests
        ? `${existing.specialRequests}\n\nRechazado: ${reason || "Sin razón especificada"}`
        : `Rechazado: ${reason || "Sin razón especificada"}`,
    })
    .where(eq(reservations.id, id))
    .returning()

  return updated
}

/**
 * Cancelar reserva
 */
export async function cancelReservation(id: string, reason?: string) {
  const existing = await getReservationById(id)

  if (existing.status === "CANCELADO") {
    return existing
  }

  const [updated] = await db
    .update(reservations)
    .set({
      status: "CANCELADO",
      cancelledAt: new Date(),
      updatedAt: new Date(),
      specialRequests: reason
        ? `${existing.specialRequests || ""}\n\nCancelado: ${reason}`
        : existing.specialRequests,
    })
    .where(eq(reservations.id, id))
    .returning()

  return updated
}

/**
 * Marcar reserva como No Show
 */
export async function markNoShow(id: string) {
  const existing = await getReservationById(id)

  // Incrementar contador de no-show del cliente
  if (existing.customerId) {
    await db
      .update(customers)
      .set({
        noShowCount: sql`${customers.noShowCount} + 1`,
      })
      .where(eq(customers.id, existing.customerId))
  }

  const [updated] = await db
    .update(reservations)
    .set({
      status: "NO_SHOW",
      updatedAt: new Date(),
    })
    .where(eq(reservations.id, id))
    .returning()

  return updated
}

/**
 * Actualizar reserva
 */
export async function updateReservation(id: string, input: UpdateReservationInput) {
  await getReservationById(id) // Verifica que existe

  const [updated] = await db
    .update(reservations)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(reservations.id, id))
    .returning()

  return updated
}

/**
 * Asignar mesas a una reserva
 */
export async function assignTables(id: string, tableIds: string[]) {
  await getReservationById(id)

  const [updated] = await db
    .update(reservations)
    .set({
      tableIds,
      updatedAt: new Date(),
    })
    .where(eq(reservations.id, id))
    .returning()

  return updated
}

/**
 * Eliminar reserva (soft delete)
 */
export async function deleteReservation(id: string, deletedBy: string) {
  await getReservationById(id)

  await db
    .update(reservations)
    .set({
      deletedAt: new Date(),
      deletedBy,
    })
    .where(eq(reservations.id, id))

  return { success: true }
}

/**
 * Contar reservas por estado
 */
export async function countByStatus(restaurantId: string, date: string) {
  const result = await db
    .select({ status: reservations.status, count: sql<number>`count(*)` })
    .from(reservations)
    .where(and(eq(reservations.restaurantId, restaurantId), eq(reservations.reservationDate, date)))
    .groupBy(reservations.status)

  const rows = await result

  return rows.reduce((acc, row) => {
    acc[row.status] = Number(row.count)
    return acc
  }, {} as Record<string, number>)
}

/**
 * Obtener reservas de un rango de fechas
 */
export async function getReservationsByDateRange(
  restaurantId: string,
  startDate: string,
  endDate: string
) {
  return await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      sql`${reservations.reservationDate} >= ${startDate} AND ${reservations.reservationDate} <= ${endDate}`
    ),
    orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
  })
}

/**
 * Buscar reservas pendientes
 */
export async function getPendingReservations(restaurantId: string, fromDate: string) {
  return await db.query.reservations.findMany({
    where: and(
      eq(reservations.restaurantId, restaurantId),
      eq(reservations.status, "PENDIENTE"),
      sql`${reservations.reservationDate} >= ${fromDate}`
    ),
    orderBy: [reservations.reservationDate, reservations.reservationTime],
  })
}
