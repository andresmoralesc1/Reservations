"use client"

import { useState } from "react"
import { Modal } from "@/components/Modal"
import { Button } from "@/components/Button"
import { toast } from "@/components/Toast"
import { TableShape, TableShapeType } from "./TableShape"

export interface Table {
  id: string
  restaurantId: string
  tableNumber: string
  capacity: number
  location: "patio" | "interior" | "terraza" | null
  isAccessible: boolean
  shape: string | null
  positionX: number
  positionY: number
  rotation: number
  width: number | null
  height: number | null
  diameter: number | null
  stoolCount: number | null
  stoolPositions: number[] | null
  createdAt: string
}

interface TableCardProps {
  table: Table
  hasReservations: boolean
  onEdit: (table: Table) => void
  onDelete: (tableId: string) => void
}

export function TableCard({ table, hasReservations, onEdit, onDelete }: TableCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const locationLabels: Record<string, string> = {
    patio: "Patio",
    interior: "Interior",
    terraza: "Terraza",
  }

  const locationColors: Record<string, string> = {
    patio: "bg-emerald-100 text-emerald-800",
    interior: "bg-amber-100 text-amber-800",
    terraza: "bg-blue-100 text-blue-800",
  }

  const getLocationLabel = (loc: string | null) => locationLabels[loc || ""] || "Sin ubicación"
  const getLocationColor = (loc: string | null) => locationColors[loc || ""] || "bg-gray-100 text-gray-800"

  async function handleDelete() {
    if (hasReservations) {
      toast("No se puede eliminar una mesa con reservas activas", "error")
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/tables/${table.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast("Mesa eliminada correctamente", "success")
        onDelete(table.id)
      } else {
        const data = await response.json()
        toast(data.error || "Error al eliminar mesa", "error")
      }
    } catch (error) {
      toast("Error de conexión", "error")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <div className="group relative bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg font-semibold uppercase tracking-wider text-black">
              {table.tableNumber}
            </h3>
            {table.isAccessible && (
              <span className="text-xs" title="Accesible">
                ♿
              </span>
            )}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLocationColor(table.location)}`}>
            {getLocationLabel(table.location)}
          </span>
        </div>

        {/* Table Shape Visual */}
        <div className="flex justify-center mb-3">
          <div className="scale-50 origin-center">
            <TableShape
              shape={(table.shape as TableShapeType) || "rectangular"}
              width={table.shape === "circular" ? 60 : table.shape === "cuadrada" ? 60 : table.shape === "barra" ? 100 : 90}
              height={table.shape === "circular" ? 60 : table.shape === "cuadrada" ? 60 : table.shape === "barra" ? 30 : 50}
              diameter={60}
              rotation={0}
              isSelected={false}
            />
          </div>
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-4 text-sm text-neutral-600">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{table.capacity} personas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs">Forma:</span>
            <span className="text-xs font-medium capitalize">{table.shape || "rectangular"}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(table)}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="flex-1"
            disabled={hasReservations || isDeleting}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>

        {hasReservations && (
          <div className="absolute top-2 right-2">
            <div
              className="h-2 w-2 rounded-full bg-emerald-500"
              title="Tiene reservas activas"
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Eliminar Mesa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </>
        }
      >
        <p className="text-neutral-600">
          ¿Estás seguro de que deseas eliminar la mesa <strong>{table.tableNumber}</strong>?
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </>
  )
}
