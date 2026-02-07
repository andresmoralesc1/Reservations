"use client"

import { Modal } from "@/components/Modal"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/Button"

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
  } | null
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

  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
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
        <Button variant="ghost" size="md" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Header with code and status */}
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-2xl uppercase tracking-wider text-black">
              {reservation.reservationCode}
            </div>
            {reservation.restaurant && (
              <div className="text-sm text-neutral-500 mt-1">
                {reservation.restaurant.name}
              </div>
            )}
          </div>
          <StatusBadge status={reservation.status} />
        </div>

        {/* Customer Info */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-3">
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
                  className="text-black hover:text-posit-red transition-colors"
                >
                  {reservation.customerPhone}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Reservation Info */}
        <div className="bg-neutral-50 rounded-lg p-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-3">
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
        {reservation.tableIds && reservation.tableIds.length > 0 && (
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500 mb-3">
              Mesas Asignadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {reservation.tableIds.map((tableId) => (
                <span
                  key={tableId}
                  className="px-3 py-1 bg-white border border-neutral-200 rounded-full text-sm"
                >
                  {tableId.slice(0, 8)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Special Requests */}
        {reservation.specialRequests && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-amber-700 mb-2">
              Solicitudes Especiales
            </h3>
            <p className="text-sm text-amber-900">{reservation.specialRequests}</p>
          </div>
        )}

        {/* Complex Case Warning */}
        {reservation.isComplexCase && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm font-medium text-red-700">
                Caso complejo - Requiere atención especial
              </span>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-neutral-400 space-y-1">
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
