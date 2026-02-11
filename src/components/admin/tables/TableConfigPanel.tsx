import React, { useState, useEffect } from "react"
import { Table } from "@/drizzle/schema"
import { TableShapePreview, TableShapeType } from "./TableShape"
import { Trash2, Save, X } from "lucide-react"

interface TableConfigPanelProps {
  table: Table
  onUpdate: (updates: Partial<Table>) => void
  onDelete: () => void
  onClose?: () => void
  // When used in mobile bottom sheet, don't show close button
  isMobileBottomSheet?: boolean
}

export const TableConfigPanel: React.FC<TableConfigPanelProps> = ({
  table,
  onUpdate,
  onDelete,
  onClose,
  isMobileBottomSheet = false,
}) => {
  const [tableNumber, setTableNumber] = useState(table.tableNumber)
  const [capacity, setCapacity] = useState(table.capacity)
  const [location, setLocation] = useState(table.location || "interior")
  const [shape, setShape] = useState<TableShapeType>((table.shape as TableShapeType) || "rectangular")
  const [rotation, setRotation] = useState(table.rotation || 0)
  const [isAccessible, setIsAccessible] = useState(table.isAccessible || false)
  const [width, setWidth] = useState(table.width || 120)
  const [height, setHeight] = useState(table.height || 80)
  const [diameter, setDiameter] = useState(table.diameter || 80)
  const [stoolCount, setStoolCount] = useState(table.stoolCount || 0)

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate({
        tableNumber,
        capacity,
        location,
        shape,
        rotation,
        isAccessible,
        width,
        height,
        diameter,
        stoolCount,
      })
      onClose?.()
    } finally {
      setIsSaving(false)
    }
  }

  const shapeOptions: { value: TableShapeType; label: string; description: string }[] = [
    { value: "circular", label: "Circular", description: "Ideal para 2-4 personas" },
    { value: "cuadrada", label: "Cuadrada", description: "Ideal para 4-6 personas" },
    { value: "rectangular", label: "Rectangular", description: "Ideal para 6+ personas" },
    { value: "barra", label: "Barra", description: "Para sillas de barra" },
  ]

  const getDefaultDimensions = (newShape: TableShapeType) => {
    switch (newShape) {
      case "circular":
        return { width: 80, height: 80, diameter: 80 }
      case "cuadrada":
        return { width: 80, height: 80, diameter: 80 }
      case "rectangular":
        return { width: 120, height: 80, diameter: 80 }
      case "barra":
        return { width: 200, height: 40, diameter: 80 }
      default:
        return { width: 120, height: 80, diameter: 80 }
    }
  }

  const handleShapeChange = (newShape: TableShapeType) => {
    setShape(newShape)
    const defaults = getDefaultDimensions(newShape)
    setWidth(defaults.width)
    setHeight(defaults.height)
    setDiameter(defaults.diameter)
  }

  return (
    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full sm:w-80 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Configurar Mesa</h2>
        {/* Only show close button on desktop (not in mobile bottom sheet) */}
        {onClose && !isMobileBottomSheet && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Table Number */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de Mesa
        </label>
        <input
          type="text"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Capacity */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Capacidad (personas)
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={capacity}
          onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ubicación
        </label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="interior">Interior</option>
          <option value="patio">Patio</option>
          <option value="terraza">Terraza</option>
        </select>
      </div>

      {/* Shape Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Forma de Mesa
        </label>
        <div className="grid grid-cols-2 gap-2">
          {shapeOptions.map((option) => (
            <TableShapePreview
              key={option.value}
              shape={option.value}
              label={option.label}
              isSelected={shape === option.value}
              onClick={() => handleShapeChange(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Rotation */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rotación: {rotation}°
        </label>
        <input
          type="range"
          min="0"
          max="360"
          step="15"
          value={rotation}
          onChange={(e) => setRotation(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0°</span>
          <span>90°</span>
          <span>180°</span>
          <span>270°</span>
          <span>360°</span>
        </div>
      </div>

      {/* Dimensions */}
      {(shape === "rectangular" || shape === "cuadrada" || shape === "barra") && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ancho (px)
            </label>
            <input
              type="number"
              min="40"
              max="400"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value) || 100)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alto (px)
            </label>
            <input
              type="number"
              min="40"
              max="400"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 80)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {shape === "circular" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diámetro (px)
          </label>
          <input
            type="number"
            min="40"
            max="300"
            value={diameter}
            onChange={(e) => setDiameter(parseInt(e.target.value) || 80)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Bar Stools */}
      {shape === "barra" && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de Sillas
          </label>
          <input
            type="number"
            min="0"
            max="20"
            value={stoolCount}
            onChange={(e) => setStoolCount(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Accessibility */}
      <div className="mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAccessible}
            onChange={(e) => setIsAccessible(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Mesa accesible (silla de ruedas)
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Guardando..." : "Guardar"}
        </button>
        <button
          onClick={onDelete}
          className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
