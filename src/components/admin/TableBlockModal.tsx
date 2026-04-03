"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Select } from "@/components/Select"
import { toast } from "@/components/Toast"
import { XIcon, LockIcon } from "@/components/admin/Icons"
import { generateTableCode } from "@/lib/utils/tableUtils"
import type { Table } from "@/drizzle/schema"

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

const BLOCK_REASONS = [
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "evento_privado", label: "Evento Privado" },
  { value: "reservado", label: "Reservado" },
  { value: "otro", label: "Otro" },
]

interface TableBlock {
  id: string
  tableId: string
  blockDate: string
  startTime: string
  endTime: string
  reason: string
  notes: string | null
  table: Table
}

interface TableBlockModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TableBlockModal({ isOpen, onClose, onSuccess }: TableBlockModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingTables, setLoadingTables] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tables, setTables] = useState<Table[]>([])
  const [existingBlocks, setExistingBlocks] = useState<TableBlock[]>([])

  const [formData, setFormData] = useState({
    tableId: "",
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    notes: "",
  })

  useEffect(() => {
    if (isOpen) {
      loadTables()
      loadExistingBlocks()
    }
  }, [isOpen])

  async function loadTables() {
    setLoadingTables(true)
    try {
      const response = await fetch(`/api/admin/tables?restaurantId=${RESTAURANT_ID}`)
      if (response.ok) {
        const data = await response.json()
        setTables(data.tables || [])
      }
    } catch (error) {
      console.error("Error loading tables:", error)
    } finally {
      setLoadingTables(false)
    }
  }

  async function loadExistingBlocks() {
    try {
      const response = await fetch(`/api/admin/table-blocks?restaurantId=${RESTAURANT_ID}`)
      if (response.ok) {
        const data = await response.json()
        // Show only today's and future blocks
        const today = new Date().toISOString().split("T")[0]
        const futureBlocks = (data.blocks || []).filter(
          (b: TableBlock) => b.blockDate >= today
        )
        setExistingBlocks(futureBlocks)
      }
    } catch (error) {
      console.error("Error loading blocks:", error)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validate
    const newErrors: Record<string, string> = {}

    if (!formData.tableId) newErrors.tableId = "Selecciona una mesa"
    if (!formData.date) newErrors.date = "Selecciona una fecha"
    if (!formData.startTime) newErrors.startTime = "Selecciona hora inicio"
    if (!formData.endTime) newErrors.endTime = "Selecciona hora fin"
    if (!formData.reason) newErrors.reason = "Selecciona un motivo"

    // Validate time range
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "La hora fin debe ser posterior a la hora inicio"
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setLoading(true)
    try {
      const response = await fetch("/api/admin/table-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          restaurantId: RESTAURANT_ID,
        }),
      })

      if (response.ok) {
        toast("Mesa bloqueada correctamente", "success")
        onSuccess()
        onClose()
        // Reset form
        setFormData({
          tableId: "",
          date: "",
          startTime: "",
          endTime: "",
          reason: "",
          notes: "",
        })
      } else {
        const error = await response.json()
        toast(error.error || "Error al bloquear la mesa", "error")
      }
    } catch (error) {
      toast("Error de conexión. Inténtalo de nuevo.", "error")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteBlock(blockId: string) {
    if (!confirm("¿Estás seguro de que deseas desbloquear esta mesa?")) return

    try {
      const response = await fetch(`/api/admin/table-blocks/${blockId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast("Mesa desbloqueada correctamente", "success")
        loadExistingBlocks()
        onSuccess()
      } else {
        toast("Error al desbloquear la mesa", "error")
      }
    } catch (error) {
      toast("Error de conexión", "error")
    }
  }

  if (!isOpen) return null

  const today = new Date().toISOString().split("T")[0]
  const tableOptions = tables.map((t) => ({
    value: t.id,
    label: `Mesa ${t.tableNumber} (${t.capacity} pax${t.location ? ` - ${t.location}` : ""})`,
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 shrink-0">
          <div>
            <h2 className="font-display text-xl uppercase tracking-wider text-black">
              Bloquear Mesas
            </h2>
            <p className="font-sans text-sm text-neutral-500 mt-1">
              Deshabilitar mesas temporalmente
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Existing Blocks */}
          {existingBlocks.length > 0 && (
            <div className="mb-6">
              <h3 className="font-sans text-sm font-semibold text-neutral-700 mb-3">
                Bloqueos Activos
              </h3>
              <div className="space-y-2">
                {existingBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-sans text-sm font-medium text-red-900">
                          Mesa {generateTableCode(block.table.location, block.table.tableNumber)}
                        </span>
                        <span className="font-sans text-xs text-red-600">
                          {block.reason.replace("_", " ")}
                        </span>
                      </div>
                      <div className="font-sans text-xs text-red-700 mt-1">
                        {block.blockDate} • {block.startTime} - {block.endTime}
                      </div>
                      {block.notes && (
                        <div className="font-sans text-xs text-red-600 mt-1">
                          {block.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    >
                      Desbloquear
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Block Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="font-sans text-sm font-semibold text-neutral-700 mb-3">
              Nuevo Bloqueo
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Mesa"
                options={tableOptions}
                value={formData.tableId}
                onChange={(e) => handleInputChange("tableId", e.target.value)}
                error={errors.tableId}
                disabled={loadingTables}
                required
              />

              <Input
                label="Fecha"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                min={today}
                error={errors.date}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Hora inicio"
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                error={errors.startTime}
                required
              />

              <Input
                label="Hora fin"
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                error={errors.endTime}
                required
              />
            </div>

            <Select
              label="Motivo"
              options={BLOCK_REASONS}
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              error={errors.reason}
              required
            />

            <Input
              label="Notas adicionales (opcional)"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Detalles adicionales..."
            />

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
                className="flex-1"
              >
                {loading ? "Bloqueando..." : "Bloquear Mesa"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
