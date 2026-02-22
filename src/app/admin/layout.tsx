"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Container } from "@/components/Container"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/Button"
import { useKeyboardShortcuts, SHORTCUTS } from "@/hooks/useKeyboardShortcuts"
import { Menu, X } from "lucide-react"

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
    { href: "/admin/services", label: "Servicios", shortcut: "2" },
    { href: "/admin/tables", label: "Mesas", shortcut: "3" },
    { href: "/admin/analytics", label: "Analíticas", shortcut: "4", permission: "view_analytics" as const },
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
      ...SHORTCUTS.NAV_SERVICES,
      handler: () => router.push("/admin/services"),
    },
    {
      ...SHORTCUTS.NAV_TABLES,
      handler: () => router.push("/admin/tables"),
    },
    {
      ...SHORTCUTS.NAV_ANALYTICS,
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="h-8 w-8 animate-spin border-2 border-black border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Admin Header - Responsive */}
      <header className="border-b border-neutral-200 bg-white sticky top-0 z-40">
        <Container size="xl">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link href="/" className="font-display text-xl uppercase tracking-widest text-black hover:text-posit-red transition-colors">
              El Posit
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {visibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    font-display text-sm uppercase tracking-wider px-4 py-2 rounded-lg transition-colors relative
                    ${pathname === item.href
                      ? "bg-black text-white"
                      : "text-black hover:bg-black/5"
                    }
                  `}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right side - User info + actions */}
            <div className="flex items-center gap-4">
              <span className="hidden sm:block font-sans text-sm text-neutral-600">
                {user.name} ({user.role})
              </span>
              <button
                onClick={() => {
                  try {
                    logout()
                    router.push("/")
                  } catch (error) {
                    console.error("Error logging out:", error)
                    // Fallback to window.location
                    window.location.href = "/"
                  }
                }}
                className="font-sans text-sm text-neutral-500 hover:text-black transition-colors cursor-pointer"
              >
                Salir
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-black/5 active:scale-95 transition-all"
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </Container>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t border-neutral-200 bg-white py-4"
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
                      font-display text-sm uppercase tracking-wider px-4 py-3 rounded-lg transition-colors
                      ${pathname === item.href
                        ? "bg-black text-white"
                        : "text-black hover:bg-black/5"
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
      <footer className="border-t border-neutral-200 bg-white py-6 mt-auto">
        <Container size="xl">
          <div className="flex items-center justify-between">
            <p className="font-sans text-xs text-neutral-500">
              Panel de Administración - El Posit
            </p>
            <button
              onClick={() => setShowHelp(true)}
              className="font-sans text-xs text-neutral-500 hover:text-black transition-colors"
            >
              Atajos de teclado (?)
            </button>
          </div>
        </Container>
      </footer>

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white shadow-xl rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-xl uppercase tracking-wider text-black mb-4">
              Atajos de Teclado
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-600">Nueva reserva</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">N</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Buscar</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">F</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Aprobar</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">A</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Rechazar</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">R</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Exportar</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">E</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Recargar</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">F5</kbd>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="text-neutral-600">Ir a Dashboard</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">1</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Ir a Servicios</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">2</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Ir a Mesas</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">3</kbd>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Ir a Analíticas</span>
                <kbd className="px-2 py-1 bg-neutral-100 rounded text-sm">4</kbd>
              </div>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowHelp(false)}
                className="px-6 py-2 bg-black text-white font-display text-sm uppercase tracking-wider rounded-lg"
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
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl uppercase tracking-widest text-black">
            El Posit
          </h1>
          <p className="font-sans text-neutral-500 mt-2">Panel de Administración</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="admin@posit.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-neutral-50 rounded-lg text-sm text-neutral-600">
          <p className="font-medium mb-2">Demo credentials:</p>
          <ul className="space-y-1">
            <li><strong>Admin:</strong> admin@posit.com / demo123</li>
            <li><strong>Manager:</strong> manager@posit.com / demo123</li>
            <li><strong>Staff:</strong> staff@posit.com / demo123</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
