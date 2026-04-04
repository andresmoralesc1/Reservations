/**
 * Barra de filtros y búsqueda para reservas
 */

import { filterOptions } from "@/types/admin"
import type { Reservation } from "@/drizzle/schema"

type ReservationWithNoShowCount = Reservation & {
  customerNoShowCount?: number
}

interface FilterBarProps {
  filter: string
  onFilterChange: (filter: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  timeFilter?: string // "all", "comida", "cena", or specific time like "20:00"
  onTimeFilterChange?: (time: string) => void
  reservations?: ReservationWithNoShowCount[] // For no-show counter
}

export function FilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  timeFilter = "all",
  onTimeFilterChange,
  reservations = [],
}: FilterBarProps) {
  // Count customers with no-show history
  const noShowCount = reservations.filter((r) => (r.customerNoShowCount || 0) > 0).length

  return (
    <div className="flex flex-col gap-4">
      {/* First row: Status filters + Service/Time filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Custom filter tabs with no-show counter */}
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const isActive = filter === option.value
            const showCount = option.value === "noShows" && noShowCount > 0

            return (
              <button
                key={option.value}
                onClick={() => onFilterChange(option.value)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all relative border
                  ${isActive
                    ? option.value === "noShows"
                      ? "bg-red-900 bg-opacity-30 text-red-400 border-red-900 border-opacity-50"
                      : "bg-[#D4A84B] text-black border-[#D4A84B]"
                    : option.value === "noShows"
                      ? "bg-transparent text-red-400 border-red-900 border-opacity-30 hover:bg-red-900 hover:bg-opacity-10"
                      : "bg-transparent text-[#A0A0A0] border-[#333333] hover:border-[#D4A84B] hover:text-white"
                  }
                `}
              >
                {option.label}
                {showCount && (
                  <span className="ml-2 px-2 py-0.5 bg-red-400 text-black rounded-full text-xs font-bold">
                    {noShowCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {onTimeFilterChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#A0A0A0]">Servicio:</span>
            <div className="flex gap-1">
              <button
                onClick={() => onTimeFilterChange("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  timeFilter === "all"
                    ? "bg-[#D4A84B] text-black border-[#D4A84B]"
                    : "bg-transparent text-[#A0A0A0] border-[#333333] hover:border-[#D4A84B] hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => onTimeFilterChange("comida")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  timeFilter === "comida"
                    ? "bg-amber-600 bg-opacity-30 text-amber-400 border-amber-600 border-opacity-50"
                    : "bg-transparent text-[#A0A0A0] border-[#333333] hover:border-amber-600 hover:border-opacity-50 hover:text-white"
                }`}
              >
                Comida
              </button>
              <button
                onClick={() => onTimeFilterChange("cena")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                  timeFilter === "cena"
                    ? "bg-indigo-600 bg-opacity-30 text-indigo-400 border-indigo-600 border-opacity-50"
                    : "bg-transparent text-[#A0A0A0] border-[#333333] hover:border-indigo-600 hover:border-opacity-50 hover:text-white"
                }`}
              >
                Cena
              </button>
            </div>
          </div>
        )}

        <div className="w-full sm:w-80">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nombre, código o teléfono..."
              className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] border border-[#333333] rounded-lg text-white placeholder-[#666666] text-sm focus:outline-none focus:border-[#D4A84B] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Second row: Specific time slots when service is selected */}
      {onTimeFilterChange && (timeFilter === "comida" || timeFilter === "cena") && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[#A0A0A0]">Hora específica:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => onTimeFilterChange(timeFilter === "comida" ? "comida" : "cena")}
              className={`px-2 py-1 rounded text-xs border transition-all ${
                (timeFilter === "comida" || timeFilter === "cena")
                  ? "bg-[#D4A84B] text-black border-[#D4A84B]"
                  : "bg-transparent text-[#A0A0A0] border-[#333333] hover:border-[#D4A84B] hover:text-white"
              }`}
            >
              Todas
            </button>
            {timeFilter === "comida" && (
              <>
                {["13:00", "13:30", "14:00", "14:30", "15:00", "15:30"].map((time) => (
                  <button
                    key={time}
                    onClick={() => onTimeFilterChange(time)}
                    className={`px-2 py-1 rounded text-xs border transition-all ${
                      timeFilter === time
                        ? "bg-amber-600 bg-opacity-30 text-amber-400 border-amber-600 border-opacity-50"
                        : "bg-transparent text-[#A0A0A0] border-[#333333] hover:border-amber-600 hover:border-opacity-50 hover:text-white"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </>
            )}
            {timeFilter === "cena" && (
              <>
                {["20:00", "20:30", "21:00", "21:30", "22:00", "22:30"].map((time) => (
                  <button
                    key={time}
                    onClick={() => onTimeFilterChange(time)}
                    className={`px-2 py-1 rounded text-xs border transition-all ${
                      timeFilter === time
                        ? "bg-indigo-600 bg-opacity-30 text-indigo-400 border-indigo-600 border-opacity-50"
                        : "bg-transparent text-[#A0A0A0] border-[#333333] hover:border-indigo-600 hover:border-opacity-50 hover:text-white"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
