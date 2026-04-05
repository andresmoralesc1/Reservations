/**
 * Types for table drag operations
 */

import { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { Table } from "@/drizzle/schema"
import type { TableOperationResult } from "./operations.types"

export interface DragState {
  activeId: string | null
  isDragging: boolean
  dragPosition: { x: number; y: number }
  activeTable: Table | null
}

export interface UseTableDragOptions {
  tables: Table[]
  onTablesChange: (tables: Table[] | ((prev: Table[]) => Table[])) => void
  snapAndConstrainToCanvas: (
    x: number,
    y: number,
    tableSize: number
  ) => { x: number; y: number }
  onUpdateTable: (tableId: string, updates: Partial<Table>) => Promise<void | TableOperationResult>
  enabled?: boolean
}

export interface UseTableDragReturn {
  // State
  dragState: DragState

  // Sensors config
  activationConstraint?: { distance: number }

  // Handlers
  handleDragStart: (event: DragStartEvent) => void
  handleDragEnd: (event: DragEndEvent) => Promise<void>

  // Actions
  setActiveId: (id: string | null) => void
}
