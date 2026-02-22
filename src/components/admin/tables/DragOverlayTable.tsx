import React from "react"
import { Table } from "@/drizzle/schema"
import { TableShape } from "./TableShape"
import { BarStools } from "./BarStool"

interface DragOverlayTableProps {
  table: Table
  zoom: number
}

export const DragOverlayTable: React.FC<DragOverlayTableProps> = ({ table, zoom }) => {
  const width = table.width ?? (table.shape === "circular" ? 80 : table.shape === "cuadrada" ? 80 : 120)
  const height = table.height ?? (table.shape === "circular" ? 80 : table.shape === "cuadrada" ? 80 : 80)
  const diameter = table.diameter ?? 80

  return (
    <div
      style={{
        pointerEvents: "none",
        // Apply inverse scale to counteract canvas zoom for proper cursor alignment
        transform: `scale(${1 / zoom})`,
        transformOrigin: "center center",
      }}
    >
      <div className="opacity-50 relative" style={{ cursor: "grabbing" }}>
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
          rotation={table.rotation || 0}
          isSelected={false}
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
      </div>
    </div>
  )
}
