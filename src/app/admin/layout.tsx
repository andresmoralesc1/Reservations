"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Container } from "@/components/Container"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/Button"
import { useKeyboardShortcuts, SHORTCUTS } from "@/hooks/useKeyboardShortcuts"
import { Menu, X, LogOut, Keyboard } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, hasPermission, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  React.useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    { href: "/admin", label: "Dashboard", shortcut: "1" },
    { href: "/admin/floor-plan", label: "Floor Plan", shortcut: "2" },
    { href: "/admin/availability", label: "Disponibilidad", shortcut: "3" },
    { href: "/admin/services", label: "Servicios", shortcut: "4" },
    { href: "/admin/tables", label: "Mesas", shortcut: "5" },
    { href: "/admin/analytics", label: "Analíticas", shortcut: "6", permission: "view_analytics" as const },
  ]

  // Filter nav items based on permissions
  const visibleNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  )

  // Keyboard shortcuts for navigation
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.NAV_DASHBOARD,
      handler: () => router.push("/admin"),
    },
    {
      key: "2",
      description: "Ir a Floor Plan",
      handler: () => router.push("/admin/floor-plan"),
    },
    {
      key: "3",
      description: "Ir a Disponibilidad",
      handler: () => router.push("/admin/availability"),
    },
    {
      key: "4",
      description: "Ir a Servicios",
      handler: () => router.push("/admin/services"),
    },
    {
      key: "5",
      description: "Ir a Mesas",
      handler: () => router.push("/admin/tables"),
    },
    {
      key: "6",
      description: "Ir a Analíticas",
      handler: () => {
        if (hasPermission("view_analytics" as const)) {
          router.push("/admin/analytics")
        }
      },
    },
    {
      ...SHORTCUTS.HELP,
      handler: () => setShowHelp(true),
    },
  ], true)

  const [showHelp, setShowHelp] = React.useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin border-2 border-[#D4A84B] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Admin Header - Premium Dark */}
      <header className="border-b border-[#333333] bg-[#0a0a0a] sticky top-0 z-40 backdrop-blur-sm bg-opacity-95">
        <Container size="xl">
          {/* Top row: Logo + User */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <Link href="/" className="font-display text-xl uppercase tracking-[0.2em] text-white hover:text-[#D4A84B] transition-colors duration-200">
                ANFITRIÓN
              </Link>
            </div>

            {/* User info + actions */}
            <div className="flex items-center gap-4">
              <span className="hidden sm:block font-sans text-sm text-[#A0A0A0]">
                {user.name} <span className="text-[#666666]">({user.role})</span>
              </span>
              <button
                onClick={() => {
                  try {
                    logout()
                    router.push("/")
                  } catch (error) {
                    console.error("Error logging out:", error)
                    window.location.href = "/"
                  }
                }}
                className="flex items-center gap-2 font-sans text-sm text-[#A0A0A0] hover:text-[#D4A84B] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-[#2a2a2a] active:scale-95 transition-all text-[#A0A0A0]"
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Bottom row: Navigation */}
          <div className="flex items-center justify-between py-3 border-t border-[#333333]">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    font-display text-xs uppercase tracking-[0.15em] px-4 py-2 rounded-lg transition-all duration-200 relative
                    ${pathname === item.href
                      ? "bg-[#D4A84B] text-black"
                      : "text-[#A0A0A0] hover:text-white hover:bg-[#2a2a2a]"
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </Container>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t border-[#333333] bg-[#0a0a0a] py-4"
            role="navigation"
            aria-label="Navegación móvil"
          >
            <Container size="xl">
              <nav className="flex flex-col gap-1">
                {visibleNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      font-display text-xs uppercase tracking-[0.15em] px-4 py-3 rounded-lg transition-all duration-200
                      ${pathname === item.href
                        ? "bg-[#D4A84B] text-black"
                        : "text-[#A0A0A0] hover:text-white hover:bg-[#2a2a2a]"
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </Container>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="py-8">
        <Container size="xl">
          {children}
        </Container>
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-[#333333] bg-[#0a0a0a] py-6 mt-auto">
        <Container size="xl">
          <div className="flex items-center justify-between">
            <p className="font-sans text-xs text-[#666666] uppercase tracking-wider">
              Panel de Administración — Anfitrión
            </p>
            <button
              onClick={() => setShowHelp(true)}
              className="flex items-center gap-2 font-sans text-xs text-[#666666] hover:text-[#D4A84B] transition-colors"
            >
              <Keyboard className="w-3 h-3" />
              Atajos de teclado
            </button>
          </div>
        </Container>
      </footer>

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg uppercase tracking-[0.15em] text-white mb-6">
              Atajos de Teclado
            </h2>
            <div className="space-y-3">
              <ShortcutItem label="Nueva reserva" keybind="N" />
              <ShortcutItem label="Buscar" keybind="F" />
              <ShortcutItem label="Aprobar" keybind="A" />
              <ShortcutItem label="Rechazar" keybind="R" />
              <ShortcutItem label="Exportar" keybind="E" />
              <ShortcutItem label="Recargar" keybind="F5" />
              <div className="border-t border-[#333333] my-3 pt-3" />
              <ShortcutItem label="Ir a Dashboard" keybind="1" />
              <ShortcutItem label="Ir a Floor Plan" keybind="2" />
              <ShortcutItem label="Ir a Disponibilidad" keybind="3" />
              <ShortcutItem label="Ir a Servicios" keybind="4" />
              <ShortcutItem label="Ir a Mesas" keybind="5" />
              <ShortcutItem label="Ir a Analíticas" keybind="6" />
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 bg-[#D4A84B] text-black font-display text-xs uppercase tracking-[0.15em] rounded-lg hover:bg-[#E5B95C] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ShortcutItem({ label, keybind }: { label: string; keybind: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#A0A0A0] text-sm">{label}</span>
      <kbd className="px-2 py-1 bg-[#2a2a2a] border border-[#333333] rounded text-xs text-[#D4A84B] font-mono">
        {keybind}
      </kbd>
    </div>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const success = await login(email, password)
    if (!success) {
      setError("Credenciales inválidas")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl uppercase tracking-[0.2em] text-white">
            ANFITRIÓN
          </h1>
          <p className="font-sans text-[#666666] mt-2 text-sm uppercase tracking-wider">
            Panel de Administración
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333333] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#D4A84B] transition-colors"
              placeholder="admin@anfitrion.app"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333333] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#D4A84B] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-20 text-red-400 px-4 py-3 rounded-lg text-sm border border-red-900 border-opacity-30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-[#D4A84B] text-black font-display text-sm uppercase tracking-[0.15em] rounded-lg hover:bg-[#E5B95C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="mt-6 p-4 bg-[#2a2a2a] rounded-lg text-sm text-[#A0A0A0] border border-[#333333]">
          <p className="font-medium mb-2 text-[#D4A84B] uppercase tracking-wider text-xs">Demo credentials:</p>
          <ul className="space-y-1">
            <li><span className="text-white">Admin:</span> admin@posit.com / demo123</li>
            <li><span className="text-white">Manager:</span> manager@posit.com / demo123</li>
            <li><span className="text-white">Staff:</span> staff@posit.com / demo123</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
