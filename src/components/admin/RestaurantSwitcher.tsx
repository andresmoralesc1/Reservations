"use client"

import { useRestaurant } from "@/contexts/RestaurantContext"
import { UtensilsCrossed, ChevronDown, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface RestaurantSwitcherProps {
  variant?: "header" | "compact"
  showIcon?: boolean
}

export function RestaurantSwitcher({
  variant = "header",
  showIcon = true,
}: RestaurantSwitcherProps) {
  const {
    restaurants,
    selectedRestaurant,
    setSelectedRestaurantById,
    isLoading,
    error,
  } = useRestaurant()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        <span className="text-sm text-neutral-500">Cargando...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
        <span className="text-sm text-red-600">Error: {error}</span>
      </div>
    )
  }

  if (!selectedRestaurant || restaurants.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg">
        <span className="text-sm text-neutral-500">Sin restaurantes</span>
      </div>
    )
  }

  // Single restaurant - no switcher needed
  if (restaurants.length === 1) {
    return (
      <div className={`flex items-center gap-2 ${variant === "compact" ? "px-2 py-1" : "px-3 py-2"} bg-neutral-100 rounded-lg`}>
        {showIcon && <UtensilsCrossed className="w-4 h-4 text-posit-red" />}
        <span className={`font-medium text-neutral-800 ${variant === "compact" ? "text-sm" : "text-sm"}`}>
          {selectedRestaurant.name}
        </span>
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200
          rounded-lg transition-colors cursor-pointer
          ${variant === "compact" ? "px-2 py-1" : "px-3 py-2"}
        `}
        aria-label="Seleccionar restaurante"
        aria-expanded={isOpen}
      >
        {showIcon && <UtensilsCrossed className="w-4 h-4 text-posit-red" />}
        <span className={`font-medium text-neutral-800 ${variant === "compact" ? "text-sm" : "text-sm"}`}>
          {selectedRestaurant.name}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 min-w-[240px] bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-neutral-100">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider px-2">
              Restaurantes ({restaurants.length})
            </p>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {restaurants.map((restaurant) => {
              const isSelected = restaurant.id === selectedRestaurant.id
              return (
                <button
                  key={restaurant.id}
                  onClick={() => {
                    setSelectedRestaurantById(restaurant.id)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full text-left px-3 py-2.5 flex items-center gap-3
                    hover:bg-neutral-50 transition-colors
                    ${isSelected ? "bg-neutral-100" : ""}
                  `}
                >
                  <UtensilsCrossed
                    className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-posit-red" : "text-neutral-400"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSelected ? "text-black" : "text-neutral-700"}`}>
                      {restaurant.name}
                    </p>
                    {restaurant.address && (
                      <p className="text-xs text-neutral-500 truncate">{restaurant.address}</p>
                    )}
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-posit-red flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
