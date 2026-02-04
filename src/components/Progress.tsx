import { cn } from "@/lib/utils"

interface ProgressProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "danger"
  showLabel?: boolean
  className?: string
}

export function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  showLabel = false,
  className
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  }

  const variantClasses = {
    default: "bg-black",
    success: "bg-green-600",
    warning: "bg-amber-500",
    danger: "bg-posit-red",
  }

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-2 flex justify-between">
          <span className="font-sans text-xs text-neutral-600">Progreso</span>
          <span className="font-display text-xs text-neutral-600">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={cn(
        "w-full overflow-hidden rounded-full bg-neutral-200",
        sizeClasses[size]
      )}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Stepped progress for multi-step forms
interface StepProgressProps {
  steps: { title: string }[]
  currentStep: number
  className?: string
}

export function StepProgress({ steps, currentStep, className }: StepProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-neutral-200" />
        <div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-black transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const stepNumber = index + 1
            const isCompleted = stepNumber < currentStep
            const isCurrent = stepNumber === currentStep

            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-sm transition-colors",
                    isCompleted && "border-black bg-black text-white",
                    isCurrent && "border-black bg-white text-black",
                    !isCompleted && !isCurrent && "border-neutral-300 bg-white text-neutral-400"
                  )}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>
                <span className={cn(
                  "absolute top-10 whitespace-nowrap font-display text-xs uppercase tracking-wider",
                  isCurrent ? "text-black" : "text-neutral-500"
                )}>
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
