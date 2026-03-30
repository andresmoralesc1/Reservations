/**
 * Customer Service
 *
 * Gestión de clientes y su historial (no-shows, tags, etc.)
 */

import { db } from "@/lib/db"
import { customers, reservations } from "@/drizzle/schema"
import { eq, sql, desc } from "drizzle-orm"

export interface CustomerInput {
  phoneNumber: string
  name?: string
  gdprConsentedAt?: Date
}

export interface CustomerStats {
  totalReservations: number
  confirmedReservations: number
  noShowCount: number
  cancellationCount: number
  lastVisitDate?: string
  averagePartySize: number
}

/**
 * Buscar o crear cliente por teléfono
 */
export async function findOrCreateCustomer(input: CustomerInput) {
  let customer = await db.query.customers.findFirst({
    where: eq(customers.phoneNumber, input.phoneNumber),
  })

  if (!customer && input.name) {
    const [newCustomer] = await db
      .insert(customers)
      .values({
        phoneNumber: input.phoneNumber,
        name: input.name,
        gdprConsentedAt: input.gdprConsentedAt || new Date(),
      })
      .returning()
    customer = newCustomer
  }

  return customer
}

/**
 * Obtener cliente por teléfono
 */
export async function getCustomerByPhone(phoneNumber: string) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.phoneNumber, phoneNumber),
  })

  if (!customer) {
    throw new Error("Cliente no encontrado")
  }

  return customer
}

/**
 * Obtener cliente por ID
 */
export async function getCustomerById(id: string) {
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, id),
  })

  if (!customer) {
    throw new Error("Cliente no encontrado")
  }

  return customer
}

/**
 * Actualizar cliente
 */
export async function updateCustomer(phoneNumber: string, data: Partial<typeof customers.$inferInsert>) {
  const [updated] = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.phoneNumber, phoneNumber))
    .returning()

  return updated
}

/**
 * Incrementar contador de no-show
 */
export async function incrementNoShowCount(phoneNumber: string) {
  const [updated] = await db
    .update(customers)
    .set({
      noShowCount: sql`${customers.noShowCount} + 1`,
    })
    .where(eq(customers.phoneNumber, phoneNumber))
    .returning()

  return updated
}

/**
 * Obtener estadísticas de un cliente
 */
export async function getCustomerStats(phoneNumber: string): Promise<CustomerStats> {
  const customer = await getCustomerByPhone(phoneNumber)

  // Obtener todas las reservas del cliente
  const customerReservations = await db.query.reservations.findMany({
    where: eq(reservations.customerPhone, phoneNumber),
    orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
  })

  const totalReservations = customerReservations.length
  const confirmedReservations = customerReservations.filter((r) => r.status === "CONFIRMADO").length
  const noShowCount = customerReservations.filter((r) => r.status === "NO_SHOW").length
  const cancellationCount = customerReservations.filter((r) => r.status === "CANCELADO").length

  const lastVisit = customerReservations.find((r) => r.status === "CONFIRMADO")
  const lastVisitDate = lastVisit?.reservationDate

  const averagePartySize =
    totalReservations > 0
      ? customerReservations.reduce((sum, r) => sum + r.partySize, 0) / totalReservations
      : 0

  return {
    totalReservations,
    confirmedReservations,
    noShowCount: customer.noShowCount || noShowCount,
    cancellationCount,
    lastVisitDate,
    averagePartySize: Math.round(averagePartySize * 10) / 10,
  }
}

/**
 * Obtener clientes con riesgo alto (muchos no-shows)
 */
export async function getRiskCustomers(threshold = 2, limit = 20) {
  const result = await db.query.customers.findMany({
    where: sql`${customers.noShowCount} >= ${threshold}`,
    orderBy: [desc(customers.noShowCount)],
    limit,
  })

  return result
}

/**
 * Buscar clientes por nombre
 */
export async function searchCustomers(query: string, limit = 10) {
  const result = await db.query.customers.findMany({
    where: sql`${customers.name} ILIKE ${`%${query}%`}`,
    limit,
  })

  return result
}

/**
 * Agregar tag a cliente
 */
export async function addCustomerTag(phoneNumber: string, tag: string) {
  const customer = await getCustomerByPhone(phoneNumber)
  const currentTags = customer.tags || []

  if (!currentTags.includes(tag)) {
    const [updated] = await db
      .update(customers)
      .set({
        tags: [...currentTags, tag],
        updatedAt: new Date(),
      })
      .where(eq(customers.phoneNumber, phoneNumber))
      .returning()

    return updated
  }

  return customer
}

/**
 * Remover tag de cliente
 */
export async function removeCustomerTag(phoneNumber: string, tag: string) {
  const customer = await getCustomerByPhone(phoneNumber)
  const currentTags = customer.tags || []

  const [updated] = await db
    .update(customers)
    .set({
      tags: currentTags.filter((t) => t !== tag),
      updatedAt: new Date(),
    })
    .where(eq(customers.phoneNumber, phoneNumber))
    .returning()

  return updated
}
