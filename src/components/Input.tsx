import { cn } from "@/lib/utils"
import { forwardRef, InputHTMLAttributes } from "react"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, type = "text", ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-")

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block font-display text-xs uppercase tracking-wider text-black"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "w-full border bg-white px-4 py-3 font-sans text-sm text-black transition-colors",
            "placeholder:text-neutral-400",
            "focus:border-black focus:outline-none focus:ring-1 focus:ring-black",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
            error ? "border-posit-red" : "border-neutral-300",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 font-sans text-xs text-posit-red">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 font-sans text-xs text-neutral-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
