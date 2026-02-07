"use client"

import { TableCard, Table } from "./TableCard"

interface TableGridProps {
  tables: Table[]
  occupiedTableIds: Set<string>
  onEdit: (table: Table) => void
  onDelete: (tableId: string) => void
}

export function TableGrid({ tables, occupiedTableIds, onEdit, onDelete }: TableGridProps) {
  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-16 w-16 text-neutral-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
        <h3 className="mt-4 font-display text-lg uppercase tracking-wider text-neutral-500">
          No hay mesas en esta ubicación
        </h3>
        <p className="mt-2 font-sans text-sm text-neutral-400">
          Agrega una nueva mesa para comenzar
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {tables.map((table) => (
        <TableCard
          key={table.id}
          table={table}
          hasReservations={occupiedTableIds.has(table.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
