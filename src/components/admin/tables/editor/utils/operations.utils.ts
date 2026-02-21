/**
 * Utilities for table operations
 */

import { Table } from "@/drizzle/schema"
import { CreateTableOptions, UpdateTableOptions } from "../types/operations.types"

/**
 * Finds the next available table number
 * @param tables - Existing tables
 * @returns Next table number as string
 */
export function getNextTableNumber(tables: Table[]): string {
  const existingNumbers = tables
    .map((t) => parseInt(t.tableNumber, 10))
    .filter((n) => !isNaN(n))

  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
  return String(maxNumber + 1)
}

/**
 * Calculates offset position for duplicating a table
 * @param positionX - Original X position
 * @param positionY - Original Y position
 * @param offset - Offset distance (default: 50px)
 * @returns Offset position {x, y}
 */
export function calculateDuplicationOffset(
  positionX: number,
  positionY: number,
  offset: number = 50
): { x: number; y: number } {
  return {
    x: positionX + offset,
    y: positionY + offset,
  }
}

/**
 * Validates create table options
 * @param options - Options to validate
 * @returns true if valid
 */
export function validateCreateOptions(options: CreateTableOptions): boolean {
  if (!options.restaurantId) {
    console.error("Restaurant ID is required")
    return false
  }

  if (!options.tableNumber || options.tableNumber.trim() === "") {
    console.error("Table number is required")
    return false
  }

  if (!options.capacity || options.capacity <= 0) {
    console.error("Capacity must be greater than 0")
    return false
  }

  if (!options.location) {
    console.error("Location is required")
    return false
  }

  return true
}

/**
 * Creates a copy of table options for duplication
 * @param sourceTable - Table to duplicate
 * @param newTableNumber - New table number
 * @param position - New position {x, y}
 * @returns CreateTableOptions
 */
export function createDuplicateOptions(
  sourceTable: Table,
  newTableNumber: string,
  position: { x: number; y: number }
): CreateTableOptions {
  return {
    restaurantId: sourceTable.restaurantId,
    tableNumber: newTableNumber,
    capacity: sourceTable.capacity,
    location: (sourceTable.location || "interior") as "patio" | "interior" | "terraza",
    shape: sourceTable.shape,
    positionX: position.x,
    positionY: position.y,
    rotation: sourceTable.rotation || 0,
    width: sourceTable.width,
    height: sourceTable.height,
    diameter: sourceTable.diameter,
    stoolCount: sourceTable.stoolCount,
    stoolPositions: sourceTable.stoolPositions,
    isAccessible: sourceTable.isAccessible || false,
  }
}

/**
 * Extracts table template data for creating from template
 * @param template - Template object
 * @param restaurantId - Restaurant ID
 * @param tableNumber - Table number
 * @param position - Position {x, y}
 * @returns CreateTableOptions
 */
export function createTemplateOptions(
  template: {
    capacity: number
    shape: string
    width?: number
    height?: number
    diameter?: number
  },
  restaurantId: string,
  tableNumber: string,
  position: { x: number; y: number }
): CreateTableOptions {
  return {
    restaurantId,
    tableNumber,
    capacity: template.capacity,
    location: "interior",
    shape: template.shape,
    positionX: position.x,
    positionY: position.y,
    rotation: 0,
    width: template.width,
    height: template.height,
    diameter: template.diameter,
    isAccessible: false,
  }
}

/**
 * Checks if a table can be safely deleted (no active reservations)
 * @param tableId - Table ID to check
 * @param reservedTableIds - Set of reserved table IDs
 * @returns true if table can be deleted
 */
export function canDeleteTable(
  tableId: string,
  reservedTableIds: Set<string>
): boolean {
  return !reservedTableIds.has(tableId)
}

/**
 * Formats API error message
 * @param error - Error object or string
 * @returns Formatted error message
 */
export function formatApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === "string") {
    return error
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }

  return "An unknown error occurred"
}
