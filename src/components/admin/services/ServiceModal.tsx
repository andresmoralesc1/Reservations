"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/Modal"

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
}

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  service: Service | null
  restaurantId?: string
}

const SERVICE_TYPES = [
  { value: "comida", label: "Comida", minTime: "13:00", maxTime: "16:00" },
  { value: "cena", label: "Cena", minTime: "20:00", maxTime: "23:00" },
]

const SEASONS = [
  { value: "todos", label: "Todas" },
  { value: "invierno", label: "Invierno" },
  { value: "primavera", label: "Primavera" },
  { value: "verano", label: "Verano" },
  { value: "otoño", label: "Otoño" },
]

const DAY_TYPES = [
  { value: "all", label: "Todos" },
  { value: "weekday", label: "Lun-Vie" },
  { value: "weekend", label: "Fin de Semana" },
]

export function ServiceModal({
  isOpen,
  onClose,
  onSave,
  service,
  restaurantId,
}: ServiceModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    serviceType: "comida",
    season: "todos",
    dayType: "all",
    startTime: "13:00",
    endTime: "16:00",
    defaultDurationMinutes: 90,
    bufferMinutes: 15,
    slotGenerationMode: "auto",
    dateRangeStart: "",
    dateRangeEnd: "",
    manualSlots: [] as string[],
  })

  const [errors, setErrors] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Load service data when editing
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || "",
        isActive: service.isActive,
        serviceType: service.serviceType,
        season: service.season,
        dayType: service.dayType,
        startTime: service.startTime,
        endTime: service.endTime,
        defaultDurationMinutes: service.defaultDurationMinutes,
        bufferMinutes: service.bufferMinutes,
        slotGenerationMode: service.slotGenerationMode,
        dateRangeStart: service.dateRange?.start || "",
        dateRangeEnd: service.dateRange?.end || "",
        manualSlots: service.manualSlots || [],
      })
    } else {
      // Reset to defaults for new service
      setFormData({
        name: "",
        description: "",
        isActive: true,
        serviceType: "comida",
        season: "todos",
        dayType: "all",
        startTime: "13:00",
        endTime: "16:00",
        defaultDurationMinutes: 90,
        bufferMinutes: 15,
        slotGenerationMode: "auto",
        dateRangeStart: "",
        dateRangeEnd: "",
        manualSlots: [],
      })
    }
    setErrors([])
  }, [service, isOpen])

  // Update time range when service type changes
  const handleServiceTypeChange = (value: string) => {
    const serviceTypeConfig = SERVICE_TYPES.find((st) => st.value === value)
    setFormData({
      ...formData,
      serviceType: value,
      startTime: serviceTypeConfig?.minTime || "13:00",
      endTime: serviceTypeConfig?.maxTime || "16:00",
    })
  }

  const validateForm = () => {
    const validationErrors: string[] = []

    if (!formData.name.trim()) {
      validationErrors.push("El nombre es requerido")
    }

    if (formData.defaultDurationMinutes < 60 || formData.defaultDurationMinutes > 180) {
      validationErrors.push("La duración debe estar entre 60 y 180 minutos")
    }

    if (formData.bufferMinutes < 10 || formData.bufferMinutes > 30) {
      validationErrors.push("El buffer debe estar entre 10 y 30 minutos")
    }

    if (formData.slotGenerationMode === "manual" && formData.manualSlots.length === 0) {
      validationErrors.push("En modo manual, debes agregar al menos un turno")
    }

    // Validate time range based on service type
    const serviceTypeConfig = SERVICE_TYPES.find((st) => st.value === formData.serviceType)
    if (serviceTypeConfig) {
      const [startH, startM] = formData.startTime.split(":").map(Number)
      const [endH, endM] = formData.endTime.split(":").map(Number)
      const [minH, minM] = serviceTypeConfig.minTime.split(":").map(Number)
      const [maxH, maxM] = serviceTypeConfig.maxTime.split(":").map(Number)

      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      const minMinutes = minH * 60 + minM
      const maxMinutes = maxH * 60 + maxM

      if (startMinutes < minMinutes || endMinutes > maxMinutes) {
        validationErrors.push(
          `Para ${serviceTypeConfig.label}, el horario debe estar entre ${serviceTypeConfig.minTime} y ${serviceTypeConfig.maxTime}`
        )
      }

      if (startMinutes >= endMinutes) {
        validationErrors.push("La hora de inicio debe ser anterior a la hora de fin")
      }
    }

    setErrors(validationErrors)
    return validationErrors.length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        restaurantId,
        name: formData.name,
        description: formData.description || null,
        isActive: formData.isActive,
        serviceType: formData.serviceType,
        season: formData.season,
        dayType: formData.dayType,
        startTime: formData.startTime,
        endTime: formData.endTime,
        defaultDurationMinutes: formData.defaultDurationMinutes,
        bufferMinutes: formData.bufferMinutes,
        slotGenerationMode: formData.slotGenerationMode,
        ...(formData.dateRangeStart && formData.dateRangeEnd && {
          dateRange: {
            start: formData.dateRangeStart,
            end: formData.dateRangeEnd,
          },
        }),
        ...(formData.slotGenerationMode === "manual" && {
          manualSlots: formData.manualSlots,
        }),
      }

      const url = service
        ? `/api/admin/services/${service.id}`
        : "/api/admin/services"

      const response = await fetch(url, {
        method: service ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        onSave()
      } else {
        setErrors([data.error || "Error al guardar el servicio"])
        if (data.details) {
          setErrors(data.details)
        }
      }
    } catch (err) {
      console.error("Error saving service:", err)
      setErrors(["Error de conexión al guardar el servicio"])
    } finally {
      setIsSaving(false)
    }
  }

  const addManualSlot = () => {
    const newSlot = "13:00" // Default, could be improved with a time picker
    setFormData({
      ...formData,
      manualSlots: [...formData.manualSlots, newSlot].sort(),
    })
  }

  const removeManualSlot = (index: number) => {
    setFormData({
      ...formData,
      manualSlots: formData.manualSlots.filter((_, i) => i !== index),
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={service ? "Editar Servicio" : "Crear Servicio"}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-neutral-600 hover:text-black transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, i) => (
                <li key={i} className="text-sm text-red-700">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
            Información Básica
          </h3>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Comida Verano - Fin de Semana"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={isSaving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Horario de comida para temporada alta"
              rows={2}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
            Configuración
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tipo
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => handleServiceTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isSaving}
              >
                {SERVICE_TYPES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Temporada
              </label>
              <select
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isSaving}
              >
                {SEASONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Días
              </label>
              <select
                value={formData.dayType}
                onChange={(e) => setFormData({ ...formData, dayType: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isSaving}
              >
                {DAY_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Hora Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Hora Fin <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Duración (min)
              </label>
              <input
                type="number"
                min="60"
                max="180"
                value={formData.defaultDurationMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    defaultDurationMinutes: parseInt(e.target.value) || 90,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Buffer (min)
              </label>
              <input
                type="number"
                min="10"
                max="30"
                value={formData.bufferMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bufferMinutes: parseInt(e.target.value) || 15,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isSaving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Generación de Turnos
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="auto"
                  checked={formData.slotGenerationMode === "auto"}
                  onChange={(e) =>
                    setFormData({ ...formData, slotGenerationMode: e.target.value })
                  }
                  disabled={isSaving}
                  className="mr-2"
                />
                <span className="text-sm">Automática</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={formData.slotGenerationMode === "manual"}
                  onChange={(e) =>
                    setFormData({ ...formData, slotGenerationMode: e.target.value })
                  }
                  disabled={isSaving}
                  className="mr-2"
                />
                <span className="text-sm">Manual (Fase 2)</span>
              </label>
            </div>
          </div>

          {/* Manual slots (only shown when mode is manual) */}
          {formData.slotGenerationMode === "manual" && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Turnos Manuales
              </label>
              <div className="space-y-2">
                {formData.manualSlots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-neutral-100 rounded text-sm">
                      {slot}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeManualSlot(index)}
                      disabled={isSaving}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addManualSlot}
                  disabled={isSaving}
                  className="text-sm text-black hover:text-neutral-700"
                >
                  + Agregar turno
                </button>
              </div>
            </div>
          )}

          {/* Date range (optional) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fecha Inicio (opcional)
              </label>
              <input
                type="date"
                value={formData.dateRangeStart}
                onChange={(e) =>
                  setFormData({ ...formData, dateRangeStart: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Fecha Fin (opcional)
              </label>
              <input
                type="date"
                value={formData.dateRangeEnd}
                onChange={(e) =>
                  setFormData({ ...formData, dateRangeEnd: e.target.value })
                }
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            disabled={isSaving}
            className="mr-2"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-neutral-700">
            Activo
          </label>
        </div>
      </form>
    </Modal>
  )
}
