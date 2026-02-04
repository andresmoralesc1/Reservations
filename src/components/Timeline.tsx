import { cn } from "@/lib/utils"

interface TimelineItem {
  id: string
  title: string
  description?: string
  time: string
  status?: "completed" | "current" | "pending"
}

interface TimelineProps {
  items: TimelineItem[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="relative flex gap-4">
          {/* Line */}
          {index < items.length - 1 && (
            <div className="absolute left-[11px] top-6 h-full w-0.5 bg-neutral-200" />
          )}

          {/* Dot */}
          <div
            className={cn(
              "relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2",
              item.status === "completed" && "border-green-600 bg-green-600",
              item.status === "current" && "border-black bg-white",
              item.status === "pending" && "border-neutral-300 bg-white"
            )}
          >
            {item.status === "completed" && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {item.status === "current" && (
              <div className="h-2 w-2 animate-pulse rounded-full bg-black" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-2">
            <div className="flex items-start justify-between">
              <div>
                <h4 className={cn(
                  "font-display text-sm uppercase tracking-wider",
                  item.status === "completed" && "text-neutral-500",
                  item.status === "current" && "text-black",
                  item.status === "pending" && "text-neutral-400"
                )}>
                  {item.title}
                </h4>
                {item.description && (
                  <p className="mt-1 font-serif text-sm text-neutral-600">
                    {item.description}
                  </p>
                )}
              </div>
              <span className="font-sans text-xs text-neutral-500">
                {item.time}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Reservation status timeline component
export function ReservationTimeline({ status }: { status: string }) {
  const timelineItems: TimelineItem[] = [
    {
      id: "1",
      title: "Solicitud creada",
      description: "El cliente inició una reserva",
      time: "Inicial",
      status: "completed",
    },
    {
      id: "2",
      title: "Confirmación pendiente",
      description: "Esperando aprobación del restaurante",
      time: "Proceso",
      status: status === "PENDIENTE" ? "current" : status === "CONFIRMADO" || status === "CANCELADO" ? "completed" : "pending",
    },
    {
      id: "3",
      title: status === "CONFIRMADO" ? "Reserva confirmada" : status === "CANCELADO" ? "Reserva cancelada" : "Confirmación",
      description: status === "CONFIRMADO"
        ? "La reserva ha sido confirmada"
        : status === "CANCELADO"
        ? "La reserva fue cancelada"
        : "El restaurante confirmará la reserva",
      time: "Final",
      status: status === "PENDIENTE" ? "pending" : "completed",
    },
  ]

  return <Timeline items={timelineItems} />
}
