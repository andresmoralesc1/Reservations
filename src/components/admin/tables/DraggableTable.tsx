import React, { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { Table } from "@/drizzle/schema"
import { TableShape } from "./TableShape"
import { BarStools } from "./BarStool"
import { RotateCw } from "lucide-react"

interface DraggableTableProps {
  table: Table
  isSelected: boolean
  onSelect: () => void
  onPositionChange: (x: number, y: number) => void
  onRotate?: (degrees: number) => void
  zoom?: number
  isDragging?: boolean
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
    console.log("DraggableTable rendering:", table.tableNumber, { positionX: table.positionX, positionY: table.positionY, shape: table.shape })
  }, [table])

  const [localRotation, setLocalRotation] = useState(table.rotation || 0)

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

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newRotation = (localRotation + 45) % 360
    setLocalRotation(newRotation)
    onRotate?.(newRotation)
  }

  const x = transform?.x ?? 0
  const y = transform?.y ?? 0

  // When in DragOverlay (isDragging=true), don't apply scale so it follows cursor correctly
  const positionStyle: React.CSSProperties = {
    position: "absolute",
    left: `${table.positionX ?? 50}px`, // Default to 50px if null
    top: `${table.positionY ?? 50}px`, // Default to 50px if null
    transform: isDragging
      ? `translate(${x}px, ${y}px)`
      : `translate(${x}px, ${y}px) scale(${zoom})`,
    transformOrigin: "center center",
    cursor: isDraggingKit ? "grabbing" : "grab",
    zIndex: isSelected ? 100 : 1,
  }

  const width = table.width ?? (table.shape === "circular" ? 80 : table.shape === "cuadrada" ? 80 : 120)
  const height = table.height ?? (table.shape === "circular" ? 80 : table.shape === "cuadrada" ? 80 : 80)
  const diameter = table.diameter ?? 80

  return (
    <div
      ref={setNodeRef}
      style={positionStyle}
      onClick={onSelect}
      className={`transition-opacity ${isDraggingKit ? "opacity-80" : "opacity-100"}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="relative group"
      >
        {/* Rotate button */}
        {isSelected && (
          <button
            onClick={handleRotate}
            className="absolute -top-8 -right-8 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors z-50"
            title="Rotar mesa"
          >
            <RotateCw className="w-4 h-4 text-gray-700" />
          </button>
        )}

        {/* Accessibility indicator */}
        {table.isAccessible && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-500 text-white p-1 rounded-full text-xs">
            ♿
          </div>
        )}

        {/* Table shape */}
        <TableShape
          shape={table.shape as any}
          width={width}
          height={height}
          diameter={diameter}
          rotation={localRotation}
          isSelected={isSelected}
        >
          {/* Table number */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-bold text-amber-900">{table.tableNumber}</div>
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
  )
}
