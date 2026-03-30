/**
 * Módulo de verificadores - Verificación de disponibilidad
 */

import { servicesAvailability } from "@/lib/availability/services-availability"
import type { CheckAvailabilityParams, LegacyResult } from "./types"

const DEFAULT_RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

/**
 * Verifica la disponibilidad para una reserva
 * Usa el servicio unificado de disponibilidad
 */
export async function checkLegacyAvailability(
  params: CheckAvailabilityParams
): Promise<LegacyResult & { available?: boolean; availableTables?: unknown[] }> {
  try {
    // Usar el servicio unificado de disponibilidad
    const result = await servicesAvailability.checkAvailabilityWithServices({
      date: params.fecha,
      time: params.hora,
      partySize: params.invitados,
      restaurantId: params.restaurante || DEFAULT_RESTAURANT_ID
    })

    // Generar mensaje si no existe uno
    const message = result.message || (
      result.available
        ? `Tenemos disponibilidad para ${params.invitados} personas el ${params.fecha} a las ${params.hora}`
        : `No tenemos disponibilidad para ${params.invitados} personas el ${params.fecha} a las ${params.hora}`
    )

    return {
      success: true,
      available: result.available,
      message,
      availableTables: result.availableTables
    }
  } catch (error) {
    console.error("[Legacy Service] Error checking availability:", error)
    return {
      success: false,
      error: "Error al verificar disponibilidad"
    }
  }
}
