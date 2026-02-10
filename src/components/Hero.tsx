import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface HeroProps {
  backgroundImage?: string
  backgroundVideo?: string
  overlay?: boolean
  className?: string
  children: ReactNode
}

export function Hero({ backgroundImage, backgroundVideo, overlay = true, className, children }: HeroProps) {
  return (
    <section
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden",
        !backgroundImage && !backgroundVideo && "bg-black",
        className
      )}
    >
      {backgroundVideo && (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={backgroundVideo} type="video/mp4" />
        </video>
      )}

      {backgroundImage && !backgroundVideo && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
      )}

      {overlay && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        {children}
      </div>
    </section>
  )
}

export function HeroTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={cn("font-display text-5xl sm:text-6xl md:text-hero uppercase tracking-tight text-white leading-none", className)}>
      {children}
    </h1>
  )
}

export function HeroSubtitle({ children, italic, className }: { children: ReactNode; italic?: boolean; className?: string }) {
  return (
    <p className={cn(
      "mt-4 text-xl sm:text-2xl text-white/90",
      italic ? "font-serif italic" : "font-sans",
      className
    )}>
      {children}
    </p>
  )
}
