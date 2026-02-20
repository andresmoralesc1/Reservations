"use client"

import React from "react"

interface SnappingIndicatorProps {
  isActive: boolean
  snapToGrid: boolean
  position: { x: number; y: number }
}

export const SnappingIndicator: React.FC<SnappingIndicatorProps> = ({
  isActive,
  snapToGrid,
  position,
}) => {
  if (!isActive || !snapToGrid) return null

  return (
    <div className="fixed top-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-pulse">
      <div className="w-2 h-2 bg-white rounded-full animate-ping" />
      <span className="text-sm font-medium">
        Grid activo: {Math.round(position.x)}, {Math.round(position.y)}
      </span>
    </div>
  )
}
