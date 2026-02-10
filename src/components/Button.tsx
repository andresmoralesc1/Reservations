import { cn } from "@/lib/utils"
import { forwardRef, ButtonHTMLAttributes } from "react"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  fullWidth?: boolean
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-display uppercase tracking-wider",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "active:scale-95",
          // Touch targets minimum 44x44px
          "min-h-[44px] sm:min-h-[48px]",
          {
            "primary": "bg-black text-white hover:bg-neutral-800 focus:ring-black",
            "secondary": "bg-white text-black border-2 border-black hover:bg-neutral-100 focus:ring-black",
            "outline": "bg-transparent text-black border-2 border-black hover:bg-black hover:text-white focus:ring-black",
            "ghost": "bg-transparent text-black hover:bg-black/5 focus:ring-black",
            "danger": "bg-posit-red text-white hover:bg-red-700 focus:ring-posit-red",
          }[variant],
          {
            "sm": "px-4 py-2 text-xs sm:text-sm",
            "md": "px-6 py-3 text-sm sm:text-base",
            "lg": "px-8 py-4 text-base sm:text-lg",
          }[size],
          fullWidth && "w-full",
          loading && "cursor-wait",
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button }
