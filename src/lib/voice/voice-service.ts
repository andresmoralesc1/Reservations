/**
 * Voice Service - Adaptado a tablas existentes en Supabase
 *
 * Trabaja directamente con:
 * - reservas (no reservations)
 * - mesas_disponibles (no tables)
 * - info_llamadas (no call_logs)
 *
 * Type-safe: Usa type guards en lugar de 'as unknown as'
 */

import { createLegacyReservation, getLegacyReservation, cancelLegacyReservation, checkLegacyAvailability, logLegacyCall } from "@/lib/services/legacy-service"
import { generateReservationCode } from "@/lib/utils"
import type {
  VoiceActionResult,
  CheckAvailabilityInput,
  CreateReservationInput,
  GetReservationInput,
  CancelReservationInput,
  ModifyReservationInput,
  VoiceAction,
} from "@/lib/voice/voice-types"
import {
  VoiceCheckAvailabilitySchema,
  VoiceCreateReservationSchema,
  VoiceGetReservationSchema,
  VoiceCancelReservationSchema,
  VoiceModifyReservationSchema,
} from "@/lib/schemas/reservation-schemas"

// ============ Type Guards ============

/**
 * Type guard para CheckAvailabilityInput
 */
function isCheckAvailabilityInput(params: unknown): params is CheckAvailabilityInput {
  const result = VoiceCheckAvailabilitySchema.safeParse(params)
  return result.success
}

/**
 * Type guard para CreateReservationInput
 */
function isCreateReservationInput(params: unknown): params is CreateReservationInput {
  const result = VoiceCreateReservationSchema.safeParse(params)
  return result.success
}

/**
 * Type guard para GetReservationInput
 */
function isGetReservationInput(params: unknown): params is GetReservationInput {
  const result = VoiceGetReservationSchema.safeParse(params)
  return result.success
}

/**
 * Type guard para CancelReservationInput
 */
function isCancelReservationInput(params: unknown): params is CancelReservationInput {
  const result = VoiceCancelReservationSchema.safeParse(params)
  return result.success
}

/**
 * Type guard para ModifyReservationInput
 */
function isModifyReservationInput(params: unknown): params is ModifyReservationInput {
  const result = VoiceModifyReservationSchema.safeParse(params)
  return result.success
}

/**
 * Type guard para logCallStart params
 */
interface LogCallStartParams {
  callerPhone: string
  restaurantId?: string
}

function isLogCallStartParams(params: unknown): params is LogCallStartParams {
  return typeof params === "object" && params !== null && "callerPhone" in params &&
         typeof (params as Record<string, unknown>).callerPhone === "string"
}

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
      numero: params.customerPhone,
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
        customerPhone: params.customerPhone,
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
      message: `Reserva ${params.code} a nombre de ${r.customerName}. ` +
               `El ${formatDate(r.reservationDate)} a las ${r.reservationTime} ` +
               `para ${r.partySize} personas. ` +
               `Estado: ${statusMessages[r.status] || r.status}.`,
      reservation: {
        reservationCode: r.reservationCode,
        customerName: r.customerName,
        customerPhone: r.customerPhone || "",
        date: r.reservationDate,
        time: r.reservationTime,
        partySize: r.partySize,
        status: r.status,
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
    const result = await cancelLegacyReservation(params.code, params.phone)

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
    const phone = params.phone?.toString().replace(/[\s-]/g, "") || ""
    const reservationPhone = (r.customerPhone || "").replace(/[\s-]/g, "")

    if (phone !== reservationPhone &&
        !phone.includes(reservationPhone) &&
        !reservationPhone.includes(phone)) {
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
  params: unknown
): Promise<VoiceActionResult> {
  switch (action) {
    case "checkAvailability":
      if (!isCheckAvailabilityInput(params)) {
        return {
          success: false,
          message: "Parámetros inválidos para verificar disponibilidad. Se requieren: fecha, hora, número de personas",
        }
      }
      return checkAvailability(params)

    case "createReservation":
      if (!isCreateReservationInput(params)) {
        return {
          success: false,
          message: "Parámetros inválidos para crear reserva. Se requieren: nombre, teléfono, fecha, hora, número de personas",
        }
      }
      return createReservation(params)

    case "getReservation":
      if (!isGetReservationInput(params)) {
        return {
          success: false,
          message: "Parámetros inválidos. Se requiere: código de reserva (RES-XXXXX)",
        }
      }
      return getReservation(params)

    case "cancelReservation":
      if (!isCancelReservationInput(params)) {
        return {
          success: false,
          message: "Parámetros inválidos. Se requieren: código de reserva y teléfono",
        }
      }
      return cancelReservation(params)

    case "modifyReservation":
      if (!isModifyReservationInput(params)) {
        return {
          success: false,
          message: "Parámetros inválidos. Se requieren: código de reserva, teléfono y al menos un cambio",
        }
      }
      return modifyReservation(params)

    case "logCallStart":
      if (!isLogCallStartParams(params)) {
        return {
          success: false,
          message: "Parámetros inválidos para logCallStart. Se requiere: callerPhone",
        }
      }
      // Registrar inicio de llamada
      const logResult = await logLegacyCall({
        telefono: params.callerPhone,
        restaurante: params.restaurantId
      })
      return { success: true, message: "Llamada registrada", callLogId: logResult.callId } as VoiceActionResult

    case "logCallEnd":
      // Finalizar llamada (no implementado aún)
      return { success: true, message: "Llamada finalizada" }

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
