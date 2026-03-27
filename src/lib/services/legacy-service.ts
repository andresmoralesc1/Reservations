/**
 * Legacy Reservation Service
 *
 * Servicio adaptado para trabajar con las tablas del schema principal
 * Mantiene compatibilidad con llamadas antiguas pero usa el nuevo schema
 */

import { db } from "@/lib/db"
import { reservations, tables, customers } from "@/drizzle/schema"
import { eq, and, desc, sql, or, gte, asc } from "drizzle-orm"
import { generateReservationCode } from "@/lib/utils"

// ============ Mapeo de estatus ============
const STATUS_MAP: Record<string, string> = {
  "PENDIENTE": "PENDING",
  "CONFIRMADO": "CONFIRMED",
  "CANCELADO": "CANCELLED",
  "NO_SHOW": "NOSHOW",
}

const STATUS_REVERSE_MAP: Record<string, string> = {
  "PENDING": "PENDIENTE",
  "CONFIRMED": "CONFIRMADO",
  "CANCELLED": "CANCELADO",
  "NOSHOW": "NO_SHOW",
}

/**
 * Crear una nueva reserva (usando nuevo schema)
 */
export async function createLegacyReservation(params: {
  nombre: string
  numero: string // teléfono
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM
  invitados: number
  idMesa?: string
  fuente?: string
  restaurante?: string
  observaciones?: string
}) {
  try {
    // Generar código de reserva
    const reservationCode = generateReservationCode()

    // Buscar o crear cliente
    let customer = await db.query.customers.findFirst({
      where: eq(customers.phoneNumber, params.numero)
    })

    if (!customer) {
      const [newCustomer] = await db.insert(customers).values({
        phoneNumber: params.numero,
        name: params.nombre
      }).returning()
      customer = newCustomer
    }

    // Buscar mesa adecuada si no se proporciona
    let tableIds: string[] = []
    if (params.idMesa) {
      // Buscar la tabla por tableCode
      const table = await db.query.tables.findFirst({
        where: eq(tables.tableCode, params.idMesa)
      })
      tableIds = table ? [table.id] : []
    } else {
      // Buscar mesa disponible con capacidad suficiente
      const availableTables = await db.query.tables.findMany({
        where: and(
          gte(tables.capacity, params.invitados),
          eq(tables.restaurantId, params.restaurante || "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
        ),
        orderBy: [asc(tables.capacity)]
      })
      if (availableTables.length > 0) {
        tableIds = [availableTables[0].id]
      }
    }

    // Insertar reserva con campos del nuevo schema
    const [newReservation] = await db.insert(reservations).values({
      reservationCode,
      customerId: customer.id,
      customerName: params.nombre,
      customerPhone: params.numero,
      restaurantId: params.restaurante || "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
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

/**
 * Obtener reserva por código
 */
export async function getLegacyReservation(idReserva: string) {
  try {
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.reservationCode, idReserva.toUpperCase()),
      with: {
        customer: true,
        restaurant: true,
      }
    })

    if (!reservation) {
      return {
        success: false,
        message: "No encontré ninguna reserva con ese código"
      }
    }

    return {
      success: true,
      data: reservation
    }
  } catch (error) {
    console.error("[Legacy Service] Error getting reservation:", error)
    return {
      success: false,
      error: "Error al buscar reserva"
    }
  }
}

/**
 * Cancelar reserva
 */
export async function cancelLegacyReservation(idReserva: string, telefono: string) {
  try {
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.reservationCode, idReserva.toUpperCase())
    })

    if (!reservation) {
      return {
        success: false,
        message: "No encontré ninguna reserva con ese código"
      }
    }

    // Verificar teléfono
    const telefonoLimpio = telefono.replace(/[\s-]/g, "")
    const reservaTelefonoLimpio = (reservation.customerPhone || "").replace(/[\s-]/g, "")

    if (telefonoLimpio !== reservaTelefonoLimpio &&
        !telefonoLimpio.includes(reservaTelefonoLimpio) &&
        !reservaTelefonoLimpio.includes(telefonoLimpio)) {
      return {
        success: false,
        message: "El número de teléfono no coincide con la reserva"
      }
    }

    // Actualizar estatus
    await db.update(reservations)
      .set({
        status: "CANCELADO",
        cancelledAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reservations.reservationCode, idReserva.toUpperCase()))

    return {
      success: true,
      message: `Reserva ${idReserva.toUpperCase()} cancelada correctamente`
    }
  } catch (error) {
    console.error("[Legacy Service] Error canceling reservation:", error)
    return {
      success: false,
      error: "Error al cancelar reserva"
    }
  }
}

