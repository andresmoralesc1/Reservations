/**
 * Tipos centralizados para Reservas
 *
 * El tipo base Reservation viene de drizzle/schema.ts.
 * Este archivo exporta enums, constantes y tipos derivados.
 */

import type { Reservation } from "@/drizzle/schema"

export type { Reservation }

/**
 * Estados de reserva (en español para BD, mapeo a inglés para APIs)
 */
export enum ReservationStatus {
  PENDIENTE = "PENDIENTE",
  CONFIRMADO = "CONFIRMADO",
  CANCELADO = "CANCELADO",
  NO_SHOW = "NO_SHOW",
  COMPLETED = "COMPLETED",
}

/**
 * Tipo de unión para los estados válidos de reserva
 */
export type ReservationStatusEnum =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "CANCELADO"
  | "NO_SHOW"
  | "COMPLETED"

/**
 * Mapeo de estados en español a inglés (para APIs externas)
 */
export const STATUS_TO_ENGLISH: Record<ReservationStatusEnum, string> = {
  "PENDIENTE": "PENDING",
  "CONFIRMADO": "CONFIRMED",
  "CANCELADO": "CANCELLED",
  "NO_SHOW": "NOSHOW",
  "COMPLETED": "COMPLETED",
}

/**
 * Mapeo inverso de inglés a español
 */
export const STATUS_TO_SPANISH: Record<string, ReservationStatusEnum> = {
  "PENDING": "PENDIENTE",
  "CONFIRMED": "CONFIRMADO",
  "CANCELLED": "CANCELADO",
  "NOSHOW": "NO_SHOW",
  "COMPLETED": "COMPLETED",
}

/**
 * Traducir estado al inglés
 */
export function translateStatusToEnglish(status: ReservationStatusEnum): string {
  return STATUS_TO_ENGLISH[status]
}

/**
 * Traducir estado al español
 */
export function translateStatusToSpanish(status: string): ReservationStatusEnum {
  return STATUS_TO_SPANISH[status] || ReservationStatus.PENDIENTE
}

/**
 * Validar si un string es un estado válido
 */
export function isValidReservationStatus(status: string): status is ReservationStatusEnum {
  return Object.values(ReservationStatus).includes(status as ReservationStatus)
}

/**
 * Colores para UI según estado
 */
export const STATUS_COLORS: Record<ReservationStatusEnum, string> = {
  "PENDIENTE": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "CONFIRMADO": "bg-green-100 text-green-800 border-green-200",
  "CANCELADO": "bg-red-100 text-red-800 border-red-200",
  "NO_SHOW": "bg-gray-100 text-gray-800 border-gray-200",
  "COMPLETED": "bg-blue-100 text-blue-800 border-blue-200",
}

/**
 * Labels para mostrar en UI
 */
export const STATUS_LABELS: Record<ReservationStatusEnum, string> = {
  "PENDIENTE": "Pendiente",
  "CONFIRMADO": "Confirmado",
  "CANCELADO": "Cancelado",
  "NO_SHOW": "No Show",
  "COMPLETED": "Completado",
}

/**
 * Fuentes de reserva
 */
export type ReservationSource =
  | "WEB"
  | "WHATSAPP"
  | "IVR"
  | "ADMIN"
  | "API"

/**
 * DTO para crear reserva (sin campos autogenerados)
 */
export interface CreateReservationDTO {
  customerId: string
  restaurantId: string
  reservationDate: string // YYYY-MM-DD
  reservationTime: string // HH:MM
  partySize: number
  tableIds?: string[]
  specialRequests?: string
  source: ReservationSource
  estimatedDurationMinutes?: number
}

/**
 * DTO para actualizar reserva
 */
export interface UpdateReservationDTO {
  status?: ReservationStatusEnum
  tableIds?: string[]
  specialRequests?: string
  estimatedDurationMinutes?: number
  cancelledAt?: Date
  confirmedAt?: Date
}

/**
 * Reserva simplificada para listas
 */
export type ReservationListItem = Pick<Reservation,
  "id" | "reservationCode" | "customerName" | "customerPhone" |
  "reservationDate" | "reservationTime" | "partySize" | "status"
> & {
  tableCount: number
}

/**
 * Reserva con relaciones incluidas
 */
export interface ReservationWithRelations extends Reservation {
  customer: {
    id: string
    name: string
    phoneNumber: string
    email?: string
  }
  restaurant: {
    id: string
    name: string
  }
  tables: Array<{
    id: string
    tableNumber: string
    tableCode: string
    capacity: number
    location: string
  }>
}

/**
 * Filtros para búsqueda de reservas
 */
export interface ReservationFilters {
  status?: ReservationStatusEnum
  date?: string // YYYY-MM-DD
  customerId?: string
  partySize?: number
  tableId?: string
  restaurantId?: string
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string // YYYY-MM-DD
  searchQuery?: string // Búsqueda en nombre o código
}

/**
 * Estadísticas de reservas
 */
export interface ReservationStats {
  total: number
  pending: number
  confirmed: number
  cancelled: number
  noShow: number
  completed: number
  todayCount: number
  todayPartySize: number
}

/**
 * Tipo legado para compatibilidad (será removido en futura versión)
 * @deprecated Usar ReservationStatusEnum directamente
 */
export type LegacyStatusMap = Record<string, string>

/**
 * Mapa de estados para compatibilidad con código existente
 * @deprecated Usar STATUS_TO_ENGLISH directamente
 */
export const STATUS_MAP: LegacyStatusMap = STATUS_TO_ENGLISH

/**
 * Mapa inverso para compatibilidad
 * @deprecated Usar STATUS_TO_SPANISH directamente
 */
export const STATUS_REVERSE_MAP: LegacyStatusMap = {
  "PENDING": "PENDIENTE",
  "CONFIRMED": "CONFIRMADO",
  "CANCELLED": "CANCELADO",
  "NOSHOW": "NO_SHOW",
  "COMPLETED": "COMPLETED",
}
