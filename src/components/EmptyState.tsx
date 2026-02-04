import { cn } from "@/lib/utils"
import { Button } from "./Button"
import { ReactNode } from "react"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center px-6 py-16 text-center",
      className
    )}>
      {icon && (
        <div className="mb-6 text-neutral-300">
          {icon}
        </div>
      )}
      <h3 className="font-display text-xl uppercase tracking-wider text-black">
        {title}
      </h3>
      {description && (
        <p className="mt-3 max-w-sm font-serif text-neutral-500">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-8">
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}

// Pre-configured empty states
export function EmptyReservations({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      }
      title="No hay reservas"
      description="No se encontraron reservas con los filtros aplicados."
      action={onRefresh ? { label: "Recargar", onClick: onRefresh } : undefined}
    />
  )
}

export function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="Sin resultados"
      description="No se encontraron resultados para tu búsqueda."
      action={{ label: "Limpiar filtros", onClick: onClear }}
    />
  )
}