/**
 * Listar reservas con filtros
 */
export async function listLegacyReservations(params: {
  restaurante?: string
  fecha?: string
  estatus?: string
  limit?: number
  offset?: number
}) {
  try {
    const conditions = []

    if (params.restaurante) {
      conditions.push(eq(reservations.restaurantId, params.restaurante))
    }
    if (params.fecha) {
      conditions.push(eq(reservations.reservationDate, params.fecha))
    }
    if (params.estatus) {
      // Mapear estatus si es necesario
      const status = STATUS_REVERSE_MAP[params.estatus] || params.estatus
      conditions.push(eq(reservations.status, status))
    }

    const results = await db.query.reservations.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        customer: true,
        restaurant: true,
      },
      orderBy: [desc(reservations.reservationDate), desc(reservations.reservationTime)],
      limit: params.limit || 50,
      offset: params.offset || 0
    })

    return {
      success: true,
      data: results
    }
  } catch (error) {
    console.error("[Legacy Service] Error listing reservations:", error)
    return {
      success: false,
      error: "Error al obtener reservas"
    }
  }
}

/**
 * Registrar llamada de voz (simplified - usando console.log por ahora)
 */
export async function logLegacyCall(params: {
  telefono: string
  restaurante?: string
  resId?: string
  accionesRealizadas?: Array<{
    action: string
    success: boolean
    timestamp: string
  }>
  duracionLlamada?: number
  motivoFinalizacion?: string
}) {
  try {
    // Por ahora solo log en consola
    console.log("[Legacy Call Log]", {
      telefono: params.telefono,
      restaurante: params.restaurante,
      resId: params.resId,
      acciones: params.accionesRealizadas,
      duracion: params.duracionLlamada,
      motivo: params.motivoFinalizacion,
      timestamp: new Date().toISOString()
    })

    return {
      success: true,
      callId: "log-" + Date.now()
    }
  } catch (error) {
    console.error("[Legacy Service] Error logging call:", error)
    return {
      success: false,
      error: "Error al registrar llamada"
    }
  }
}

/**
 * Verificar disponibilidad (usando nuevo schema)
 */
export async function checkLegacyAvailability(params: {
  fecha: string
  hora: string
  invitados: number
  restaurante?: string
}) {
  try {
    // Buscar mesas con capacidad suficiente
    const allTables = await db.query.tables.findMany({
      where: eq(tables.restaurantId, params.restaurante || "a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    })

    const suitableTables = allTables.filter(t => t.capacity >= params.invitados)

    // Buscar reservas confirmadas que se solapan
    const startTime = params.hora
    const endTime = addMinutes(params.hora, 90) // 90 min duración

    const conflictingReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.reservationDate, params.fecha),
        eq(reservations.status, "CONFIRMADO"),
        // Chequear solapamiento de horarios
        sql`${reservations.reservationTime} < ${endTime}::time AND ${reservations.reservationTime} + interval '2 hours' > ${startTime}::time`
      )
    })

    // IDs de mesas ocupadas
    const occupiedTableIds = new Set<string>()
    for (const res of conflictingReservations) {
      if (res.tableIds && Array.isArray(res.tableIds)) {
        for (const tableId of res.tableIds) {
          occupiedTableIds.add(tableId)
        }
      }
    }

    // Filtrar mesas disponibles
    const availableTables = suitableTables.filter(t => !occupiedTableIds.has(t.id))

    return {
      success: true,
      available: availableTables.length > 0,
      message: availableTables.length > 0
        ? `Tenemos disponibilidad para ${params.invitados} personas el ${params.fecha} a las ${params.hora}`
        : `No tenemos disponibilidad para ${params.invitados} personas el ${params.fecha} a las ${params.hora}`,
      availableTables: availableTables
    }
  } catch (error) {
    console.error("[Legacy Service] Error checking availability:", error)
    return {
      success: false,
      error: "Error al verificar disponibilidad"
    }
  }
}

// Helper function para sumar minutos a una hora
function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, mins + minutes)
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}
