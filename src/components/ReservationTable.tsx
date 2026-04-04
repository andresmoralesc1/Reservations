"use client"

import { cn } from "@/lib/utils"
import { StatusBadge } from "./StatusBadge"
import { CustomerRiskBadge } from "./admin/CustomerRiskBadge"
import type { Table, Reservation } from "@/drizzle/schema"

type ReservationWithTables = Reservation & {
  tables?: Table[]
  customerNoShowCount?: number
}

interface ReservationTableProps {
  reservations: ReservationWithTables[]
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onNoShow?: (id: string) => void
  loading?: boolean
  selectedIds?: Set<string>
  onToggleSelection?: (id: string) => void
  onViewDetails?: (id: string) => void
}

export function ReservationTable({
  reservations,
  onApprove,
  onReject,
  onNoShow,
  loading,
  selectedIds = new Set(),
  onToggleSelection,
  onViewDetails,
}: ReservationTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#1a1a1a] border border-[#333333] rounded-lg">
        <div className="h-8 w-8 animate-spin border-2 border-[#D4A84B] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-[#1a1a1a] p-12 text-center border border-[#333333] rounded-lg">
        <p className="font-serif text-[#A0A0A0]">No hay reservas para mostrar</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-[#1a1a1a] border border-[#333333] rounded-lg">
      <table className="min-w-full">
        <thead className="border-b border-[#333333] bg-[#2a2a2a]">
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
                  className="h-4 w-4 rounded border-[#333333] bg-[#2a2a2a] text-[#D4A84B] focus:ring-[#D4A84B] focus:ring-offset-0"
                />
              </th>
            )}
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-[0.1em] text-[#D4A84B]">
              Código
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-[0.1em] text-[#D4A84B]">
              Cliente
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-[0.1em] text-[#D4A84B]">
              Fecha/Hora
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-[0.1em] text-[#D4A84B]">
              Personas
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-[0.1em] text-[#D4A84B]">
              Mesas
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-[0.1em] text-[#D4A84B]">
              Estado
            </th>
            <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-[0.1em] text-[#D4A84B]">
              Origen
            </th>
            <th className="px-6 py-4 text-right font-display text-xs uppercase tracking-[0.1em] text-[#D4A84B]">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#333333]">
          {reservations.map((reservation) => (
            <tr
              key={reservation.id}
              className={cn(
                "hover:bg-[#2a2a2a] transition-colors",
                selectedIds.has(reservation.id) && "bg-[#D4A84B] bg-opacity-10"
              )}
            >
              {onToggleSelection && (
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(reservation.id)}
                    onChange={() => onToggleSelection(reservation.id)}
                    className="h-4 w-4 rounded border-[#333333] bg-[#2a2a2a] text-[#D4A84B] focus:ring-[#D4A84B] focus:ring-offset-0"
                  />
                </td>
              )}
              <td className="whitespace-nowrap px-6 py-4">
                <span className="font-display text-sm text-white">{reservation.reservationCode}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="font-sans text-sm font-medium text-white">{reservation.customerName}</div>
                    <div className="font-sans text-xs text-[#666666]">{reservation.customerPhone}</div>
                  </div>
                  {reservation.customerNoShowCount && reservation.customerNoShowCount > 0 && (
                    <CustomerRiskBadge noShowCount={reservation.customerNoShowCount} />
                  )}
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-sans text-sm text-[#A0A0A0]">
                {reservation.reservationDate} - {reservation.reservationTime}
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-sans text-sm text-white text-center">
                {reservation.partySize}
              </td>
              <td className="px-6 py-4">
                {reservation.tables && reservation.tables.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {reservation.tables.map((table) => (
                      <span
                        key={table.id}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-[#2a2a2a] border border-[#333333] text-xs font-medium text-[#D4A84B]"
                        title={`${table.location || ''} - ${table.capacity} pax`}
                      >
                        {table.tableCode}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-sans text-xs text-[#666666]">Sin asignar</span>
                )}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <StatusBadge status={reservation.status} />
              </td>
              <td className="whitespace-nowrap px-6 py-4 font-sans text-xs text-[#666666] uppercase">
                {reservation.source}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(reservation.id)}
                      className="p-1.5 rounded-lg hover:bg-[#2a2a2a] text-[#A0A0A0] hover:text-white transition-colors"
                      title="Ver detalles"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                  {reservation.status === "PENDIENTE" && (
                    <>
                      <button
                        onClick={() => onApprove?.(reservation.id)}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => onReject?.(reservation.id)}
                        className="px-3 py-1.5 bg-transparent border border-red-900 border-opacity-50 text-red-400 text-xs font-medium rounded-lg hover:bg-red-900 hover:bg-opacity-10 transition-colors"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  {reservation.status === "CONFIRMADO" && onNoShow && (
                    <button
                      onClick={() => onNoShow(reservation.id)}
                      className="px-3 py-1.5 bg-transparent border border-orange-900 border-opacity-50 text-orange-400 text-xs font-medium rounded-lg hover:bg-orange-900 hover:bg-opacity-10 transition-colors"
                    >
                      No Show
                    </button>
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
