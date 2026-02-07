"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { toast } from "@/components/Toast"

interface BulkTableModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  restaurantId: string
}

interface FormData {
  count: number
  capacity: number
  location: "patio" | "interior" | "terraza" | null
  startingNumber: number | null
  isAccessible: boolean
}

const INITIAL_FORM: FormData = {
  count: 1,
  capacity: 4,
  location: null,
  startingNumber: null,
  isAccessible: false,
}

const LOCATION_OPTIONS = [
  { value: "patio" as const, label: "Patio", icon: "🌿" },
  { value: "interior" as const, label: "Interior", icon: "🏠" },
  { value: "terraza" as const, label: "Terraza", icon: "☀️" },
]

export function BulkTableModal({
  isOpen,
  onClose,
  onSave,
  restaurantId,
}: BulkTableModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewNumbers, setPreviewNumbers] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      setFormData(INITIAL_FORM)
      setPreviewNumbers([])
    }
  }, [isOpen])

  // Update preview when form data changes
  useEffect(() => {
    if (formData.count && formData.startingNumber !== null) {
      const numbers = []
      for (let i = 0; i < Math.min(formData.count, 5); i++) {
        numbers.push(`M-${formData.startingNumber! + i}`)
      }
      setPreviewNumbers(numbers)
    } else {
      setPreviewNumbers([])
    }
  }, [formData.count, formData.startingNumber])

  function updateFormData<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (!formData.location || !formData.capacity || !formData.count) {
      toast("Completa todos los campos requeridos", "error")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/tables/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          count: formData.count,
          capacity: formData.capacity,
          location: formData.location,
          startingNumber: formData.startingNumber || undefined,
          isAccessible: formData.isAccessible,
        }),
      })

      const data = await response.json()

      if (response.ok || response.status === 207) {
        toast(
          `${data.count} ${data.count === 1 ? "mesa creada" : "mesas creadas"}`,
          data.errors?.length > 0 ? "warning" : "success"
        )
        if (data.errors?.length > 0) {
          console.warn("Some tables failed to create:", data.errors)
        }
        onSave()
      } else {
        toast(data.error || "Error al crear mesas", "error")
      }
    } catch (error) {
      toast("Error de conexión", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = formData.location && formData.capacity && formData.count

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Varias Mesas"
      size="md"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? "Creando..." : `Crear ${formData.count} ${formData.count === 1 ? "Mesa" : "Mesas"}`}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Ubicación
          </label>
          <div className="grid grid-cols-3 gap-3">
            {LOCATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFormData("location", option.value)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  formData.location === option.value
                    ? "border-black bg-black/5"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-sm font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Cantidad de Mesas
          </label>
          <Input
            type="number"
            min="1"
            max="50"
            value={formData.count}
            onChange={(e) => updateFormData("count", parseInt(e.target.value) || 1)}
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Capacidad
          </label>
          <div className="grid grid-cols-6 gap-2">
            {[2, 4, 6, 8, 10, 12].map((cap) => (
              <button
                key={cap}
                onClick={() => updateFormData("capacity", cap)}
                className={`p-3 rounded-lg border-2 transition-all text-center font-display text-sm ${
                  formData.capacity === cap
                    ? "border-black bg-black/5"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>

        {/* Starting Number (Optional) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Número Inicial (opcional)
          </label>
          <Input
            type="number"
            min="1"
            placeholder="Se auto-asigna si se deja vacío"
            value={formData.startingNumber ?? ""}
            onChange={(e) =>
              updateFormData(
                "startingNumber",
                e.target.value ? parseInt(e.target.value) : null
              )
            }
          />
        </div>

        {/* Accessible */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="accessible-bulk"
            checked={formData.isAccessible}
            onChange={(e) => updateFormData("isAccessible", e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          <label htmlFor="accessible-bulk" className="text-sm text-neutral-700">
            Todas las mesas accesibles (♿)
          </label>
        </div>

        {/* Preview */}
        {previewNumbers.length > 0 && (
          <div className="bg-neutral-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-2">
              Vista previa ({formData.count} mesas):
            </h4>
            <div className="flex flex-wrap gap-2">
              {previewNumbers.map((num) => (
                <span
                  key={num}
                  className="px-3 py-1 bg-white border border-neutral-200 rounded-full text-sm font-medium"
                >
                  {num}
                </span>
              ))}
              {formData.count > 5 && (
                <span className="px-3 py-1 text-neutral-500">
                  +{formData.count - 5} más...
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
