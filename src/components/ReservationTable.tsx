"use client"

import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { StatusBadge } from "./StatusBadge"

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

interface ReservationTableProps {
  reservations: Reservation[]
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  loading?: boolean
  selectedIds?: Set<string>
  onToggleSelection?: (id: string) => void
  onViewDetails?: (id: string) => void
}

export function ReservationTable({
  reservations,
  onApprove,
  onReject,
  loading,
  selectedIds = new Set(),
  onToggleSelection,
  onViewDetails,
}: ReservationTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-white">
        <div className="h-8 w-8 animate-spin border-2 border-black border-t-transparent" />
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-white p-12 text-center border border-neutral-200">
        <p className="font-serif text-neutral-500">No hay reservas para mostrar</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-white border border-neutral-200">
      <table className="min-w-full">
        <thead className="border-b border-neutral-200 bg-neutral-50">
          <tr>
            {onToggleSelection && (
              <th className="px-4 py-4 w-10">
                <input
                  type="checkbox"
                  checked={reservations.length > 0 && reservations.every((r) => selectedIds.has(r.id))}
                  onChange={(e) => {
                    if (e.target.checked) {
                      reservations.forEach((r) => selectedIds.add(r.id))
                    } else {
                      reservations.forEach((r) => selectedIds.delete(r.id))
                    }
                    // Force a re-render by cloning the Set
                    onToggleSelection(reservations[0].id)
                    if (!e.target.checked) {
                      onToggleSelection(reservations[0].id)
                    }
                  }}
                  className="h-4 w-4 rounded border-neutral-300"
                />
              </th>
            )}
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              Codigo
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              Cliente
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              Fecha/Hora
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              Personas
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              Estado
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-wider text-neutral-500">
              Origen
            </th>
            <th className="px-6 py-4 text-right font-display text-xs uppercase tracking-wider text-neutral-500">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {reservations.map((reservation) => (
            <tr
              key={reservation.id}
              className={cn(
                "hover:bg-neutral-50 transition-colors",
                selectedIds.has(reservation.id) && "bg-black/5"
              )}
            >
              {onToggleSelection && (
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(reservation.id)}
                    onChange={() => onToggleSelection(reservation.id)}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                </td>
              )}
              <td className="whitespace-nowrap px-6 py-4">
                <span className="font-display text-sm">{reservation.reservationCode}</span>
              </td>
              <td className="px-6 py-4">
                <div className="font-sans text-sm font-medium text-black">{reservation.customerName}</div>
                <div className="font-sans text-xs text-neutral-500">{reservation.customerPhone}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-sans text-sm">
                {reservation.reservationDate} - {reservation.reservationTime}
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-sans text-sm text-center">
                {reservation.partySize}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <StatusBadge status={reservation.status} />
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-sans text-xs text-neutral-500 uppercase">
                {reservation.source}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(reservation.id)}
                      className="px-3 py-1.5"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Button>
                  )}
                  {reservation.status === "PENDIENTE" && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onApprove?.(reservation.id)}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => onReject?.(reservation.id)}
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
