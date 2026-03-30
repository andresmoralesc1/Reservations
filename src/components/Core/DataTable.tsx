/**
 * DataTable - Tabla genérica reutilizable
 *
 * @example
 * <DataTable
 *   data={users}
 *   columns={[
 *     { key: 'name', label: 'Nombre', sortable: true },
 *     { key: 'email', label: 'Email' },
 *     { key: 'status', label: 'Estado', render: (row) => <StatusBadge status={row.status} /> }
 *   ]}
 *   onSort={(key, dir) => console.log(key, dir)}
 * />
 */

"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T, index: number) => React.ReactNode
  className?: string
  headerClassName?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyField?: string
  sortable?: boolean
  onRowClick?: (row: T, index: number) => void
  onSort?: (key: string, direction: "asc" | "desc") => void
  emptyMessage?: string
  emptyState?: React.ReactNode
  loading?: boolean
  loadingRows?: number
  className?: string
  rowClassName?: string | ((row: T, index: number) => string)
  selectable?: boolean
  selectedIds?: Set<string | number>
  onSelectionChange?: (selectedIds: Set<string | number>) => void
  stickyHeader?: boolean
  striped?: boolean
  hoverable?: boolean
  compact?: boolean
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyField = "id",
  sortable = true,
  onRowClick,
  onSort,
  emptyMessage = "No hay datos para mostrar",
  emptyState,
  loading = false,
  loadingRows = 5,
  className,
  rowClassName,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  stickyHeader = true,
  striped = true,
  hoverable = true,
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (aValue === bValue) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      const comparison = String(aValue).localeCompare(String(bValue))
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection])

  const handleSort = (key: string) => {
    if (!sortable) return

    const column = columns.find((col) => col.key === key)
    if (!column?.sortable) return

    const newDirection = sortKey === key && sortDirection === "asc" ? "desc" : "asc"
    setSortKey(key)
    setSortDirection(newDirection)
    onSort?.(key, newDirection)
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return

    const newSelection = checked
      ? new Set<string | number>(data.map((row) => String(row[keyField] ?? row.id)))
      : new Set<string | number>()

    onSelectionChange(newSelection)
  }

  const handleSelectRow = (id: string | number, checked: boolean) => {
    if (!onSelectionChange) return

    const newSelection = new Set(selectedIds)
    if (checked) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    onSelectionChange(newSelection)
  }

  const isAllSelected =
    data.length > 0 && data.every((row) => selectedIds.has(String(row[keyField] ?? row.id)))
  const isSomeSelected = data.some((row) => selectedIds.has(String(row[keyField] ?? row.id)))

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <table className="w-full">
          <thead className={cn("bg-neutral-100", stickyHeader && "sticky top-0 z-10")}>
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <div className="h-4 w-4 animate-pulse bg-neutral-200 rounded" />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-neutral-500",
                    col.headerClassName
                  )}
                >
                  <div className="h-4 w-24 animate-pulse bg-neutral-200 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className={cn("border-b border-neutral-100", striped && i % 2 === 0 && "bg-neutral-50")}>
                {selectable && (
                  <td className="px-4 py-3">
                    <div className="h-4 w-4 animate-pulse bg-neutral-200 rounded" />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", compact ? "text-sm" : "")}>
                    <div className="h-4 animate-pulse bg-neutral-200 rounded max-w-[150px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn("w-full text-center py-12", className)}>
        {emptyState || (
          <div className="text-neutral-400">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="font-serif text-lg">{emptyMessage}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full">
        <thead className={cn("bg-neutral-100 border-b border-neutral-200", stickyHeader && "sticky top-0 z-10")}>
          <tr>
            {selectable && (
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected && !isAllSelected
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={cn(
                  "px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-neutral-500",
                  col.sortable && sortable && "cursor-pointer hover:text-neutral-700 select-none",
                  col.headerClassName
                )}
              >
                <div className="flex items-center gap-2">
                  {col.label}
                  {sortable && col.sortable && (
                    <span className="flex flex-col">
                      <svg
                        className={cn(
                          "h-3 w-3 -mb-1.5 transition-colors",
                          sortKey === col.key && sortDirection === "asc"
                            ? "text-black"
                            : "text-neutral-300"
                        )}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" />
                      </svg>
                      <svg
                        className={cn(
                          "h-3 w-3 -mt-1.5 transition-colors",
                          sortKey === col.key && sortDirection === "desc"
                            ? "text-black"
                            : "text-neutral-300"
                        )}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" />
                      </svg>
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => {
            const rowId = String(row[keyField] ?? row.id ?? rowIndex)
            const isSelected = selectedIds.has(rowId)

            return (
              <tr
                key={rowId}
                onClick={() => onRowClick?.(row, rowIndex)}
                className={cn(
                  "border-b border-neutral-100 transition-colors",
                  striped && rowIndex % 2 === 0 && "bg-neutral-50",
                  hoverable && onRowClick && "cursor-pointer hover:bg-neutral-100",
                  isSelected && "bg-blue-50",
                  typeof rowClassName === "function" ? rowClassName(row, rowIndex) : rowClassName
                )}
              >
                {selectable && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-sm text-neutral-700",
                      compact && "py-2",
                      col.className
                    )}
                  >
                    {col.render ? col.render(row, rowIndex) : String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
