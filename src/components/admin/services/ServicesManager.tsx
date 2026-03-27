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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [filters, setFilters] = useState({
    isActive: "all",
    serviceType: "all",
    season: "all",
  })

  const fetchServices = async () => {
    console.log("Fetching services... restaurantId:", restaurantId)
    console.log("[ServicesManager] localStorage restaurant:", localStorage.getItem("posit_restaurant"))
    console.log("[ServicesManager] localStorage user:", localStorage.getItem("posit_user"))
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (restaurantId) {
        params.append("restaurantId", restaurantId)
        console.log("[ServicesManager] Query params:", params.toString())
      } else {
        console.log("[ServicesManager] WARNING: restaurantId is empty/null, fetching ALL services")
      }

      const url = `/api/admin/services?${params.toString()}`
      console.log("Fetching from:", url)

      const response = await fetch(url)
      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      if (data.success) {
        setServices(data.data || [])
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
    console.log("ServicesManager mounted, restaurantId:", restaurantId)
    fetchServices()
  }, [restaurantId])

  const handleCreate = () => {
    console.log("Creating new service")
    setEditingService(null)
    setModalOpen(true)
  }

  const handleEdit = (service: Service) => {
    console.log("Editing service:", service.id)
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

  const handleToggleActive = async (service: Service) => {
    const action = service.isActive ? "desactivar" : "activar"
    if (!confirm(`¿Estás seguro de ${action} el servicio "${service.name}"?`)) {
      return
    }

    try {
      setDeletingService(service)
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      })

      const data = await response.json()

      if (data.success) {
        await fetchServices()
      } else {
        alert(data.error || `Error al ${action} el servicio`)
      }
    } catch (err) {
      console.error("Error toggling service:", err)
      alert(`Error de conexión al ${action} el servicio`)
    } finally {
      setDeletingService(null)
    }
  }

  const openDeleteConfirm = (service: Service) => {
    setServiceToDelete(service)
    setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false)
    setServiceToDelete(null)
  }

  const handleDeletePermanently = async () => {
    if (!serviceToDelete) return

    try {
      setDeletingService(serviceToDelete)
      const response = await fetch(`/api/admin/services/${serviceToDelete.id}?permanent=true`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        await fetchServices()
        closeDeleteConfirm()
      } else {
        alert(data.error || "Error al eliminar el servicio")
      }
    } catch (err) {
      console.error("Error permanently deleting service:", err)
      alert("Error de conexión al eliminar el servicio")
    } finally {
      setDeletingService(null)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingService(null)
  }

  const handleModalSave = async () => {
    console.log("Service saved, refreshing...")
    try {
      await fetchServices()
      console.log("Services refreshed successfully")
      setModalOpen(false)
      setEditingService(null)
    } catch (error) {
      console.error("Error refreshing services:", error)
      alert("Error al actualizar la lista de servicios")
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    return `${hours}:${minutes}`
  }

  console.log("ServicesManager state:", { loading, error, servicesCount: services.length })

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
        <p className="text-sm text-neutral-500 mt-4 text-center">Cargando servicios...</p>
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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" onClick={fetchServices}>
                ↻ Refrescar
              </Button>
              <Button variant="primary" size="md" onClick={handleCreate}>
                + Crear Servicio
              </Button>
            </div>
          </div>

          {/* Debug info */}
          <div className="mt-2 text-xs text-neutral-400">
            Restaurant ID: {restaurantId || "No disponible"} | Services: {services.length} | Loading: {loading.toString()}
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
                      onClick={() => handleToggleActive(service)}
                      disabled={deletingService?.id === service.id}
                      className={service.isActive ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                    >
                      {deletingService?.id === service.id
                        ? "Procesando..."
                        : service.isActive
                        ? "Desactivar"
                        : "Activar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteConfirm(service)}
                      disabled={deletingService?.id === service.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingService?.id === service.id ? "Eliminando..." : "Eliminar"}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        title="Eliminar Servicio"
        size="md"
        footer={
          <>
            <button
              onClick={closeDeleteConfirm}
              disabled={deletingService !== null}
              className="px-4 py-2 text-neutral-600 hover:text-black transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeletePermanently}
              disabled={deletingService !== null}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deletingService ? "Eliminando..." : "Eliminar Permanentemente"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Esta acción es irreversible
            </p>
          </div>

          <p className="text-neutral-700">
            ¿Estás seguro que deseas eliminar el servicio <strong>"{serviceToDelete?.name}"</strong>?
          </p>

          <p className="text-sm text-neutral-500">
            Esta acción eliminará permanentemente el servicio. Si el servicio tiene reservas asociadas, no se podrá eliminar.
          </p>

          {serviceToDelete && (
            <div className="bg-neutral-50 rounded-lg p-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-neutral-600">
                <span><strong>Tipo:</strong> {SERVICE_TYPE_LABELS[serviceToDelete.serviceType] || serviceToDelete.serviceType}</span>
                <span><strong>Días:</strong> {DAY_TYPE_LABELS[serviceToDelete.dayType] || serviceToDelete.dayType}</span>
                <span><strong>Horario:</strong> {formatTime(serviceToDelete.startTime)} - {formatTime(serviceToDelete.endTime)}</span>
                <span><strong>Temporada:</strong> {SEASON_LABELS[serviceToDelete.season] || serviceToDelete.season}</span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
