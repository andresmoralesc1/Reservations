"use client"

import { useState, useEffect } from "react"
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
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (restaurantId) {
        params.append("restaurantId", restaurantId)
      }

      const url = `/api/admin/services?${params.toString()}`

      const response = await fetch(url)
      const data = await response.json()

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
    fetchServices()
  }, [restaurantId])

  const handleCreate = () => {
    setEditingService(null)
    setModalOpen(true)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setModalOpen(true)
  }

  const handleDelete = async (service: Service) => {
    openDeleteConfirm(service)
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
        alert(`✅ Servicio "${serviceToDelete.name}" eliminado permanentemente`)
        await fetchServices()
        closeDeleteConfirm()
      } else {
        // Si tiene reservas asociadas, ofrecer desactivar
        if (data.error?.includes("reservas asociadas") || data.error?.includes("no se puede eliminar")) {
          const deactivate = confirm(
            `⚠️ ${data.error}\n\n` +
            `¿Quieres desactivar el servicio en su lugar? (Se mantendrá en la BD pero oculto)`
          )
          if (deactivate) {
            const deactivateResponse = await fetch(`/api/admin/services/${serviceToDelete.id}`, {
              method: "DELETE",
            })
            const deactivateData = await deactivateResponse.json()
            if (deactivateData.success) {
              alert(`✅ Servicio "${serviceToDelete.name}" desactivado`)
              await fetchServices()
              closeDeleteConfirm()
            } else {
              alert(`❌ Error: ${deactivateData.error || "No se pudo desactivar el servicio"}`)
            }
          }
        } else {
          alert(`❌ Error: ${data.error || "No se pudo eliminar el servicio"}`)
        }
      }
    } catch (err) {
      console.error("Error permanently deleting service:", err)
      alert(`❌ Error de conexión: ${err instanceof Error ? err.message : "Error desconocido"}`)
    } finally {
      setDeletingService(null)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingService(null)
  }

  const handleModalSave = async () => {
    try {
      await fetchServices()
      setModalOpen(false)
      setEditingService(null)
    } catch (error) {
      alert("Error al actualizar la lista de servicios")
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    return `${hours}:${minutes}`
  }

  // Aplicar filtros a los servicios
  const filteredServices = services.filter((service) => {
    // Filtro por estado (activo/inactivo)
    if (filters.isActive !== "all") {
      if (filters.isActive === "true" && !service.isActive) return false
      if (filters.isActive === "false" && service.isActive) return false
    }

    // Filtro por tipo de servicio
    if (filters.serviceType !== "all") {
      if (service.serviceType !== filters.serviceType) return false
    }

    // Filtro por temporada
    if (filters.season !== "all") {
      if (filters.season === "todos") {
        // "todos" es un valor especial, mostrar todos
        return true
      }
      if (service.season !== filters.season) return false
    }

    return true
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-neutral-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-neutral-100 rounded"></div>
            <div className="h-16 bg-neutral-100 rounded"></div>
            <div className="h-16 bg-neutral-100 rounded"></div>
          </div>
        </div>
        <p className="text-sm text-neutral-500 mt-4 text-center">Cargando servicios...</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-neutral-200">
        {/* Header */}
        <div className="border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl uppercase tracking-[0.1em] text-black">
              Servicios
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchServices}
                className="px-4 py-2 bg-transparent border border-neutral-300 text-black text-sm font-medium rounded-lg hover:bg-neutral-100 transition-colors"
              >
                ↻ Refrescar
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                + Crear Servicio
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="px-3 py-1.5 bg-white border border-neutral-300 text-black rounded-lg text-sm focus:outline-none focus:border-black"
            >
              <option value="all">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>

            <select
              value={filters.serviceType}
              onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
              className="px-3 py-1.5 bg-white border border-neutral-300 text-black rounded-lg text-sm focus:outline-none focus:border-black"
            >
              <option value="all">Todos los tipos</option>
              <option value="comida">Comida</option>
              <option value="cena">Cena</option>
            </select>

            <select
              value={filters.season}
              onChange={(e) => setFilters({ ...filters, season: e.target.value })}
              className="px-3 py-1.5 bg-white border border-neutral-300 text-black rounded-lg text-sm focus:outline-none focus:border-black"
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
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Services List */}
        <div className="divide-y divide-neutral-200">
          {filteredServices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-neutral-500">
                {services.length === 0
                  ? "No hay servicios configurados. Crea tu primer servicio para empezar."
                  : "No hay servicios que coincidan con los filtros seleccionados."}
              </p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                className="px-6 py-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-lg text-black">{service.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          service.isActive
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                        }`}
                      >
                        {service.isActive ? "Activo" : "Inactivo"}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">
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
                      <span className="text-amber-600">
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
                    <button
                      onClick={() => handleEdit(service)}
                      className="px-3 py-1.5 bg-transparent border border-neutral-300 text-black text-sm font-medium rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(service)}
                      disabled={deletingService?.id === service.id}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        !service.isActive
                          ? "opacity-50 cursor-not-allowed bg-neutral-100 text-neutral-400"
                          : "bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
                      }`}
                    >
                      {deletingService?.id === service.id ? "Procesando..." : service.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(service)}
                      disabled={deletingService?.id === service.id}
                      className="px-3 py-1.5 bg-transparent border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingService?.id === service.id ? "Eliminando..." : "Eliminar"}
                    </button>
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
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${deleteConfirmOpen ? "" : "hidden"}`}>
        <div className="absolute inset-0 bg-black/50" onClick={closeDeleteConfirm}></div>
        <div className="relative bg-white border border-neutral-200 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <h3 className="font-display text-lg uppercase tracking-[0.1em] text-black mb-4">
            Eliminar Servicio
          </h3>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Esta acción es irreversible
              </p>
            </div>

            <p className="text-neutral-600">
              ¿Estás seguro que deseas eliminar el servicio <strong className="text-black">"{serviceToDelete?.name}"</strong>?
            </p>

            <p className="text-sm text-neutral-500">
              Esta acción eliminará permanentemente el servicio. Si el servicio tiene reservas asociadas, no se podrá eliminar.
            </p>

            {serviceToDelete && (
              <div className="bg-neutral-50 rounded-lg p-3 text-sm border border-neutral-200">
                <div className="grid grid-cols-2 gap-2 text-neutral-600">
                  <span><strong className="text-black">Tipo:</strong> {SERVICE_TYPE_LABELS[serviceToDelete.serviceType] || serviceToDelete.serviceType}</span>
                  <span><strong className="text-black">Días:</strong> {DAY_TYPE_LABELS[serviceToDelete.dayType] || serviceToDelete.dayType}</span>
                  <span><strong className="text-black">Horario:</strong> {formatTime(serviceToDelete.startTime)} - {formatTime(serviceToDelete.endTime)}</span>
                  <span><strong className="text-black">Temporada:</strong> {SEASON_LABELS[serviceToDelete.season] || serviceToDelete.season}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={closeDeleteConfirm}
              disabled={deletingService !== null}
              className="px-4 py-2 bg-transparent border border-neutral-300 text-black text-sm font-medium rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
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
          </div>
        </div>
      </div>
    </>
  )
}
