/**
 * Hook para cargar y gestionar reservas
 */

import { useState, useCallback, useEffect } from "react"
import type { Reservation, FilterValue } from "../types"

interface UseReservationsProps {
  restaurantId: string
  filter: FilterValue
  dateFilter: string
}

export function useReservations({ restaurantId, filter, dateFilter }: UseReservationsProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReservations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set("restaurantId", restaurantId)

      if (filter !== "all") {
        params.set("status", filter.toUpperCase())
      }

      if (dateFilter) {
        params.set("date", dateFilter)
      }

      const response = await fetch(`/api/admin/reservations?${params}`)

      if (!response.ok) {
        throw new Error("Error loading reservations")
      }

      const data = await response.json()
      setReservations(data.reservations || [])
    } catch (err) {
      console.error("Error loading reservations:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [restaurantId, filter, dateFilter])

  useEffect(() => {
    loadReservations()
  }, [loadReservations])

  return {
    reservations,
    loading,
    error,
    reload: loadReservations,
  }
}

/**
 * Hook para gestionar acciones sobre reservas (aprobar, rechazar, etc.)
 */
export function useReservationActions() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    reservation: Reservation | null
    action: "approve" | "reject" | null
  }>({
    isOpen: false,
    reservation: null,
    action: null,
  })

  const handleApprove = useCallback((reservation: Reservation) => {
    setConfirmDialog({
      isOpen: true,
      reservation,
      action: "approve",
    })
  }, [])

  const handleReject = useCallback((reservation: Reservation) => {
    setConfirmDialog({
      isOpen: true,
      reservation,
      action: "reject",
    })
  }, [])

  const handleConfirmAction = useCallback(async (): Promise<boolean> => {
    if (!confirmDialog.reservation || !confirmDialog.action) return false

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/reservations/${confirmDialog.reservation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: confirmDialog.action,
          reason: confirmDialog.action === "reject" ? "No disponible" : undefined,
        }),
      })

      if (response.ok) {
        return true
      }

      return false
    } catch (error) {
      console.error("Error processing action:", error)
      return false
    } finally {
      setIsProcessing(false)
      setConfirmDialog({ isOpen: false, reservation: null, action: null })
    }
  }, [confirmDialog])

  const closeDialog = useCallback(() => {
    setConfirmDialog({ isOpen: false, reservation: null, action: null })
  }, [])

  return {
    confirmDialog,
    isProcessing,
    handleApprove,
    handleReject,
    handleConfirmAction,
    closeDialog,
  }
}

/**
 * Hook para gestionar selección múltiple de reservas
 */
export function useReservationSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  return {
    selectedIds,
    toggleSelection,
    clearSelection,
    selectAll,
    isSelected,
    selectedCount: selectedIds.size,
  }
}
