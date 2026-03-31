/**
 * Hook para manejar el filtrado por restaurante
 * Combina el contexto de restaurantes con filtros adicionales
 */

import { useRestaurant } from "@/contexts/RestaurantContext"
import { useState, useCallback, useEffect } from "react"

export type LocationFilter = "all" | "interior" | "terraza" | "patio"

export interface RestaurantFilters {
  restaurantId: string | null
  location: LocationFilter
}

export function useRestaurantFilter() {
  const { selectedRestaurant, selectedRestaurantId, isLoading } = useRestaurant()
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all")

  // Reset location filter when restaurant changes
  useEffect(() => {
    setLocationFilter("all")
  }, [selectedRestaurantId])

  const filters: RestaurantFilters = {
    restaurantId: selectedRestaurantId,
    location: locationFilter,
  }

  const setLocationFilterCallback = useCallback((location: LocationFilter) => {
    setLocationFilter(location)
  }, [])

  return {
    // Restaurant
    selectedRestaurant,
    selectedRestaurantId,
    isLoading,
    filters,

    // Location filter
    locationFilter,
    setLocation: setLocationFilterCallback,

    // Helpers
    hasFilters: locationFilter !== "all",
    clearFilters: () => setLocationFilter("all"),
  }
}
