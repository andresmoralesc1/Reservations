"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { format, addDays, isToday, isTomorrow, startOfWeek, addWeeks, subWeeks } from "date-fns"
import { es } from "date-fns/locale"

type TimeSlot = {
  time: string
  available: boolean
  tablesCount: number
  totalCapacity: number
  occupiedPercent: number
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
  shape?: string
}

type AvailabilityResult = {
  available: boolean
  availableTables?: TableInfo[]
  suggestedTables?: string[]
  service?: {
    id: string
    name: string
    startTime: string
    endTime: string
    defaultDurationMinutes: number
    serviceType: string
  } | null
  message?: string
  alternativeSlots?: Array<{ time: string; available: boolean }>
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
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')

  // Generate time slots (comida y cena) - memoized to avoid infinite loops
  const allTimeSlots = useMemo((): string[] => {
    const slots: string[] = []
    // Comida: 13:00 - 16:00
    for (let hour = 13; hour <= 15; hour++) {
      for (let min = 0; min < 60; min += 30) {
        slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
      }
    }
    slots.push('16:00')
    // Cena: 19:00 - 23:00
    for (let hour = 19; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 30) {
        slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
      }
    }
    slots.push('23:00')
    return slots
  }, [])

  // Check availability for a specific time slot
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

  // Load availability for the selected date
  const loadDayAvailability = useCallback(async () => {
    setLoading(true)
    const slots: TimeSlot[] = []

    try {
      // Process slots in batches to avoid overwhelming the server
      for (const time of allTimeSlots) {
        const result = await checkSlotAvailability(selectedDate, time, partySize)
        console.log('Availability check:', { date: selectedDate, time, partySize, result })
        // Log completo del result
        console.log('Result full:', JSON.stringify(result, null, 2))
        if (result) {
          // Use the actual availableTables array from the API
          const tables = result.availableTables || []
          const tablesCount = tables.length
          const isAvailable = result.available && tablesCount > 0

          console.log('Slot processed:', { time, tablesCount, isAvailable, tables })

          slots.push({
            time,
            available: isAvailable,
            tablesCount,
            totalCapacity: tables.reduce((sum: number, t: TableInfo) => sum + t.capacity, 0),
            occupiedPercent: isAvailable ? 0 : 100,
          })
        } else {
          // Fallback for API errors - mark as unavailable
          slots.push({
            time,
            available: false,
            tablesCount: 0,
            totalCapacity: 0,
            occupiedPercent: 100,
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

  // Load availability on date or party size change - use refs to avoid loop
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
  }

  // Navigate dates
  const navigateDay = (days: number) => {
    const newDate = addDays(new Date(selectedDate), days)
    setSelectedDate(format(newDate, 'yyyy-MM-dd'))
    setSelectedSlot(null)
    setSlotDetails(null)
  }

  const goToToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
    setSelectedSlot(null)
    setSlotDetails(null)
  }

  // Get occupancy level color - simple: green if available, red if not
  const getOccupancyColor = (available: boolean, tablesCount: number) => {
    if (!available || tablesCount === 0) return 'bg-red-100 text-red-700 border-red-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  // Quick dates
  const getQuickDate = (days: number) => {
    const date = addDays(new Date(), days)
    return {
      label: isToday(date) ? "Hoy" : isTomorrow(date) ? "Mañana" : format(date, 'EEE d', { locale: es }),
      date: format(date, 'yyyy-MM-dd'),
      isToday: isToday(date)
    }
  }

  const quickDates = [getQuickDate(0), getQuickDate(1), getQuickDate(2)]

  // Group slots by service (comida/cena)
  const lunchSlots = availabilityData?.slots.filter(s => s.time >= '13:00' && s.time <= '16:00') || []
  const dinnerSlots = availabilityData?.slots.filter(s => s.time >= '19:00' && s.time <= '23:00') || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wider text-black">
          Disponibilidad
        </h1>
        <p className="font-sans text-neutral-500 mt-1">
          Consulta rápida para teléfono y walk-ins
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Date Navigation */}
        <div className="flex-1 bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDay(-1)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Día anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800"
              >
                Hoy
              </button>
              <button
                onClick={() => navigateDay(1)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Día siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Current Date */}
            <div className="flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-lg">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">
                {availabilityData?.displayDate || format(new Date(selectedDate), "EEEE, d MMM", { locale: es })}
              </span>
            </div>

            {/* Quick Dates */}
            <div className="flex items-center gap-2">
              {quickDates.map(({ label, date, isToday: isTodayDate }) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedDate === date
                      ? "bg-black text-white"
                      : isTodayDate
                      ? "bg-neutral-800 text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>

        {/* Party Size */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-neutral-500" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Personas:</span>
              <div className="flex items-center gap-1">
                {[2, 4, 6, 8].map((size) => (
                  <button
                    key={size}
                    onClick={() => setPartySize(size)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      partySize === size
                        ? "bg-black text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {size}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={partySize}
                  onChange={(e) => setPartySize(parseInt(e.target.value) || 2)}
                  className="w-16 px-2 py-1 border border-neutral-200 rounded-lg text-sm text-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-neutral-600">Verificando disponibilidad...</p>
        </div>
      )}

      {/* Availability Grid */}
      {!loading && availabilityData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time Slots - Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Comida */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                <h3 className="font-semibold text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Comida (13:00 - 16:00)
                </h3>
              </div>
              <div className="p-4 grid grid-cols-4 sm:grid-cols-6 gap-2">
                {lunchSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.time
                  return (
                    <button
                      key={slot.time}
                      onClick={() => handleSlotClick(slot.time)}
                      className={`
                        relative p-3 rounded-lg border-2 text-center transition-all
                        ${getOccupancyColor(slot.available, slot.tablesCount)}
                        ${isSelected ? 'ring-2 ring-black ring-offset-2' : 'hover:opacity-80'}
                      `}
                    >
                      <div className="text-lg font-bold">{slot.time}</div>
                      <div className="text-xs mt-1 font-medium">
                        {slot.available && slot.tablesCount > 0
                          ? `${slot.tablesCount} mesa${slot.tablesCount === 1 ? '' : 's'}`
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
                  <Clock className="w-4 h-4" />
                  Cena (19:00 - 23:00)
                </h3>
              </div>
              <div className="p-4 grid grid-cols-4 sm:grid-cols-6 gap-2">
                {dinnerSlots.map((slot) => {
                  const isSelected = selectedSlot === slot.time
                  return (
                    <button
                      key={slot.time}
                      onClick={() => handleSlotClick(slot.time)}
                      className={`
                        relative p-3 rounded-lg border-2 text-center transition-all
                        ${getOccupancyColor(slot.available, slot.tablesCount)}
                        ${isSelected ? 'ring-2 ring-black ring-offset-2' : 'hover:opacity-80'}
                      `}
                    >
                      <div className="text-lg font-bold">{slot.time}</div>
                      <div className="text-xs mt-1 font-medium">
                        {slot.available && slot.tablesCount > 0
                          ? `${slot.tablesCount} mesa${slot.tablesCount === 1 ? '' : 's'}`
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
            {/* Selected Slot Details */}
            {selectedSlot && slotDetails ? (
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
                        <span className="ml-2 bg-neutral-100 px-2 py-0.5 rounded">
                          {slotDetails.service.startTime} - {slotDetails.service.endTime}
                        </span>
                      </div>
                    )}

                    {slotDetails.availableTables && slotDetails.availableTables.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">
                          Mesas Disponibles ({slotDetails.availableTables.length})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {slotDetails.availableTables.map((table) => (
                            <div
                              key={table.id}
                              className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg text-sm"
                            >
                              <span className="font-medium">{table.tableCode || table.tableNumber}</span>
                              <span className="text-neutral-600">
                                {table.capacity}p · {table.location}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">No Disponible</span>
                    </div>
                    <p className="text-sm text-neutral-600">{slotDetails.message || 'Sin información'}</p>

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
              <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center">
                <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">Selecciona un horario para ver detalles</p>
              </div>
            )}

            {/* Quick Summary */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <h3 className="font-semibold text-sm mb-3">Resumen del Día</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total slots:</span>
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

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
              <h4 className="font-medium text-blue-900 text-sm mb-2">💡 Consejos</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Click en cualquier horario para ver mesas disponibles</li>
                <li>• Los horarios en ámbar tienen pocas mesas</li>
                <li>• Cambia la cantidad de personas para ver opciones diferentes</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
