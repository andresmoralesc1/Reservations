"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Select } from "@/components/Select"
import { toast } from "@/components/Toast"
import { XIcon, CalendarIcon, ClockIcon, UsersIcon } from "@/components/admin/Icons"

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

const PARTY_SIZES = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1} ${i === 0 ? "persona" : "personas"}`,
}))

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

export function CreateReservationModal({ isOpen, onClose, onSuccess }: CreateReservationModalProps) {
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    partySize: "",
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
        name: "",
        phone: "",
        specialRequests: "",
      })
      setErrors({})
      setTimeSlots([])
    }
  }, [isOpen])

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

  // Load available time slots when date and party size are selected
  useEffect(() => {
    if (formData.date && formData.partySize) {
      loadTimeSlots()
    } else {
      setTimeSlots([])
    }
  }, [formData.date, formData.partySize])

  async function loadTimeSlots() {
    if (!formData.date || !formData.partySize) return

    setCheckingAvailability(true)
    try {
      const response = await fetch(
        `/api/admin/availability/slots?restaurantId=${RESTAURANT_ID}&date=${formData.date}&partySize=${formData.partySize}`
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
    if (!formData.phone || !/^3\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Teléfono inválido (formato: 3XXXXXXXXX)"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: formData.name,
          customerPhone: formData.phone,
          restaurantId: RESTAURANT_ID,
          reservationDate: formData.date,
          reservationTime: formData.time,
          partySize: parseInt(formData.partySize),
          specialRequests: formData.specialRequests || undefined,
          source: "MANUAL",
          confirmImmediately: true, // Signal to skip pending queue
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

          {/* Time Slots */}
          {formData.date && formData.partySize && (
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
              placeholder="3XXXXXXXXX"
              error={errors.phone}
              helperText="Formato: 3 seguido de 9 dígitos"
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
