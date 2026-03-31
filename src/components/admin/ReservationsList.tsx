/**
 * Componente de lista de reservas con paginación
 */

import { ReservationTable } from "@/components/ReservationTable"
import { Pagination } from "@/components/Pagination"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { EmptyReservations } from "@/components/EmptyState"
import type { Reservation } from "@/types/admin"

interface ReservationsListProps {
  reservations: Reservation[]
  paginatedReservations: Reservation[]
  loading: boolean
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onRefresh: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onNoShow?: (id: string) => void
  selectedIds: Set<string>
  onToggleSelection: (id: string) => void
  onViewDetails: (id: string) => void
}

export function ReservationsList({
  reservations,
  paginatedReservations,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
  onApprove,
  onReject,
  onNoShow,
  selectedIds,
  onToggleSelection,
  onViewDetails,
}: ReservationsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Cargando reservas..." />
      </div>
    )
  }

  if (paginatedReservations.length === 0) {
    return (
      <div className="bg-white border border-neutral-200">
        <EmptyReservations onRefresh={onRefresh} />
      </div>
    )
  }

  return (
    <>
      <ReservationTable
        reservations={paginatedReservations}
        onApprove={onApprove}
        onReject={onReject}
        onNoShow={onNoShow}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelection={onToggleSelection}
        onViewDetails={onViewDetails}
      />
      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </>
  )
}
