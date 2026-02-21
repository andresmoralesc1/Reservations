/**
 * Table Layout Editor - Reusable hooks and utilities
 */

// Hooks
export { useGridSnapping } from './hooks/useGridSnapping'
export type { UseGridSnappingOptions, UseGridSnappingReturn } from './hooks/useGridSnapping'

export { useTableOperations } from './hooks/useTableOperations'
export type { UseTableOperationsReturn } from './hooks/useTableOperations'

export { useTableDrag } from './hooks/useTableDrag'
export type { UseTableDragReturn, UseTableDragOptions } from './types/drag.types'

// Config
export { CANVAS_CONFIG, GRID_CONFIG, ZOOM_CONFIG } from './config/canvas.config'
export type { CanvasConfig, GridConfig, ZoomConfig } from './config/canvas.config'

// Types
export type {
  CreateTableOptions,
  UpdateTableOptions,
  TableOperationResult,
  TableOperationsState,
  UseTableOperationsOptions,
} from './types/operations.types'

export type {
  DragState,
} from './types/drag.types'

// Utils
export * from './utils/grid.utils'
export * from './utils/operations.utils'
export * from './utils/drag.utils'
