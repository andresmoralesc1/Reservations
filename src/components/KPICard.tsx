import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: number
    trend: "up" | "down" | "neutral"
  }
  icon?: ReactNode
  className?: string
}

export function KPICard({ title, value, change, icon, className }: KPICardProps) {
  return (
    <div className={cn("bg-white border border-neutral-200 p-6 rounded-lg hover:border-neutral-300 transition-all duration-200 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-display text-xs uppercase tracking-[0.1em] text-neutral-500">
            {title}
          </p>
          <p className="mt-2 font-display text-2xl sm:text-3xl text-black font-semibold">
            {value}
          </p>
          {change && (
            <div className="mt-3 flex items-center gap-1">
              {change.trend === "up" && (
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {change.trend === "down" && (
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {change.trend === "neutral" && (
                <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                </svg>
              )}
              <span className={cn(
                "font-sans text-sm",
                change.trend === "up" && "text-green-600",
                change.trend === "down" && "text-red-600",
                change.trend === "neutral" && "text-neutral-400"
              )}>
                {change.value > 0 ? "+" : ""}{change.value}%
              </span>
              <span className="font-sans text-xs text-neutral-400">vs mes anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
