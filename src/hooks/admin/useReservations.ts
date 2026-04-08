/**
 * Hook para cargar y gestionar reservas
 */

import { useState, useCallback, useEffect } from "react"
import type { Reservation, FilterValue } from "@/types/admin"

interface UseReservationsProps {
  restaurantId: string
  filter?: FilterValue // Optional - filtering is done client-side in useFilters
  dateFilter: string
  timeFilter?: string
}

export function useReservations({ restaurantId, filter, dateFilter, timeFilter }: UseReservationsProps) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReservations = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set("restaurantId", restaurantId)

      // Map filter values to database status (Spanish)
      const statusMap: Record<FilterValue, string | null> = {
        all: null,
        pending: "PENDIENTE",
        confirmed: "CONFIRMADO",
        cancelled: "CANCELADO",
        noShows: null, // Client-side filter, not a DB status
      }

      if (filter && filter !== "all") {
        params.set("status", statusMap[filter] || "")
      }

      if (dateFilter) {
        params.set("date", dateFilter)
      }

      const response = await fetch(`/api/admin/reservations?${params}`)

      if (!response.ok) {
        throw new Error("Error loading reservations")
      }

      const data = await response.json()
      let reservations = data.reservations || []

      // Client-side filtering by time/service
      if (timeFilter && timeFilter !== "all") {
        reservations = reservations.filter((r: Reservation) => {
          const hour = parseInt(r.reservationTime.split(':')[0])

          if (timeFilter === "comida") {
            // Comida: 13:00 - 15:59
            return hour >= 13 && hour < 16
          } else if (timeFilter === "cena") {
            // Cena: 19:00 - 23:00
            return hour >= 19 && hour < 24
          } else {
            // Specific time like "20:00"
            return r.reservationTime === timeFilter
          }
        })
      }

      setReservations(reservations)
    } catch (err) {
      console.error("Error loading reservations:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [restaurantId, filter, dateFilter, timeFilter])

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

  const handleConfirmAction = useCallback(async (): Promise<{ success: boolean; action: string | null }> => {
    if (!confirmDialog.reservation || !confirmDialog.action) {
      return { success: false, action: null }
    }

    const actionToProcess = confirmDialog.action
    const reservationId = confirmDialog.reservation.id

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionToProcess,
          reason: actionToProcess === "reject" ? "No disponible" : undefined,
        }),
      })

      const success = response.ok

      // Close dialog only after processing
      setConfirmDialog({ isOpen: false, reservation: null, action: null })

      return { success, action: actionToProcess }
    } catch (error) {
      console.error("Error processing action:", error)
      setConfirmDialog({ isOpen: false, reservation: null, action: null })
      return { success: false, action: actionToProcess }
    } finally {
      setIsProcessing(false)
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
