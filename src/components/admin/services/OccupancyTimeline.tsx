"use client"

import { useState, useEffect } from "react"
import { generateTableCode } from "@/lib/utils/tableUtils"

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>
      <div className="relative bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-[#333333] px-6 py-4 flex items-center justify-between">
          <h3 className="font-display text-lg uppercase tracking-[0.1em] text-white">
            Vista de Ocupación - {formatDate(date)}
          </h3>
          <button
            onClick={onClose}
            className="text-[#666666] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-[#666666]">Cargando datos de ocupación...</div>
            </div>
          )}

          {error && (
            <div className="bg-[#E53935]/20 border border-[#E53935]/30 rounded-lg p-4">
              <p className="text-sm text-[#E53935]">{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg text-white">{data.service.name}</h3>
                  <p className="text-sm text-[#666666]">
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
                    className="px-3 py-1.5 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg text-sm focus:outline-none focus:border-[#D4A84B]"
                  >
                    <option value="all" className="bg-[#2a2a2a]">Todas las secciones</option>
                    <option value="patio" className="bg-[#2a2a2a]">Patio</option>
                    <option value="interior" className="bg-[#2a2a2a]">Interior</option>
                    <option value="terraza" className="bg-[#2a2a2a]">Terraza</option>
                  </select>

                  <label className="flex items-center text-sm text-[#A0A0A0]">
                    <input
                      type="checkbox"
                      checked={filters.showOnlyAvailable}
                      onChange={(e) =>
                        setFilters({ ...filters, showOnlyAvailable: e.target.checked })
                      }
                      className="mr-2 accent-[#D4A84B]"
                    />
                    Solo libres
                  </label>
                </div>
              </div>

              {/* Timeline */}
              <div className="overflow-x-auto border border-[#333333] rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-[#666666] uppercase tracking-wider sticky left-0 bg-[#2a2a2a]">
                        Hora
                      </th>
                      {filteredTables.map((table) => (
                        <th
                          key={table.id}
                          className="px-4 py-2 text-center text-xs font-medium text-[#666666] uppercase tracking-wider min-w-[140px]"
                        >
                          Mesa {generateTableCode(table.location, table.tableNumber)}
                          <div className="text-[10px] text-[#666666]">
                            {table.capacity}p
                            {table.location && ` • ${LOCATION_LABELS[table.location] || table.location}`}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333333]">
                    {data.timeSlots.map((slot) => (
                      <tr key={slot} className="hover:bg-[#2a2a2a]/50">
                        <td className="px-4 py-2 text-sm font-mono font-medium whitespace-nowrap sticky left-0 bg-[#1a1a1a] text-white">
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
                                <div className="h-16 bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded flex items-center justify-center">
                                  <span className="text-xs text-[#4CAF50] font-medium">Libre</span>
                                </div>
                              ) : (
                                <div
                                  className="h-16 bg-[#2196F3]/20 border border-[#2196F3]/40 rounded p-2 cursor-pointer hover:bg-[#2196F3]/30 transition-colors"
                                  onClick={() => handleClick(reservation!)}
                                >
                                  <div className="font-medium text-xs text-white truncate">
                                    {reservation.customerName}
                                  </div>
                                  <div className="text-xs text-[#A0A0A0]">
                                    {reservation.partySize}p
                                  </div>
                                  <div className="text-[10px] text-[#666666]">
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
                  <div className="w-4 h-4 bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded"></div>
                  <span className="text-[#A0A0A0]">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#2196F3]/20 border border-[#2196F3]/40 rounded"></div>
                  <span className="text-[#A0A0A0]">Ocupada</span>
                </div>
                <div className="text-[#666666]">
                  Click en una reserva para ver detalles
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reservation Details */}
      {selectedReservation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedReservation(null)}></div>
          <div className="relative bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="font-display text-lg uppercase tracking-[0.1em] text-white mb-4">
              Detalles de Reserva
            </h3>

            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#666666]">Cliente</div>
                <div className="font-medium text-white">{selectedReservation.customerName}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-[#666666]">Personas</div>
                  <div className="font-medium text-white">{selectedReservation.partySize}</div>
                </div>
                <div>
                  <div className="text-xs text-[#666666]">Inicio</div>
                  <div className="font-medium text-white">{formatTime(selectedReservation.startTime)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#666666]">Fin</div>
                  <div className="font-medium text-white">{formatTime(selectedReservation.endTime)}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-[#666666]">Mesas</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedReservation.tables.map((t, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-[#2a2a2a] border border-[#333333] rounded text-sm text-white"
                    >
                      Mesa {t.number}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#666666]">Estado</div>
                <div className="font-medium text-white">{selectedReservation.status}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedReservation(null)}
                className="px-4 py-2 bg-[#D4A84B] text-black rounded-lg hover:bg-[#E5B95C] transition-colors text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
