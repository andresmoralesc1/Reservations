/**
 * Canvas configuration for the table layout editor
 */

export const CANVAS_CONFIG = {
  WIDTH: 2000,
  HEIGHT: 1500,
} as const

export const GRID_CONFIG = {
  SIZE: 20,          // Snap to 20px grid
  THRESHOLD: 10,     // Snap within 10px
} as const

export const ZOOM_CONFIG = {
  MIN: 0.5,
  MAX: 2.0,
  STEP: 0.1,
  DEFAULT: 1.0,
} as const

export type CanvasConfig = typeof CANVAS_CONFIG
export type GridConfig = typeof GRID_CONFIG
export type ZoomConfig = typeof ZOOM_CONFIG
