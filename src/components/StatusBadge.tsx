import { cn } from "@/lib/utils"

type Status = "PENDIENTE" | "CONFIRMADO" | "CANCELADO" | "NO_SHOW" | string

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PENDIENTE: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", label: "Pendiente" },
  CONFIRMADO: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", label: "Confirmado" },
  CANCELADO: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200", label: "Cancelado" },
  NO_SHOW: { bg: "bg-neutral-100", text: "text-neutral-600", border: "border-neutral-200", label: "No Show" },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: "bg-neutral-100", text: "text-neutral-600", border: "border-neutral-200", label: status }

  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-display uppercase tracking-wider border rounded-full",
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
