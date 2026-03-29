"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Eye, Utensils, Moon } from "lucide-react"
import { format, addDays, isToday, isTomorrow, parseISO } from "date-fns"
import { es } from "date-fns/locale"

type TimeSlot = {
  time: string
  available: boolean
  tablesCount: number
  totalCapacity: number
}

type DayAvailability = {
  date: string
  displayDate: string
  isToday: boolean
  slots: TimeSlot[]
}

type TableInfo = {
  id: string
  tableNumber: string
  tableCode: string
  capacity: number
  location: string
}

type AvailabilityResult = {
  available: boolean
  availableTables?: TableInfo[]
  service?: {
    id: string
    name: string
    startTime: string
    endTime: string
    serviceType: string
  } | null
  message?: string
  alternativeSlots?: Array<{ time: string; available: boolean }>
}

type ExistingReservation = {
  id: string
  reservationCode: string
  customerName: string
  customerPhone: string
  partySize: number
  status: string
  tables: Array<{ tableCode: string; capacity: number; location: string }>
  specialRequests?: string | null
}

export default function AvailabilityPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

  // State
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [partySize, setPartySize] = useState(2)
  const [loading, setLoading] = useState(false)
  const [availabilityData, setAvailabilityData] = useState<DayAvailability | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotDetails, setSlotDetails] = useState<AvailabilityResult | null>(null)
  const [existingReservations, setExistingReservations] = useState<ExistingReservation[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [showReservations, setShowReservations] = useState(false)

  // Horarios reales del restaurante:
  // Comida: 13:00 - 15:30 (última reserva 15:45)
  // Cena: 20:00 - 22:30 (última reserva 22:45, cocina cierra 22:45)
  const allTimeSlots = useMemo((): string[] => {
    const slots: string[] = []
    // Comida: 13:00 - 15:30
    for (let hour = 13; hour <= 15; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 15 && min > 30) break // Solo hasta 15:30
        slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
      }
    }
    // Cena: 20:00 - 22:30
    for (let hour = 20; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 30) {
        if (hour === 22 && min > 30) break // Solo hasta 22:30
        slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
      }
    }
    return slots
  }, [])

  // Check availability
  const checkSlotAvailability = useCallback(async (date: string, time: string, people: number) => {
    try {
      const response = await fetch("/api/reservations/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          date,
          time,
          party_size: people,
        }),
      })
      return await response.json()
    } catch (err) {
      return null
    }
  }, [restaurantId])

  // Get existing reservations for a date/time
  const getExistingReservations = useCallback(async (date: string, time: string) => {
    setLoadingReservations(true)
    try {
      const response = await fetch(`/api/admin/reservations?date=${date}&restaurantId=${restaurantId}`)
      const data = await response.json()

      // Filter reservations for the specific time slot
      const slotReservations = data.reservations?.filter((r: any) => {
        if (r.reservationTime !== time) return false
        // Only show active reservations
        return ['PENDIENTE', 'CONFIRMED', 'COMPLETED'].includes(r.status)
      }) || []

      setExistingReservations(slotReservations)
    } catch (error) {
      console.error("Error fetching reservations:", error)
      setExistingReservations([])
    } finally {
      setLoadingReservations(false)
    }
  }, [restaurantId])

  // Load availability for selected date
  const loadDayAvailability = useCallback(async () => {
    setLoading(true)
    const slots: TimeSlot[] = []

    try {
      for (const time of allTimeSlots) {
        const result = await checkSlotAvailability(selectedDate, time, partySize)
        if (result) {
          const tables = result.availableTables || []
          const tablesCount = tables.length
          const isAvailable = result.available && tablesCount > 0

          slots.push({
            time,
            available: isAvailable,
            tablesCount,
            totalCapacity: tables.reduce((sum: number, t: TableInfo) => sum + t.capacity, 0),
          })
        } else {
          slots.push({
            time,
            available: false,
            tablesCount: 0,
            totalCapacity: 0,
          })
        }
      }

      setAvailabilityData({
        date: selectedDate,
        displayDate: isToday(new Date(selectedDate))
          ? "Hoy"
          : isTomorrow(new Date(selectedDate))
          ? "Mañana"
          : format(new Date(selectedDate), "EEEE, d MMM", { locale: es }),
        isToday: isToday(new Date(selectedDate)),
        slots,
      })
    } catch (error) {
      console.error("Error loading availability:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, partySize, allTimeSlots, checkSlotAvailability])

  // Load availability on date or party size change
  const isLoadingRef = useRef(false)
  useEffect(() => {
    if (!isLoadingRef.current) {
      isLoadingRef.current = true
      loadDayAvailability().finally(() => {
        isLoadingRef.current = false
      })
    }
  }, [selectedDate, partySize])

  // Handle slot click
  const handleSlotClick = async (time: string) => {
    setSelectedSlot(time)
    const result = await checkSlotAvailability(selectedDate, time, partySize)
    setSlotDetails(result)

    // Also load existing reservations
    await getExistingReservations(selectedDate, time)
    setShowReservations(false) // Start with availability view
  }

  // Navigate dates
  const navigateDay = (days: number) => {
    const newDate = addDays(new Date(selectedDate), days)
    setSelectedDate(format(newDate, 'yyyy-MM-dd'))
    setSelectedSlot(null)
    setSlotDetails(null)
    setExistingReservations([])
    setShowReservations(false)
  }

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    setSelectedSlot(null)
    setSlotDetails(null)
    setExistingReservations([])
    setShowReservations(false)
  }

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200'
      case 'PENDIENTE': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'COMPLETED': return 'bg-neutral-100 text-neutral-600 border-neutral-200'
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-neutral-100 text-neutral-600 border-neutral-200'
    }
  }

  // Slot color
  const getSlotColor = (available: boolean, tablesCount: number) => {
    if (!available || tablesCount === 0) return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
    return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
  }

  // Quick dates
  const quickDates = [
    { label: "Hoy", date: format(new Date(), 'yyyy-MM-dd'), isToday: true },
    { label: "Mañana", date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), isToday: false },
    { label: format(addDays(new Date(), 2), 'EEE d', { locale: es }), date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), isToday: false },
  ]

  // Group slots by service
  const lunchSlots = availabilityData?.slots.filter(s => s.time >= '13:00' && s.time < '17:00') || []
  const dinnerSlots = availabilityData?.slots.filter(s => s.time >= '19:00') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-black">
            Disponibilidad
          </h1>
          <p className="font-sans text-neutral-500 mt-1">
            Consulta rápida y reservas existentes
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Date Navigation */}
        <div className="flex-1 bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-1">
              <button onClick={() => navigateDay(-1)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={goToToday} className="px-3 py-2 bg-black text-white rounded-lg text-sm font-medium">
                Hoy
              </button>
              <button onClick={() => navigateDay(1)} className="p-2 hover:bg-neutral-100 rounded-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">{availabilityData?.displayDate || selectedDate}</span>
            </div>

            <div className="flex items-center gap-2">
              {quickDates.map(({ label, date }) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedDate === date ? "bg-black text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-auto px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Party Size */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-neutral-500" />
            <span className="text-sm font-medium">Personas:</span>
            <div className="flex items-center gap-1">
              {[2, 4, 6, 8].map((size) => (
                <button
                  key={size}
                  onClick={() => setPartySize(size)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    partySize === size ? "bg-black text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {size}
                </button>
              ))}
              <input
                type="number"
                min="1" max="20"
                value={partySize}
                onChange={(e) => setPartySize(parseInt(e.target.value) || 2)}
                className="w-16 px-2 py-1 border border-neutral-200 rounded-lg text-sm text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-neutral-600">Verificando disponibilidad...</p>
        </div>
      )}

      {/* Content */}
      {!loading && availabilityData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time Slots */}
          <div className="lg:col-span-2 space-y-6">
            {/* Comida */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  Comida (13:00 - 15:30)
                </h3>
              </div>
              <div className="p-4 grid grid-cols-5 sm:grid-cols-6 gap-2">
                {lunchSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.time
                  return (
                    <button
                      key={slot.time}
                      onClick={() => handleSlotClick(slot.time)}
                      className={`
                        p-3 rounded-lg border-2 text-center transition-all
                        ${getSlotColor(slot.available, slot.tablesCount)}
                        ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}
                      `}
                    >
                      <div className="text-lg font-bold">{slot.time}</div>
                      <div className="text-xs mt-1 font-medium">
                        {slot.available && slot.tablesCount > 0
                          ? `${slot.tablesCount} mesas`
                          : 'Lleno'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cena */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
                <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Cena (20:00 - 22:30)
                </h3>
              </div>
              <div className="p-4 grid grid-cols-5 sm:grid-cols-6 gap-2">
                {dinnerSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.time
                  return (
                    <button
                      key={slot.time}
                      onClick={() => handleSlotClick(slot.time)}
                      className={`
                        p-3 rounded-lg border-2 text-center transition-all
                        ${getSlotColor(slot.available, slot.tablesCount)}
                        ${isSelected ? 'ring-2 ring-black ring-offset-2' : ''}
                      `}
                    >
                      <div className="text-lg font-bold">{slot.time}</div>
                      <div className="text-xs mt-1 font-medium">
                        {slot.available && slot.tablesCount > 0
                          ? `${slot.tablesCount} mesas`
                          : 'Lleno'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="space-y-4">
            {selectedSlot && slotDetails ? (
              <>
                {/* View Toggle */}
                <div className="flex gap-2 bg-white rounded-xl border border-neutral-200 p-1">
                  <button
                    onClick={() => setShowReservations(false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      !showReservations ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    Disponibilidad
                  </button>
                  <button
                    onClick={() => setShowReservations(true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1 ${
                      showReservations ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Reservas ({existingReservations.length})
                  </button>
                </div>

                {/* Availability View */}
                {!showReservations ? (
                  <div className="bg-white rounded-xl border border-neutral-200 p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      {selectedSlot}
                    </h3>

                    {slotDetails.available && slotDetails.availableTables && slotDetails.availableTables.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">¡Disponible!</span>
                        </div>

                        {slotDetails.service && (
                          <div className="text-sm text-neutral-600">
                            <span className="font-medium">Servicio:</span> {slotDetails.service.name}
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-sm mb-2">Mesas Disponibles:</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {slotDetails.availableTables.map((table) => (
                              <div
                                key={table.id}
                                className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg text-sm"
                              >
                                <span className="font-medium">{table.tableCode}</span>
                                <span className="text-neutral-600">
                                  {table.capacity}p · {table.location}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-red-700">
                          <XCircle className="w-5 h-5" />
                          <span className="font-medium">No Disponible</span>
                        </div>
                        <p className="text-sm text-neutral-600">{slotDetails.message || 'No hay mesas disponibles'}</p>

                        {slotDetails.alternativeSlots && slotDetails.alternativeSlots.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-2">Horarios Alternativos:</h4>
                            <div className="flex flex-wrap gap-2">
                              {slotDetails.alternativeSlots.map((slot) => (
                                <button
                                  key={slot.time}
                                  onClick={() => handleSlotClick(slot.time)}
                                  className={`px-3 py-1 rounded-lg text-sm ${
                                    slot.available
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                                  }`}
                                  disabled={!slot.available}
                                >
                                  {slot.time}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Reservations View */
                  <div className="bg-white rounded-xl border border-neutral-200 p-4">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Reservas a las {selectedSlot}
                    </h3>

                    {loadingReservations ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                      </div>
                    ) : existingReservations.length === 0 ? (
                      <div className="text-center py-6 text-neutral-500">
                        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                        <p className="text-sm">No hay reservas para este horario</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {existingReservations.map((res) => (
                          <div key={res.id} className="border border-neutral-200 rounded-lg p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <span className="font-medium">{res.customerName}</span>
                                <span className="ml-2 text-sm text-neutral-500">{res.partySize}p</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(res.status)}`}>
                                {res.status === 'CONFIRMED' ? 'Confirmado' :
                                 res.status === 'PENDIENTE' ? 'Pendiente' :
                                 res.status === 'COMPLETED' ? 'Completado' : res.status}
                              </span>
                            </div>
                            <div className="text-sm text-neutral-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{res.reservationCode}</span>
                                <span>·</span>
                                <span>{res.customerPhone}</span>
                              </div>
                              {res.tables && res.tables.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {res.tables.map((t, i) => (
                                    <span key={i} className="bg-neutral-100 px-2 py-0.5 rounded text-xs">
                                      {t.tableCode} ({t.capacity}p)
                                    </span>
                                  ))}
                                </div>
                              )}
                              {res.specialRequests && (
                                <p className="text-xs text-neutral-500 italic">{res.specialRequests}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Summary */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4">
                  <h3 className="font-semibold text-sm mb-3">Resumen del Día</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Horarios:</span>
                      <span className="font-medium">{allTimeSlots.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Disponibles:</span>
                      <span className="font-medium text-green-600">
                        {availabilityData.slots.filter(s => s.available).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Llenos:</span>
                      <span className="font-medium text-red-600">
                        {availabilityData.slots.filter(s => !s.available).length}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center">
                <Clock className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">Selecciona un horario para ver detalles</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
