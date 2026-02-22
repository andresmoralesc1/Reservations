"use client"

import React, { useState, useCallback, useEffect } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  Modifiers,
} from "@dnd-kit/core"
import { Table } from "@/drizzle/schema"
import { DraggableTable } from "./DraggableTable"
import { TableConfigPanel } from "./TableConfigPanel"
import { TableTemplatesBar, TableTemplate } from "./TableTemplatesBar"
import { KeyboardShortcutsHint } from "./KeyboardShortcutsHint"
import { SnappingIndicator } from "./SnappingIndicator"
import { Plus, ZoomIn, ZoomOut, Maximize2, Grid3x3, CheckCircle2, Loader2, LayoutGrid, Copy, X, Info } from "lucide-react"
import { useGridSnapping } from "./editor/hooks/useGridSnapping"
import { useTableOperations } from "./editor/hooks/useTableOperations"
import { useTableDrag } from "./editor/hooks/useTableDrag"
import { CANVAS_CONFIG } from "./editor/config/canvas.config"
import { DragOverlayTable } from "./DragOverlayTable"

interface TableLayoutEditorProps {
  tables: Table[]
  onTablesChange: (tables: Table[]) => void
  onCreateTable: () => void
  onUpdateTable: (id: string, updates: Partial<Table>) => Promise<void>
  onDeleteTable: (id: string) => Promise<void>
  restaurantId: string
}

// Debug helper
const DEBUG_MODE = true

