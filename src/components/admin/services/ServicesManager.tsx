"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/Button"
import { Modal } from "@/components/Modal"
import { ServiceModal } from "./ServiceModal"

interface Service {
  id: string
  name: string
  description: string | null
  isActive: boolean
  serviceType: string
  season: string
  dayType: string
  startTime: string
  endTime: string
  defaultDurationMinutes: number
  bufferMinutes: number
  slotGenerationMode: string
  dateRange: { start: string; end: string } | null
  manualSlots: string[] | null
  availableTableIds: string[] | null
  createdAt: string
  updatedAt: string
  restaurant?: {
    id: string
    name: string
  }
}

interface ServicesManagerProps {
  restaurantId?: string
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  comida: "Comida",
  cena: "Cena",
}

const SEASON_LABELS: Record<string, string> = {
  todos: "Todas",
  invierno: "Invierno",
  primavera: "Primavera",
  verano: "Verano",
  otoño: "Otoño",
}

const DAY_TYPE_LABELS: Record<string, string> = {
  all: "Todos",
  weekday: "Lun-Vie",
  weekend: "Fin de Semana",
}

export function ServicesManager({ restaurantId }: ServicesManagerProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const [filters, setFilters] = useState({
    isActive: "all",
    serviceType: "all",
    season: "all",
  })

  const fetchServices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (restaurantId) {
        params.append("restaurantId", restaurantId)
      }

      if (filters.isActive !== "all") {
        params.append("isActive", filters.isActive)
      }

      if (filters.serviceType !== "all") {
        params.append("serviceType", filters.serviceType)
      }

      if (filters.season !== "all") {
        params.append("season", filters.season)
      }

      const response = await fetch(`/api/admin/services?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setServices(data.data)
      } else {
        setError(data.error || "Error al cargar los servicios")
      }
    } catch (err) {
      console.error("Error fetching services:", err)
      setError("Error de conexión al cargar los servicios")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [restaurantId, filters])

  const handleCreate = () => {
    setEditingService(null)
    setModalOpen(true)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setModalOpen(true)
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`¿Estás seguro de desactivar el servicio "${service.name}"?`)) {
      return
    }

    try {
      setDeletingService(service)
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        await fetchServices()
      } else {
        alert(data.error || "Error al desactivar el servicio")
      }
    } catch (err) {
      console.error("Error deleting service:", err)
      alert("Error de conexión al desactivar el servicio")
    } finally {
      setDeletingService(null)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingService(null)
  }

  const handleModalSave = async () => {
    await fetchServices()
    handleModalClose()
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    return `${hours}:${minutes}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-neutral-200 rounded"></div>
            <div className="h-16 bg-neutral-200 rounded"></div>
            <div className="h-16 bg-neutral-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
        {/* Header */}
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl uppercase tracking-wider text-black">
              Servicios
            </h2>
            <Button variant="primary" size="md" onClick={handleCreate}>
              + Crear Servicio
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-4">
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>

            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="comida">Comida</option>
              <option value="cena">Cena</option>
            </select>

            <select
              value={filters.season}
              onChange={(e) => setFilters({ ...filters, season: e.target.value })}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">Todas las temporadas</option>
              <option value="todos">Todas</option>
              <option value="invierno">Invierno</option>
              <option value="primavera">Primavera</option>
              <option value="verano">Verano</option>
              <option value="otoño">Otoño</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Services List */}
        <div className="divide-y divide-neutral-200">
          {services.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-neutral-500">
                No hay servicios configurados. Crea tu primer servicio para empezar.
              </p>
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="px-6 py-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-lg">{service.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          service.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {service.isActive ? "Activo" : "Inactivo"}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {SERVICE_TYPE_LABELS[service.serviceType] || service.serviceType}
                      </span>
                    </div>

                    {service.description && (
                      <p className="text-sm text-neutral-600 mt-1">{service.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                      <span>
                        {SEASON_LABELS[service.season] || service.season}
                      </span>
                      <span>•</span>
                      <span>
                        {DAY_TYPE_LABELS[service.dayType] || service.dayType}
                      </span>
                      <span>•</span>
                      <span>
                        {formatTime(service.startTime)} - {formatTime(service.endTime)}
                      </span>
                      <span>•</span>
                      <span>{service.defaultDurationMinutes} min</span>
                    </div>

                    {service.restaurant && (
                      <div className="text-xs text-neutral-400 mt-1">
                        {service.restaurant.name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(service)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service)}
                      disabled={!service.isActive || deletingService?.id === service.id}
                      className={!service.isActive ? "opacity-50 cursor-not-allowed" : ""}
                    >
                      {deletingService?.id === service.id ? "Desactivando..." : "Desactivar"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Service Modal */}
      <ServiceModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        service={editingService}
        restaurantId={restaurantId}
      />
    </>
  )
}
