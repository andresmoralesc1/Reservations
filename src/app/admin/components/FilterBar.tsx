/**
 * Barra de filtros y búsqueda para reservas
 */

import { FilterTabs } from "@/components/FilterTabs"
import { SearchBar } from "@/components/SearchBar"
import { filterOptions } from "../types"

interface FilterBarProps {
  filter: string
  onFilterChange: (filter: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  timeFilter?: string // "all", "comida", "cena", or specific time like "20:00"
  onTimeFilterChange?: (time: string) => void
}

export function FilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  timeFilter = "all",
  onTimeFilterChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* First row: Status filters + Service/Time filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <FilterTabs
          options={filterOptions}
          value={filter as any}
          onChange={onFilterChange as any}
        />

        {onTimeFilterChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">Servicio:</span>
            <div className="flex gap-1">
              <button
                onClick={() => onTimeFilterChange("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === "all"
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => onTimeFilterChange("comida")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === "comida"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Comida
              </button>
              <button
                onClick={() => onTimeFilterChange("cena")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === "cena"
                    ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Cena
              </button>
            </div>
          </div>
        )}

        <div className="w-full sm:w-80">
          <SearchBar
            onSearch={onSearchChange}
            placeholder="Buscar por nombre, código o teléfono..."
          />
        </div>
      </div>

      {/* Second row: Specific time slots when service is selected */}
      {onTimeFilterChange && (timeFilter === "comida" || timeFilter === "cena") && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-neutral-600">Hora específica:</span>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => onTimeFilterChange(timeFilter === "comida" ? "comida" : "cena")}
              className={`px-2 py-1 rounded text-xs ${
                (timeFilter === "comida" || timeFilter === "cena")
                  ? "bg-black text-white"
                  : "bg-neutral-200 text-neutral-700"
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
                    className={`px-2 py-1 rounded text-xs ${
                      timeFilter === time
                        ? "bg-amber-600 text-white"
                        : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
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
                    className={`px-2 py-1 rounded text-xs ${
                      timeFilter === time
                        ? "bg-indigo-600 text-white"
                        : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
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
