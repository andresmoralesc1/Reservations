/**
 * Voice Service - Adaptado a tablas existentes en Supabase
 *
 * Trabaja directamente con:
 * - reservations
 * - tables
 * - call_logs
 *
 * Type-safe: Usa type guards en lugar de 'as unknown as'
 */

import {
  getReservationByCode,
  createReservation as createReservationService,
  cancelReservation as cancelReservationService,
  updateReservation,
  listReservations
} from "@/lib/services"
import { servicesAvailability } from "@/lib/availability/services-availability"
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
import { createLogger, logError } from "@/lib/logger"
import { db } from "@/lib/db"
import { callLogs, reservations } from "@/drizzle/schema"
import { eq, sql } from "drizzle-orm"

const logger = createLogger({ module: "voice-service" })

const DEFAULT_RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

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
    const result = await servicesAvailability.checkAvailabilityWithServices({
      date: params.date,
      time: params.time,
      partySize: params.partySize,
      restaurantId: params.restaurantId || DEFAULT_RESTAURANT_ID
    })

    return {
      success: result.available,
      message: result.message || (result.available ? "Tenemos disponibilidad" : "No hay disponibilidad"),
      availableSlots: result.available ? [] : undefined,
      alternativeSlots: result.available ? undefined : result.alternativeSlots,
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
    const availability = await servicesAvailability.checkAvailabilityWithServices({
      date: params.date,
      time: params.time,
      partySize: params.partySize,
      restaurantId: params.restaurantId || DEFAULT_RESTAURANT_ID
    })

    if (!availability.available && availability.availableTables?.length === 0) {
      // Guardar como reserva fallida
      await saveFailedReservation({
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        date: params.date,
        time: params.time,
        partySize: params.partySize,
        specialRequests: params.specialRequests,
        failureReason: "No hay disponibilidad",
        actionAttempted: "createReservation",
      })

      return {
        success: false,
        message: availability.message || "No hay disponibilidad para la fecha y hora seleccionadas",
        availableSlots: [],
      }
    }

    // Crear reserva con el nuevo servicio
    const reservation = await createReservationService({
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      reservationDate: params.date,
      reservationTime: params.time,
      partySize: params.partySize,
      restaurantId: params.restaurantId || DEFAULT_RESTAURANT_ID,
      source: "VOICE",
      specialRequests: params.specialRequests,
      tableIds: availability.availableTables?.[0]?.id ? [availability.availableTables[0].id] : undefined
    })

    logger.info({
      msg: "Reserva creada por voz",
      reservationCode: reservation.reservationCode,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      date: params.date,
      time: params.time,
      partySize: params.partySize,
    })

    return {
      success: true,
      message: `Reserva creada exitosamente. Tu código es ${reservation.reservationCode}. Te esperamos el ${formatDate(params.date)} a las ${params.time} para ${params.partySize} personas.`,
      reservationCode: reservation.reservationCode,
      reservation: {
        reservationCode: reservation.reservationCode!,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        date: params.date,
        time: params.time,
        partySize: params.partySize,
        status: reservation.status,
      },
    }
  } catch (error) {
    logError("Error en createReservation (voz)", error, {
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      date: params.date,
      time: params.time,
    })

    // Guardar como reserva fallida
    await saveFailedReservation({
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      date: params.date,
      time: params.time,
      partySize: params.partySize,
      specialRequests: params.specialRequests,
      failureReason: error instanceof Error ? error.message : "Error desconocido",
      actionAttempted: "createReservation",
    })

    return {
      success: false,
      message: "Error al crear la reserva. Por favor intenta nuevamente.",
    }
  }
}

// ============ Función 3: getReservation ============
export async function getReservation(params: GetReservationInput): Promise<VoiceActionResult> {
  try {
    const reservation = await getReservationByCode(params.code)

    // Formatear mensaje
    const statusMessages: Record<string, string> = {
      PENDIENTE: "pendiente de confirmación",
      CONFIRMADO: "confirmada",
      CANCELADO: "cancelada",
      COMPLETADA: "completada",
      NO_SHOW: "no show",
    }

    return {
      success: true,
      message: `Reserva ${params.code} a nombre de ${reservation.customerName}. ` +
               `El ${formatDate(reservation.reservationDate)} a las ${reservation.reservationTime} ` +
               `para ${reservation.partySize} personas. ` +
               `Estado: ${statusMessages[reservation.status] || reservation.status}.`,
      reservation: {
        reservationCode: reservation.reservationCode,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone || "",
        date: reservation.reservationDate,
        time: reservation.reservationTime,
        partySize: reservation.partySize,
        status: reservation.status,
      },
    }
  } catch (error) {
    console.error("[Voice Service] Error in getReservation:", error)
    return {
      success: false,
      message: "No encontré ninguna reserva con ese código. Por favor verifica e intenta nuevamente.",
    }
  }
}

// ============ Función 4: cancelReservation ============
export async function cancelReservation(params: CancelReservationInput): Promise<VoiceActionResult> {
  try {
    // First get the reservation to verify the phone
    const reservation = await getReservationByCode(params.code)

    // Verify phone matches
    const phone = params.phone?.toString().replace(/[\s-]/g, "") || ""
    const reservationPhone = (reservation.customerPhone || "").replace(/[\s-]/g, "")

    if (phone && phone !== reservationPhone &&
        !phone.includes(reservationPhone) &&
        !reservationPhone.includes(phone)) {
      return {
        success: false,
        message: "El número de teléfono no coincide con el de la reserva.",
      }
    }

    // Cancel the reservation
    await cancelReservationService(reservation.id)

    return {
      success: true,
      message: `La reserva ${params.code} ha sido cancelada exitosamente.`,
    }
  } catch (error) {
    console.error("[Voice Service] Error in cancelReservation:", error)
    return {
      success: false,
      message: "No se pudo cancelar la reserva. Verifica el código e intenta nuevamente.",
    }
  }
}

