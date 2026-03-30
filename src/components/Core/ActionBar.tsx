/**
 * ActionBar - Barra de acciones para elementos seleccionados
 *
 * @example
 * <ActionBar
 *   selectedCount={3}
 *   onClearSelection={() => setSelectedIds(new Set())}
 *   actions={[
 *     { label: 'Aprobar', onClick: handleApprove, variant: 'primary' },
 *     { label: 'Rechazar', onClick: handleReject, variant: 'danger' },
 *   ]}
 * />
 */

"use client"

import { Button } from "@/components/Button"
import { cn } from "@/lib/utils"

export interface Action {
  label: string
  onClick: () => void
  variant?: "primary" | "secondary" | "danger" | "ghost"
  icon?: React.ReactNode
  disabled?: boolean
  loading?: boolean
}

export interface ActionBarProps {
  selectedCount: number
  onClearSelection: () => void
  actions: Action[]
  className?: string
  message?: string
}

export function ActionBar({
  selectedCount,
  onClearSelection,
  actions,
  className,
  message,
}: ActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-4 shadow-lg md:relative md:bottom-auto md:shadow-none",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm">
            {message || `${selectedCount} elemento${selectedCount > 1 ? "s" : ""} seleccionado${selectedCount > 1 ? "s" : ""}`}
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-neutral-500 hover:text-neutral-700 underline"
          >
            Limpiar selección
          </button>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "secondary"}
              size={action.variant === "primary" ? "md" : "sm"}
              onClick={action.onClick}
              disabled={action.disabled}
              loading={action.loading}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
