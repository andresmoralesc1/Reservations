/**
 * Módulo de canceladores - Cancelación de reservas
 */

import { db } from "@/lib/db"
import { reservations } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import type { LegacyResult } from "./types"
import { phonesMatch } from "./validators"

/**
 * Cancela una reserva verificando el teléfono
 */
export async function cancelLegacyReservation(
  idReserva: string,
  telefono: string
): Promise<LegacyResult> {
  try {
    // Buscar la reserva
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.reservationCode, idReserva.toUpperCase())
    })

    if (!reservation) {
      return {
        success: false,
        message: "No encontré ninguna reserva con ese código"
      }
    }

    // Verificar que el teléfono coincida
    const reservaTelefono = reservation.customerPhone || ""
    if (!phonesMatch(telefono, reservaTelefono)) {
      return {
        success: false,
        message: "El número de teléfono no coincide con la reserva"
      }
    }

    // Actualizar estatus a CANCELADO
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
