/**
 * Voice Types
 *
 * Tipos compartidos para el sistema de voz.
 * Definen las interfaces entre Pipecat, voice-bridge y voice-service.
 */

// ============ Actions que Pipecat puede ejecutar ============
export type VoiceAction =
  | "checkAvailability"
  | "createReservation"
  | "getReservation"
  | "cancelReservation"
  | "modifyReservation"

// ============ Input desde Pipecat ============
export interface PipecatFunctionCall {
  action: VoiceAction
  params: Record<string, unknown>
  callId?: string // ID único de la llamada para logging
}

// ============ Respuesta hacia Pipecat ============
export interface VoiceActionResult {
  success: boolean
  message: string // Mensaje para el bot (se dirá al cliente)
  data?: Record<string, unknown>
  reservationCode?: string
  reservation?: ReservationDetails
  availableSlots?: AlternativeSlot[]
  alternativeSlots?: string[] // Array de horas disponibles como "HH:MM" (solo las disponibles)
  suggestedTables?: string[] // IDs de mesas sugeridas
}

// ============ Detalles de reserva para voz ============
export interface ReservationDetails {
  reservationCode: string
  customerName: string
  customerPhone: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  partySize: number
  status: string
  restaurantName?: string
  specialRequests?: string | null
}

// ============ Parámetros de cada acción ============
export interface CheckAvailabilityInput {
  date: string // YYYY-MM-DD
  time: string // HH:MM
  partySize: number
  restaurantId?: string // Opcional, usa default si no se provee
}

export interface CreateReservationInput {
  customerName: string
  customerPhone: string // Formato español: +34 6XX XXX XXX o 6XXXXXXXX
  restaurantId?: string // Opcional, usa default si no se provee
  date: string // YYYY-MM-DD
  time: string // HH:MM
  partySize: number
  specialRequests?: string
}

export interface GetReservationInput {
  code: string // RES-XXXXX
}

export interface CancelReservationInput {
  code: string // RES-XXXXX
  phone: string // Para verificación de seguridad
}

/**
 * Input para modificar reserva - acepta dos formatos:
 * Formato plano (Pipecat): { code, phone, newDate?, newTime?, newPartySize?, newSpecialRequests? }
 * Formato anidado: { code, phone, changes?: { newDate?, newTime?, newPartySize?, newSpecialRequests? } }
 */
export interface ModifyReservationInput {
  code: string // RES-XXXXX
  phone: string // Para verificación
  // Flat format (Pipecat)
  newDate?: string // YYYY-MM-DD
  newTime?: string // HH:MM
  newPartySize?: number
  newSpecialRequests?: string
  // Nested format (backward compatibility)
  changes?: {
    newDate?: string // YYYY-MM-DD
    newTime?: string // HH:MM
    newPartySize?: number
    newSpecialRequests?: string
  }
}

// ============ Alternativas de horario ============
export interface AlternativeSlot {
  time: string // HH:MM
  available: boolean
  reason?: string // Opcional: por qué no está disponible
}

// ============ Call Log (registro de llamadas) ============
export interface CallLogEntry {
  id: string // UUID
  reservationId?: string | null // UUID opcional
  restaurantId: string // UUID
  callerPhone: string // +34 6XX XXX XXX
  callStartedAt: Date
  callDurationSecs?: number | null
  callEndReason?: CallEndReason
  callCost?: string | null // Coste estimado (Cartesia + GPT)
  callSummary?: string | null // Resumen generado por GPT
  actionsTaken: CallAction[]
  createdAt: Date
}

export type CallEndReason =
  | "completed" // Llamada finalizada normalmente
  | "hangup" // Cliente colgó
  | "error" // Error en el sistema
  | "timeout" // Timeout por inactividad
  | "no_show" // Cliente no respondió

export interface CallAction {
  action: VoiceAction
  success: boolean
  timestamp: Date
  params?: Record<string, unknown>
  error?: string
}

// ============ Validadores ============
export function isValidVoiceAction(action: string): action is VoiceAction {
  return ["checkAvailability", "createReservation", "getReservation", "cancelReservation", "modifyReservation"]
    .includes(action)
}
