import { cn } from "@/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full"
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "lg", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto px-6",
          {
            "sm": "max-w-2xl",
            "md": "max-w-4xl",
            "lg": "max-w-6xl",
            "xl": "max-w-7xl",
            "full": "max-w-8xl",
          }[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Container.displayName = "Container"

export { Container }
