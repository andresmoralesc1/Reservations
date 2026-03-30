/**
 * Módulo de creadores - Creación de reservas
 */

import { db } from "@/lib/db"
import { reservations, tables, customers } from "@/drizzle/schema"
import { eq, and, gte, asc } from "drizzle-orm"
import { generateReservationCode } from "@/lib/utils"
import type { CreateReservationParams, ReservationResult } from "./types"
import { normalizeSpanishPhone } from "./validators"

const DEFAULT_RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

/**
 * Busca o crea un cliente por número de teléfono
 */
async function findOrCreateCustomer(phoneNumber: string, name: string) {
  let customer = await db.query.customers.findFirst({
    where: eq(customers.phoneNumber, phoneNumber),
  })

  if (!customer) {
    const [newCustomer] = await db.insert(customers).values({
      phoneNumber,
      name,
    }).returning()
    customer = newCustomer
  }

  return customer
}

/**
 * Busca la mejor mesa disponible para una reserva
 */
async function findBestTable(
  partySize: number,
  restaurantId: string,
  tableCode?: string
): Promise<string[]> {
  // Si se especifica un código de mesa, buscar esa mesa específica
  if (tableCode) {
    const table = await db.query.tables.findFirst({
      where: eq(tables.tableCode, tableCode)
    })
    return table ? [table.id] : []
  }

  // Buscar la mesa más pequeña que pueda acomodar al grupo
  const availableTables = await db.query.tables.findMany({
    where: and(
      gte(tables.capacity, partySize),
      eq(tables.restaurantId, restaurantId)
    ),
    orderBy: [asc(tables.capacity)]
  })

  return availableTables.length > 0 ? [availableTables[0].id] : []
}

/**
 * Crea una nueva reserva en el sistema
 */
export async function createLegacyReservation(
  params: CreateReservationParams
): Promise<ReservationResult> {
  try {
    // Generar código de reserva
    const reservationCode = generateReservationCode()

    // Normalizar número de teléfono
    const cleanPhone = normalizeSpanishPhone(params.numero)

    // Buscar o crear cliente
    const customer = await findOrCreateCustomer(cleanPhone, params.nombre)

    // Buscar mesa adecuada
    const restaurantId = params.restaurante || DEFAULT_RESTAURANT_ID
    const tableIds = await findBestTable(params.invitados, restaurantId, params.idMesa)

    // Insertar reserva
    const [newReservation] = await db.insert(reservations).values({
      reservationCode,
      customerId: customer.id,
      customerName: params.nombre,
      customerPhone: cleanPhone,
      restaurantId,
      reservationDate: params.fecha,
      reservationTime: params.hora,
      partySize: params.invitados,
      tableIds,
      status: "PENDIENTE",
      source: params.fuente || "WEB",
      specialRequests: params.observaciones,
    }).returning()

    return {
      success: true,
      reservationCode,
      message: `Reserva creada. Código: ${reservationCode}`,
      data: newReservation
    }
  } catch (error) {
    console.error("[Legacy Service] Error creating reservation:", error)
    return {
      success: false,
      error: "Error al crear reserva"
    }
  }
}
