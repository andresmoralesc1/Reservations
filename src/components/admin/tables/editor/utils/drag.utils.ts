/**
 * Utilities for table drag operations
 */

import { Table } from "@/drizzle/schema"

/**
 * Finds a table by ID in the tables array
 * @param tableId - Table ID to find
 * @param tables - Array of tables
 * @returns Table or null
 */
export function findTableById(tableId: string, tables: Table[]): Table | null {
  return tables.find((t) => t.id === tableId) || null
}

/**
 * Calculates the new position after drag with delta
 * @param initialX - Initial X position
 * @param initialY - Initial Y position
 * @param deltaX - X delta from drag
 * @param deltaY - Y delta from drag
 * @returns New position {x, y}
 */
export function calculateDragPosition(
  initialX: number,
  initialY: number,
  deltaX: number,
  deltaY: number
): { x: number; y: number } {
  return {
    x: initialX + deltaX,
    y: initialY + deltaY,
  }
}

/**
 * Checks if drag actually moved the table
 * @param deltaX - X delta from drag
 * @param deltaY - Y delta from drag
 * @returns true if position changed
 */
export function hasPositionChanged(deltaX: number, deltaY: number): boolean {
  return deltaX !== 0 || deltaY !== 0
}

/**
 * Creates an optimistic update for tables array
 * @param tables - Current tables array
 * @param tableId - ID of table to update
 * @param position - New position {x, y}
 * @returns Updated tables array
 */
export function createOptimisticUpdate(
  tables: Table[],
  tableId: string,
  position: { x: number; y: number }
): Table[] {
  return tables.map((t) =>
    t.id === tableId
      ? { ...t, positionX: position.x, positionY: position.y }
      : t
  )
}

/**
 * Formats drag error message
 * @param error - Error from update operation
 * @returns Formatted error string
 */
export function formatDragError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  return "Failed to update table position"
}
