"use client"

import React, { useState, useEffect } from "react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { toast } from "@/components/Toast"
import { TableShapePreview, TableShapeType } from "./TableShape"

export interface Table {
  id: string
  tableNumber: string
  capacity: number
  location: "patio" | "interior" | "terraza" | null
  isAccessible: boolean
  createdAt: string
  shape?: string | null
}

type WizardStep = 1 | 2 | 3 | 4 | 5

interface TableWizardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  restaurantId: string
  editTable?: Table
}

interface FormData {
  location: "patio" | "interior" | "terraza" | null
  capacity: number | null
  shape: TableShapeType
  tableNumber: string
  isAccessible: boolean
  notes: string
}

const INITIAL_FORM: FormData = {
  location: null,
  capacity: null,
  shape: "rectangular",
  tableNumber: "",
  isAccessible: false,
  notes: "",
}

const LOCATION_OPTIONS = [
  { value: "patio" as const, label: "Patio", icon: "🌿" },
  { value: "interior" as const, label: "Interior", icon: "🏠" },
  { value: "terraza" as const, label: "Terraza", icon: "☀️" },
]

const CAPACITY_OPTIONS = [2, 4, 6, 8, 10, 12]

const SHAPE_OPTIONS: { value: TableShapeType; label: string; description: string }[] = [
  { value: "circular", label: "Circular", description: "Ideal para 2-4 personas" },
  { value: "cuadrada", label: "Cuadrada", description: "Ideal para 4-6 personas" },
  { value: "rectangular", label: "Rectangular", description: "Ideal para 6+ personas" },
  { value: "barra", label: "Barra", description: "Para sillas de barra" },
]

