import { cn } from "@/lib/utils"
import { forwardRef, SelectHTMLAttributes } from "react"

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: { value: string; label: string }[]
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, options, ...props }, ref) => {
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
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "w-full border bg-white px-4 py-3 font-sans text-sm text-black transition-colors",
            "focus:border-black focus:outline-none focus:ring-1 focus:ring-black",
            "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
            error ? "border-posit-red" : "border-neutral-300",
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

Select.displayName = "Select"

export { Select }
