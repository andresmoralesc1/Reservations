/**
 * Grid utilities for snapping calculations
 */

import { GRID_CONFIG } from '../config/canvas.config'

/**
 * Snaps a coordinate value to the nearest grid line
 * @param value - The coordinate to snap (x or y)
 * @param gridSize - Size of the grid cells (default: 20px)
 * @returns The snapped coordinate
 */
export function snapToGridLine(value: number, gridSize: number = GRID_CONFIG.SIZE): number {
  return Math.round(value / gridSize) * gridSize
}

/**
 * Checks if a value should snap based on threshold distance
 * @param value - The original value
 * @param snappedValue - The value after snapping
 * @param threshold - Maximum distance to allow snap (default: 10px)
 * @returns true if within snapping threshold
 */
export function shouldSnap(
  value: number,
  snappedValue: number,
  threshold: number = GRID_CONFIG.THRESHOLD
): boolean {
  return Math.abs(value - snappedValue) < threshold
}

/**
 * Snaps coordinates to grid with threshold checking
 * Only snaps if within threshold distance
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param snapEnabled - Whether snapping is enabled
 * @returns Snapped coordinates {x, y}
 */
export function snapToGrid(
  x: number,
  y: number,
  snapEnabled: boolean = true
): { x: number; y: number } {
  if (!snapEnabled) {
    return { x, y }
  }

  const snappedX = snapToGridLine(x)
  const snappedY = snapToGridLine(y)

  return {
    x: shouldSnap(x, snappedX) ? snappedX : x,
    y: shouldSnap(y, snappedY) ? snappedY : y,
  }
}

/**
 * Constrains a value within min and max bounds
 * @param value - Value to constrain
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns Constrained value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Constrains position within canvas bounds
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @param tableSize - Table width/height for offset
 * @returns Constrained position {x, y}
 */
export function constrainToCanvas(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  tableSize: number = 100
): { x: number; y: number } {
  return {
    x: clamp(x, 0, canvasWidth - tableSize),
    y: clamp(y, 0, canvasHeight - tableSize),
  }
}

/**
 * Combines snapping and canvas constraining
 * @param x - Raw X coordinate
 * @param y - Raw Y coordinate
 * @param snapEnabled - Whether to snap to grid
 * @param canvasWidth - Canvas width (default: 2000)
 * @param canvasHeight - Canvas height (default: 1500)
 * @param tableSize - Table size for bounds (default: 100)
 * @returns Final constrained and snapped position
 */
export function snapAndConstrain(
  x: number,
  y: number,
  snapEnabled: boolean = true,
  canvasWidth: number = 2000,
  canvasHeight: number = 1500,
  tableSize: number = 100
): { x: number; y: number } {
  const snapped = snapToGrid(x, y, snapEnabled)
  return constrainToCanvas(snapped.x, snapped.y, canvasWidth, canvasHeight, tableSize)
}

/**
 * Calculates grid position for auto-arrange layout
 * @param index - Table index in the array
 * @param cols - Number of columns (default: 8)
 * @param startX - Starting X position (default: 50)
 * @param startY - Starting Y position (default: 50)
 * @param spacingX - Horizontal spacing (default: 150)
 * @param spacingY - Vertical spacing (default: 150)
 * @returns Grid position {x, y}
 */
export function calculateGridPosition(
  index: number,
  cols: number = 8,
  startX: number = 50,
  startY: number = 50,
  spacingX: number = 150,
  spacingY: number = 150
): { x: number; y: number } {
  const col = index % cols
  const row = Math.floor(index / cols)

  return {
    x: startX + col * spacingX,
    y: startY + row * spacingY,
  }
}

/**
 * Checks if a position is valid (within bounds and not overlapping)
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @param existingPositions - Array of existing positions to check overlap
 * @param minDistance - Minimum distance between tables (default: 100)
 * @returns true if position is valid
 */
export function isValidPosition(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  existingPositions: Array<{ x: number; y: number }>,
  minDistance: number = 100
): boolean {
  // Check bounds
  if (x < 0 || y < 0 || x > canvasWidth || y > canvasHeight) {
    return false
  }

  // Check overlaps
  for (const pos of existingPositions) {
    const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2))
    if (distance < minDistance) {
      return false
    }
  }

  return true
}
