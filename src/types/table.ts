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

/**
 * Mesa simplificada para listas
 */
export type TableListItem = Pick<Table, "id" | "tableNumber" | "tableCode" | "capacity" | "location" | "deletedAt">

/**
 * DTO para crear mesa
 */
export interface CreateTableDTO {
  restaurantId: string
  tableNumber: string
  tableCode: string
  capacity: number
  location: TableLocation
  isAccessible?: boolean
  shape?: TableShape
  positionX?: number
  positionY?: number
  width?: number
  height?: number
}

/**
 * DTO para actualizar mesa
 * Nota: location usa string | null para compatibilidad con Drizzle ORM
 */
export interface UpdateTableDTO {
  tableNumber?: string
  tableCode?: string
  capacity?: number
  location?: string | null // Drizzle usa string, no TableLocation enum
  isAccessible?: boolean
  shape?: TableShape
  positionX?: number
  positionY?: number
  width?: number
  height?: number
  rotation?: number
  diameter?: number
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
 * Filtros para búsqueda de mesas
 */
export interface TableFilters {
  location?: TableLocation
  minCapacity?: number
  maxCapacity?: number
  isAccessible?: boolean
  isActive?: boolean
  searchQuery?: string
}

/**
 * Estadísticas de mesas
 */
export interface TableStats {
  total: number
  active: number
  inactive: number
  byLocation: Record<TableLocation, number>
  totalCapacity: number
  accessible: number
}
