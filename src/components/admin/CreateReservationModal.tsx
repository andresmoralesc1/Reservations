"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Select } from "@/components/Select"
import { toast } from "@/components/Toast"
import { XIcon, CalendarIcon, ClockIcon, UsersIcon } from "@/components/admin/Icons"
import { CustomerRiskBadge } from "./CustomerRiskBadge"

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

const PARTY_SIZES = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i === 0 ? "persona" : "personas"}`,
}))

const LOCATION_OPTIONS = [
  { value: "", label: "Cualquier ubicación" },
  { value: "interior", label: "Interior" },
  { value: "terraza", label: "Terraza" },
  { value: "patio", label: "Patio" },
  { value: "barra", label: "Barra" },
]

interface CreateReservationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface TimeSlot {
  value: string
  label: string
  available: boolean
}

interface CustomerRisk {
  exists: boolean
  noShowCount: number
  tags: string[]
  riskLevel: "none" | "medium" | "high"
  name?: string
}

export function CreateReservationModal({ isOpen, onClose, onSuccess }: CreateReservationModalProps) {
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [checkingCustomer, setCheckingCustomer] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [customerRisk, setCustomerRisk] = useState<CustomerRisk | null>(null)

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    partySize: "",
    location: "",
    name: "",
    phone: "",
    specialRequests: "",
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        date: "",
        time: "",
        partySize: "",
        location: "",
        name: "",
        phone: "",
        specialRequests: "",
      })
      setErrors({})
      setTimeSlots([])
      setCustomerRisk(null)
    }
  }, [isOpen])

  // Check customer risk when phone is valid
  useEffect(() => {
    const phone = formData.phone
    // Validar teléfono español: 9 dígitos empezando por 6, 7, 8, o 9
    if (/^[6789]\d{8}$/.test(phone)) {
      checkCustomerRisk(phone)
    } else {
      setCustomerRisk(null)
    }
  }, [formData.phone])

  async function checkCustomerRisk(phone: string) {
    setCheckingCustomer(true)
    try {
      const response = await fetch(`/api/admin/customers/${phone}`)
      if (response.ok) {
        const data = await response.json()
        console.log("[CreateReservationModal] Customer risk data:", data)
        setCustomerRisk(data)

        // Auto-fill name if customer exists and name field is empty
        if (data.exists && data.name && !formData.name) {
          setFormData((prev) => ({ ...prev, name: data.name }))
        }
      }
    } catch (error) {
      console.error("Error checking customer risk:", error)
    } finally {
      setCheckingCustomer(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Load available time slots when date is selected
  useEffect(() => {
    if (formData.date) {
      loadTimeSlots()
    } else {
      setTimeSlots([])
    }
  }, [formData.date])

  async function loadTimeSlots() {
    if (!formData.date) return

    // Use partySize if selected, otherwise default to 2 (minimum for most tables)
    const partySize = formData.partySize || "2"

    setCheckingAvailability(true)
    try {
      const response = await fetch(
        `/api/admin/availability/slots?restaurantId=${RESTAURANT_ID}&date=${formData.date}&partySize=${partySize}`
      )

      if (response.ok) {
        const data = await response.json()
        setTimeSlots(data.slots || [])
      } else {
        console.error("Error loading time slots")
      }
    } catch (error) {
      console.error("Error loading time slots:", error)
    } finally {
      setCheckingAvailability(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate
    const newErrors: Record<string, string> = {}

    if (!formData.date) newErrors.date = "Selecciona una fecha"
    if (!formData.time) newErrors.time = "Selecciona una hora"
    if (!formData.partySize) newErrors.partySize = "Selecciona el número de personas"
    if (!formData.name || formData.name.length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
    }
    if (!formData.phone || !/^[6789]\d{8}$/.test(formData.phone)) {
      newErrors.phone = "Teléfono inválido (formato: 6XXXXXXXX o +34 6XX XXX XXX)"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          restaurantId: RESTAURANT_ID,
          reservationDate: formData.date,
          reservationTime: formData.time,
          partySize: parseInt(formData.partySize),
          preferredLocation: formData.location || undefined,
          specialRequests: formData.specialRequests || undefined,
          source: "MANUAL",
          confirmImmediately: true,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast("Reserva creada correctamente", "success")
        onSuccess()
        onClose()
      } else {
        const error = await response.json()
        toast(error.error || "Error al crear la reserva", "error")
      }
    } catch (error) {
      toast("Error de conexión. Inténtalo de nuevo.", "error")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const today = new Date().toISOString().split("T")[0]
  const availableTimeSlots = timeSlots.filter((slot) => slot.available)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="font-display text-xl uppercase tracking-wider text-black">
              Nueva Reserva Manual
            </h2>
            <p className="font-sans text-sm text-neutral-500 mt-1">
              Para clientes sin reserva o walk-ins
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black transition-colors"
            aria-label="Cerrar"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Risk Warning Banner */}
        {customerRisk && customerRisk.noShowCount > 0 && (
          <div className={`
            mx-6 mt-4 p-4 rounded-lg border flex items-start gap-3
            ${customerRisk.riskLevel === "high"
              ? "bg-red-50 border-red-200"
              : "bg-amber-50 border-amber-200"}
          `}>
            <span className="text-xl">
              {customerRisk.riskLevel === "high" ? "🔴" : "🟡"}
            </span>
            <div className="flex-1">
              <p className={`
                font-medium text-sm
                ${customerRisk.riskLevel === "high" ? "text-red-800" : "text-amber-800"}
              `}>
                {customerRisk.riskLevel === "high"
                  ? "Cliente con historial de no-shows"
                  : "Precaución: Cliente con no-shows previos"}
              </p>
              <p className={`
                text-xs mt-1
                ${customerRisk.riskLevel === "high" ? "text-red-700" : "text-amber-700"}
              `}>
                Este cliente tiene {(customerRisk.noShowCount || 0) + 1} no-show{(customerRisk.noShowCount || 0) + 1 === 1 ? "" : "s"} en su historial.
                {customerRisk.riskLevel === "high" && " Se recomienda confirmar reserva por llamada."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCustomerRisk(null)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Party Size */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              min={today}
              error={errors.date}
              required
            />

            <Select
              label="Personas"
              options={PARTY_SIZES}
              value={formData.partySize}
              onChange={(e) => handleInputChange("partySize", e.target.value)}
              error={errors.partySize}
              required
            />
          </div>

          {/* Location Preference */}
          <Select
            label="Ubicación preferida"
            options={LOCATION_OPTIONS}
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            helperText="Opcional: asignaremos la mejor mesa en esta zona"
          />

          {/* Time Slots */}
          {formData.date && (
            <div>
              <label className="block font-sans text-sm font-medium text-neutral-700 mb-2">
                Hora Disponible
                {checkingAvailability && (
                  <span className="ml-2 text-neutral-400 text-xs">Verificando...</span>
                )}
              </label>
              {checkingAvailability ? (
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="h-10 bg-neutral-100 rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              ) : availableTimeSlots.length === 0 ? (
                <div className="text-center py-4 bg-neutral-50 rounded-lg border border-neutral-200">
                  <p className="font-sans text-sm text-neutral-500">
                    No hay horarios disponibles para esta fecha
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availableTimeSlots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => handleInputChange("time", slot.value)}
                      className={`
                        px-3 py-2 rounded-lg font-sans text-sm transition-all
                        ${
                          formData.time === slot.value
                            ? "bg-black text-white"
                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                        }
                      `}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
              {errors.time && (
                <p className="font-sans text-xs text-red-600 mt-1">{errors.time}</p>
              )}
            </div>
          )}

          {/* Customer Info */}
          <div className="space-y-4">
            <Input
              label="Nombre del cliente"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Juan García"
              error={errors.name}
              required
            />

            <Input
              label="Teléfono"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="6XXXXXXXX"
              error={errors.phone}
              helperText={
                checkingCustomer
                  ? "Verificando historial..."
                  : customerRisk?.exists
                    ? `Cliente encontrado${customerRisk.noShowCount > 0 ? ` (${customerRisk.noShowCount} no-shows)` : ""}`
                    : "Formato: 9 dígitos (6XX XXX XXX)"
              }
              required
            />
          </div>

          {/* Special Requests */}
          <Input
            label="Notas adicionales (opcional)"
            value={formData.specialRequests}
            onChange={(e) => handleInputChange("specialRequests", e.target.value)}
            placeholder="Alérgias, preferencias, etc."
          />

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!formData.time || availableTimeSlots.length === 0}
              className="flex-1"
            >
              {loading ? "Creando..." : "Crear Reserva"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
