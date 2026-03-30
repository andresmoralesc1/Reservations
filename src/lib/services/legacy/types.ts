/**
 * Tipos internos del módulo legacy
 */

export type ReservationSource = 'WEB' | 'WHATSAPP' | 'VOICE' | 'MANUAL' | 'IVR'

export interface CreateReservationParams {
  nombre: string
  numero: string // teléfono
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM
  invitados: number
  idMesa?: string
  fuente?: ReservationSource
  restaurante?: string
  observaciones?: string
}

export interface ListReservationsParams {
  restaurante?: string
  fecha?: string
  estatus?: string
  limit?: number
  offset?: number
}

export interface LegacyCallParams {
  telefono: string
  restaurante?: string
  resId?: string
  accionesRealizadas?: Array<{
    action: string
    success: boolean
    timestamp: string
  }>
  duracionLlamada?: number
  motivoFinalizacion?: string
}

export interface CheckAvailabilityParams {
  fecha: string
  hora: string
  invitados: number
  restaurante?: string
}

export interface LegacyResult<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface ReservationResult extends LegacyResult {
  reservationCode?: string
}

export interface ReservationWithRelations {
  id: string
  reservationCode: string
  customerName: string
  customerPhone: string | null
  reservationDate: string
  reservationTime: string
  partySize: number
  status: string
  customer?: {
    id: string
    phoneNumber: string
    name: string | null
  } | null
  restaurant?: {
    id: string
    name: string
  } | null
}
