/**
 * Hook para gestionar filtros y búsqueda de reservas
 */

import { useState, useCallback, useEffect } from "react"
import type { Reservation, FilterValue } from "../types"

interface UseFiltersProps {
  reservations: Reservation[]
  itemsPerPage?: number
}

interface UseFiltersReturn {
  filter: FilterValue
  setFilter: (filter: FilterValue) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredReservations: Reservation[]
  paginatedReservations: Reservation[]
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
  resetFilters: () => void
}

export function useFilters({
  reservations,
  itemsPerPage = 10,
}: UseFiltersProps): UseFiltersReturn {
  const [filter, setFilter] = useState<FilterValue>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>(reservations)
  const [currentPage, setCurrentPage] = useState(1)

  // Calculate total pages
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage)

  // Filter by search query
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const filtered = reservations.filter((r) =>
        r.customerName.toLowerCase().includes(query) ||
        r.reservationCode.toLowerCase().includes(query) ||
        r.customerPhone.includes(query)
      )
      setFilteredReservations(filtered)
    } else {
      setFilteredReservations(reservations)
    }
    setCurrentPage(1) // Reset to first page when filter changes
  }, [searchQuery, reservations])

  // Paginated reservations
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilter("all")
    setSearchQuery("")
    setCurrentPage(1)
  }, [])

  return {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    filteredReservations,
    paginatedReservations,
    currentPage,
    setCurrentPage,
    totalPages,
    resetFilters,
  }
}
