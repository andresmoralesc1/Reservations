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
}

export function ReservationTable({ reservations, onApprove, onReject, loading }: ReservationTableProps) {
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
            <tr key={reservation.id} className="hover:bg-neutral-50 transition-colors">
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
                {reservation.status === "PENDIENTE" && (
                  <div className="flex justify-end gap-2">
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
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
