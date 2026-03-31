"use client"

import React, { createContext, useContext, ReactNode } from "react"

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

// Single restaurant for this installation
const MAIN_RESTAURANT: Restaurant = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name: "El Patio",
  phone: null,
  address: null,
  timezone: "Europe/Madrid",
  isActive: true,
}

export function RestaurantProvider({ children }: RestaurantProviderProps) {
  // No loading, no errors - always return the main restaurant
  const value: RestaurantContextValue = {
    restaurants: [MAIN_RESTAURANT],
    selectedRestaurant: MAIN_RESTAURANT,
    selectedRestaurantId: MAIN_RESTAURANT.id,
    isLoading: false,
    error: null,
  }

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  )
}
