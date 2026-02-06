"use client"

import { useEffect, useState, useCallback } from "react"
import { KPICard } from "@/components/KPICard"
import { FilterTabs } from "@/components/FilterTabs"
import { ReservationTable } from "@/components/ReservationTable"
import { SearchBar } from "@/components/SearchBar"
import { Pagination } from "@/components/Pagination"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { EmptyReservations } from "@/components/EmptyState"
import { toast } from "@/components/Toast"
import { HourlyBarChart } from "@/components/admin/HourlyBarChart"
import { StatusDonutChart } from "@/components/admin/StatusDonutChart"
import { BulkActionsBar } from "@/components/admin/BulkActionsBar"
import { ReservationDetailsModal } from "@/components/admin/ReservationDetailsModal"
import { Button } from "@/components/Button"

interface Reservation {
  id: string
  reservationCode: string
  customerName: string
  customerPhone: string
  reservationDate: string
  reservationTime: string
  partySize: number
  status: string
  source: string
  specialRequests?: string
  isComplexCase?: boolean
  confirmedAt?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
  tableIds?: string[]
  restaurant?: {
    name: string
    phone: string
    address: string
  }
}

interface EnhancedStats {
  // Today's stats
  totalToday: number
  confirmedCount: number
  pendingCount: number
  cancelledCount: number
  noShowCount: number
  confirmationRate: number
  avgPartySize: number
  occupancyRate: number
  totalCovers: number

  // Queue stats
  totalPending: number
  expiredSessions: number
  nextHourCount: number

  // Restaurant info
  totalTables: number
  totalCapacity: number
}

type FilterValue = "all" | "pending" | "confirmed" | "cancelled"

const filterOptions: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "cancelled", label: "Canceladas" },
]

