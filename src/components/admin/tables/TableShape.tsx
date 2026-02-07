import React from "react"

export type TableShapeType = "circular" | "cuadrada" | "rectangular" | "barra"

interface TableShapeProps {
  shape: TableShapeType
  width?: number
  height?: number
  diameter?: number
  rotation: number
  isSelected: boolean
  children?: React.ReactNode
  className?: string
}

export const TableShape: React.FC<TableShapeProps> = ({
  shape,
  width = 100,
  height = 80,
  diameter = 80,
  rotation,
  isSelected,
  children,
  className = "",
}) => {
  const baseClasses = "flex items-center justify-center relative transition-all duration-200 shadow-md hover:shadow-lg"
  const selectedClasses = isSelected ? "ring-4 ring-blue-500 ring-offset-2" : ""

  const style: React.CSSProperties = {
    transform: `rotate(${rotation}deg)`,
  }

  const renderShape = () => {
    switch (shape) {
      case "circular":
        return (
          <div
            className={`${baseClasses} ${selectedClasses} rounded-full bg-amber-100 border-4 border-amber-700 ${className}`}
            style={{
              ...style,
              width: `${diameter}px`,
              height: `${diameter}px`,
            }}
          >
            {children}
          </div>
        )

      case "cuadrada":
        return (
          <div
            className={`${baseClasses} ${selectedClasses} rounded-sm bg-amber-100 border-4 border-amber-700 ${className}`}
            style={{
              ...style,
              width: `${width}px`,
              height: `${height}px`,
            }}
          >
            {children}
          </div>
        )

      case "rectangular":
        return (
          <div
            className={`${baseClasses} ${selectedClasses} rounded-md bg-amber-100 border-4 border-amber-700 ${className}`}
            style={{
              ...style,
              width: `${width}px`,
              height: `${height}px`,
            }}
          >
            {children}
          </div>
        )

      case "barra":
        return (
          <div
            className={`${baseClasses} ${selectedClasses} rounded-md bg-stone-300 border-b-8 border-stone-600 ${className}`}
            style={{
              ...style,
              width: `${width}px`,
              height: `${height}px`,
            }}
          >
            {children}
          </div>
        )

      default:
        return null
    }
  }

  return renderShape()
}

interface TableShapePreviewProps {
  shape: TableShapeType
  label?: string
  isSelected?: boolean
  onClick?: () => void
}

export const TableShapePreview: React.FC<TableShapePreviewProps> = ({
  shape,
  label,
  isSelected = false,
  onClick,
}) => {
  const defaultProps = {
    circular: { diameter: 60 },
    cuadrada: { width: 60, height: 60 },
    rectangular: { width: 90, height: 50 },
    barra: { width: 100, height: 30 },
  }

  const props = defaultProps[shape]

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="scale-75 origin-center">
        <TableShape
          shape={shape}
          {...props}
          rotation={0}
          isSelected={isSelected}
        />
      </div>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </button>
  )
}
