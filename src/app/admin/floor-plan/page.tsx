"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { FloorPlanView } from "@/components/admin/FloorPlanView"
import { TableTimeline } from "@/components/admin/TableTimeline"
import { FloorPlanHeader } from "./FloorPlanHeader"
import { format, addDays } from "date-fns"

// Tipo de tabla para el floor plan (mínimo requerido)
interface FloorPlanTable {
  id: string
  tableCode: string
  tableNumber: string
  capacity: number
  location: string
  shape: string
  positionX: number
  positionY: number
  width: number
  height: number
  diameter?: number
  rotation?: number
  status?: "available" | "occupied" | "reserved" | "blocked"
  reservations: Array<{
    id: string
    reservationCode: string
    customerName: string
    customerPhone: string
    reservationTime: string
    partySize: number
    status: string
    estimatedDurationMinutes: number
  }>
}

export default function FloorPlanPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [selectedTable, setSelectedTable] = useState<FloorPlanTable | null>(null)

  // Keyboard shortcuts for date navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // ESC to close selected table
      if (e.key === 'Escape' && selectedTable) {
        setSelectedTable(null)
        return
      }

      const currentDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedDate(format(addDays(currentDate, -1), 'yyyy-MM-dd'))
          break
        case 'ArrowRight':
          e.preventDefault()
          setSelectedDate(format(addDays(currentDate, 1), 'yyyy-MM-dd'))
          break
        case 'h':
        case 'H':
          e.preventDefault()
          setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedDate, selectedTable])

  const handleTableClick = (table: FloorPlanTable) => {
    setSelectedTable(table)
  }

  const handleCloseTimeline = () => {
    setSelectedTable(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header with date navigation */}
      <FloorPlanHeader
        dateFilter={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Floor Plan View */}
      <FloorPlanView
        date={selectedDate}
        restaurantId={restaurantId}
        onTableClick={handleTableClick}
        selectedTableId={selectedTable?.id}
      />

      {/* Table Timeline Modal */}
      {selectedTable && (
        <TableTimeline
          table={selectedTable}
          date={selectedDate}
          onClose={handleCloseTimeline}
        />
      )}
    </div>
  )
}
