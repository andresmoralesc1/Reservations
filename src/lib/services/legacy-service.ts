/**
 * Legacy Reservation Service
 *
 * Servicio adaptado para trabajar con las tablas existentes en Supabase:
 * - reservas (en lugar de reservations)
 * - mesas_disponibles (en lugar de tables)
 * - info_llamadas (en lugar de call_logs)
 * - reservas_temporales (en lugar de reservation_sessions)
 */

import { db } from "@/lib/db"
import { reservas, mesasDisponibles, infoLlamadas } from "@/drizzle/legacy-schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { generateReservationCode } from "@/lib/utils"

// ============ Mapeo de campos entre新旧 ============

// Mapeo de estatus
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

// ============ Funciones principales ============

/**
 * Crear una nueva reserva (adaptado a tabla existente)
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
    const idReserva = generateReservationCode()

    // Determinar ID de mesa si no se proporciona
    let idMesa = params.idMesa
    if (!idMesa) {
      // Buscar una mesa disponible con capacidad suficiente
      const mesa = await db.query.mesasDisponibles.findFirst({
        where: (table, { and, eq, gte }) => and(
          eq(table.restaurante, params.restaurante || "default"),
          gte(table.capacidad, params.invitados),
          eq(table.activa, true)
        ),
        orderBy: (table, { asc }) => [asc(table.capacidad)]
      })
      idMesa = mesa?.idMesa || "mesa-por-asignar"
    }

    // Insertar reserva
    const [nuevaReserva] = await db.insert(reservas).values({
      idReserva,
      idMesa,
      nombre: params.nombre,
      numero: params.numero,
      fecha: params.fecha,
      hora: params.hora,
      invitados: params.invitados,
      estatus: "PENDIENTE",
      fuente: params.fuente || "WEB",
      restaurante: params.restaurante || "default",
      observaciones: params.observaciones,
    }).returning()

    return {
      success: true,
      reservationCode: idReserva,
      message: `Reserva creada. Código: ${idReserva}`,
      data: nuevaReserva
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
    const reserva = await db.query.reservas.findFirst({
      where: eq(reservas.idReserva, idReserva.toUpperCase())
    })

    if (!reserva) {
      return {
        success: false,
        message: "No encontré ninguna reserva con ese código"
      }
    }

    return {
      success: true,
      data: reserva
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
    const reserva = await db.query.reservas.findFirst({
      where: eq(reservas.idReserva, idReserva.toUpperCase())
    })

    if (!reserva) {
      return {
        success: false,
        message: "No encontré ninguna reserva con ese código"
      }
    }

    // Verificar teléfono (quitar espacios y guiones para comparar)
    const telefonoLimpio = telefono.replace(/[\s-]/g, "")
    const reservaTelefonoLimpio = (reserva.numero || "").replace(/[\s-]/g, "")

    if (telefonoLimpio !== reservaTelefonoLimpio &&
        !telefonoLimpio.includes(reservaTelefonoLimpio) &&
        !reservaTelefonoLimpio.includes(telefonoLimpio)) {
      return {
        success: false,
        message: "El número de teléfono no coincide con la reserva"
      }
    }

    // Actualizar estatus
    await db.update(reservas)
      .set({
        estatus: "CANCELADO",
        fechaCancelacion: new Date(),
        updatedAt: new Date()
      })
      .where(eq(reservas.idReserva, idReserva.toUpperCase()))

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
      conditions.push(eq(reservas.restaurante, params.restaurante))
    }
    if (params.fecha) {
      conditions.push(eq(reservas.fecha, params.fecha))
    }
    if (params.estatus) {
      conditions.push(eq(reservas.estatus, params.estatus))
    }

    const results = await db.query.reservas.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(reservas.fecha), desc(reservas.hora)],
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
 * Registrar llamada de voz (info_llamadas)
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
    const [nuevoLog] = await db.insert(infoLlamadas).values({
      telefono: params.telefono,
      restaurante: params.restaurante || "default",
      resId: params.resId,
      accionesRealizadas: params.accionesRealizadas || [],
      duracionLlamada: params.duracionLlamada?.toString(),
      motivoFinalizacion: params.motivoFinalizacion || "completed",
      fechaLlamada: new Date(),
    }).returning()

    return {
      success: true,
      callId: nuevoLog.id.toString()
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
 * Verificar disponibilidad (simplified)
 */
export async function checkLegacyAvailability(params: {
  fecha: string
  hora: string
  invitados: number
  restaurante?: string
}) {
  try {
    // Buscar mesas disponibles con capacidad suficiente
    const mesas = await db.query.mesasDisponibles.findMany({
      where: (table, { and, eq, gte }) => and(
        eq(table.restaurante, params.restaurante || "default"),
        gte(table.capacidad, params.invitados),
        eq(table.activa, true)
      )
    })

    // Buscar reservas que se solapan
    const reservasOcupadas = await db.query.reservas.findMany({
      where: (table, { and, eq, sql }) => and(
        eq(table.fecha, params.fecha),
        eq(table.estatus, "CONFIRMADO"),
        // Solapamiento de hora (reserva ocupa su hora + 90 min)
        sql`${table.hora} <= ${params.hora}::time + interval '90 minutes'`
      )
    })

    // IDs de mesas ocupadas
    const mesasOcupadasIds = new Set(reservasOcupadas.map(r => r.idMesa))

    // Filtrar mesas disponibles
    const mesasLibres = mesas.filter(m => !mesasOcupadasIds.has(m.idMesa))

    return {
      success: true,
      available: mesasLibres.length > 0,
      message: mesasLibres.length > 0
        ? `Tenemos disponibilidad para ${params.invitados} personas el ${params.fecha} a las ${params.hora}`
        : `No tenemos disponibilidad para ${params.invitados} personas el ${params.fecha} a las ${params.hora}`,
      availableTables: mesasLibres
    }
  } catch (error) {
    console.error("[Legacy Service] Error checking availability:", error)
    return {
      success: false,
      error: "Error al verificar disponibilidad"
    }
  }
}
