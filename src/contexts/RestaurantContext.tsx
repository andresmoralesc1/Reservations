"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

export interface Restaurant {
  id: string
  name: string
  phone?: string | null
  address?: string | null
  timezone: string
  isActive: boolean
}

interface RestaurantContextValue {
  restaurants: Restaurant[]
  selectedRestaurant: Restaurant | null
  selectedRestaurantId: string | null
  isLoading: boolean
  error: string | null
  setSelectedRestaurant: (restaurant: Restaurant) => void
  setSelectedRestaurantById: (id: string) => void
  refreshRestaurants: () => Promise<void>
}

const RestaurantContext = createContext<RestaurantContextValue | undefined>(undefined)

export function useRestaurant() {
  const context = useContext(RestaurantContext)
  if (!context) {
    throw new Error("useRestaurant must be used within a RestaurantProvider")
  }
  return context
}

interface RestaurantProviderProps {
  children: ReactNode
}

const STORAGE_KEY = "posit_selected_restaurant"

export function RestaurantProvider({ children }: RestaurantProviderProps) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load restaurants and selected restaurant on mount
  useEffect(() => {
    loadRestaurants()
  }, [])

  // Load selected restaurant from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setSelectedRestaurantIdState(stored)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  const loadRestaurants = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/restaurants")
      if (!response.ok) {
        throw new Error("Error al cargar restaurantes")
      }

      const data = await response.json()
      setRestaurants(data.restaurants)

      // Set first restaurant as default if none selected
      if (data.restaurants.length > 0 && !selectedRestaurantId) {
        const firstRestaurant = data.restaurants[0]
        setSelectedRestaurantIdState(firstRestaurant.id)
        localStorage.setItem(STORAGE_KEY, firstRestaurant.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
      console.error("Error loading restaurants:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const setSelectedRestaurant = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurantIdState(restaurant.id)
    localStorage.setItem(STORAGE_KEY, restaurant.id)
  }, [])

  const setSelectedRestaurantById = useCallback((id: string) => {
    const restaurant = restaurants.find((r) => r.id === id)
    if (restaurant) {
      setSelectedRestaurant(restaurant)
    }
  }, [restaurants, setSelectedRestaurant])

  const refreshRestaurants = useCallback(async () => {
    await loadRestaurants()
  }, [])

  // Get the selected restaurant object
  const selectedRestaurant = React.useMemo(
    () => restaurants.find((r) => r.id === selectedRestaurantId) || null,
    [restaurants, selectedRestaurantId]
  )

  return (
    <RestaurantContext.Provider
      value={{
        restaurants,
        selectedRestaurant,
        selectedRestaurantId,
        isLoading,
        error,
        setSelectedRestaurant,
        setSelectedRestaurantById,
        refreshRestaurants,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  )
}
