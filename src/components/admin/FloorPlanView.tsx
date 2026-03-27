"use client"

import { useState, useEffect } from "react"

interface Table {
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
  diameter: number
  rotation: number
  status: "available" | "occupied" | "reserved" | "blocked"
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

interface FloorPlanViewProps {
  date: string
  restaurantId: string
  onTableClick?: (table: Table) => void
  selectedTableId?: string
}

const STATUS_COLORS = {
  available: "bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200 hover:scale-105",
  occupied: "bg-red-100 border-red-300 text-red-700",
  reserved: "bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200 hover:scale-105",
  blocked: "bg-gray-200 border-gray-400 text-gray-500",
}

const LOCATION_INFO = {
  interior: { label: "Interior", icon: "🏠", bg: "bg-blue-50", border: "border-blue-200" },
  terraza: { label: "Terraza", icon: "☀️", bg: "bg-amber-50", border: "border-amber-200" },
  patio: { label: "Patio", icon: "🌿", bg: "bg-green-50", border: "border-green-200" },
  barra: { label: "Barra", icon: "🍷", bg: "bg-purple-50", border: "border-purple-200" },
}

export function FloorPlanView({ date, restaurantId, onTableClick, selectedTableId }: FloorPlanViewProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    blocked: 0,
  })
  const [selectedLocation, setSelectedLocation] = useState<string>("interior")

  useEffect(() => {
    loadFloorPlan()
  }, [date, restaurantId])

  async function loadFloorPlan() {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/floor-plan?date=${date}&restaurantId=${restaurantId}`
      )
      if (response.ok) {
        const data = await response.json()
        setTables(data.tables)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error("Error loading floor plan:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter tables by selected location
  const locationTables = tables.filter(t => t.location === selectedLocation)

  // Calculate canvas size based on table positions
  const maxX = locationTables.length > 0
    ? Math.max(...locationTables.map(t => t.positionX + (t.width || t.diameter || 70)))
    : 800
  const maxY = locationTables.length > 0
    ? Math.max(...locationTables.map(t => t.positionY + (t.height || t.diameter || 50)))
    : 500

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-neutral-50 rounded-lg border border-neutral-200">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
          <p className="text-sm text-neutral-500">Cargando floor plan...</p>
        </div>
      </div>
    )
  }

  const info = LOCATION_INFO[selectedLocation as keyof typeof LOCATION_INFO] || {
    label: selectedLocation,
    icon: "🪑",
    bg: "bg-neutral-50",
    border: "border-neutral-200"
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-black">{summary.total}</div>
          <div className="text-xs text-neutral-500 uppercase tracking-wide mt-1">Total Mesas</div>
        </div>
        <div className="bg-white rounded-lg border border-emerald-200 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-emerald-600">{summary.available}</div>
          <div className="text-xs text-emerald-600 uppercase tracking-wide mt-1">Disponibles</div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-red-600">{summary.occupied}</div>
          <div className="text-xs text-red-600 uppercase tracking-wide mt-1">Ocupadas</div>
        </div>
        <div className="bg-white rounded-lg border border-amber-200 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-amber-600">{summary.reserved}</div>
          <div className="text-xs text-amber-600 uppercase tracking-wide mt-1">Reservadas</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-500">{summary.blocked}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Bloqueadas</div>
        </div>
      </div>

      {/* Location Tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(LOCATION_INFO).map(([key, locInfo]) => {
          const count = tables.filter(t => t.location === key).length
          return (
            <button
              key={key}
              onClick={() => setSelectedLocation(key)}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-colors ${
                selectedLocation === key
                  ? "bg-black text-white"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              {locInfo.icon} {locInfo.label} ({count})
            </button>
          )
        })}
      </div>

      {/* ==================== */}
      {/* EDITOR VISUAL */}
      {/* ==================== */}
      <div className="bg-white rounded-xl border-2 shadow-lg overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b ${info.bg} ${info.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{info.icon}</span>
              <div>
                <h3 className="font-display text-2xl uppercase tracking-wider text-black">
                  {info.label}
                </h3>
                <p className="text-sm text-neutral-500">
                  Editor visual - {locationTables.length} {locationTables.length === 1 ? "mesa" : "mesas"}
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-emerald-600">
                  {locationTables.filter(t => t.status === "available").length}
                </div>
                <div className="text-neutral-400">Disp</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-amber-600">
                  {locationTables.filter(t => t.status === "reserved").length}
                </div>
                <div className="text-neutral-400">Res</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-red-600">
                  {locationTables.filter(t => t.status === "occupied").length}
                </div>
                <div className="text-neutral-400">Ocup</div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas with absolute positioning */}
        <div className="p-6 bg-neutral-100 overflow-auto">
          <div
            className="bg-white rounded-lg border-2 border-dashed border-neutral-300 mx-auto shadow-inner"
            style={{
              width: maxX + 100,
              height: maxY + 100,
              minHeight: 500,
              position: "relative",
            }}
          >
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #000 1px, transparent 1px),
                  linear-gradient(to bottom, #000 1px, transparent 1px)
                `,
                backgroundSize: "50px 50px",
              }}
            />

            {/* Tables in absolute positions */}
            {locationTables.map((table) => {
              const isSelected = selectedTableId === table.id

              if (table.shape === "circular") {
                return (
                  <div
                    key={table.id}
                    className={`
                      border-2 cursor-pointer transition-all duration-200
                      flex items-center justify-center rounded-full
                      ${STATUS_COLORS[table.status]}
                      ${isSelected ? "ring-4 ring-black ring-offset-2 z-10" : "z-0"}
                    `}
                    style={{
                      position: "absolute",
                      width: table.diameter || 60,
                      height: table.diameter || 60,
                      left: table.positionX,
                      top: table.positionY,
                      transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
                    }}
                    onClick={() => onTableClick?.(table)}
                    title={`${table.tableCode} - ${table.capacity} personas - ${table.status}`}
                  >
                    <span className="font-bold text-sm">{table.tableCode}</span>
                    <span className="text-xs opacity-70">{table.capacity}p</span>

                    {/* Status dot */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                      table.status === "available" ? "bg-emerald-500" :
                      table.status === "occupied" ? "bg-red-500" :
                      table.status === "reserved" ? "bg-amber-500" :
                      "bg-gray-400"
                    }`} />

                    {/* Reservation count */}
                    {table.reservations && table.reservations.length > 0 && (
                      <div className="absolute -bottom-1 -left-1 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {table.reservations.length}
                      </div>
                    )}
                  </div>
                )
              }

              if (table.shape === "barra") {
                return (
                  <div
                    key={table.id}
                    className={`
                      border-2 cursor-pointer transition-all duration-200
                      flex items-center justify-center rounded
                      ${STATUS_COLORS[table.status]}
                      ${isSelected ? "ring-4 ring-black ring-offset-2 z-10" : "z-0"}
                    `}
                    style={{
                      position: "absolute",
                      width: table.width || 80,
                      height: (table.height || 30) / 2,
                      left: table.positionX,
                      top: table.positionY,
                      transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
                    }}
                    onClick={() => onTableClick?.(table)}
                    title={`${table.tableCode} - Barra - ${table.status}`}
                  >
                    <span className="font-bold text-xs">{table.tableCode}</span>

                    <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border-2 border-white ${
                      table.status === "available" ? "bg-emerald-500" :
                      table.status === "occupied" ? "bg-red-500" :
                      table.status === "reserved" ? "bg-amber-500" :
                      "bg-gray-400"
                    }`} />
                  </div>
                )
              }

              // Rectangular default
              return (
                <div
                  key={table.id}
                  className={`
                    border-2 cursor-pointer transition-all duration-200
                    flex items-center justify-center rounded-lg
                    ${STATUS_COLORS[table.status]}
                    ${isSelected ? "ring-4 ring-black ring-offset-2 z-10" : "z-0"}
                  `}
                  style={{
                    position: "absolute",
                    width: table.width || 70,
                    height: table.height || 50,
                    left: table.positionX,
                    top: table.positionY,
                    transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
                  }}
                  onClick={() => onTableClick?.(table)}
                  title={`${table.tableCode} - ${table.capacity} personas - ${table.status}`}
                >
                  <div className="text-center">
                    <div className="font-bold text-sm">{table.tableCode}</div>
                    <div className="text-xs opacity-70">{table.capacity}p</div>
                  </div>

                  {/* Status dot */}
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    table.status === "available" ? "bg-emerald-500" :
                    table.status === "occupied" ? "bg-red-500" :
                    table.status === "reserved" ? "bg-amber-500" :
                    "bg-gray-400"
                  }`} />

                  {/* Reservation count */}
                  {table.reservations && table.reservations.length > 0 && (
                    <div className="absolute -bottom-1 -left-1 bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {table.reservations.length}
                    </div>
                  )}
                </div>
              )
            })}

            {locationTables.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                <div className="text-center">
                  <div className="text-5xl mb-3">🪑</div>
                  <p className="text-lg">No hay mesas en esta zona</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center gap-6 flex-wrap text-sm">
          <span className="font-display text-xs uppercase tracking-wider text-neutral-500">Leyenda:</span>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-200 border-2 border-emerald-300"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-200 border-2 border-red-300"></div>
            <span>Ocupada ahora</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-amber-200 border-2 border-amber-300"></div>
            <span>Reservada hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gray-300 border-2 border-gray-400"></div>
            <span>Bloqueada</span>
          </div>
        </div>
      </div>
    </div>
  )
}
