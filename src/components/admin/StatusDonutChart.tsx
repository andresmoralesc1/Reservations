import React from "react"

type StatusType = "PENDIENTE" | "CONFIRMADO" | "CANCELADO" | "NO_SHOW"

interface StatusDonutChartProps {
  data: {
    PENDIENTE: number
    CONFIRMADO: number
    CANCELADO: number
    NO_SHOW: number
  }
  percentages: {
    PENDIENTE: number
    CONFIRMADO: number
    CANCELADO: number
    NO_SHOW: number
  }
}

const STATUS_COLORS: Record<StatusType, string> = {
  PENDIENTE: "bg-amber-500",
  CONFIRMADO: "bg-emerald-500",
  CANCELADO: "bg-red-500",
  NO_SHOW: "bg-neutral-300",
}

const STATUS_LABELS: Record<StatusType, string> = {
  PENDIENTE: "Pendientes",
  CONFIRMADO: "Confirmadas",
  CANCELADO: "Canceladas",
  NO_SHOW: "No Show",
}

export function StatusDonutChart({ data, percentages }: StatusDonutChartProps) {
  const total = Object.values(data).reduce((sum, val) => sum + val, 0)

  // Calculate segments for CSS conic-gradient
  let currentAngle = 0
  const segments: string[] = []

  const statusOrder: StatusType[] = ["CONFIRMADO", "PENDIENTE", "CANCELADO", "NO_SHOW"]

  for (const status of statusOrder) {
    if (data[status] > 0) {
      const percentage = (data[status] / total) * 100
      const endAngle = currentAngle + percentage
      segments.push(`${STATUS_COLORS[status].replace("bg-", "")} ${currentAngle}% ${endAngle}%`)
      currentAngle = endAngle
    }
  }

  const gradientValue = segments.length > 0
    ? `conic-gradient(${segments.join(", ")})`
    : "conic-gradient(#e5e7eb 0% 100%)"

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
        Distribución de Estados
      </h3>

      <div className="flex items-center gap-6">
        {/* Donut chart */}
        <div className="relative">
          <div
            className="w-32 h-32 rounded-full"
            style={{ background: gradientValue }}
          >
            {/* Inner circle for donut effect */}
            <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-900">{total}</div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wide">
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {statusOrder.map((status) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
                <span className="text-sm text-neutral-600">{STATUS_LABELS[status]}</span>
              </div>
              <div className="text-sm font-medium text-neutral-900">
                {data[status]} <span className="text-neutral-400">({percentages[status]}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
