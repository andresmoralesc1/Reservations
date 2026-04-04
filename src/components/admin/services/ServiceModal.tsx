"use client"

import { useState, useEffect } from "react"

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
  const [newSlotTime, setNewSlotTime] = useState("")

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
    setNewSlotTime("")
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

      if (!response.ok) {
        throw new Error(data.error || `Error HTTP ${response.status}`)
      }

      if (data.success) {
        onSave()
      } else {
        setErrors([data.error || "Error al guardar el servicio"])
        if (data.details) {
          setErrors(data.details)
        }
      }
    } catch (err) {
      setErrors(["Error de conexión al guardar el servicio"])
    } finally {
      setIsSaving(false)
    }
  }

  const addManualSlot = () => {
    if (!newSlotTime) {
      setErrors(["Por favor selecciona una hora para el turno"])
      return
    }

    // Check if slot already exists
    if (formData.manualSlots.includes(newSlotTime)) {
      setErrors([`El turno ${newSlotTime} ya existe`])
      return
    }

    // Validate time is within service range
    const serviceTypeConfig = SERVICE_TYPES.find((st) => st.value === formData.serviceType)
    if (serviceTypeConfig) {
      const [slotH, slotM] = newSlotTime.split(":").map(Number)
      const [startH, startM] = serviceTypeConfig.minTime.split(":").map(Number)
      const [endH, endM] = serviceTypeConfig.maxTime.split(":").map(Number)

      const slotMinutes = slotH * 60 + slotM
      const minMinutes = startH * 60 + startM
      const maxMinutes = endH * 60 + endM

      if (slotMinutes < minMinutes || slotMinutes > maxMinutes) {
        setErrors([
          `El turno debe estar entre ${serviceTypeConfig.minTime} y ${serviceTypeConfig.maxTime}`
        ])
        return
      }
    }

    setFormData({
      ...formData,
      manualSlots: [...formData.manualSlots, newSlotTime].sort(),
    })
    setNewSlotTime("")
    setErrors([])
  }

  const removeManualSlot = (index: number) => {
    setFormData({
      ...formData,
      manualSlots: formData.manualSlots.filter((_, i) => i !== index),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose}></div>
      <div className="relative bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-[#333333] px-6 py-4">
          <h3 className="font-display text-lg uppercase tracking-[0.1em] text-white">
            {service ? "Editar Servicio" : "Crear Servicio"}
          </h3>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-[#E53935]/20 border border-[#E53935]/30 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, i) => (
                  <li key={i} className="text-sm text-[#E53935]">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-[#666666]">
              Información Básica
            </h3>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                Nombre <span className="text-[#E53935]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Comida Verano - Fin de Semana"
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B]"
                disabled={isSaving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Horario de comida para temporada alta"
                rows={2}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B]"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-[#666666]">
              Configuración
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                  Tipo
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => handleServiceTypeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B]"
                  disabled={isSaving}
                >
                  {SERVICE_TYPES.map((st) => (
                    <option key={st.value} value={st.value} className="bg-[#2a2a2a]">
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                  Temporada
                </label>
                <select
                  value={formData.season}
                  onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B]"
                  disabled={isSaving}
                >
                  {SEASONS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-[#2a2a2a]">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                  Días
                </label>
                <select
                  value={formData.dayType}
                  onChange={(e) => setFormData({ ...formData, dayType: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B]"
                  disabled={isSaving}
                >
                  {DAY_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value} className="bg-[#2a2a2a]">
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                  Hora Inicio <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B] [color-scheme:dark]"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                  Hora Fin <span className="text-[#E53935]">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B] [color-scheme:dark]"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
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
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B]"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
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
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B]"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
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
                    className="mr-2 accent-[#D4A84B]"
                  />
                  <span className="text-sm text-[#A0A0A0]">Automática</span>
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
                    className="mr-2 accent-[#D4A84B]"
                  />
                  <span className="text-sm text-[#A0A0A0]">Manual (Fase 2)</span>
                </label>
              </div>
            </div>

            {/* Manual slots (only shown when mode is manual) */}
            {formData.slotGenerationMode === "manual" && (
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
                  Turnos Manuales
                </label>

                {/* Add new slot */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="time"
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B] [color-scheme:dark]"
                    disabled={isSaving}
                  />
                  <button
                    type="button"
                    onClick={addManualSlot}
                    disabled={isSaving || !newSlotTime}
                    className="px-4 py-2 bg-[#D4A84B] text-black rounded-lg hover:bg-[#E5B95C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    + Agregar
                  </button>
                </div>

                {/* List of existing slots */}
                {formData.manualSlots.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-[#666666]">
                      Turnos configurados: {formData.manualSlots.length}
                    </p>
                    {formData.manualSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-[#2a2a2a] rounded-lg border border-[#333333]">
                        <span className="px-3 py-1 bg-[#1a1a1a] border border-[#333333] rounded font-mono text-sm text-white">
                          {slot}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeManualSlot(index)}
                          disabled={isSaving}
                          className="ml-auto text-[#E53935] hover:text-[#C62828] text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.manualSlots.length === 0 && (
                  <p className="text-sm text-[#666666] italic">
                    No hay turnos configurados. Agrega al menos uno.
                  </p>
                )}
              </div>
            )}

            {/* Date range (optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                  Fecha Inicio (opcional)
                </label>
                <input
                  type="date"
                  value={formData.dateRangeStart}
                  onChange={(e) =>
                    setFormData({ ...formData, dateRangeStart: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B] [color-scheme:dark]"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A0A0A0] mb-1">
                  Fecha Fin (opcional)
                </label>
                <input
                  type="date"
                  value={formData.dateRangeEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, dateRangeEnd: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B] [color-scheme:dark]"
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
              className="mr-2 accent-[#D4A84B]"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-[#A0A0A0]">
              Activo
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-[#333333] px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-transparent border border-[#333333] text-white text-sm font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2 bg-[#D4A84B] text-black rounded-lg hover:bg-[#E5B95C] transition-colors disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}
