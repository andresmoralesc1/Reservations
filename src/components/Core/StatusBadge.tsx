/**
 * StatusBadge (Core Version) - Badge de estado mejorado
 *
 * Versión mejorada del componente StatusBadge con más opciones
 *
 * @example
 * <StatusBadge status="CONFIRMED" />
 * <StatusBadge status="custom" color="purple" />
 * <StatusBadge status="pending" variant="dot" />
 */

"use client"

import { cn } from "@/lib/utils"

export type StatusColor =
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "purple"
  | "gray"
  | "orange"
  | "pink"

export type StatusVariant = "filled" | "outline" | "dot" | "minimal"

const colorConfig = {
  green: {
    filled: { bg: "bg-green-100", text: "text-green-800", border: "" },
    outline: { bg: "bg-transparent", text: "text-green-700", border: "border border-green-200" },
    dot: { bg: "bg-green-100", text: "text-green-800", border: "", dot: "bg-green-500" },
    minimal: { bg: "", text: "text-green-700", border: "" },
  },
  red: {
    filled: { bg: "bg-red-100", text: "text-red-800", border: "" },
    outline: { bg: "bg-transparent", text: "text-red-700", border: "border border-red-200" },
    dot: { bg: "bg-red-100", text: "text-red-800", border: "", dot: "bg-red-500" },
    minimal: { bg: "", text: "text-red-700", border: "" },
  },
  yellow: {
    filled: { bg: "bg-amber-100", text: "text-amber-800", border: "" },
    outline: { bg: "bg-transparent", text: "text-amber-700", border: "border border-amber-200" },
    dot: { bg: "bg-amber-100", text: "text-amber-800", border: "", dot: "bg-amber-500" },
    minimal: { bg: "", text: "text-amber-700", border: "" },
  },
  blue: {
    filled: { bg: "bg-blue-100", text: "text-blue-800", border: "" },
    outline: { bg: "bg-transparent", text: "text-blue-700", border: "border border-blue-200" },
    dot: { bg: "bg-blue-100", text: "text-blue-800", border: "", dot: "bg-blue-500" },
    minimal: { bg: "", text: "text-blue-700", border: "" },
  },
  purple: {
    filled: { bg: "bg-purple-100", text: "text-purple-800", border: "" },
    outline: { bg: "bg-transparent", text: "text-purple-700", border: "border border-purple-200" },
    dot: { bg: "bg-purple-100", text: "text-purple-800", border: "", dot: "bg-purple-500" },
    minimal: { bg: "", text: "text-purple-700", border: "" },
  },
  gray: {
    filled: { bg: "bg-neutral-100", text: "text-neutral-800", border: "" },
    outline: { bg: "bg-transparent", text: "text-neutral-700", border: "border border-neutral-300" },
    dot: { bg: "bg-neutral-100", text: "text-neutral-800", border: "", dot: "bg-neutral-500" },
    minimal: { bg: "", text: "text-neutral-600", border: "" },
  },
  orange: {
    filled: { bg: "bg-orange-100", text: "text-orange-800", border: "" },
    outline: { bg: "bg-transparent", text: "text-orange-700", border: "border border-orange-200" },
    dot: { bg: "bg-orange-100", text: "text-orange-800", border: "", dot: "bg-orange-500" },
    minimal: { bg: "", text: "text-orange-700", border: "" },
  },
  pink: {
    filled: { bg: "bg-pink-100", text: "text-pink-800", border: "" },
    outline: { bg: "bg-transparent", text: "text-pink-700", border: "border border-pink-200" },
    dot: { bg: "bg-pink-100", text: "text-pink-800", border: "", dot: "bg-pink-500" },
    minimal: { bg: "", text: "text-pink-700", border: "" },
  },
}

// Mapeo de estados comunes a colores
const statusToColor: Record<string, StatusColor> = {
  CONFIRMADO: "green",
  CONFIRMED: "green",
  PENDIENTE: "yellow",
  PENDING: "yellow",
  CANCELADO: "red",
  CANCELLED: "red",
  CANCELED: "red",
  NO_SHOW: "gray",
  "NO-SHOW": "gray",
  COMPLETED: "blue",
  COMPLETADO: "blue",
}

const statusLabels: Record<string, string> = {
  CONFIRMADO: "Confirmado",
  CONFIRMED: "Confirmed",
  PENDIENTE: "Pendiente",
  PENDING: "Pending",
  CANCELADO: "Cancelado",
  CANCELLED: "Cancelled",
  CANCELED: "Canceled",
  NO_SHOW: "No Show",
  "NO-SHOW": "No Show",
  COMPLETED: "Completado",
  COMPLETADO: "Completado",
}

export interface StatusBadgeProps {
  status: string
  color?: StatusColor
  variant?: StatusVariant
  label?: string
  size?: "sm" | "md" | "lg"
  className?: string
  uppercase?: boolean
}

export function StatusBadge({
  status,
  color,
  variant = "filled",
  label,
  size = "sm",
  className,
  uppercase = true,
}: StatusBadgeProps) {
  // Auto-detect color from status if not provided
  const detectedColor = color ?? statusToColor[status.toUpperCase()] ?? "gray"
  const config = colorConfig[detectedColor][variant]

  const displayLabel = label ?? statusLabels[status.toUpperCase()] ?? status

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  }

  if (variant === "dot") {
    const dotConfig = colorConfig[detectedColor].dot
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium",
          dotConfig.bg,
          dotConfig.text,
          sizeClasses[size],
          uppercase && "uppercase tracking-wider",
          className
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", dotConfig.dot)} />
        <span className="font-display">{displayLabel}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md font-medium",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        uppercase && "uppercase tracking-wider font-display",
        className
      )}
    >
      {displayLabel}
    </span>
  )
}
