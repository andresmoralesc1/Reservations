"use client"

import { useState } from "react"
import { Button } from "@/components/Button"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { toast } from "@/components/Toast"

interface BulkActionsBarProps {
  selectedIds: string[]
  selectedCount: number
  onApproveAll: () => void
  onRejectAll: () => void
  onClearSelection: () => void
  onExportCSV: () => void
}

export function BulkActionsBar({
  selectedIds,
  selectedCount,
  onApproveAll,
  onRejectAll,
  onClearSelection,
  onExportCSV,
}: BulkActionsBarProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    action: "approve" | "reject" | null
  }>({
    isOpen: false,
    action: null,
  })
  const [isProcessing, setIsProcessing] = useState(false)

  async function handleBulkApprove() {
    setConfirmDialog({ isOpen: false, action: null })
    setIsProcessing(true)
    try {
      const promises = selectedIds.map((id) =>
        fetch(`/api/admin/reservations/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "approve" }),
        })
      )

      await Promise.all(promises)
      toast(`${selectedCount} ${selectedCount === 1 ? "reserva aprobada" : "reservas aprobadas"}`, "success")
      onApproveAll()
    } catch (error) {
      toast("Error al aprobar reservas", "error")
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleBulkReject() {
    setConfirmDialog({ isOpen: false, action: null })
    setIsProcessing(true)
    try {
      const promises = selectedIds.map((id) =>
        fetch(`/api/admin/reservations/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", reason: "Rechazo en lote" }),
        })
      )

      await Promise.all(promises)
      toast(`${selectedCount} ${selectedCount === 1 ? "reserva rechazada" : "reservas rechazadas"}`, "success")
      onRejectAll()
    } catch (error) {
      toast("Error al rechazar reservas", "error")
    } finally {
      setIsProcessing(false)
    }
  }

  if (selectedCount === 0) return null

  return (
    <>
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-display text-sm uppercase tracking-wider">
            {selectedCount} {selectedCount === 1 ? "seleccionada" : "seleccionadas"}
          </span>
          <button
            onClick={onClearSelection}
            className="text-neutral-400 hover:text-white transition-colors text-sm"
          >
            Limpiar selección
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportCSV}
            className="bg-white text-black hover:bg-neutral-100"
          >
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDialog({ isOpen: true, action: "reject" })}
            disabled={isProcessing}
            className="border-white text-white hover:bg-white hover:text-black"
          >
            Rechazar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setConfirmDialog({ isOpen: true, action: "approve" })}
            disabled={isProcessing}
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            Aprobar
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={confirmDialog.action === "approve" ? handleBulkApprove : handleBulkReject}
        title={
          confirmDialog.action === "approve"
            ? "Aprobar Reservas"
            : "Rechazar Reservas"
        }
        message={
          confirmDialog.action === "approve"
            ? `¿Estás seguro de que deseas aprobar ${selectedCount} ${selectedCount === 1 ? "reserva" : "reservas"}?`
            : `¿Estás seguro de que deseas rechazar ${selectedCount} ${selectedCount === 1 ? "reserva" : "reservas"}?`
        }
        confirmText={confirmDialog.action === "approve" ? "Aprobar" : "Rechazar"}
        variant={confirmDialog.action === "approve" ? "info" : "danger"}
        isConfirming={isProcessing}
      />
    </>
  )
}
