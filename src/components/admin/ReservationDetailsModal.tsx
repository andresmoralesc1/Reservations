"use client"

import { Modal } from "@/components/Modal"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/Button"

import type { Table } from "@/drizzle/schema"

interface ReservationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  reservation: {
    id: string
    reservationCode: string
    customerName: string
    customerPhone: string
    reservationDate: string
    reservationTime: string
    partySize: number
    status: string
    source: string
    specialRequests?: string | null
    isComplexCase?: boolean | null
    confirmedAt?: Date | null
    cancelledAt?: Date | null
    createdAt: Date | null
    updatedAt: Date | null
    tableIds?: string[] | null
    tables?: Table[]
    restaurant?: {
      name: string
      phone: string
      address: string
    }
  } | null
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onNoShow?: (id: string) => void
}

const SOURCE_LABELS: Record<string, string> = {
  IVR: "Teléfono",
  WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
  WEB: "Web",
}

export function ReservationDetailsModal({
  isOpen,
  onClose,
  reservation,
  onApprove,
  onReject,
  onNoShow,
}: ReservationDetailsModalProps) {
  if (!reservation) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":")
    return `${hours}:${minutes}`
  }

  const formatDateTime = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return "-"
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalles de Reserva"
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cerrar
          </Button>
          {reservation?.status === "PENDIENTE" && (
            <>
              {onApprove && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onApprove(reservation.id)}
                >
                  Aprobar
                </Button>
              )}
              {onReject && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => onReject(reservation.id)}
                >
                  Rechazar
                </Button>
              )}
            </>
          )}
          {reservation?.status === "CONFIRMADO" && onNoShow && (
            <Button
              variant="outline"
              size="md"
              onClick={() => onNoShow(reservation.id)}
              className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
            >
              Marcar No Show
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header with code and status */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-2xl uppercase tracking-[0.1em] text-black">
              {reservation.reservationCode}
            </div>
            {reservation.restaurant && (
              <div className="text-sm text-neutral-600 mt-1">
                {reservation.restaurant.name}
              </div>
            )}
          </div>
          <StatusBadge status={reservation.status} />
        </div>

        {/* Customer Info */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.05em] text-black mb-3">
            Cliente
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-neutral-400">Nombre</div>
              <div className="font-medium">{reservation.customerName}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Teléfono</div>
              <div className="font-medium">
                <a
                  href={`tel:${reservation.customerPhone}`}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {reservation.customerPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Reservation Info */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <h3 className="text-sm font-medium uppercase tracking-[0.05em] text-black mb-3">
            Reserva
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-neutral-400">Fecha</div>
              <div className="font-medium">{formatDate(reservation.reservationDate)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Hora</div>
              <div className="font-medium">{formatTime(reservation.reservationTime)}</div>
            </div>
            <div>
              <div className="text-xs text-neutral-400">Personas</div>
              <div className="font-medium">{reservation.partySize}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-neutral-400">Origen</div>
            <div className="font-medium">{SOURCE_LABELS[reservation.source] || reservation.source}</div>
          </div>
        </div>

        {/* Tables */}
        {reservation.tables && reservation.tables.length > 0 && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.05em] text-black mb-3">
              Mesas Asignadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {reservation.tables.map((table) => (
                <span
                  key={table.id}
                  className="px-3 py-1 bg-black border border-black rounded-full text-sm font-medium text-white"
                  title={`${table.location || ''} - ${table.capacity} pax`}
                >
                  {table.tableCode}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Special Requests */}
        {reservation.specialRequests && (
          <div className="bg-amber-900 bg-opacity-20 border border-amber-900 border-opacity-30 rounded-lg p-4">
            <h3 className="text-sm font-medium uppercase tracking-[0.05em] text-amber-400 mb-2">
              Solicitudes Especiales
            </h3>
            <p className="text-sm text-amber-200">{reservation.specialRequests}</p>
          </div>
        )}

        {/* Complex Case Warning */}
        {reservation.isComplexCase && (
          <div className="bg-red-900 bg-opacity-20 border border-red-900 border-opacity-30 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium text-red-400">
                Caso complejo - Requiere atención especial
              </span>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-neutral-500 space-y-1">
          <div>Creada: {formatDateTime(reservation.createdAt)}</div>
          <div>Actualizada: {formatDateTime(reservation.updatedAt)}</div>
          {reservation.confirmedAt && (
            <div>Confirmada: {formatDateTime(reservation.confirmedAt)}</div>
          )}
          {reservation.cancelledAt && (
            <div>Cancelada: {formatDateTime(reservation.cancelledAt)}</div>
          )}
        </div>
      </div>
    </Modal>
  )
}
