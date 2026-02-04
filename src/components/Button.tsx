import { cn } from "@/lib/utils"
import { forwardRef, ButtonHTMLAttributes } from "react"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-display uppercase tracking-wider transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "primary": "bg-black text-white hover:bg-neutral-800 active:bg-neutral-900",
            "secondary": "bg-white text-black border border-black hover:bg-neutral-100",
            "outline": "bg-transparent text-black border border-black hover:bg-black hover:text-white",
            "ghost": "bg-transparent text-black hover:bg-black/5",
            "danger": "bg-posit-red text-white hover:bg-posit-red-dark",
          }[variant],
          {
            "sm": "px-4 py-2 text-xs",
            "md": "px-6 py-3 text-sm",
            "lg": "px-8 py-4 text-base",
          }[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
