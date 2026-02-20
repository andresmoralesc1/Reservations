"use client"

import React from "react"
import { Table } from "@/drizzle/schema"
import { Users } from "lucide-react"

export interface TableTemplate {
  id: string
  name: string
  capacity: number
  shape: "circular" | "cuadrada" | "rectangular"
  width: number
  height: number
  diameter: number
  color: string
  icon?: React.ReactNode
}

// Mesas predefinidas con dimensiones realistas
const TABLE_TEMPLATES: TableTemplate[] = [
  {
    id: "mesa-2",
    name: "Mesa 2",
    capacity: 2,
    shape: "circular",
    width: 60,
    height: 60,
    diameter: 60,
    color: "bg-amber-100 border-amber-300",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "mesa-4",
    name: "Mesa 4",
    capacity: 4,
    shape: "cuadrada",
    width: 100,
    height: 100,
    diameter: 100,
    color: "bg-amber-100 border-amber-300",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "mesa-6",
    name: "Mesa 6",
    capacity: 6,
    shape: "rectangular",
    width: 140,
    height: 90,
    diameter: 90,
    color: "bg-amber-100 border-amber-300",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "mesa-8",
    name: "Mesa 8",
    capacity: 8,
    shape: "rectangular",
    width: 180,
    height: 100,
    diameter: 100,
    color: "bg-amber-100 border-amber-300",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "mesa-12",
    name: "Mesa 12",
    capacity: 12,
    shape: "rectangular",
    width: 240,
    height: 110,
    diameter: 110,
    color: "bg-amber-100 border-amber-300",
    icon: <Users className="w-4 h-4" />,
  },
]

interface TableTemplatesBarProps {
  onAddTable: (template: TableTemplate) => void
  disabled?: boolean
}

export const TableTemplatesBar: React.FC<TableTemplatesBarProps> = ({
  onAddTable,
  disabled = false,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Mesas Predefinidas
        </h3>
        <span className="text-xs text-gray-500">Click para agregar al canvas</span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {TABLE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onAddTable(template)}
            disabled={disabled}
            className={`
              flex-shrink-0 group relative
              border-2 rounded-lg p-3
              transition-all duration-200
              hover:scale-105 hover:shadow-lg
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${template.color}
            `}
            title={`Agregar ${template.name} (${template.capacity} personas)`}
          >
            {/* Preview visual de la mesa */}
            <div className="flex flex-col items-center gap-2">
              {/* Shape preview */}
              <div
                className={`
                  border-2 border-amber-400 bg-amber-50
                  flex items-center justify-center
                  shadow-sm
                  ${template.shape === "circular" ? "rounded-full" : "rounded-md"}
                `}
                style={{
                  width: `${Math.min(template.width, 60)}px`,
                  height: `${Math.min(template.height, 60)}px`,
                }}
              >
                <span className="text-xs font-bold text-amber-900">
                  {template.capacity}
                </span>
              </div>

              {/* Info */}
              <div className="text-center">
                <div className="text-xs font-bold text-gray-800">
                  {template.name}
                </div>
                <div className="text-xs text-gray-600">
                  {template.capacity} pers.
                </div>
              </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-blue-500 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200" />
          </button>
        ))}
      </div>
    </div>
  )
}
