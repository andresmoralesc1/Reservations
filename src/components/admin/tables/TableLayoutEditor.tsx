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
} from "@dnd-kit/core"
import { Table } from "@/drizzle/schema"
import { DraggableTable } from "./DraggableTable"
import { TableConfigPanel } from "./TableConfigPanel"
import { Plus, ZoomIn, ZoomOut, Maximize2, Grid3x3 } from "lucide-react"

interface TableLayoutEditorProps {
  tables: Table[]
  onTablesChange: (tables: Table[]) => void
  onCreateTable: () => void
  onUpdateTable: (id: string, updates: Partial<Table>) => Promise<void>
  onDeleteTable: (id: string) => Promise<void>
  restaurantId: string
}

const CANVAS_WIDTH = 2000
const CANVAS_HEIGHT = 1500

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
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const selectedTable = tables.find((t) => t.id === selectedTableId)

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, delta } = event
      setActiveId(null)

      if (!delta.x && !delta.y) return

      const tableId = active.id as string
      const table = tables.find((t) => t.id === tableId)

      if (table) {
        const newX = Math.max(0, Math.min(CANVAS_WIDTH - 100, (table.positionX ?? 0) + delta.x))
        const newY = Math.max(0, Math.min(CANVAS_HEIGHT - 100, (table.positionY ?? 0) + delta.y))

        // Optimistic update
        const updatedTables = tables.map((t) =>
          t.id === tableId ? { ...t, positionX: newX, positionY: newY } : t
        )
        onTablesChange(updatedTables)

        // Persist to server
        try {
          await onUpdateTable(tableId, { positionX: newX, positionY: newY })
        } catch (error) {
          console.error("Error updating table position:", error)
        }
      }
    },
    [tables, onTablesChange, onUpdateTable]
  )

  const handleSelectTable = useCallback((tableId: string) => {
    setSelectedTableId(tableId)
  }, [])

  const handleDeselect = useCallback(() => {
    setSelectedTableId(null)
  }, [])

  const handleRotate = useCallback(
    async (tableId: string, degrees: number) => {
      try {
        await onUpdateTable(tableId, { rotation: degrees })
        const updatedTables = tables.map((t) =>
          t.id === tableId ? { ...t, rotation: degrees } : t
        )
        onTablesChange(updatedTables)
      } catch (error) {
        console.error("Error rotating table:", error)
      }
    },
    [tables, onTablesChange, onUpdateTable]
  )

  const handleUpdateTable = useCallback(
    async (updates: Partial<Table>) => {
      if (!selectedTableId) return
      setIsSaving(true)
      try {
        await onUpdateTable(selectedTableId, updates)
        const updatedTables = tables.map((t) =>
          t.id === selectedTableId ? { ...t, ...updates } : t
        )
        onTablesChange(updatedTables)
        setSelectedTableId(null)
      } catch (error) {
        console.error("Error updating table:", error)
      } finally {
        setIsSaving(false)
      }
    },
    [selectedTableId, tables, onTablesChange, onUpdateTable]
  )

  const handleDeleteTable = useCallback(
    async () => {
      if (!selectedTableId) return
      try {
        await onDeleteTable(selectedTableId)
        const updatedTables = tables.filter((t) => t.id !== selectedTableId)
        onTablesChange(updatedTables)
        setSelectedTableId(null)
      } catch (error) {
        console.error("Error deleting table:", error)
      }
    },
    [selectedTableId, tables, onTablesChange, onDeleteTable]
  )

  const activeTable = tables.find((t) => t.id === activeId)

  return (
    <div className="flex h-full">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateTable}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Mesa
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Reducir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={() => setZoom(1)}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              title="Restablecer zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 border rounded-md transition-colors ${
                showGrid
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-gray-300 hover:bg-gray-50"
              }`}
              title="Mostrar/ocultar grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>

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
                width: `${CANVAS_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
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
              {tables.map((table) => (
                <DraggableTable
                  key={table.id}
                  table={table}
                  isSelected={selectedTableId === table.id}
                  onSelect={() => handleSelectTable(table.id)}
                  onPositionChange={() => {}}
                  onRotate={(degrees) => handleRotate(table.id, degrees)}
                  zoom={zoom}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTable ? (
              <div className="opacity-50">
                <DraggableTable
                  table={activeTable}
                  isSelected={false}
                  onSelect={() => {}}
                  onPositionChange={() => {}}
                  zoom={zoom}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Config Panel */}
      {selectedTable && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <TableConfigPanel
            table={selectedTable}
            onUpdate={handleUpdateTable}
            onDelete={handleDeleteTable}
            onClose={() => setSelectedTableId(null)}
          />
        </div>
      )}
    </div>
  )
}
