/**
 * Types for table operations
 */

import { Table } from "@/drizzle/schema"

export interface CreateTableOptions {
  restaurantId: string
  tableNumber: string
  capacity: number
  location: "patio" | "interior" | "terraza" | "barra"
  shape: string | null
  positionX: number
  positionY: number
  rotation: number
  width?: number | null
  height?: number | null
  diameter?: number | null
  isAccessible?: boolean
  stoolCount?: number | null
  stoolPositions?: number[] | null
}

export interface UpdateTableOptions {
  tableNumber?: string
  capacity?: number
  // Más flexible para compatibilidad con Drizzle ORM (string | null)
  location?: string | null | undefined
  isAccessible?: boolean
  shape?: string | null
  positionX?: number
  positionY?: number
  rotation?: number
  width?: number | null
  height?: number | null
  diameter?: number | null
  stoolCount?: number | null
  stoolPositions?: number[] | null
}

export interface TableOperationResult {
  success: boolean
  table?: Table
  error?: string
}

export interface TableOperationsState {
  isSaving: boolean
  showSaved: boolean
  lastSavedAt: Date | null
  pendingOperations: number
}

export interface UseTableOperationsOptions {
  restaurantId: string
  tables: Table[]
  onTablesChange?: (tables: Table[] | ((prev: Table[]) => Table[])) => void
  autoHideSaved?: boolean
  autoHideDelay?: number
}