export function TableWizardModal({
  isOpen,
  onClose,
  onSave,
  restaurantId,
  editTable,
}: TableWizardModalProps) {
  const [step, setStep] = useState<WizardStep>(1)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestedNumber, setSuggestedNumber] = useState("")

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen) {
      if (editTable) {
        setFormData({
          location: editTable.location,
          capacity: editTable.capacity,
          shape: (editTable.shape as TableShapeType) || "rectangular",
          tableNumber: editTable.tableNumber,
          isAccessible: editTable.isAccessible,
          notes: "",
        })
        setStep(3) // Skip location and capacity when editing
      } else {
        setFormData(INITIAL_FORM)
        setStep(1)
        fetchSuggestedNumber()
      }
    }
  }, [isOpen, editTable])

  async function fetchSuggestedNumber() {
    try {
      const response = await fetch(`/api/admin/tables?restaurantId=${restaurantId}`)
      const data = await response.json()
      const tables = data.tables || []

      const maxNumber = tables.reduce((max: number, t: Table) => {
        const num = parseInt(t.tableNumber.replace(/\D/g, ""), 10)
        return isNaN(num) ? max : Math.max(max, num)
      }, 0)

      setSuggestedNumber(`M-${maxNumber + 1}`)
      setFormData((prev) => ({ ...prev, tableNumber: `M-${maxNumber + 1}` }))
    } catch (error) {
      console.error("Error fetching suggested number:", error)
    }
  }

  function updateFormData<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      const url = editTable
        ? `/api/admin/tables/${editTable.id}`
        : "/api/admin/tables"

      const payload = {
        restaurantId,
        tableNumber: formData.tableNumber,
        capacity: formData.capacity,
        location: formData.location,
        shape: formData.shape,
        isAccessible: formData.isAccessible,
      }

      console.log("Creating table with payload:", payload)
      console.log("URL:", url)

      const response = await fetch(url, {
        method: editTable ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("Response status:", response.status)

      const data = await response.json()
      console.log("Response data:", data)

      if (response.ok) {
        toast(editTable ? "Mesa actualizada" : "Mesa creada", "success")
        onSave()
      } else {
        toast(data.error || "Error al guardar", "error")
      }
    } catch (error) {
      console.error("Error creating table:", error)
      toast("Error de conexión", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return formData.location !== null
      case 2:
        return formData.capacity !== null && formData.capacity > 0
      case 3:
        return true // Shape is always selected
      case 4:
        return formData.tableNumber.trim().length > 0
      case 5:
        return true
      default:
        return false
    }
  }

  function nextStep() {
    if (canProceed() && step < 5) {
      setStep((step + 1) as WizardStep)
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep((step - 1) as WizardStep)
    }
  }

  const steps = [
    { number: 1, label: "Ubicación", completed: formData.location !== null },
    { number: 2, label: "Capacidad", completed: formData.capacity !== null },
    { number: 3, label: "Forma", completed: true },
    { number: 4, label: "Configuración", completed: formData.tableNumber.length > 0 },
    { number: 5, label: "Confirmar", completed: false },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTable ? "Editar Mesa" : "Nueva Mesa"}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            size="md"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
          >
            Atrás
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            {step < 5 ? (
              <Button
                variant="primary"
                size="md"
                onClick={nextStep}
                disabled={!canProceed() || isSubmitting}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : editTable ? "Guardar Cambios" : "Crear Mesa"}
              </Button>
            )}
          </div>
        </div>
      }
    >
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    s.completed || step >= s.number
                      ? "bg-black text-white"
                      : "bg-neutral-200 text-neutral-500"
                  }`}
                >
                  {s.completed ? "✓" : s.number}
                </div>
                <span className="mt-2 text-xs text-neutral-500">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 bg-neutral-200" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg uppercase tracking-wider text-black">
            ¿Dónde estará ubicada la mesa?
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {LOCATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFormData("location", option.value)}
                className={`p-6 rounded-lg border-2 transition-all text-center ${
                  formData.location === option.value
                    ? "border-black bg-black/5"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                <div className="text-3xl mb-2">{option.icon}</div>
                <div className="font-medium">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg uppercase tracking-wider text-black">
            ¿Cuál es la capacidad de la mesa?
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {CAPACITY_OPTIONS.map((cap) => (
              <button
                key={cap}
                onClick={() => updateFormData("capacity", cap)}
                className={`p-4 rounded-lg border-2 transition-all text-center font-display text-lg ${
                  formData.capacity === cap
                    ? "border-black bg-black/5"
                    : "border-neutral-200 hover:border-neutral-400"
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              O personalizado:
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={formData.capacity ?? ""}
              onChange={(e) => updateFormData("capacity", parseInt(e.target.value) || null)}
              placeholder="Ej: 5"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg uppercase tracking-wider text-black">
            ¿Qué forma tiene la mesa?
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {SHAPE_OPTIONS.map((option) => (
              <TableShapePreview
                key={option.value}
                shape={option.value}
                label={option.label}
                isSelected={formData.shape === option.value}
                onClick={() => updateFormData("shape", option.value)}
              />
            ))}
          </div>
          <p className="text-sm text-neutral-500 text-center mt-2">
            {SHAPE_OPTIONS.find((o) => o.value === formData.shape)?.description}
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg uppercase tracking-wider text-black">
            Configuración de la mesa
          </h3>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Número de Mesa
            </label>
            <Input
              value={formData.tableNumber}
              onChange={(e) => updateFormData("tableNumber", e.target.value)}
              placeholder="Ej: M-1"
            />
            {suggestedNumber && !editTable && (
              <p className="mt-1 text-xs text-neutral-500">
                Sugerido: {suggestedNumber}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="accessible"
              checked={formData.isAccessible}
              onChange={(e) => updateFormData("isAccessible", e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <label htmlFor="accessible" className="text-sm text-neutral-700">
              Mesa accesible (♿)
            </label>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg uppercase tracking-wider text-black">
            Confirmar datos de la mesa
          </h3>
          <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-500">Ubicación:</span>
              <span className="font-medium">
                {LOCATION_OPTIONS.find((o) => o.value === formData.location)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Capacidad:</span>
              <span className="font-medium">{formData.capacity} personas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Forma:</span>
              <span className="font-medium">
                {SHAPE_OPTIONS.find((o) => o.value === formData.shape)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Número:</span>
              <span className="font-medium">{formData.tableNumber}</span>
            </div>
            {formData.isAccessible && (
              <div className="flex justify-between">
                <span className="text-neutral-500">Accesibilidad:</span>
                <span className="font-medium">Sí ♿</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
