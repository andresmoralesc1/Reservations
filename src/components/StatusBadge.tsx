import { cn } from "@/lib/utils"

type Status = "PENDIENTE" | "CONFIRMADO" | "CANCELADO" | "NO_SHOW" | string

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PENDIENTE: { bg: "bg-amber-900", text: "text-amber-400", border: "border-amber-900", label: "Pendiente" },
  CONFIRMADO: { bg: "bg-green-900", text: "text-green-400", border: "border-green-900", label: "Confirmado" },
  CANCELADO: { bg: "bg-red-900", text: "text-red-400", border: "border-red-900", label: "Cancelado" },
  NO_SHOW: { bg: "bg-neutral-700", text: "text-neutral-300", border: "border-neutral-600", label: "No Show" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: "bg-neutral-700", text: "text-neutral-300", border: "border-neutral-600", label: status }

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-display uppercase tracking-wider border rounded-full bg-opacity-20 border-opacity-30",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {config.label}
    </span>
  )
}
