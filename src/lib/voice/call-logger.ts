/**
 * Call Logger
 *
 * Servicio para registrar llamadas de voz en la tabla call_logs.
 * Reemplaza el sistema de "info_llamadas" de n8n.
 */

import { db } from "@/lib/db"
import { callLogs } from "@/drizzle/schema"
import { eq, and, gte, lte, desc } from "drizzle-orm"
import type { VoiceAction, CallEndReason } from "./voice-types"

// ============ Tipos ============
export interface CallStartParams {
  callerPhone: string
  restaurantId: string
}

export interface CallActionParams {
  action: VoiceAction
  success: boolean
  params?: Record<string, unknown>
  error?: string
}

export interface CallEndParams {
  durationSecs: number
  endReason: CallEndReason
  cost?: string
  summary?: string
  reservationId?: string
}

// ============ Funciones principales ============

/**
 * Registra el inicio de una llamada de voz
 *
 * @param params - Teléfono del cliente y ID del restaurante
 * @returns ID del log creado
 *
 * @example
 * const logId = await logCallStart({
 *   callerPhone: "+34 612 345 678",
 *   restaurantId: "abc-123-def"
 * })
 */
export async function logCallStart(params: CallStartParams): Promise<string> {
  try {
    const [log] = await db
      .insert(callLogs)
      .values({
        callerPhone: params.callerPhone,
        restaurantId: params.restaurantId,
        callStartedAt: new Date(),
        actionsTaken: [],
      })
      .returning()

    console.log(`[Call Logger] Call started: ${log.id} from ${params.callerPhone}`)
    return log.id
  } catch (error) {
    console.error("[Call Logger] Error starting call:", error)
    throw error
  }
}

/**
 * Registra una acción ejecutada durante la llamada
 *
 * @param logId - ID del log de la llamada
 * @param params - Acción ejecutada y resultado
 *
 * @example
 * await logCallAction("log-id-123", {
 *   action: "checkAvailability",
 *   success: true,
 *   params: { date: "2026-04-01", time: "21:00", partySize: 4 }
 * })
 */
export async function logCallAction(logId: string, params: CallActionParams): Promise<void> {
  try {
    const log = await db.query.callLogs.findFirst({
      where: eq(callLogs.id, logId),
    })

    if (!log) {
      console.warn(`[Call Logger] Log not found: ${logId}`)
      return
    }

    const newAction = {
      action: params.action,
      success: params.success,
      timestamp: new Date().toISOString(),
      params: params.params,
      error: params.error,
    }

    const updatedActions = [...(log.actionsTaken || []), newAction]

    await db
      .update(callLogs)
      .set({ actionsTaken: updatedActions as typeof callLogs.$inferInsert.actionsTaken })
      .where(eq(callLogs.id, logId))

    console.log(`[Call Logger] Action logged: ${params.action} (${params.success ? "success" : "failed"})`)
  } catch (error) {
    console.error("[Call Logger] Error logging action:", error)
    // No throw - logging errors shouldn't break the flow
  }
}

/**
 * Registra el final de una llamada
 *
 * @param logId - ID del log de la llamada
 * @param params - Datos finales de la llamada
 *
 * @example
 * await logCallEnd("log-id-123", {
 *   durationSecs: 127,
 *   endReason: "completed",
 *   summary: "Cliente reservó para 4 personas el sábado a las 21:00",
 *   reservationId: "res-id-456"
 * })
 */
export async function logCallEnd(logId: string, params: CallEndParams): Promise<void> {
  try {
    await db
      .update(callLogs)
      .set({
        callDurationSecs: params.durationSecs,
        callEndReason: params.endReason,
        callCost: params.cost,
        callSummary: params.summary,
        reservationId: params.reservationId,
      })
      .where(eq(callLogs.id, logId))

    console.log(`[Call Logger] Call ended: ${logId} (${params.endReason}, ${params.durationSecs}s)`)
  } catch (error) {
    console.error("[Call Logger] Error ending call:", error)
    throw error
  }
}

/**
 * Busca logs de llamadas por teléfono
 *
 * @param phoneNumber - Teléfono del cliente (normalizado o no)
 * @param limit - Número máximo de resultados
 * @returns Logs de llamadas del cliente
 */
export async function getCallLogsByPhone(phoneNumber: string, limit = 10) {
  try {
    const logs = await db.query.callLogs.findMany({
      where: eq(callLogs.callerPhone, phoneNumber),
      orderBy: [desc(callLogs.callStartedAt)],
      limit,
    })

    return logs
  } catch (error) {
    console.error("[Call Logger] Error fetching logs by phone:", error)
    throw error
  }
}

/**
 * Obtiene estadísticas de llamadas por restaurante
 *
 * @param restaurantId - ID del restaurante
 * @param startDate - Fecha de inicio (opcional)
 * @param endDate - Fecha de fin (opcional)
 * @returns Estadísticas agregadas
 */
export async function getCallStats(restaurantId: string, startDate?: Date, endDate?: Date) {
  try {
    // Esta es una implementación simple. Para producción, considerar
    // usar SQL directo con agregaciones para mejor rendimiento.
    const whereConditions = [eq(callLogs.restaurantId, restaurantId)]

    if (startDate) {
      whereConditions.push(gte(callLogs.callStartedAt, startDate))
    }
    if (endDate) {
      whereConditions.push(lte(callLogs.callStartedAt, endDate))
    }

    const logs = await db.query.callLogs.findMany({
      where: and(...whereConditions),
    })

    const totalCalls = logs.length
    const completedCalls = logs.filter((l) => l.callEndReason === "completed").length
    const callsWithReservation = logs.filter((l) => l.reservationId).length
    const avgDuration = logs.reduce((sum, l) => sum + (l.callDurationSecs || 0), 0) / totalCalls || 0

    return {
      totalCalls,
      completedCalls,
      callsWithReservation,
      avgDuration: Math.round(avgDuration),
      completionRate: totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0,
    }
  } catch (error) {
    console.error("[Call Logger] Error fetching stats:", error)
    throw error
  }
}
