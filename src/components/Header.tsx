"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState, useEffect } from "react"

interface HeaderProps {
  variant?: "light" | "dark" | "transparent"
}

export function Header({ variant = "light" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isMenuOpen])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isMenuOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black">
      <nav className="px-6 py-4" aria-label="Navegación principal">
        <div className="mx-auto flex max-w-8xl items-center justify-between">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/10 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            <span className={cn(
              "h-0.5 w-6 bg-white transition-all duration-300",
              isMenuOpen && "translate-y-2 rotate-45"
            )} />
            <span className={cn(
              "h-0.5 w-6 bg-white transition-all duration-300",
              isMenuOpen && "opacity-0"
            )} />
            <span className={cn(
              "h-0.5 w-6 bg-white transition-all duration-300",
              isMenuOpen && "-translate-y-2 -rotate-45"
            )} />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="font-display text-2xl uppercase tracking-widest text-white hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-2 py-1 transition-opacity"
            aria-label="El Posit - Ir al inicio"
          >
            El Posit
          </Link>

          {/* Reserve Button */}
          <Link
            href="#reservar"
            className="font-display text-sm uppercase tracking-wider text-white hover:opacity-70 active:opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black rounded px-3 py-2 transition-opacity"
          >
            Reservar
          </Link>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 top-[72px] bg-black text-white transition-all duration-300",
          isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
        aria-hidden={!isMenuOpen}
      >
        <nav className="flex flex-col items-center gap-8 pt-20 font-display text-2xl uppercase tracking-wider" aria-label="Menú móvil">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="text-white hover:text-posit-red transition-colors focus:outline-none focus:ring-2 focus:ring-posit-red rounded px-4 py-2"
          >
            Inicio
          </Link>
          <Link
            href="#restaurantes"
            onClick={() => setIsMenuOpen(false)}
            className="text-white hover:text-posit-red transition-colors focus:outline-none focus:ring-2 focus:ring-posit-red rounded px-4 py-2"
          >
            Restaurantes
          </Link>
          <Link
            href="#reservar"
            onClick={() => setIsMenuOpen(false)}
            className="text-white hover:text-posit-red transition-colors focus:outline-none focus:ring-2 focus:ring-posit-red rounded px-4 py-2"
          >
            Reservar
          </Link>
          <Link
            href="/admin"
            onClick={() => setIsMenuOpen(false)}
            className="text-white hover:text-posit-red transition-colors focus:outline-none focus:ring-2 focus:ring-posit-red rounded px-4 py-2"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
