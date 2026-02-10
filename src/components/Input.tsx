import { cn } from "@/lib/utils"
import { forwardRef, InputHTMLAttributes } from "react"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, type = "text", required, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-")
    const descriptionId = `${inputId}-description`
    const hasDescription = error || helperText

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block font-display text-xs uppercase tracking-wider text-black"
          >
            {label}
            {required && <span className="text-posit-red ml-1" aria-label="requerido">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={!!error}
          aria-describedby={hasDescription ? descriptionId : undefined}
          aria-required={required}
          required={required}
          className={cn(
            "w-full border-2 bg-white px-4 py-3 font-sans text-sm text-black transition-all",
            "placeholder:text-neutral-400",
            "hover:border-neutral-400",
            "focus:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
            "min-h-[48px]", // Touch target minimum
            error
              ? "border-posit-red focus:ring-posit-red"
              : "border-neutral-300",
            className
          )}
          {...props}
        />
        {hasDescription && (
          <p
            id={descriptionId}
            className={cn(
              "mt-2 font-sans text-xs",
              error ? "text-posit-red" : "text-neutral-500"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
