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
import { PageHeader, AdminStats, AdminCharts, FilterBar, ActionBar, ReservationsList } from "./components"
import { useAdminStats, useFilters, useReservations, useReservationActions, useReservationSelection } from "./hooks"
import type { Reservation, FilterValue } from "./types"

export default function AdminPage() {
  // State
  const [dateFilter, setDateFilter] = useState("")
  const [filter, setFilter] = useState<FilterValue>("all")

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
  const [detailsReservation, setDetailsReservation] = useState<Reservation | null>(null)
  const [createReservationModalOpen, setCreateReservationModalOpen] = useState(false)
  const [tableBlockModalOpen, setTableBlockModalOpen] = useState(false)

  // Hooks
  const { stats, chartData, loading: statsLoading, reload: reloadStats } = useAdminStats(
    "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    dateFilter
  )

  const { reservations, loading: reservationsLoading, reload: reloadReservations } = useReservations({
    restaurantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    filter,
    dateFilter,
  })

  const {
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
      const reservation = reservations.find((r: Reservation) => r.id === id)
      if (reservation) {
        handleApprove(reservation)
      }
    },
    [reservations, handleApprove]
  )

  const handleRejectById = useCallback(
    (id: string) => {
      const reservation = reservations.find((r: Reservation) => r.id === id)
      if (reservation) {
        handleReject(reservation)
      }
    },
    [reservations, handleReject]
  )

  const handleViewDetails = useCallback(
    (id: string) => {
      const res = reservations.find((r: Reservation) => r.id === id)
      if (res) setDetailsReservation(res)
    },
    [reservations]
  )

  const handleConfirmDialogAction = useCallback(async () => {
    const success = await handleConfirmAction()
    if (success) {
      toast(
        confirmDialog.action === "approve"
          ? "Reserva aprobada correctamente"
          : "Reserva rechazada",
        "success"
      )
      reloadReservations()
      reloadStats()
    } else {
      toast("Error al procesar la acción", "error")
    }
  }, [handleConfirmAction, confirmDialog.action, reloadReservations, reloadStats])

  const handleRefreshAll = useCallback(() => {
    reloadReservations()
    reloadStats()
  }, [reloadReservations, reloadStats])

  const handleExportCSV = useCallback(() => {
    const headers = ["Código", "Cliente", "Teléfono", "Fecha", "Hora", "Personas", "Estado", "Origen"]
    const rows = filteredReservations.map((r: Reservation) => [
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

  const handleFilterChange = useCallback((newFilter: string) => {
    setFilter(newFilter as FilterValue)
  }, [])

  // Loading combined
  const loading = statsLoading || reservationsLoading

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
