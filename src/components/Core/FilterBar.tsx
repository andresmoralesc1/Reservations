/**
 * FilterBar - Barra de filtros reutilizable
 *
 * Combina búsqueda, filtros y acciones en un solo componente
 *
 * @example
 * <FilterBar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   searchPlaceholder="Buscar reservas..."
 *   filters={[
 *     { key: 'status', label: 'Estado', options: [...], value: status },
 *     { key: 'date', label: 'Fecha', type: 'date', value: date }
 *   ]}
 *   onFilterChange={(key, value) => ...}
 *   actions={<Button>Nuevo</Button>}
 * />
 */

"use client"

import { Input } from "@/components/Input"
import { Button } from "@/components/Button"
import { cn } from "@/lib/utils"

export type FilterType = "select" | "date" | "multiselect" | "toggle"

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  key: string
  label: string
  type: FilterType
  options?: FilterOption[]
  value?: string | string[] | boolean | null
  placeholder?: string
}

export interface FilterBarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterConfig[]
  onFilterChange?: (key: string, value: unknown) => void
  actions?: React.ReactNode
  className?: string
  compact?: boolean
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  onFilterChange,
  actions,
  className,
  compact = false,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        compact && "flex-wrap gap-2",
        className
      )}
    >
      {/* Search */}
      {onSearchChange && (
        <div className={cn("relative flex-1 max-w-md", compact && "max-w-xs")}>
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10"
          />
        </div>
      )}

      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const value = filter.value as string | undefined

            return (
              <div key={filter.key} className="flex items-center gap-2">
                {!compact && (
                  <label className="text-sm font-medium text-neutral-600">{filter.label}:</label>
                )}

                {filter.type === "select" && (
                  <select
                    value={value ?? ""}
                    onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    className={cn(
                      "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm",
                      "focus:border-black focus:outline-none focus:ring-1 focus:ring-black",
                      compact && "px-2 py-1 text-xs"
                    )}
                  >
                    <option value="">{filter.placeholder || `Todos ${filter.label}`}</option>
                    {filter.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === "date" && (
                  <input
                    type="date"
                    value={value ?? ""}
                    onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                    className={cn(
                      "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm",
                      "focus:border-black focus:outline-none focus:ring-1 focus:ring-black",
                      compact && "px-2 py-1 text-xs"
                    )}
                  />
                )}

                {filter.type === "toggle" && (
                  <button
                    onClick={() => onFilterChange?.(filter.key, !filter.value)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      filter.value
                        ? "bg-black text-white"
                        : "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50",
                      compact && "px-2 py-1 text-xs"
                    )}
                  >
                    {filter.label}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
