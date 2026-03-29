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
}

export function FilterBar({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <FilterTabs
        options={filterOptions}
        value={filter as any}
        onChange={onFilterChange as any}
      />
      <div className="w-full sm:w-80">
        <SearchBar
          onSearch={onSearchChange}
          placeholder="Buscar por nombre, código o teléfono..."
        />
      </div>
    </div>
  )
}
