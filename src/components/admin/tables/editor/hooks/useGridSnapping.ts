/**
 * Hook for grid snapping functionality
 * Provides utilities to snap positions to grid and constrain to canvas bounds
 */

import { useCallback } from 'react'
import { CANVAS_CONFIG, GRID_CONFIG } from '../config/canvas.config'
import {
  snapToGrid,
  snapAndConstrain,
  calculateGridPosition,
  isValidPosition,
} from '../utils/grid.utils'

export interface UseGridSnappingOptions {
  snapEnabled?: boolean
  canvasWidth?: number
  canvasHeight?: number
  gridSize?: number
  snapThreshold?: number
}

export interface UseGridSnappingReturn {
  /**
   * Snaps coordinates to grid with threshold checking
   */
  snap: (x: number, y: number) => { x: number; y: number }

  /**
   * Snaps coordinates and constrains them within canvas bounds
   */
  snapAndConstrainToCanvas: (
    x: number,
    y: number,
    tableSize?: number
  ) => { x: number; y: number }

  /**
   * Calculates grid position for auto-arrange layout
   */
  calculatePosition: (
    index: number,
    cols?: number,
    startX?: number,
    startY?: number,
    spacingX?: number,
    spacingY?: number
  ) => { x: number; y: number }

  /**
   * Checks if a position is valid (within bounds and not overlapping)
   */
  checkPositionValid: (
    x: number,
    y: number,
    existingPositions: Array<{ x: number; y: number }>,
    minDistance?: number
  ) => boolean

  /**
   * Current configuration values
   */
  config: {
    snapEnabled: boolean
    gridSize: number
    snapThreshold: number
    canvasWidth: number
    canvasHeight: number
  }
}

/**
 * Hook for grid snapping in table layout editor
 *
 * @example
 * ```tsx
 * const { snap, snapAndConstrainToCanvas, config } = useGridSnapping({
 *   snapEnabled: true,
 *   canvasWidth: 2000,
 *   canvasHeight: 1500,
 * })
 *
 * // Snap a position
 * const snapped = snap(45, 67) // { x: 40, y: 60 }
 *
 * // Snap and constrain to canvas
 * const final = snapAndConstrainToCanvas(45, 67, 100)
 * ```
 */
export function useGridSnapping(
  options: UseGridSnappingOptions = {}
): UseGridSnappingReturn {
  const {
    snapEnabled = true,
    canvasWidth = CANVAS_CONFIG.WIDTH,
    canvasHeight = CANVAS_CONFIG.HEIGHT,
    gridSize = GRID_CONFIG.SIZE,
    snapThreshold = GRID_CONFIG.THRESHOLD,
  } = options

  const snap = useCallback(
    (x: number, y: number) => {
      return snapToGrid(x, y, snapEnabled)
    },
    [snapEnabled]
  )

  const snapAndConstrainToCanvas = useCallback(
    (x: number, y: number, tableSize: number = 100) => {
      return snapAndConstrain(
        x,
        y,
        snapEnabled,
        canvasWidth,
        canvasHeight,
        tableSize
      )
    },
    [snapEnabled, canvasWidth, canvasHeight]
  )

  const calculatePosition = useCallback(
    (
      index: number,
      cols: number = 8,
      startX: number = 50,
      startY: number = 50,
      spacingX: number = 150,
      spacingY: number = 150
    ) => {
      return calculateGridPosition(index, cols, startX, startY, spacingX, spacingY)
    },
    []
  )

  const checkPositionValid = useCallback(
    (
      x: number,
      y: number,
      existingPositions: Array<{ x: number; y: number }>,
      minDistance: number = 100
    ) => {
      return isValidPosition(x, y, canvasWidth, canvasHeight, existingPositions, minDistance)
    },
    [canvasWidth, canvasHeight]
  )

  return {
    snap,
    snapAndConstrainToCanvas,
    calculatePosition,
    checkPositionValid,
    config: {
      snapEnabled,
      gridSize,
      snapThreshold,
      canvasWidth,
      canvasHeight,
    },
  }
}
