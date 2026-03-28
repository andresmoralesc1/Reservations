"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { FloorPlanView } from "@/components/admin/FloorPlanView"
import { TableTimeline } from "@/components/admin/TableTimeline"
import { CalendarIcon } from "@/components/admin/Icons"

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
    new Date().toISOString().split("T")[0]
  )
  const [selectedTable, setSelectedTable] = useState<FloorPlanTable | null>(null)

  const handleTableClick = (table: FloorPlanTable) => {
    setSelectedTable(table)
  }

  const handleCloseTimeline = () => {
    setSelectedTable(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-black">
            Floor Plan
          </h1>
          <p className="font-sans text-neutral-500 mt-1">
            Vista visual de mesas y reservas en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-neutral-100 rounded-lg px-4 py-2">
            <CalendarIcon className="h-5 w-5 text-neutral-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none text-neutral-700"
            />
          </div>
        </div>
      </div>

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
