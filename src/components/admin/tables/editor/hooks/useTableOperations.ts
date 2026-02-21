/**
 * Hook for table CRUD operations
 * Handles creating, updating, deleting, and duplicating tables
 */

import { useState, useCallback, useEffect } from "react"
import { Table } from "@/drizzle/schema"
import {
  CreateTableOptions,
  UpdateTableOptions,
  TableOperationResult,
  TableOperationsState,
  UseTableOperationsOptions,
} from "../types/operations.types"
import {
  getNextTableNumber,
  calculateDuplicationOffset,
  validateCreateOptions,
  createDuplicateOptions,
  createTemplateOptions,
  canDeleteTable,
  formatApiError,
} from "../utils/operations.utils"

const DEFAULT_AUTO_HIDE_DELAY = 2000

export interface UseTableOperationsReturn {
  // State
  state: TableOperationsState

  // Operations
  createTable: (options: CreateTableOptions) => Promise<TableOperationResult>
  updateTable: (tableId: string, updates: UpdateTableOptions) => Promise<TableOperationResult>
  deleteTable: (tableId: string, reservedTableIds?: Set<string>) => Promise<TableOperationResult>
  duplicateTable: (
    tableId: string,
    snapAndConstrainToCanvas: (x: number, y: number, size: number) => { x: number; y: number }
  ) => Promise<TableOperationResult>
  duplicateTableFromTemplate: (
    template: any,
    snapAndConstrainToCanvas: (x: number, y: number, size: number) => { x: number; y: number }
  ) => Promise<TableOperationResult>

  // Batch operations
  autoArrangeTables: (
    tables: Table[],
    onUpdateTable: (id: string, updates: Partial<Table>) => Promise<void>
  ) => Promise<Table[]>

  // Helpers
  getNextTableNumber: (tables: Table[]) => string
  clearSavedIndicator: () => void
}

/**
 * Hook for managing table CRUD operations
 *
 * @example
 * ```tsx
 * const { createTable, updateTable, deleteTable, state } = useTableOperations({
 *   restaurantId: "xxx",
 *   onTablesChange: setTables,
 * })
 *
 * // Create a table
 * const result = await createTable({
 *   restaurantId: "xxx",
 *   tableNumber: "1",
 *   capacity: 4,
 *   location: "interior",
 *   shape: "rectangular",
 *   positionX: 100,
 *   positionY: 100,
 *   rotation: 0,
 * })
 * ```
 */
