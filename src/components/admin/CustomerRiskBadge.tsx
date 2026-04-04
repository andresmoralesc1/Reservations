/**
 * Badge que muestra el nivel de riesgo de un cliente basado en su historial de no-shows
 */

import { cn } from "@/lib/utils"

interface CustomerRiskBadgeProps {
  noShowCount: number
  compact?: boolean // Si es true, muestra solo el icono sin texto
}

export function CustomerRiskBadge({ noShowCount, compact = false }: CustomerRiskBadgeProps) {
  if (noShowCount === 0) {
    return null
  }

  // Niveles de riesgo
  const level = noShowCount >= 3 ? "high" : noShowCount >= 1 ? "medium" : "low"

  const config = {
    high: {
      bgColor: "bg-red-900",
      textColor: "text-red-400",
      borderColor: "border-red-900",
      icon: "🔴",
      label: "Reiterativo",
      description: `${noShowCount} no-shows`,
    },
    medium: {
      bgColor: "bg-amber-900",
      textColor: "text-amber-400",
      borderColor: "border-amber-900",
      icon: "🟡",
      label: "Precaución",
      description: `${noShowCount} no-show${noShowCount === 1 ? "" : "s"}`,
    },
    low: {
      bgColor: "bg-neutral-700",
      textColor: "text-neutral-300",
      borderColor: "border-neutral-600",
      icon: "⚠️",
      label: "Verificar",
      description: `${noShowCount} no-show`,
    },
  }

  const style = config[level]

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs",
          style.bgColor,
          style.textColor
        )}
        title={`${noShowCount} no-show${noShowCount === 1 ? "" : "s"} previos`}
      >
        {style.icon}
      </span>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium bg-opacity-20 border-opacity-30",
        style.bgColor,
        style.textColor,
        style.borderColor
      )}
      title={`Este cliente tiene ${noShowCount} no-show${noShowCount === 1 ? "" : "s"} en su historial`}
    >
      <span>{style.icon}</span>
      <span className="hidden sm:inline">{style.label}</span>
      <span className="hidden md:inline text-[10px] opacity-75">
        ({style.description})
      </span>
    </div>
  )
}
