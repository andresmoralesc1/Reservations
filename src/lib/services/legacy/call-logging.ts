/**
 * Módulo de logging - Registro de llamadas de voz
 */

import type { LegacyCallParams, LegacyResult } from "./types"

/**
 * Registra una llamada de voz en el sistema
 * Nota: Actualmente solo logea en consola, pero está preparado
 * para integrarse con callLogs cuando sea necesario
 */
export async function logLegacyCall(
  params: LegacyCallParams
): Promise<LegacyResult & { callId?: string }> {
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

    // TODO: Integrar con tabla callLogs cuando sea necesario
    // const [callLog] = await db.insert(callLogs).values({...}).returning()

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
