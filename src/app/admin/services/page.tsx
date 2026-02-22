"use client"

import { useAuth } from "@/contexts/AuthContext"
import { ServicesManager } from "@/components/admin/services/ServicesManager"

export default function ServicesPage() {
  const { user } = useAuth()
  const restaurantId = user?.restaurantId

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wider text-black">
          Configuración de Servicios
        </h1>
        <p className="font-sans text-neutral-500 mt-1">
          Gestiona los horarios de atención (comida, cena) y temporadas
        </p>
      </div>

      {/* Services Manager */}
      <ServicesManager restaurantId={restaurantId} />
    </div>
  )
}
