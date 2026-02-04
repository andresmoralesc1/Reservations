import { cn } from "@/lib/utils"
import { forwardRef, HTMLAttributes } from "react"

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  initials?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "circle" | "square"
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, initials, size = "md", variant = "circle", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
      xl: "h-16 w-16 text-lg",
    }

    const variantClasses = {
      circle: "rounded-full",
      square: "rounded-lg",
    }

    if (src) {
      return (
        <div
          ref={ref}
          className={cn(
            "overflow-hidden bg-neutral-200",
            sizeClasses[size],
            variantClasses[variant],
            className
          )}
          {...props}
        >
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center bg-black font-display uppercase text-white",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {initials}
      </div>
    )
  }
)

Avatar.displayName = "Avatar"

// Avatar group for overlapping avatars
interface AvatarGroupProps {
  children: React.ReactNode
  max?: number
  className?: string
}

export function AvatarGroup({ children, max = 3, className }: AvatarGroupProps) {
  const avatars = Array.isArray(children) ? children : [children]
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn("flex -space-x-2", className)}>
      {visibleAvatars.map((avatar, index) => (
        <div key={index} className="ring-2 ring-white">
          {avatar}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-neutral-200 font-display text-xs text-neutral-600">
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
