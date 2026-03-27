/**
 * Voice Service - Adaptado a tablas existentes en Supabase
 *
 * Trabaja directamente con:
 * - reservas (no reservations)
 * - mesas_disponibles (no tables)
 * - info_llamadas (no call_logs)
 */

import { createLegacyReservation, getLegacyReservation, cancelLegacyReservation, checkLegacyAvailability, logLegacyCall } from "@/lib/services/legacy-service"
import { generateReservationCode, normalizeSpanishPhone } from "@/lib/utils"
import type {
  VoiceActionResult,
  CheckAvailabilityInput,
  CreateReservationInput,
  GetReservationInput,
  CancelReservationInput,
  ModifyReservationInput,
} from "@/lib/voice/voice-types"

// ============ Función 1: checkAvailability ============
export async function checkAvailability(params: CheckAvailabilityInput): Promise<VoiceActionResult> {
  try {
    const result = await checkLegacyAvailability({
      fecha: params.date,
      hora: params.time,
      invitados: params.partySize,
      restaurante: params.restaurantId || "default",
    })

    return {
      success: result.success || result.available === true,
      message: result.message || "Error al verificar disponibilidad",
      availableSlots: result.available ? [] : undefined,
    }
  } catch (error) {
    console.error("[Voice Service] Error in checkAvailability:", error)
    return {
      success: false,
      message: "No pude verificar la disponibilidad. Por favor intenta nuevamente.",
    }
  }
}

// ============ Función 2: createReservation ============
export async function createReservation(params: CreateReservationInput): Promise<VoiceActionResult> {
  try {
    // Normalizar teléfono
    const normalizedPhone = normalizeSpanishPhone(params.customerPhone)

    // Verificar disponibilidad primero
    const availability = await checkLegacyAvailability({
      fecha: params.date,
      hora: params.time,
      invitados: params.partySize,
      restaurante: params.restaurantId || "default",
    })

    if (!availability.available && availability.availableTables?.length === 0) {
      return {
        success: false,
        message: availability.message || "No hay disponibilidad para la fecha y hora seleccionadas",
        availableSlots: [],
      }
    }

    // Crear reserva
    const result = await createLegacyReservation({
      nombre: params.customerName,
      numero: normalizedPhone,
      fecha: params.date,
      hora: params.time,
      invitados: params.partySize,
      fuente: "VOICE",
      restaurante: params.restaurantId || "default",
      observaciones: params.specialRequests,
    })

    if (!result.success) {
      return {
        success: false,
        message: result.error || "Error al crear la reserva",
      }
    }

    return {
      success: true,
      message: `Reserva creada exitosamente. Tu código es ${result.reservationCode}. Te esperamos el ${formatDate(params.date)} a las ${params.time} para ${params.partySize} personas.`,
      reservationCode: result.reservationCode,
      reservation: {
        reservationCode: result.reservationCode!,
        customerName: params.customerName,
        customerPhone: normalizedPhone,
        date: params.date,
        time: params.time,
        partySize: params.partySize,
        status: "PENDIENTE",
      },
    }
  } catch (error) {
    console.error("[Voice Service] Error in createReservation:", error)
    return {
      success: false,
      message: "Error al crear la reserva. Por favor intenta nuevamente.",
    }
  }
}

// ============ Función 3: getReservation ============
export async function getReservation(params: GetReservationInput): Promise<VoiceActionResult> {
  try {
    const result = await getLegacyReservation(params.code)

    if (!result.success) {
      return {
        success: false,
        message: result.message || "No encontré ninguna reserva con ese código.",
      }
    }

    const r = result.data!

    // Formatear mensaje
    const statusMessages: Record<string, string> = {
      PENDIENTE: "pendiente de confirmación",
      CONFIRMADO: "confirmada",
      CANCELADO: "cancelada",
    }

    return {
      success: true,
      message: `Reserva ${params.code} a nombre de ${r.nombre}. ` +
               `El ${formatDate(r.fecha)} a las ${r.hora} ` +
               `para ${r.invitados} personas. ` +
               `Estado: ${statusMessages[r.estatus] || r.estatus}.`,
      reservation: {
        reservationCode: r.idReserva,
        customerName: r.nombre,
        customerPhone: r.numero || "",
        date: r.fecha,
        time: r.hora,
        partySize: r.invitados,
        status: r.estatus,
      },
    }
  } catch (error) {
    console.error("[Voice Service] Error in getReservation:", error)
    return {
      success: false,
      message: "Error al buscar la reserva. Por favor intenta nuevamente.",
    }
  }
}

// ============ Función 4: cancelReservation ============
export async function cancelReservation(params: CancelReservationInput): Promise<VoiceActionResult> {
  try {
    const normalizedPhone = normalizeSpanishPhone(params.phone)

    const result = await cancelLegacyReservation(params.code, normalizedPhone)

    if (!result.success) {
      return {
        success: false,
        message: result.message || "No se pudo cancelar la reserva.",
      }
    }

    return {
      success: true,
      message: result.message || `La reserva ${params.code} ha sido cancelada exitosamente.`,
    }
  } catch (error) {
    console.error("[Voice Service] Error in cancelReservation:", error)
    return {
      success: false,
      message: "Error al cancelar la reserva. Por favor intenta nuevamente.",
    }
  }
}

// ============ Función 5: modifyReservation ============
export async function modifyReservation(params: ModifyReservationInput): Promise<VoiceActionResult> {
  try {
    // Get reservation first
    const getResult = await getLegacyReservation(params.code)

    if (!getResult.success || !getResult.data) {
      return {
        success: false,
        message: "No encontré ninguna reserva con ese código.",
      }
    }

    const r = getResult.data

    // Verify phone
    const normalizedPhone = normalizeSpanishPhone(params.phone)
    const reservationPhone = (r.numero || "").replace(/[\s-]/g, "")

    if (normalizedPhone !== reservationPhone &&
        !normalizedPhone.includes(reservationPhone) &&
        !reservationPhone.includes(normalizedPhone)) {
      return {
        success: false,
        message: "El número de teléfono no coincide con la de la reserva.",
      }
    }

    // For now, return message about modification (would need update query)
    return {
      success: true,
      message: "La modificación de reservas no está disponible en este momento. Por favor contacta al restaurante directamente.",
    }
  } catch (error) {
    console.error("[Voice Service] Error in modifyReservation:", error)
    return {
      success: false,
      message: "Error al modificar la reserva. Por favor intenta nuevamente.",
    }
  }
}

// ============ Función Router: processVoiceAction ============
export async function processVoiceAction(
  action: string,
  params: Record<string, unknown>
): Promise<VoiceActionResult> {
  switch (action) {
    case "checkAvailability":
      return checkAvailability(params as unknown as CheckAvailabilityInput)

    case "createReservation":
      return createReservation(params as unknown as CreateReservationInput)

    case "getReservation":
      return getReservation(params as unknown as GetReservationInput)

    case "cancelReservation":
      return cancelReservation(params as unknown as CancelReservationInput)

    case "modifyReservation":
      return modifyReservation(params as unknown as ModifyReservationInput)

    case "logCallStart":
      // Registrar inicio de llamada
      const logResult = await logLegacyCall({
        telefono: (params as any).callerPhone || "unknown",
        restaurante: (params as any).restaurantId
      })
      return { success: true, callLogId: logResult.callId } as any

    case "logCallEnd":
      // Finalizar llamada (no implementado aún)
      return { success: true } as any

    default:
      return {
        success: false,
        message: `Acción no reconocida: ${action}`,
      }
  }
}

// ============ Helper ============
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long"
    })
  } catch {
    return dateStr
  }
}
