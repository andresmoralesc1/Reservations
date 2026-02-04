import { cn } from "@/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined"
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden",
          {
            "default": "bg-white",
            "elevated": "bg-white shadow-lg",
            "outlined": "bg-white border border-neutral-200",
          }[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = "Card"

const CardImage = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { src: string; alt: string }>(
  ({ className, src, alt, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative aspect-[4/3] w-full overflow-hidden", className)} {...props}>
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    )
  }
)

CardImage.displayName = "CardImage"

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("p-6", className)} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = "CardContent"

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3 ref={ref} className={cn("font-display text-xl uppercase tracking-wide text-black", className)} {...props}>
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = "CardTitle"

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn("mt-2 font-serif text-sm text-neutral-600", className)} {...props}>
        {children}
      </p>
    )
  }
)

CardDescription.displayName = "CardDescription"

export { Card, CardImage, CardContent, CardTitle, CardDescription }
