"use client"

import { useRestaurant } from "@/contexts/RestaurantContext"
import { UtensilsCrossed } from "lucide-react"

interface RestaurantSwitcherProps {
  variant?: "header" | "compact"
  showIcon?: boolean
}

export function RestaurantSwitcher({
  variant = "header",
  showIcon = true,
}: RestaurantSwitcherProps) {
  const { selectedRestaurant } = useRestaurant()

  if (!selectedRestaurant) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${variant === "compact" ? "px-2 py-1" : "px-3 py-2"} bg-neutral-100 rounded-lg`}>
      {showIcon && <UtensilsCrossed className="w-4 h-4 text-posit-red" />}
      <span className={`font-medium text-neutral-800 ${variant === "compact" ? "text-sm" : "text-sm"}`}>
        {selectedRestaurant.name}
      </span>
    </div>
  )
}
