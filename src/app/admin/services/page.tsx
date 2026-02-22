"use client"

import { useAuth } from "@/contexts/AuthContext"

export default function ServicesPage() {
  const { user } = useAuth()

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

      {/* Services Manager - Comentar temporalmente */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <p className="text-neutral-600">
          Sistema de Services cargando... Restaurant ID: {user?.restaurantId || "No encontrado"}
        </p>
        <p className="text-sm text-neutral-400 mt-2">
          Si ves esto, la página funciona. Próximamente: lista de services.
        </p>
      </div>
    </div>
  )
}
