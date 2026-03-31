/**
 * Hook para gestionar filtros con URL (compartibles y persistentes)
 * Los filtros se almacenan en la URL como ?status=pending&search=juan&page=1
 */

import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { Reservation, FilterValue } from "@/types/admin"

interface UseFiltersWithURLProps {
  reservations: Reservation[]
  itemsPerPage?: number
}

interface UseFiltersWithURLReturn {
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

// Mapeo de filtros URL a valores internos
const URL_TO_FILTER: Record<string, FilterValue> = {
  all: "all",
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
  noshows: "noShows",
}

const FILTER_TO_URL: Record<FilterValue, string> = {
  all: "all",
  pending: "pending",
  confirmed: "confirmed",
  cancelled: "cancelled",
  noShows: "noshows",
}

export function useFiltersWithURL({
  reservations,
  itemsPerPage = 10,
}: UseFiltersWithURLProps): UseFiltersWithURLReturn {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Leer estado inicial desde URL
  const initialFilter = URL_TO_FILTER[searchParams.get("status") || ""] || "all"
  const initialSearch = searchParams.get("search") || ""
  const initialPage = parseInt(searchParams.get("page") || "1", 10)

  const [filter, setFilterState] = useState<FilterValue>(initialFilter)
  const [searchQuery, setSearchQueryState] = useState(initialSearch)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])

  // Función para actualizar URL
  const updateURL = useCallback((
    newFilter: FilterValue,
    newSearch: string,
    newPage: number
  ) => {
    const params = new URLSearchParams()

    // Solo agregar parámetros con valores
    if (newFilter !== "all") {
      params.set("status", FILTER_TO_URL[newFilter])
    }
    if (newSearch) {
      params.set("search", newSearch)
    }
    if (newPage > 1) {
      params.set("page", newPage.toString())
    }

    const queryString = params.toString()
    const newURL = queryString ? `?${queryString}` : ""

    // Reemplazar URL sin recargar la página
    router.replace(newURL, { scroll: false })
  }, [router])

  // Setters que actualizan estado y URL
  const setFilter = useCallback((newFilter: FilterValue) => {
    setFilterState(newFilter)
    setCurrentPage(1) // Reset page al cambiar filtro
    updateURL(newFilter, searchQuery, 1)
  }, [searchQuery, updateURL])

  const setSearchQuery = useCallback((newSearch: string) => {
    setSearchQueryState(newSearch)
    setCurrentPage(1) // Reset page al cambiar búsqueda
    updateURL(filter, newSearch, 1)
  }, [filter, updateURL])

  const setCurrentPageAndUpdateURL = useCallback((newPage: number) => {
    setCurrentPage(newPage)
    updateURL(filter, searchQuery, newPage)
  }, [filter, searchQuery, updateURL])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilterState("all")
    setSearchQueryState("")
    setCurrentPage(1)
    router.replace("/", { scroll: false })
  }, [router])

  // Calculate total pages
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage)

  // Filtrar reservas cuando cambian las dependencias
  useEffect(() => {
    let filtered = reservations

    // Apply status filter
    if (filter === "pending") {
      filtered = filtered.filter((r) => r.status === "PENDIENTE")
    } else if (filter === "confirmed") {
      filtered = filtered.filter((r) => r.status === "CONFIRMADO")
    } else if (filter === "cancelled") {
      filtered = filtered.filter((r) => r.status === "CANCELADO")
    } else if (filter === "noShows") {
      filtered = filtered.filter((r) => (r.customerNoShowCount || 0) > 0)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((r) =>
        r.customerName.toLowerCase().includes(query) ||
        r.reservationCode.toLowerCase().includes(query) ||
        r.customerPhone.includes(query)
      )
    }

    setFilteredReservations(filtered)
  }, [searchQuery, reservations, filter])

  // Paginated reservations
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return {
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    filteredReservations,
    paginatedReservations,
    currentPage,
    setCurrentPage: setCurrentPageAndUpdateURL,
    totalPages,
    resetFilters,
  }
}
