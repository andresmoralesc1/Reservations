/**
 * Hook for table drag and drop operations
 * Manages drag state, position updates, and optimistic UI updates
 */

import { useState, useCallback } from "react"
import { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { Table } from "@/drizzle/schema"
import {
  DragState,
  UseTableDragOptions,
  UseTableDragReturn,
} from "../types/drag.types"
import {
  findTableById,
  calculateDragPosition,
  hasPositionChanged,
  createOptimisticUpdate,
  formatDragError,
} from "../utils/drag.utils"

const DEFAULT_ACTIVATION_DISTANCE = 8 // px

export function useTableDrag(
  options: UseTableDragOptions
): UseTableDragReturn {
  const {
    tables,
    onTablesChange,
    snapAndConstrainToCanvas,
    onUpdateTable,
    enabled = true,
  } = options

  const [dragState, setDragState] = useState<DragState>({
    activeId: null,
    isDragging: false,
    dragPosition: { x: 0, y: 0 },
    activeTable: null,
  })

  const setActiveId = useCallback((id: string | null) => {
    setDragState((prev) => ({
      ...prev,
      activeId: id,
      isDragging: id !== null,
    }))
  }, [])

  /**
   * Handles drag start event
   * - Sets active table
   * - Records initial position
   */
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!enabled) return

      const activeId = event.active.id as string
      const activeTable = findTableById(activeId, tables)

      if (activeTable) {
        setDragState({
          activeId,
          isDragging: true,
          dragPosition: {
            x: activeTable.positionX ?? 0,
            y: activeTable.positionY ?? 0,
          },
          activeTable,
        })
      }
    },
    [tables, enabled]
  )

  /**
   * Handles drag end event
   * - Calculates new position
   * - Applies snapping and constraints
   * - Performs optimistic update
   * - Persists to server
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      if (!enabled) return

      const { active, delta } = event
      setActiveId(null)

      // Ignore if no actual movement
      if (!hasPositionChanged(delta.x, delta.y)) {
        return
      }

      const tableId = active.id as string
      const table = findTableById(tableId, tables)

      if (!table) {
        console.warn("Table not found:", tableId)
        return
      }

      try {
        // Calculate raw new position
        const rawPos = calculateDragPosition(
          table.positionX ?? 0,
          table.positionY ?? 0,
          delta.x,
          delta.y
        )

        // Apply grid snapping and canvas constraints
        const finalPos = snapAndConstrainToCanvas(rawPos.x, rawPos.y, 100)

        // Optimistic update
        const updatedTables = createOptimisticUpdate(
          tables,
          tableId,
          finalPos
        )
        onTablesChange(updatedTables)

        // Persist to server
        await onUpdateTable(tableId, {
          positionX: finalPos.x,
          positionY: finalPos.y,
        })

        // Success - drag state will be cleared by setActiveId(null)
      } catch (error) {
        console.error("Error updating table position:", formatDragError(error))

        // On error, you could revert the optimistic update here
        // For now, we leave the optimistic state in place
      } finally {
        setDragState((prev) => ({
          ...prev,
          isDragging: false,
          activeTable: null,
        }))
      }
    },
    [tables, onTablesChange, snapAndConstrainToCanvas, onUpdateTable, enabled, setActiveId]
  )

  return {
    dragState,
    activationConstraint: {
      distance: DEFAULT_ACTIVATION_DISTANCE,
    },
    handleDragStart,
    handleDragEnd,
    setActiveId,
  }
}
