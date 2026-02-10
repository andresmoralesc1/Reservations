"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState } from "react"

interface HeaderProps {
  variant?: "light" | "dark" | "transparent"
}

export function Header({ variant = "light" }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Always use black background and white text
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-black text-white">
      <div className="mx-auto flex max-w-8xl items-center justify-between">
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
          aria-label="Menu"
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
        <Link href="/" className="font-display text-2xl uppercase tracking-widest">
          El Posit
        </Link>

        {/* Reserve Button */}
        <Link
          href="#reservar"
          className="font-display text-sm uppercase tracking-wider hover:opacity-70 transition-opacity"
        >
          Reservar
        </Link>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 top-[72px] bg-black text-white transition-all duration-300",
        isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        <nav className="flex flex-col items-center gap-8 pt-20 font-display text-2xl uppercase tracking-wider">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="hover:text-posit-red transition-colors">
            Inicio
          </Link>
          <Link href="#restaurantes" onClick={() => setIsMenuOpen(false)} className="hover:text-posit-red transition-colors">
            Restaurantes
          </Link>
          <Link href="#reservar" onClick={() => setIsMenuOpen(false)} className="hover:text-posit-red transition-colors">
            Reservar
          </Link>
          <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="hover:text-posit-red transition-colors">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
