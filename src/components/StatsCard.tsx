import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface StatsCardProps {
  value: number | string
  label: string
  icon?: ReactNode
  className?: string
}

export function StatsCard({ value, label, icon, className }: StatsCardProps) {
  return (
    <div className={cn("bg-white p-6 border border-neutral-200", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-4xl text-black">{value}</p>
          <p className="mt-2 font-sans text-sm text-neutral-500 uppercase tracking-wide">{label}</p>
        </div>
        {icon && (
          <div className="text-neutral-300 text-2xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
