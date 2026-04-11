import { db } from "@/lib/db"
import { failedReservations } from "@/drizzle/schema"
import { eq, desc } from "drizzle-orm"

export interface SaveFailedReservationParams {
  customerName: string
  customerPhone: string
  reservationDate: string
  reservationTime: string
  partySize: number
  specialRequests?: string
  failureReason: "no_availability" | "invalid_phone" | "system_error" | "incomplete_data" | "customer_hangup"
  actionAttempted: "create" | "modify" | "cancel"
  restaurantId?: string
  sessionId?: string
  partialData?: Record<string, unknown>
}

/**
 * Guarda una reserva fallida para recuperación posterior
 */
export async function saveFailedReservation(params: SaveFailedReservationParams) {
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const result = await db.insert(failedReservations).values({
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      reservationDate: params.reservationDate,
      reservationTime: params.reservationTime,
      partySize: params.partySize,
      specialRequests: params.specialRequests || null,
      failureReason: params.failureReason,
      actionAttempted: params.actionAttempted,
      restaurantId: params.restaurantId || null,
      sessionId: params.sessionId || null,
      partialData: params.partialData || {},
      recoveryStatus: "pending",
      expiresAt,
    }).returning()

    return { success: true, id: result[0]?.id }
  } catch (error) {
    console.error("[FailedReservations] Error saving:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Obtiene reservas fallidas pendientes de recuperación
 */
export async function getPendingFailedReservations(limit = 50) {
  try {
    const results = await db.select()
      .from(failedReservations)
      .where(eq(failedReservations.recoveryStatus, "pending"))
      .orderBy(desc(failedReservations.createdAt))
      .limit(limit)

    return { success: true, data: results }
  } catch (error) {
    console.error("[FailedReservations] Error fetching:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Marca una reserva fallida como recuperada
 */
export async function markAsRecovered(id: string, recoveredBy: string) {
  try {
    await db.update(failedReservations)
      .set({
        recoveryStatus: "recovered",
        recoveredAt: new Date(),
        recoveredBy,
      })
      .where(eq(failedReservations.id, id))

    return { success: true }
  } catch (error) {
    console.error("[FailedReservations] Error marking recovered:", error)
    return { success: false, error: String(error) }
  }
}