export function useTableOperations(
  options: UseTableOperationsOptions
): UseTableOperationsReturn {
  const {
    restaurantId,
    tables,
    onTablesChange,
    autoHideSaved = true,
    autoHideDelay = DEFAULT_AUTO_HIDE_DELAY,
  } = options

  const [opState, setOpState] = useState<TableOperationsState>({
    isSaving: false,
    showSaved: false,
    lastSavedAt: null,
    pendingOperations: 0,
  })

  // Update pending operations counter
  const updatePendingCount = useCallback((delta: number) => {
    setOpState((prev) => ({
      ...prev,
      pendingOperations: Math.max(0, prev.pendingOperations + delta),
      isSaving: prev.pendingOperations + delta + 1 > 0,
    }))
  }, [])

  // Show saved indicator
  const showSavedSuccess = useCallback(() => {
    setOpState((prev) => ({
      ...prev,
      showSaved: true,
      lastSavedAt: new Date(),
    }))

    if (autoHideSaved) {
      setTimeout(() => {
        setOpState((prev) => ({ ...prev, showSaved: false }))
      }, autoHideDelay)
    }
  }, [autoHideSaved, autoHideDelay])

  // Clear saved indicator manually
  const clearSavedIndicator = useCallback(() => {
    setOpState((prev) => ({ ...prev, showSaved: false }))
  }, [])

  // Create table
  const createTable = useCallback(
    async (options: CreateTableOptions): Promise<TableOperationResult> => {
      // Validate
      if (!validateCreateOptions(options)) {
        return { success: false, error: "Invalid options" }
      }

      updatePendingCount(1)
      setOpState((prev) => ({ ...prev, showSaved: false }))

      try {
        const response = await fetch("/api/admin/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error creating table")
        }

        const data = await response.json()
        const newTable = data.table

        // Update local state
        if (onTablesChange) {
          onTablesChange([...tables, newTable])
        }

        showSavedSuccess()
        return { success: true, table: newTable }
      } catch (error) {
        console.error("Error creating table:", error)
        return { success: false, error: formatApiError(error) }
      } finally {
        updatePendingCount(-1)
      }
    },
    [onTablesChange, updatePendingCount, showSavedSuccess]
  )

  // Update table
  const updateTable = useCallback(
    async (tableId: string, updates: UpdateTableOptions): Promise<TableOperationResult> => {
      updatePendingCount(1)
      setOpState((prev) => ({ ...prev, showSaved: false }))

      try {
        const response = await fetch(`/api/admin/tables/${tableId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error updating table")
        }

        const data = await response.json()
        const updatedTable = data.table

        // Update local state
        if (onTablesChange) {
          onTablesChange(
            tables.map((t) => (t.id === tableId ? { ...t, ...updatedTable } : t))
          )
        }

        showSavedSuccess()
        return { success: true, table: updatedTable }
      } catch (error) {
        console.error("Error updating table:", error)
        return { success: false, error: formatApiError(error) }
      } finally {
        updatePendingCount(-1)
      }
    },
    [tables, onTablesChange, updatePendingCount, showSavedSuccess]
  )

  // Delete table
  const deleteTable = useCallback(
    async (tableId: string, reservedTableIds: Set<string> = new Set()): Promise<TableOperationResult> => {
      // Check if table can be deleted
      if (!canDeleteTable(tableId, reservedTableIds)) {
        return {
          success: false,
          error: "Cannot delete table with active reservations",
        }
      }

      updatePendingCount(1)

      try {
        const response = await fetch(`/api/admin/tables/${tableId}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error deleting table")
        }

        // Update local state
        if (onTablesChange) {
          onTablesChange(tables.filter((t) => t.id !== tableId))
        }

        showSavedSuccess()
        return { success: true }
      } catch (error) {
        console.error("Error deleting table:", error)
        return { success: false, error: formatApiError(error) }
      } finally {
        updatePendingCount(-1)
      }
    },
    [tables, onTablesChange, updatePendingCount, showSavedSuccess]
  )

  // Duplicate table
  const duplicateTable = useCallback(
    async (
      tableId: string,
      snapAndConstrainToCanvas: (x: number, y: number, size: number) => { x: number; y: number }
    ): Promise<TableOperationResult> => {
      const sourceTable = tables.find((t) => t.id === tableId)
      if (!sourceTable) {
        return { success: false, error: "Table not found" }
      }

      // Calculate new position and number
      const newTableNumber = getNextTableNumber(tables)
      const offsetPos = calculateDuplicationOffset(
        sourceTable.positionX ?? 0,
        sourceTable.positionY ?? 0
      )
      const finalPos = snapAndConstrainToCanvas(offsetPos.x, offsetPos.y, 100)

      // Create duplicate
      const options = createDuplicateOptions(sourceTable, newTableNumber, finalPos)
      return createTable(options)
    },
    [tables, createTable]
  )

  // Duplicate table from template
  const duplicateTableFromTemplate = useCallback(
    async (
      template: any,
      snapAndConstrainToCanvas: (x: number, y: number, size: number) => { x: number; y: number }
    ): Promise<TableOperationResult> => {
      // Calculate position and number
      const newTableNumber = getNextTableNumber(tables)
      const position = snapAndConstrainToCanvas(50, 50, 100)

      // Create from template
      const options = createTemplateOptions(template, restaurantId, newTableNumber, position)
      return createTable(options)
    },
    [tables, createTable, restaurantId]
  )

  // Auto-arrange tables in grid
  const autoArrangeTables = useCallback(
    async (
      tables: Table[],
      onUpdateTable: (id: string, updates: Partial<Table>) => Promise<void>
    ): Promise<Table[]> => {
      const COLS = 8
      const START_X = 50
      const START_Y = 50
      const SPACING_X = 150
      const SPACING_Y = 150

      updatePendingCount(tables.length)

      try {
        const updatedTables = await Promise.all(
          tables.map(async (table, index) => {
            const col = index % COLS
            const row = Math.floor(index / COLS)
            const newX = START_X + col * SPACING_X
            const newY = START_Y + row * SPACING_Y

            await onUpdateTable(table.id, { positionX: newX, positionY: newY })

            return {
              ...table,
              positionX: newX,
              positionY: newY,
            }
          })
        )

        showSavedSuccess()
        return updatedTables
      } catch (error) {
        console.error("Error auto-arranging tables:", error)
        throw error
      } finally {
        updatePendingCount(-tables.length)
      }
    },
    [updatePendingCount, showSavedSuccess]
  )

  return {
    state: opState,
    createTable,
    updateTable,
    deleteTable,
    duplicateTable,
    duplicateTableFromTemplate,
    autoArrangeTables,
    getNextTableNumber,
    clearSavedIndicator,
  }
}
