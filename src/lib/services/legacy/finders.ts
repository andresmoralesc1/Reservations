/**
 * Módulo de buscadores - Consulta de reservas
 */

import { db } from "@/lib/db"
import { reservations } from "@/drizzle/schema"
import { eq, and, desc } from "drizzle-orm"
import { STATUS_REVERSE_MAP } from "@/types/reservation"
import type { LegacyResult, ListReservationsParams, ReservationWithRelations } from "./types"

/**
 * Obtiene una reserva por su código
 */
export async function getLegacyReservation(
  idReserva: string
): Promise<LegacyResult<ReservationWithRelations>> {
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
      data: reservation as ReservationWithRelations
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
 * Lista reservas con filtros opcionales
 */
export async function listLegacyReservations(
  params: ListReservationsParams
): Promise<LegacyResult<ReservationWithRelations[]>> {
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
      data: results as ReservationWithRelations[]
    }
  } catch (error) {
    console.error("[Legacy Service] Error listing reservations:", error)
    return {
      success: false,
      error: "Error al obtener reservas"
    }
  }
}
