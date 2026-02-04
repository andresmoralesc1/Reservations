import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "promo" | "success" | "warning" | "error"
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-display uppercase tracking-wider",
        {
          "default": "bg-black text-white",
          "promo": "bg-posit-red text-white",
          "success": "bg-green-700 text-white",
          "warning": "bg-amber-500 text-black",
          "error": "bg-red-600 text-white",
        }[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
