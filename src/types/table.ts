/**
 * Tipos centralizados para Mesas
 * El tipo base Table viene de drizzle/schema.ts
 */

import type { Table, TableBlock } from "@/drizzle/schema"

export type { Table, TableBlock }

/**
 * Ubicaciones posibles de mesas
 */
export type TableLocation =
  | "interior"
  | "terraza"
  | "patio"
  | "privado"
  | "bar"

/**
 * Formas posibles de mesas
 */
export type TableShape =
  | "rectangular"
  | "round"
  | "square"
  | "oval"
  | "circular"
  | "cuadrada"
  | "barra"

/**
 * Mesa simplificada para listas
 */
export type TableListItem = Pick<Table, "id" | "tableNumber" | "tableCode" | "capacity" | "location" | "deletedAt"> & {
  isAccessible: boolean
}

/**
 * DTO para crear mesa
 */
export interface CreateTableDTO {
  restaurantId: string
  tableNumber: string
  capacity: number
  location: TableLocation | null
  isAccessible?: boolean
  shape?: TableShape
  positionX?: number
  positionY?: number
  width?: number
  height?: number
  diameter?: number
}

/**
 * DTO para actualizar mesa
 */
export interface UpdateTableDTO {
  tableNumber?: string
  capacity?: number
  location?: string | null
  isAccessible?: boolean
  shape?: string | null
  positionX?: number
  positionY?: number
  width?: number | null
  height?: number | null
  rotation?: number
  diameter?: number | null
  stoolCount?: number
  stoolPositions?: number[] | null
  deletedAt?: Date | null
}

/**
 * Mesa con estado de ocupación
 */
export type TableWithStatus = Table & {
  isAvailable: boolean
  currentReservation?: {
    id: string
    customerName: string
    reservationTime: string
    estimatedEndTime: string
  }
}

/**
 * Mesa con estado para floor plan
 */
export interface TableWithFloorPlanStatus extends Table {
  status: "available" | "occupied" | "reserved" | "blocked"
  reservations?: Array<{
    id: string
    reservationCode: string
    customerName: string
    customerPhone: string
    reservationTime: string
    partySize: number
    status: string
    estimatedDurationMinutes: number
  }>
}

/**
 * Filtros para búsqueda de mesas
 */
export interface TableFilters {
  location?: TableLocation | string | null
  minCapacity?: number
  maxCapacity?: number
  isAccessible?: boolean
  searchQuery?: string
}

/**
 * Estadísticas de mesas
 */
export interface TableStats {
  total: number
  active: number
  inactive: number
  byLocation: Record<string, number>
  totalCapacity: number
  accessible: number
}
