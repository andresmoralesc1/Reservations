"use client"

import { useState } from "react"
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
      <div className="bg-[#D4A84B]/10 border border-[#D4A84B] px-6 py-4 flex items-center justify-between rounded-lg">
        <div className="flex items-center gap-4">
          <span className="font-display text-xs uppercase tracking-[0.15em] text-black">
            {selectedCount} {selectedCount === 1 ? "seleccionada" : "seleccionadas"}
          </span>
          <button
            onClick={onClearSelection}
            className="text-neutral-600 hover:text-black transition-colors text-sm"
          >
            Limpiar selección
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onExportCSV}
            className="px-4 py-2 bg-white border border-neutral-300 text-black rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => setConfirmDialog({ isOpen: true, action: "reject" })}
            disabled={isProcessing}
            className="px-4 py-2 bg-transparent border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rechazar
          </button>
          <button
            onClick={() => setConfirmDialog({ isOpen: true, action: "approve" })}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aprobar
          </button>
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