// ============ Función 5: modifyReservation ============
export async function modifyReservation(params: ModifyReservationInput): Promise<VoiceActionResult> {
  try {
    // Get reservation first to verify it exists
    const reservation = await getReservationByCode(params.code)

    // Verify phone matches
    const phone = params.phone?.toString().replace(/[\s-]/g, "") || ""
    const reservationPhone = (reservation.customerPhone || "").replace(/[\s-]/g, "")

    if (phone !== reservationPhone &&
        !phone.includes(reservationPhone) &&
        !reservationPhone.includes(phone)) {
      return {
        success: false,
        message: "El número de teléfono no coincide con el de la reserva.",
      }
    }

    // Build dynamic updateData object with only the fields provided
    // Accept both flat format (newDate, newTime, newPartySize, newSpecialRequests) and nested format (changes.{...})
    const updateData: {
      reservationDate?: string
      reservationTime?: string
      partySize?: number
      specialRequests?: string
      updatedAt: Date
    } = {
      updatedAt: new Date(),
    }

    let changesMade: string[] = []

    // Get changes from flat format (Pipecat) or nested format (backward compatibility)
    const newDate = params.newDate ?? params.changes?.newDate
    const newTime = params.newTime ?? params.changes?.newTime
    const newPartySize = params.newPartySize ?? params.changes?.newPartySize
    const newSpecialRequests = params.newSpecialRequests ?? params.changes?.newSpecialRequests

    if (newDate) {
      updateData.reservationDate = newDate
      changesMade.push(`fecha al ${formatDate(newDate)}`)
    }

    if (newTime) {
      updateData.reservationTime = newTime
      changesMade.push(`hora a las ${newTime}`)
    }

    if (newPartySize) {
      updateData.partySize = newPartySize
      changesMade.push(`número de personas a ${newPartySize}`)
    }

    if (newSpecialRequests !== undefined) {
      updateData.specialRequests = newSpecialRequests
      changesMade.push(`solicitudes especiales actualizadas`)
    }

    if (changesMade.length === 0) {
      return {
        success: false,
        message: "No se proporcionaron cambios para modificar. Por favor especifica al menos un cambio: nueva fecha, nueva hora, nuevo número de personas o nuevas solicitudes especiales.",
      }
    }

    // Execute real DB UPDATE
    await db.update(reservations)
      .set(updateData)
      .where(eq(reservations.reservationCode, params.code))

    logger.info({
      msg: "Reserva modificada por voz",
      reservationCode: params.code,
      changes: updateData,
    })

    return {
      success: true,
      message: `Reserva ${params.code} modificada exitosamente. ${changesMade.join(", ")}.`,
    }
  } catch (error) {
    logError("Error en modifyReservation (voz)", error, {
      code: params.code,
      changes: params.changes,
    })
    return {
      success: false,
      message: "Error al modificar la reserva. Por favor intenta nuevamente.",
    }
  }
}

// ============ Función 6: saveFailedReservation ============
interface FailedReservationParams {
  customerName: string
  customerPhone: string
  date: string
  time: string
  partySize: number
  specialRequests?: string
  failureReason: string
  actionAttempted: string
  sessionId?: string
}

export async function saveFailedReservation(params: FailedReservationParams): Promise<void> {
  try {
    await db.execute(sql`
      INSERT INTO failed_reservations (
        customer_name,
        customer_phone,
        reservation_date,
        reservation_time,
        party_size,
        special_requests,
        failure_reason,
        action_attempted,
        session_id,
        partial_data,
        recovery_status,
        created_at
      ) VALUES (
        ${params.customerName},
        ${params.customerPhone},
        ${params.date},
        ${params.time},
        ${params.partySize},
        ${params.specialRequests || null},
        ${params.failureReason},
        ${params.actionAttempted},
        ${params.sessionId || null},
        ${JSON.stringify(params)}::jsonb,
        'pending',
        now()
      )
    `)

    logger.info({
      msg: "Reserva fallida guardada",
      customerPhone: params.customerPhone,
      failureReason: params.failureReason,
    })
  } catch (error) {
    logError("Error guardando reserva fallida", error, { params })
  }
}

// ============ Función Router: processVoiceAction ============
export async function processVoiceAction(
  action: string,
  params: unknown
): Promise<VoiceActionResult> {
  // Log intent detectado
  logger.info({
    msg: "Intent detectado",
    action,
    hasParams: params !== undefined && params !== null,
  })

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
      const [callLog] = await db.insert(callLogs).values({
        callerPhone: params.callerPhone,
        restaurantId: params.restaurantId || DEFAULT_RESTAURANT_ID,
        callStartedAt: new Date(),
      }).returning()
      return { success: true, message: "Llamada registrada", callLogId: callLog.id } as VoiceActionResult

    case "logCallEnd":
      // Finalizar llamada (no implementado aún)
      return { success: true, message: "Llamada finalizada" }

    default:
      logger.warn({ msg: "Acción no reconocida", action })
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
