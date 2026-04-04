"use client"

import { useAuth } from "@/contexts/AuthContext"
import { ServicesManager } from "@/components/admin/services/ServicesManager"
import { SeasonIndicator } from "@/components/admin/SeasonIndicator"

export default function ServicesPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl uppercase tracking-[0.1em] text-white">
            Configuración de Servicios
          </h1>
          <p className="font-sans text-[#A0A0A0] mt-1 text-sm">
            Gestiona los horarios de atención (comida, cena) y temporadas
          </p>
        </div>
        <SeasonIndicator />
      </div>

      {/* Services Manager */}
      <ServicesManager restaurantId={restaurantId} />
    </div>
  )
}
