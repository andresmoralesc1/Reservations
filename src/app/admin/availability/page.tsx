"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { CalendarIcon, ClockIcon, UsersIcon, CheckCircleIcon, XCircleIcon } from "@/components/admin/Icons"

type AvailabilityResult = {
  available: boolean
  reason?: string
  tables?: Array<{
    id: string
    tableNumber: string
    tableCode: string
    capacity: number
    location: string
  }>
  count?: number
  suggestedTimes?: string[]
  service?: {
    id: string
    name: string
    start: string
    end: string
    duration: number
    type: string
  }
  activeServices?: Array<{
    id: string
    name: string
    start: string
    end: string
    duration: number
    type: string
  }>
  message: string
}

export default function AvailabilityPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId || "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [time, setTime] = useState("13:30")
  const [partySize, setPartySize] = useState("2")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AvailabilityResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/reservations/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          date,
          time,
          party_size: parseInt(partySize),
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError("Error al verificar disponibilidad")
    } finally {
      setLoading(false)
    }
  }

  const getTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 13; hour <= 23; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`
        slots.push(timeStr)
      }
    }
    return slots
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wider text-black">
          Ver Disponibilidad
        </h1>
        <p className="font-sans text-neutral-500 mt-1">
          Consulta rápida de disponibilidad para teléfono y walk-ins
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Fecha
              </div>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Hora
              </div>
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              {getTimeSlots().map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Party Size */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4" />
                Personas
              </div>
            </label>
            <select
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size} {size === 1 ? "persona" : "personas"}
                </option>
              ))}
            </select>
          </div>

          {/* Check Button */}
          <div className="flex items-end">
            <button
              onClick={handleCheck}
              disabled={loading}
              className="w-full px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 disabled:bg-neutral-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Verificando..." : "Ver Disponibilidad"}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Main Result */}
          <div
            className={`rounded-xl p-6 border-2 ${
              result.available
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-4">
              {result.available ? (
                <CheckCircleIcon className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <XCircleIcon className="h-8 w-8 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-xl font-semibold ${
                    result.available ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {result.available ? "¡Disponible!" : "No Disponible"}
                </h3>
                <p
                  className={`mt-1 ${
                    result.available ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {result.message}
                </p>

                {/* Service Info */}
                {result.service && (
                  <div className="mt-3 text-sm">
                    <span className="font-medium">Servicio:</span>{" "}
                    <span className="bg-white px-2 py-1 rounded">
                      {result.service.name} ({result.service.start} - {result.service.end})
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Available Tables */}
          {result.available && result.tables && result.tables.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h4 className="font-semibold text-lg mb-4">Mesas Disponibles ({result.count})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.tables.map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div>
                      <span className="font-medium">{table.tableCode}</span>
                      <span className="text-neutral-500 text-sm ml-2">
                        (Mesa {table.tableNumber})
                      </span>
                    </div>
                    <div className="text-sm text-neutral-600">
                      {table.capacity} pax · {table.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Times */}
          {!result.available && result.suggestedTimes && result.suggestedTimes.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h4 className="font-semibold text-lg mb-4">Horarios Alternativos</h4>
              <div className="flex flex-wrap gap-2">
                {result.suggestedTimes.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => {
                      setTime(slot)
                      handleCheck()
                    }}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 font-medium"
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Services (when outside hours) */}
          {result.activeServices && result.activeServices.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h4 className="font-semibold text-lg mb-4">Servicios Activos Esta Fecha</h4>
              <div className="space-y-2">
                {result.activeServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="text-sm text-neutral-600">
                      {service.start} - {service.end}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
