"use client"

import { useState } from "react"
import { Button } from "@/components/Button"
import { OccupancyTimeline } from "@/components/admin/services/OccupancyTimeline"
import { Calendar } from "lucide-react"

interface TimelineButtonProps {
  restaurantId: string
}

export function TimelineButton({ restaurantId }: TimelineButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [serviceType, setServiceType] = useState<"comida" | "cena">("comida")

  // Determine service type based on current time
  const getCurrentServiceType = (): "comida" | "cena" => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const currentMinutes = hours * 60 + minutes

    const comidaStart = 13 * 60 // 13:00
    const comidaEnd = 16 * 60 // 16:00
    const cenaStart = 20 * 60 // 20:00
    const cenaEnd = 23 * 60 // 23:00

    if (currentMinutes >= comidaStart && currentMinutes < comidaEnd) {
      return "comida"
    } else if (currentMinutes >= cenaStart && currentMinutes < cenaEnd) {
      return "cena"
    } else if (currentMinutes < comidaStart) {
      return "comida"
    } else {
      return "cena"
    }
  }

  const handleOpen = () => {
    const currentService = getCurrentServiceType()
    setServiceType(currentService)
    setIsOpen(true)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        Ver Ocupación
      </Button>

      <OccupancyTimeline
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        date={selectedDate}
        serviceType={serviceType}
        restaurantId={restaurantId}
      />
    </>
  )
}