// TODO: Get from environment or auth
const RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState<EnhancedStats>({
    totalToday: 0,
    confirmedCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    noShowCount: 0,
    confirmationRate: 0,
    avgPartySize: 0,
    occupancyRate: 0,
    totalCovers: 0,
    totalPending: 0,
    expiredSessions: 0,
    nextHourCount: 0,
    totalTables: 0,
    totalCapacity: 0,
  })
  const [chartData, setChartData] = useState<{
    hourly: { data: unknown[]; maxCount: number }
    statusDistribution: {
      data: { PENDIENTE: number; CONFIRMADO: number; CANCELADO: number; NO_SHOW: number }
      total: number
      percentages: { PENDIENTE: number; CONFIRMADO: number; CANCELADO: number; NO_SHOW: number }
    }
  } | null>(null)

  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    reservation: Reservation | null
    action: "approve" | "reject" | null
  }>({
    isOpen: false,
    reservation: null,
    action: null,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [detailsReservation, setDetailsReservation] = useState<Reservation | null>(null)

  const itemsPerPage = 10

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Load stats
      const dateParam = dateFilter || new Date().toISOString().split("T")[0]
      const statsResponse = await fetch(
        `/api/admin/dashboard/stats?restaurantId=${RESTAURANT_ID}&date=${dateParam}`
      )
      const statsData = await statsResponse.json()
      setStats(statsData)

      // Load chart data
      const chartResponse = await fetch(
        `/api/admin/dashboard/chart-data?restaurantId=${RESTAURANT_ID}&date=${dateParam}`
      )
      const chartDataResult = await chartResponse.json()
      setChartData(chartDataResult)

      // Load reservations
      const params = new URLSearchParams()
      params.set("restaurantId", RESTAURANT_ID)
      if (filter !== "all") {
        params.set("status", filter.toUpperCase())
      }
      if (dateFilter) {
        params.set("date", dateFilter)
      }

      const reservationsResponse = await fetch(`/api/admin/reservations?${params}`)
      const reservationsData = await reservationsResponse.json()

      setReservations(reservationsData.reservations || [])
      setFilteredReservations(reservationsData.reservations || [])
    } catch (error) {
      console.error("Error loading data:", error)
      toast("Error al cargar los datos", "error")
    } finally {
      setLoading(false)
    }
  }, [filter, dateFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    // Filter reservations based on search query
    if (searchQuery) {
      const filtered = reservations.filter((r) =>
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reservationCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.customerPhone.includes(searchQuery)
      )
      setFilteredReservations(filtered)
    } else {
      setFilteredReservations(reservations)
    }
    setCurrentPage(1)
  }, [searchQuery, reservations])

  useEffect(() => {
    setTotalPages(Math.ceil(filteredReservations.length / itemsPerPage))
  }, [filteredReservations])

  function handleApproveAction(reservation: Reservation) {
    setConfirmDialog({
      isOpen: true,
      reservation,
      action: "approve",
    })
  }

  function handleRejectAction(reservation: Reservation) {
    setConfirmDialog({
      isOpen: true,
      reservation,
      action: "reject",
    })
  }

  function handleApproveById(id: string) {
    const reservation = reservations.find((r) => r.id === id)
    if (reservation) {
      handleApproveAction(reservation)
    }
  }

  function handleRejectById(id: string) {
    const reservation = reservations.find((r) => r.id === id)
    if (reservation) {
      handleRejectAction(reservation)
    }
  }

  async function handleConfirmAction() {
    if (!confirmDialog.reservation || !confirmDialog.action) return

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
        toast(
          confirmDialog.action === "approve"
            ? "Reserva aprobada correctamente"
            : "Reserva rechazada",
          "success"
        )
        await loadData()
      } else {
        toast("Error al procesar la acción", "error")
      }
    } catch (error) {
      console.error("Error processing action:", error)
      toast("Error de conexión", "error")
    } finally {
      setIsProcessing(false)
      setConfirmDialog({ isOpen: false, reservation: null, action: null })
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function handleExportCSV() {
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
    ])

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
  }

  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wider text-black">
            Dashboard
          </h1>
          <p className="font-sans text-neutral-500 mt-1">
            Resumen de reservas y estadísticas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFilter("")
              loadData()
            }}
          >
            Hoy
          </Button>
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Total Hoy"
          value={stats.totalToday}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <KPICard
          title="Tasa Confirmación"
          value={`${stats.confirmationRate}%`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          title="Promedio Grupo"
          value={`${stats.avgPartySize} pax`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <KPICard
          title="Ocupación"
          value={`${stats.occupancyRate}%`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Pendientes Totales"
          value={stats.totalPending}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <KPICard
          title="Sesiones Expiradas"
          value={stats.expiredSessions}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KPICard
          title="Próxima Hora"
          value={stats.nextHourCount}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
        <KPICard
          title="Total Cubierto"
          value={`${stats.totalCovers} pax`}
          icon={
            <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      {chartData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <HourlyBarChart
              data={chartData.hourly.data as Array<{
                hour: number
                label: string
                count: number
                confirmed: number
                pending: number
                cancelled: number
                covers: number
              }>}
              maxCount={chartData.hourly.maxCount}
            />
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <StatusDonutChart
              data={chartData.statusDistribution.data}
              percentages={chartData.statusDistribution.percentages}
            />
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <FilterTabs
          options={filterOptions}
          value={filter}
          onChange={setFilter}
        />
        <div className="w-full sm:w-80">
          <SearchBar
            onSearch={setSearchQuery}
            placeholder="Buscar por nombre, código o teléfono..."
          />
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedIds={Array.from(selectedIds)}
        selectedCount={selectedIds.size}
        onApproveAll={() => {
          loadData()
          clearSelection()
        }}
        onRejectAll={() => {
          loadData()
          clearSelection()
        }}
        onClearSelection={clearSelection}
        onExportCSV={handleExportCSV}
      />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner text="Cargando reservas..." />
        </div>
      ) : paginatedReservations.length === 0 ? (
        <div className="bg-white border border-neutral-200">
          <EmptyReservations onRefresh={loadData} />
        </div>
      ) : (
        <>
          <ReservationTable
            reservations={paginatedReservations}
            onApprove={handleApproveById}
            onReject={handleRejectById}
            loading={loading}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onViewDetails={(id) => {
              const res = reservations.find((r) => r.id === id)
              if (res) setDetailsReservation(res)
            }}
          />
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, reservation: null, action: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.action === "approve"
            ? "Aprobar Reserva"
            : "Rechazar Reserva"
        }
        message={
          confirmDialog.action === "approve"
            ? `¿Estás seguro de que deseas aprobar la reserva de ${confirmDialog.reservation?.customerName}?`
            : `¿Estás seguro de que deseas rechazar la reserva de ${confirmDialog.reservation?.customerName}?`
        }
        confirmText={
          confirmDialog.action === "approve"
            ? "Aprobar"
            : "Rechazar"
        }
        variant={confirmDialog.action === "approve" ? "info" : "danger"}
        isConfirming={isProcessing}
      />

      {/* Details Modal */}
      <ReservationDetailsModal
        isOpen={detailsReservation !== null}
        onClose={() => setDetailsReservation(null)}
        reservation={detailsReservation}
      />
    </div>
  )
}
