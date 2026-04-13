/**
 * Panel de Administración - Dashboard de Reservas
 * Página principal refactorizada con componentes y hooks modulares
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { format, addDays } from "date-fns"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { ReservationDetailsModal } from "@/components/admin/ReservationDetailsModal"
import { CreateReservationModal } from "@/components/admin/CreateReservationModal"
import { TableBlockModal } from "@/components/admin/TableBlockModal"
import { toast } from "@/components/Toast"
import { PageHeader, AdminStats, AdminCharts, FilterBar, ActionBar, ReservationsList } from "@/components/admin"
import { useAdminStats, useFilters, useReservations, useReservationActions, useReservationSelection, useRestaurantFilter } from "@/hooks/admin"
import type { Reservation, AdminReservation, FilterValue } from "@/types/admin"

export default function AdminPage() {
  // Restaurant filter from context
  const { selectedRestaurantId, isLoading: restaurantLoading } = useRestaurantFilter()

  // State - Start at today's date by default
  const [dateFilter, setDateFilter] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [timeFilter, setTimeFilter] = useState<string>("all")

  // Keyboard shortcuts for date navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const currentDate = dateFilter ? new Date(dateFilter + 'T00:00:00') : new Date()

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setDateFilter(format(addDays(currentDate, -1), 'yyyy-MM-dd'))
          break
        case 'ArrowRight':
          e.preventDefault()
          setDateFilter(format(addDays(currentDate, 1), 'yyyy-MM-dd'))
          break
        case 'h':
        case 'H':
          e.preventDefault()
          setDateFilter(format(new Date(), 'yyyy-MM-dd'))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dateFilter])
  const [detailsReservation, setDetailsReservation] = useState<AdminReservation | null>(null)
  const [createReservationModalOpen, setCreateReservationModalOpen] = useState(false)
  const [tableBlockModalOpen, setTableBlockModalOpen] = useState(false)

  // Hooks - use selected restaurant ID from context
  const { stats, chartData, loading: statsLoading, reload: reloadStats } = useAdminStats(
    selectedRestaurantId || "",
    dateFilter
  )

  const { reservations, loading: reservationsLoading, reload: reloadReservations } = useReservations({
    restaurantId: selectedRestaurantId || "",
    dateFilter,
    timeFilter,
  })

  const {
    filter,
    setFilter,
    filteredReservations,
    paginatedReservations,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
  } = useFilters({ reservations, itemsPerPage: 10 })

  const { confirmDialog, isProcessing, handleApprove, handleReject, handleConfirmAction, closeDialog } =
    useReservationActions()

  const { selectedIds, toggleSelection, clearSelection, selectedCount } = useReservationSelection()

  // Handlers
  const handleApproveById = useCallback(
    (id: string) => {
      const reservation = reservations.find((r) => r.id === id)
      if (reservation) {
        handleApprove(reservation)
      }
    },
    [reservations, handleApprove]
  )

  const handleRejectById = useCallback(
    (id: string) => {
      const reservation = reservations.find((r) => r.id === id)
      if (reservation) {
        handleReject(reservation)
      }
    },
    [reservations, handleReject]
  )

  const handleNoShowById = useCallback(
    async (id: string) => {
      const reservation = reservations.find((r) => r.id === id)
      if (!reservation) return

      if (!confirm(`¿Marcar la reserva de ${reservation.customerName} como NO SHOW?\n\nEsto incrementará su contador de no-shows.`)) {
        return
      }

      try {
        const response = await fetch(`/api/admin/reservations/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "NO_SHOW" }),
        })

        if (response.ok) {
          toast("Reserva marcada como No Show", "success")
          reloadReservations()
          reloadStats()
        } else {
          const error = await response.json()
          toast(error.error || "Error al marcar No Show", "error")
        }
      } catch (error) {
        console.error("Error marking no-show:", error)
        toast("Error al marcar No Show", "error")
      }
    },
    [reservations, reloadReservations, reloadStats]
  )

  const handleViewDetails = useCallback(
    (id: string) => {
      const res = reservations.find((r) => r.id === id)
      if (res) setDetailsReservation(res)
    },
    [reservations]
  )

  const handleConfirmDialogAction = useCallback(async () => {
    const result = await handleConfirmAction()
    if (result?.success && result.action) {
      toast(
        result.action === "approve"
          ? "Reserva aprobada correctamente"
          : "Reserva rechazada",
        "success"
      )
      reloadReservations()
      reloadStats()
      // Cerrar modales después de acción exitosa
      closeDialog()
      setDetailsReservation(null)
    } else {
      toast("Error al procesar la acción", "error")
    }
  }, [handleConfirmAction, reloadReservations, reloadStats, closeDialog])

  const handleRefreshAll = useCallback(() => {
    reloadReservations()
    reloadStats()
  }, [reloadReservations, reloadStats])

  const handleExportCSV = useCallback(() => {
    const headers = ["Código", "Cliente", "Teléfono", "Fecha", "Hora", "Personas", "Estado", "Origen"]
    const rows = filteredReservations.map((r) => [
      r.reservationCode,
      r.customerName,
      r.customerPhone,
      r.reservationDate,
      r.reservationTime,
      r.partySize,
      r.status,
      r.source,
    ] as string[])

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reservas-${dateFilter || "hoy"}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast("CSV exportado correctamente", "success")
  }, [filteredReservations, dateFilter])

  const handleTodayClick = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    setDateFilter(today)
    handleRefreshAll()
  }, [handleRefreshAll])

  // Loading combined
  const loading = statsLoading || reservationsLoading || restaurantLoading

  // Show loading state while restaurant is being loaded
  if (restaurantLoading || !selectedRestaurantId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin border-2 border-black border-t-transparent rounded-full mb-4" />
          <p className="text-neutral-500">Cargando restaurante...</p>
        </div>
      </div>
    )
  }

  // After hooks are defined, create handler
  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter as FilterValue)
  }, [])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        onTodayClick={handleTodayClick}
      />

      {/* KPI Stats */}
      <AdminStats stats={stats} />

      {/* Charts */}
      <AdminCharts chartData={chartData} />

      {/* Filters */}
      <FilterBar
        filter={filter}
        onFilterChange={handleFilterChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        reservations={reservations}
      />

      {/* Action Bar */}
      <ActionBar
        selectedIds={Array.from(selectedIds)}
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        onApproveAll={handleRefreshAll}
        onRejectAll={handleRefreshAll}
        onExportCSV={handleExportCSV}
        onCreateReservation={() => setCreateReservationModalOpen(true)}
        onBlockTables={() => setTableBlockModalOpen(true)}
      />

      {/* Reservations List */}
      <ReservationsList
        reservations={reservations}
        paginatedReservations={paginatedReservations}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRefresh={handleRefreshAll}
        onApprove={handleApproveById}
        onReject={handleRejectById}
        onNoShow={handleNoShowById}
        selectedIds={selectedIds}
        onToggleSelection={toggleSelection}
        onViewDetails={handleViewDetails}
      />

      {/* Modals */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeDialog}
        onConfirm={handleConfirmDialogAction}
        title={confirmDialog.action === "approve" ? "Aprobar Reserva" : "Rechazar Reserva"}
        message={
          confirmDialog.action === "approve"
            ? `¿Estás seguro de que deseas aprobar la reserva de ${confirmDialog.reservation?.customerName}?`
            : `¿Estás seguro de que deseas rechazar la reserva de ${confirmDialog.reservation?.customerName}?`
        }
        confirmText={confirmDialog.action === "approve" ? "Aprobar" : "Rechazar"}
        variant={confirmDialog.action === "approve" ? "info" : "danger"}
        isConfirming={isProcessing}
      />

      <ReservationDetailsModal
        isOpen={detailsReservation !== null}
        onClose={() => setDetailsReservation(null)}
        reservation={detailsReservation}
        onApprove={handleApproveById}
        onReject={handleRejectById}
        onNoShow={handleNoShowById}
      />

      <CreateReservationModal
        isOpen={createReservationModalOpen}
        onClose={() => setCreateReservationModalOpen(false)}
        onSuccess={handleRefreshAll}
      />

      <TableBlockModal
        isOpen={tableBlockModalOpen}
        onClose={() => setTableBlockModalOpen(false)}
        onSuccess={handleRefreshAll}
      />
    </div>
  )
}
