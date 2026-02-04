import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn(
        "animate-spin rounded-full border-black border-t-transparent",
        sizeClasses[size]
      )} />
      {text && (
        <p className="font-sans text-sm text-neutral-500">{text}</p>
      )}
    </div>
  )
}

export function PageLoader({ text = "Cargando..." }: { text?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 py-8">
      <LoadingSpinner size="sm" />
      {text && <span className="font-sans text-sm text-neutral-500">{text}</span>}
    </div>
  )
}
