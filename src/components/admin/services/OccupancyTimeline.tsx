"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/Button"

interface TimelineReservation {
  id: string
  tableIds: string[]
  tables: Array<{ id?: string; number?: string }>
  customerName: string
  partySize: number
  startTime: string
  endTime: string
  status: string
  serviceId: string
}

interface TimelineData {
  date: string
  service: {
    id: string
    name: string
    serviceType: string
    startTime: string
    endTime: string
    defaultDurationMinutes: number
    bufferMinutes: number
  }
  tables: Array<{
    id: string
    tableNumber: string
    capacity: number
    location: string | null
  }>
  reservations: TimelineReservation[]
  timeSlots: string[]
}

interface OccupancyTimelineProps {
  isOpen: boolean
  onClose: () => void
  date: string
  serviceType: "comida" | "cena"
  restaurantId?: string
}

const LOCATION_LABELS: Record<string, string> = {
  patio: "Patio",
  interior: "Interior",
  terraza: "Terraza",
}

export function OccupancyTimeline({
  isOpen,
  onClose,
  date,
  serviceType,
  restaurantId,
}: OccupancyTimelineProps) {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservation, setSelectedReservation] = useState<TimelineReservation | null>(null)
  const [filters, setFilters] = useState({
    location: "all",
    showOnlyAvailable: false,
  })

  useEffect(() => {
    if (isOpen) {
      fetchTimelineData()
    }
  }, [isOpen, date, serviceType, restaurantId])

  const fetchTimelineData = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        date,
        serviceType,
      })

      if (restaurantId) {
        params.append("restaurantId", restaurantId)
      }

      const response = await fetch(`/api/admin/occupancy-timeline?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || "Error al cargar los datos")
      }
    } catch (err) {
      console.error("Error fetching timeline:", err)
      setError("Error de conexión al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  // Check if a time is within a reservation's time range
  const isWithinRange = (
    time: string,
    startTime: string,
    endTime: string
  ): boolean => {
    const [timeH, timeM] = time.split(":").map(Number)
    const [startH, startM] = startTime.split(":").map(Number)
    const [endH, endM] = endTime.split(":").map(Number)

    const timeMinutes = timeH * 60 + timeM
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    return timeMinutes >= startMinutes && timeMinutes < endMinutes
  }

  // Find reservation for a table at a specific time
  const findReservationAtTime = (
    tableId: string,
    time: string
  ): TimelineReservation | null => {
    if (!data) return null

    return data.reservations.find(
      (res) => res.tableIds.includes(tableId) && isWithinRange(time, res.startTime, res.endTime)
    ) || null
  }

  const filteredTables = data?.tables.filter((t) => {
    if (filters.location === "all") return true
    return t.location === filters.location
  }) || []

  const handleClick = (reservation: TimelineReservation) => {
    setSelectedReservation(reservation)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    return `${hours}:${minutes}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vista de Ocupación - ${formatDate(date)}`}
      size="xl"
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-neutral-500">Cargando datos de ocupación...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-lg">{data.service.name}</h3>
              <p className="text-sm text-neutral-500">
                {formatTime(data.service.startTime)} - {formatTime(data.service.endTime)}
                {" • "}
                {data.service.defaultDurationMinutes} min por reserva
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="all">Todas las secciones</option>
                <option value="patio">Patio</option>
                <option value="interior">Interior</option>
                <option value="terraza">Terraza</option>
              </select>

              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={filters.showOnlyAvailable}
                  onChange={(e) =>
                    setFilters({ ...filters, showOnlyAvailable: e.target.checked })
                  }
                  className="mr-2"
                />
                Solo libres
              </label>
            </div>
          </div>

          {/* Timeline */}
          <div className="overflow-x-auto border border-neutral-200 rounded-lg">
            <table className="min-w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider sticky left-0 bg-neutral-50">
                    Hora
                  </th>
                  {filteredTables.map((table) => (
                    <th
                      key={table.id}
                      className="px-4 py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider min-w-[140px]"
                    >
                      Mesa {table.tableNumber}
                      <div className="text-[10px] text-neutral-400">
                        {table.capacity}p
                        {table.location && ` • ${LOCATION_LABELS[table.location] || table.location}`}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {data.timeSlots.map((slot) => (
                  <tr key={slot} className="hover:bg-neutral-50">
                    <td className="px-4 py-2 text-sm font-mono font-medium whitespace-nowrap sticky left-0 bg-white">
                      {formatTime(slot)}
                    </td>
                    {filteredTables.map((table) => {
                      const reservation = findReservationAtTime(table.id, slot)

                      // Check if table is available
                      const isAvailable = !reservation

                      // Filter if showOnlyAvailable is enabled
                      if (filters.showOnlyAvailable && !isAvailable) {
                        return (
                          <td key={table.id} className="px-2 py-1">
                            <div className="h-16"></div>
                          </td>
                        )
                      }

                      return (
                        <td key={table.id} className="px-2 py-1 min-w-[140px]">
                          {isAvailable ? (
                            <div className="h-16 bg-green-50 border border-green-200 rounded flex items-center justify-center">
                              <span className="text-xs text-green-700 font-medium">Libre</span>
                            </div>
                          ) : (
                            <div
                              className="h-16 bg-blue-100 border border-blue-300 rounded p-2 cursor-pointer hover:bg-blue-200 transition-colors"
                              onClick={() => handleClick(reservation!)}
                            >
                              <div className="font-medium text-xs text-blue-900 truncate">
                                {reservation.customerName}
                              </div>
                              <div className="text-xs text-blue-700">
                                {reservation.partySize}p
                              </div>
                              <div className="text-[10px] text-blue-600">
                                hasta {formatTime(reservation.endTime)}
                              </div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span>Ocupada</span>
            </div>
            <div className="text-neutral-500">
              Click en una reserva para ver detalles
            </div>
          </div>
        </div>
      )}

      {/* Reservation Details */}
      {selectedReservation && (
        <Modal
          isOpen={!!selectedReservation}
          onClose={() => setSelectedReservation(null)}
          title="Detalles de Reserva"
          size="md"
          footer={
            <Button variant="ghost" size="md" onClick={() => setSelectedReservation(null)}>
              Cerrar
            </Button>
          }
        >
          <div className="space-y-4">
            <div>
              <div className="text-xs text-neutral-400">Cliente</div>
              <div className="font-medium">{selectedReservation.customerName}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-neutral-400">Personas</div>
                <div className="font-medium">{selectedReservation.partySize}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Inicio</div>
                <div className="font-medium">{formatTime(selectedReservation.startTime)}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Fin</div>
                <div className="font-medium">{formatTime(selectedReservation.endTime)}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Mesas</div>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedReservation.tables.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-neutral-100 rounded text-sm"
                  >
                    Mesa {t.number}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Estado</div>
              <div className="font-medium">{selectedReservation.status}</div>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  )
}
