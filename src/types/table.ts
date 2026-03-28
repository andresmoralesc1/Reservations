/**
 * Tipos centralizados para Mesas
 */

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
 * Mesa completa
 */
export interface Table {
  id: string
  restaurantId: string
  tableNumber: string // Número visible (ej: "1", "A1")
  tableCode: string // Código único (ej: "I-1", "T-2")
  capacity: number
  location: TableLocation
  isAccessible: boolean
  shape: TableShape
  positionX?: number // Para floor plan
  positionY?: number // Para floor plan
  width?: number // Para floor plan
  height?: number // Para floor plan
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Mesa simplificada para listas
 */
export interface TableListItem {
  id: string
  tableNumber: string
  tableCode: string
  capacity: number
  location: TableLocation
  isAccessible: boolean
  isActive: boolean
}

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
  isActive?: boolean
}

/**
 * Mesa con estado de ocupación
 */
export interface TableWithStatus extends Table {
  isAvailable: boolean
  currentReservation?: {
    id: string
    customerName: string
    reservationTime: string
    estimatedEndTime: string
  }
}

/**
 * Bloqueo de mesa
 */
export interface TableBlock {
  id: string
  tableId: string
  blockDate: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  reason?: string
  createdAt: Date
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