export const TableLayoutEditor: React.FC<TableLayoutEditorProps> = ({
  tables,
  onTablesChange,
  onCreateTable,
  onUpdateTable,
  onDeleteTable,
  restaurantId,
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Grid snapping hook
  const { snapAndConstrainToCanvas, calculatePosition } = useGridSnapping({
    snapEnabled: snapToGrid,
    canvasWidth: CANVAS_CONFIG.WIDTH,
    canvasHeight: CANVAS_CONFIG.HEIGHT,
  })

  // Table operations hook
  const {
    state: opsState,
    updateTable,
    deleteTable,
    duplicateTable,
    duplicateTableFromTemplate,
    autoArrangeTables,
  } = useTableOperations({
    restaurantId,
    tables,
    onTablesChange,
  })

  // Table drag hook
  const {
    dragState,
    activationConstraint,
    handleDragStart,
    handleDragEnd,
  } = useTableDrag({
    tables,
    onTablesChange,
    snapAndConstrainToCanvas,
    onUpdateTable: updateTable,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint,
    })
  )

  const selectedTable = tables.find((t) => t.id === selectedTableId)

  const handleSelectTable = useCallback((tableId: string) => {
    setSelectedTableId(tableId)
  }, [])

  const handleDeselect = useCallback(() => {
    setSelectedTableId(null)
  }, [])

  // Handle adding table from template
  const handleAddTableFromTemplate = useCallback(
    async (template: TableTemplate) => {
      const result = await duplicateTableFromTemplate(template, snapAndConstrainToCanvas)

      if (result.success && result.table) {
        // Auto-select the new table
        setSelectedTableId(result.table.id)
      } else {
        console.error("Error adding table from template:", result.error)
      }
    },
    [duplicateTableFromTemplate, snapAndConstrainToCanvas]
  )

  // Handle duplicating selected table
  const handleDuplicateTable = useCallback(
    async () => {
      if (!selectedTableId) return

      const result = await duplicateTable(selectedTableId, snapAndConstrainToCanvas)

      if (result.success && result.table) {
        // Auto-select the new table
        setSelectedTableId(result.table.id)
      } else {
        console.error("Error duplicating table:", result.error)
      }
    },
    [selectedTableId, duplicateTable, snapAndConstrainToCanvas]
  )

  const handleRotate = useCallback(
    async (tableId: string, degrees: number) => {
      await updateTable(tableId, { rotation: degrees })
    },
    [updateTable]
  )

  const handleUpdateTable = useCallback(
    async (updates: Partial<Table>) => {
      if (!selectedTableId) return
      await updateTable(selectedTableId, updates as any)
      setSelectedTableId(null)
    },
    [selectedTableId, updateTable]
  )

  const handleDeleteTable = useCallback(
    async () => {
      if (!selectedTableId) return

      const result = await deleteTable(selectedTableId)
      if (result.success) {
        setSelectedTableId(null)
      } else {
        console.error("Error deleting table:", result.error)
      }
    },
    [selectedTableId, deleteTable]
  )

  // Auto-arrange tables in a grid
  const handleAutoArrange = useCallback(async () => {
    const updatedTables = await autoArrangeTables(tables, onUpdateTable)
    onTablesChange(updatedTables)
  }, [tables, onUpdateTable, autoArrangeTables])

  const activeTable = tables.find((t) => t.id === dragState.activeId)

  // Debug: log tables info
  useEffect(() => {
    if (DEBUG_MODE) {
      console.log("TableLayoutEditor - tables:", tables)
      console.log("TableLayoutEditor - tables count:", tables.length)
    }
  }, [tables])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+D to duplicate
      if (e.ctrlKey && e.key === "d" && selectedTableId) {
        e.preventDefault()
        handleDuplicateTable()
      }
      // Delete to remove selected table
      if (e.key === "Delete" && selectedTableId) {
        e.preventDefault()
        handleDeleteTable()
      }
      // Escape to deselect
      if (e.key === "Escape" && selectedTableId) {
        setSelectedTableId(null)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedTableId, handleDuplicateTable, handleDeleteTable])

  // If no tables, show message
  if (tables.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">No hay mesas configuradas</p>
          <button
            onClick={onCreateTable}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + Crear Primera Mesa
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full relative">
      {/* Snapping Indicator */}
      <SnappingIndicator
        isActive={!!dragState.activeId}
        snapToGrid={snapToGrid}
        position={dragState.dragPosition}
      />

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar - Mobile Responsive */}
        <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          {/* Left side - Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={onCreateTable}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex-shrink-0"
              title="Crear mesa personalizada"
            >
              <Plus className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Personalizada</span>
              <span className="sr-only sm:not-sr-only">Crear</span>
            </button>
            {selectedTable && (
              <button
                onClick={handleDuplicateTable}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex-shrink-0"
                title="Duplicar mesa seleccionada (Ctrl+D)"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Duplicar</span>
              </button>
            )}
            <button
              onClick={handleAutoArrange}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex-shrink-0 min-h-[44px]"
              title="Organizar mesas en grilla automáticamente"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Auto-Organizar</span>
              <span className="sr-only sm:not-sr-only">Organizar</span>
            </button>

            {/* Autosave indicator - mobile friendly */}
            {opsState.isSaving && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 ml-2 sm:ml-4 flex-shrink-0">
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                <span className="hidden sm:inline">Guardando...</span>
              </div>
            )}
            {opsState.showSaved && !opsState.isSaving && (
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-green-600 ml-2 sm:ml-4 flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Guardado</span>
              </div>
            )}

            {/* Table count - hide on very small screens */}
            <div className="hidden sm:flex text-sm text-gray-600 ml-4 border-l border-gray-300 pl-4 flex-shrink-0">
              {tables.length} mesas
            </div>

            {/* Shortcuts help button */}
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className={`ml-2 min-h-[44px] sm:min-h-0 p-2 sm:p-2 border rounded-md transition-colors ${
                showShortcuts
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
              title="Ver atajos de teclado"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* Right side - Zoom controls - stack vertically on mobile */}
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="min-h-[44px] sm:min-h-0 p-2 sm:p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Reducir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[50px] sm:min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="min-h-[44px] sm:min-h-0 p-2 sm:p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={() => setZoom(1)}
              className="min-h-[44px] sm:min-h-0 p-2 sm:p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Restablecer zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`min-h-[44px] sm:min-h-0 p-2 sm:p-2 border rounded-md transition-colors ${
                showGrid
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
              title="Mostrar/ocultar grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`hidden sm:block min-h-[44px] sm:min-h-0 p-2 sm:p-2 border rounded-md transition-colors ${
                snapToGrid
                  ? "border-purple-500 bg-purple-50 text-purple-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
              title="Alinear a grid (Snapping)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Templates Bar - Predefined tables */}
        <TableTemplatesBar
          onAddTable={handleAddTableFromTemplate}
          disabled={opsState.isSaving}
        />

        {/* Keyboard Shortcuts Hint */}
        {showShortcuts && <KeyboardShortcutsHint />}

        {/* Canvas */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className="flex-1 overflow-auto bg-gray-100 relative"
            onClick={handleDeselect}
          >
            <div
              className="relative"
              style={{
                width: `${CANVAS_CONFIG.WIDTH}px`,
                height: `${CANVAS_CONFIG.HEIGHT}px`,
                minWidth: "100%",
                minHeight: "100%",
                backgroundImage: showGrid
                  ? `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `
                  : "none",
                backgroundSize: "20px 20px",
              }}
            >
              {tables.map((table) => {
                // Don't render the table if it's being dragged (it's shown in DragOverlay)
                if (dragState.activeId === table.id) {
                  return null
                }

                return (
                  <DraggableTable
                    key={table.id}
                    table={table}
                    isSelected={selectedTableId === table.id}
                    onSelect={() => handleSelectTable(table.id)}
                    onPositionChange={() => {}}
                    onRotate={(degrees) => handleRotate(table.id, degrees)}
                    zoom={zoom}
                  />
                )
              })}
            </div>
          </div>

          <DragOverlay>
            {activeTable ? (
              <DragOverlayTable
                table={activeTable}
                zoom={zoom}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Config Panel - Mobile bottom sheet, Desktop side panel */}
      {selectedTable && (
        <>
          {/* Mobile overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setSelectedTableId(null)}
          />
          {/* Mobile bottom sheet */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-2xl shadow-xl z-50 max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg uppercase tracking-wider text-black">
                  Configurar Mesa
                </h3>
                <button
                  onClick={() => setSelectedTableId(null)}
                  className="p-2 hover:bg-gray-100 rounded-md"
                  aria-label="Cerrar"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <TableConfigPanel
                table={selectedTable}
                onUpdate={handleUpdateTable}
                onDelete={handleDeleteTable}
                onClose={() => setSelectedTableId(null)}
                isMobileBottomSheet={true}
              />
            </div>
          </div>
          {/* Desktop side panel */}
          <div className="hidden md:block w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <TableConfigPanel
              table={selectedTable}
              onUpdate={handleUpdateTable}
              onDelete={handleDeleteTable}
              onClose={() => setSelectedTableId(null)}
              isMobileBottomSheet={false}
            />
          </div>
        </>
      )}
    </div>
  )
}
