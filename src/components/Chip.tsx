import { cn } from "@/lib/utils"

interface ChipProps {
  label: string
  onRemove?: () => void
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger"
  size?: "sm" | "md"
  icon?: React.ReactNode
  className?: string
}

export function Chip({
  label,
  onRemove,
  variant = "default",
  size = "md",
  icon,
  className
}: ChipProps) {
  const variantClasses = {
    default: "bg-neutral-100 text-neutral-700 border-neutral-300",
    primary: "bg-black text-white border-black",
    secondary: "bg-white text-black border-black",
    success: "bg-green-100 text-green-700 border-green-300",
    warning: "bg-amber-100 text-amber-700 border-amber-300",
    danger: "bg-red-100 text-red-700 border-red-300",
  }

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border font-sans",
        variantClasses[variant],
        sizeClasses[size],
        onRemove && "pr-2",
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 hover:opacity-70"
          aria-label="Remove"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  )
}

// Chip group for displaying multiple chips
interface ChipGroupProps {
  chips: { label: string; value: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
}

export function ChipGroup({ chips, selected, onChange, className }: ChipGroupProps) {
  const toggleChip = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((chip) => {
        const isSelected = selected.includes(chip.value)
        return (
          <button
            key={chip.value}
            onClick={() => toggleChip(chip.value)}
            className={cn(
              "inline-flex items-center gap-2 border px-3 py-1.5 font-sans text-sm transition-colors",
              isSelected
                ? "border-black bg-black text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400"
            )}
          >
            {chip.label}
            {isSelected && (
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
