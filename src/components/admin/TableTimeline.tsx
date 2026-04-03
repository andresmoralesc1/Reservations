"use client"

import { useState } from "react"
import { XIcon, ClockIcon, UsersIcon } from "@/components/admin/Icons"
import type { Table } from "@/drizzle/schema"

type TimelineReservation = {
  id: string
  reservationCode: string
  customerName: string
  customerPhone: string
  reservationTime: string
  partySize: number
  status: string
  estimatedDurationMinutes: number
}

type TableWithReservations = Table & {
  reservations: TimelineReservation[]
}

interface TableTimelineProps {
  table: TableWithReservations | null
  date: string
  onClose: () => void
}

// Time slots from 13:00 to 23:30 (every 30 min)
const TIME_SLOTS = [
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00",
  "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
]

export function TableTimeline({ table, date, onClose }: TableTimelineProps) {
  const [hoveredReservation, setHoveredReservation] = useState<string | null>(null)

  if (!table) return null

  // Calculate position and width for each reservation bar
  const getReservationStyle = (reservation: TimelineReservation) => {
    const startTime = reservation.reservationTime
    const duration = reservation.estimatedDurationMinutes || 90

    const startIndex = TIME_SLOTS.indexOf(startTime)
    const endIndex = TIME_SLOTS.findIndex((slot, idx) => {
      if (idx <= startIndex) return false
      const slotTime = parseTime(slot)
      const resTime = parseTime(startTime)
      const resEndTime = new Date(resTime.getTime() + duration * 60000)
      return slotTime <= resEndTime
    })

    if (startIndex === -1) return null

    const actualEndIndex = endIndex === -1 ? startIndex + 2 : endIndex
    const left = (startIndex / TIME_SLOTS.length) * 100
    const width = ((actualEndIndex - startIndex) / TIME_SLOTS.length) * 100

    return { left: `${left}%`, width: `${width}%` }
  }

  // Parse HH:MM to Date
  const parseTime = (time: string) => {
    const [hours, mins] = time.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, mins, 0, 0)
    return date
  }

  // Format time for display
  const formatTimeRange = (reservation: TimelineReservation) => {
    const start = reservation.reservationTime
    const duration = reservation.estimatedDurationMinutes || 90
    const endTime = addMinutes(start, duration)
    return `${start} - ${endTime}`
  }

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, mins + minutes)
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  }

  const statusColors = {
    PENDIENTE: "bg-amber-100 border-amber-300 text-amber-800",
    CONFIRMADO: "bg-emerald-100 border-emerald-300 text-emerald-800",
    CANCELADO: "bg-gray-100 border-gray-300 text-gray-500 line-through",
    NO_SHOW: "bg-red-100 border-red-300 text-red-500 line-through",
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="font-display text-xl uppercase tracking-wider text-black">
              Mesa {table.tableCode}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="font-sans text-sm text-neutral-500">
                Capacidad: {table.capacity} personas
              </span>
              <span className="font-sans text-sm text-neutral-500">
                Ubicación: {table.location}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black transition-colors"
            aria-label="Cerrar"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Timeline */}
        <div className="p-6">
          {/* Time scale */}
          <div className="relative mb-4">
            <div className="flex justify-between text-xs text-neutral-400 px-4">
              {TIME_SLOTS.filter((_, i) => i % 2 === 0).map((slot) => (
                <span key={slot}>{slot}</span>
              ))}
            </div>
          </div>

          {/* Reservations Timeline */}
          <div className="relative bg-neutral-50 rounded-lg border border-neutral-200 p-4 min-h-[120px]">
            {table.reservations.length === 0 ? (
              <div className="text-center py-8 text-neutral-400">
                <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Sin reservas para esta fecha</p>
              </div>
            ) : (
              <div className="relative h-12">
                {table.reservations.map((reservation) => {
                  const style = getReservationStyle(reservation)
                  if (!style) return null

                  return (
                    <div
                      key={reservation.id}
                      className={`absolute top-0 h-10 rounded-md border-2 px-2 py-1 cursor-pointer transition-all hover:z-10 hover:shadow-lg ${statusColors[reservation.status as keyof typeof statusColors]}`}
                      style={style}
                      onClick={() => setHoveredReservation(
                        hoveredReservation === reservation.id ? null : reservation.id
                      )}
                      title={`${reservation.customerName} - ${reservation.partySize} personas`}
                    >
                      <div className="text-xs font-medium truncate">{reservation.customerName}</div>
                      <div className="text-xs opacity-75">{reservation.partySize}p</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Reservations List */}
          {table.reservations.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-display text-sm uppercase tracking-wider text-neutral-500">
                Reservas del Día
              </h3>
              {table.reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{reservation.customerName}</div>
                      <div className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[reservation.status as keyof typeof statusColors]}`}>
                        {reservation.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {formatTimeRange(reservation)}
                      </span>
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" />
                        {reservation.partySize} personas
                      </span>
                      <span className="font-mono text-xs bg-neutral-200 px-2 py-0.5 rounded">
                        {reservation.customerPhone}
                      </span>
                    </div>
                  </div>
                  <div className="font-display text-sm font-medium">
                    {reservation.reservationCode}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
