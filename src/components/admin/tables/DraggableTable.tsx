import React, { useRef } from "react"
import { useDraggable } from "@dnd-kit/core"
import { RotateCw } from "lucide-react"
import { Table } from "@/drizzle/schema"
import { TableShape } from "./TableShape"
import { BarStools } from "./BarStool"
import { generateTableCode } from "@/lib/utils/tableUtils"

interface DraggableTableProps {
  table: Table
  isSelected: boolean
  onSelect: () => void
  onPositionChange: (x: number, y: number) => void
  onRotate?: (degrees: number) => void
  zoom?: number
  isDragging?: boolean  // New prop to indicate if in DragOverlay
}

export const DraggableTable: React.FC<DraggableTableProps> = ({
  table,
  isSelected,
  onSelect,
  onPositionChange,
  onRotate,
  zoom = 1,
  isDragging = false,
}) => {
  // Debug log
  React.useEffect(() => {
    console.log("DraggableTable rendering:", table.tableNumber, { positionX: table.positionX, positionY: table.positionY, shape: table.shape, isSelected, rotation: table.rotation })
  }, [table, isSelected])

  // Reference to the actual table shape element for centering
  const tableRef = useRef<HTMLDivElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDraggingKit,
  } = useDraggable({
    id: table.id,
    data: {
      table,
      onPositionChange,
    },
  })

  const x = transform?.x ?? 0
  const y = transform?.y ?? 0

  // Match FloorPlanView defaults for consistency
  const width = table.width ?? (table.shape === "circular" ? 60 : table.shape === "cuadrada" ? 70 : 70)
  const height = table.height ?? (table.shape === "circular" ? 60 : table.shape === "cuadrada" ? 70 : 80)
  const diameter = table.diameter ?? 60

  // When in DragOverlay (isDragging=true), don't apply scale so it follows cursor correctly
  const positionStyle: React.CSSProperties = {
    position: "absolute",
    left: `${table.positionX ?? 50}px`, // Default to 50px if null
    top: `${table.positionY ?? 50}px`, // Default to 50px if null
    transform: isDragging
      ? `translate(${x}px, ${y}px)`
      : `translate(${x}px, ${y}px)`,
    transformOrigin: "center center",
    cursor: isDraggingKit ? "grabbing" : "grab",
    zIndex: isSelected ? 100 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={positionStyle}
      className={`transition-opacity ${isDraggingKit ? "opacity-80" : "opacity-100"}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="relative group"
        onClick={(e) => {
          // Don't trigger selection if already selected (prevents deselect issues)
          e.stopPropagation()
          onSelect()
        }}
      >
        {/* Rotate button - outside of drag area but positioned above */}
        {isSelected && onRotate && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const newRotation = ((table.rotation || 0) + 90) % 360
              console.log("Rotate button clicked, new rotation:", newRotation, "table:", table.tableNumber)
              onRotate(newRotation)
            }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-full shadow-lg transition-colors z-20 cursor-pointer"
            title="Rotar 90°"
            style={{ pointerEvents: 'auto' }}
          >
            <RotateCw className="w-4 h-4" />
          </button>
        )}

        {/* Accessibility indicator */}
        {table.isAccessible && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white p-1 rounded-full text-xs pointer-events-none">
            ♿
          </div>
        )}

        {/* Table shape */}
        <div ref={tableRef}>
          <TableShape
            shape={(table.shape as "circular" | "cuadrada" | "rectangular" | "barra") || "rectangular"}
            width={width}
            height={height}
            diameter={diameter}
            rotation={table.rotation || 0}
            isSelected={isSelected}
          >
          {/* Table number */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm font-bold text-amber-900">{generateTableCode(table.location, table.tableNumber)}</div>
              <div className="text-xs text-amber-700">{table.capacity}p</div>
            </div>
          </div>

          {/* Bar stools */}
          {table.shape === "barra" && table.stoolCount && table.stoolCount > 0 && (
            <BarStools count={table.stoolCount} barWidth={width} />
          )}
          </TableShape>

          {/* Selection outline */}
          {isSelected && (
            <div className="absolute inset-0 -m-2 border-2 border-dashed border-blue-500 rounded-lg pointer-events-none" />
          )}
        </div>
      </div>
    </div>
  )
}
