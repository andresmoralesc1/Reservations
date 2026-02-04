"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase-client"
import { Container } from "@/components/Container"
import { Button } from "@/components/Button"
import { KPICard } from "@/components/KPICard"
import { FilterTabs } from "@/components/FilterTabs"
import { ReservationTable } from "@/components/ReservationTable"
import { SearchBar } from "@/components/SearchBar"
import { Pagination } from "@/components/Pagination"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { PageLoader } from "@/components/LoadingSpinner"
import { EmptyReservations } from "@/components/EmptyState"
import { ActionDropdown } from "@/components/Dropdown"
import { toast } from "@/components/Toast"
import { DropdownOption } from "@/components/Dropdown"

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
}

interface Stats {
  totalPending: number
  todayPending: number
  expiredSessions: number
  nextHour: number
}

type FilterValue = "all" | "pending" | "confirmed" | "cancelled"

const filterOptions: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "cancelled", label: "Canceladas" },
]

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    todayPending: 0,
    expiredSessions: 0,
    nextHour: 0,
  })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
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

  const itemsPerPage = 10
  const supabase = createClient()

  useEffect(() => {
    loadReservations()
  }, [filter])

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
    // Calculate total pages
    setTotalPages(Math.ceil(filteredReservations.length / itemsPerPage))
  }, [filteredReservations])

  async function loadReservations() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== "all") {
        params.set("status", filter.toUpperCase())
      }

      const response = await fetch(`/api/admin/reservations?${params}`)
      const data = await response.json()

      setReservations(data.reservations || [])
      setFilteredReservations(data.reservations || [])
      setStats(data.meta || stats)
    } catch (error) {
      console.error("Error loading reservations:", error)
      toast("Error al cargar las reservas", "error")
    } finally {
      setLoading(false)
    }
  }

  function getActionItems(reservation: Reservation): DropdownOption[] {
    return [
      {
        value: "details",
        label: "Ver detalles",
        onClick: () => {
          // TODO: Open details modal
          toast(`Detalles: ${reservation.reservationCode}`, "info")
        },
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
      },
      {
        value: "approve",
        label: "Aprobar",
        onClick: () => handleApproveAction(reservation),
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      {
        value: "reject",
        label: "Rechazar",
        onClick: () => handleRejectAction(reservation),
        variant: "danger",
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ),
      },
    ]
  }

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

  // Wrappers for ReservationTable compatibility
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
        await loadReservations()
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

  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-cream">
      {/* Admin Header */}
      <header className="border-b border-neutral-200 bg-white">
        <Container size="xl">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-display text-xl uppercase tracking-widest text-black hover:text-posit-red transition-colors">
                El Posit
              </Link>
              <h1 className="font-display text-2xl uppercase tracking-wider">
                Panel Admin
              </h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => supabase.auth.signOut()}
            >
              Cerrar Sesion
            </Button>
          </div>
        </Container>
      </header>

      <main className="py-8">
        <Container size="xl">
          {/* KPI Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Pendientes Totales"
              value={stats.totalPending}
              change={{ value: 12, trend: "up" }}
              icon={
                <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <KPICard
              title="Pendientes Hoy"
              value={stats.todayPending}
              change={{ value: 8, trend: "up" }}
              icon={
                <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <KPICard
              title="Sesiones Expiradas"
              value={stats.expiredSessions}
              change={{ value: -5, trend: "down" }}
              icon={
                <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <KPICard
              title="Próxima Hora"
              value={stats.nextHour}
              icon={
                <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              }
            />
          </div>

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

          {/* Content */}
          {loading ? (
            <PageLoader text="Cargando reservas..." />
          ) : paginatedReservations.length === 0 ? (
            <div className="bg-white border border-neutral-200">
              <EmptyReservations onRefresh={loadReservations} />
            </div>
          ) : (
            <>
              <ReservationTable
                reservations={paginatedReservations}
                onApprove={handleApproveById}
                onReject={handleRejectById}
                loading={loading}
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
        </Container>
      </main>

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

      {/* Admin Footer */}
      <footer className="border-t border-neutral-200 bg-white py-6 mt-auto">
        <Container size="xl">
          <div className="flex items-center justify-between">
            <p className="font-sans text-xs text-neutral-500">
              Panel de Administracion - El Posit
            </p>
            <Link href="/" className="font-sans text-xs text-neutral-500 hover:text-black transition-colors">
              Volver al inicio
            </Link>
          </div>
        </Container>
      </footer>
    </div>
  )
}
