"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, loading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = searchParams.get("redirect") || "/admin"

  // Demo users for quick login
  const demoUsers = [
    { email: "admin@posit.com", label: "Admin", color: "bg-red-100 text-red-800" },
    { email: "manager@posit.com", label: "Manager", color: "bg-blue-100 text-blue-800" },
    { email: "staff@posit.com", label: "Staff", color: "bg-green-100 text-green-800" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const success = await login(email, password)

    if (success) {
      router.push(redirectTo)
    } else {
      setError("Credenciales inválidas. Intenta de nuevo.")
      setIsSubmitting(false)
    }
  }

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("demo123")
    setError("")
    setIsSubmitting(true)

    const success = await login(demoEmail, "demo123")

    if (success) {
      router.push(redirectTo)
    } else {
      setError("Error al iniciar sesión")
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-black mb-2">
            Reservations
          </h1>
          <p className="text-neutral-600">Inicia sesión para continuar</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="usuario@ejemplo.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-200"></div>
            <span className="text-sm text-neutral-500">o</span>
            <div className="flex-1 h-px bg-neutral-200"></div>
          </div>

          {/* Quick Login (Demo) */}
          <div className="mt-6">
            <p className="text-sm text-neutral-500 mb-3 text-center">
              Acceso rápido (demo):
            </p>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => quickLogin(user.email)}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${user.color} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {user.label} ({user.email})
                </button>
              ))}
            </div>
          </div>

          {/* Demo Credentials Notice */}
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Modo demo:</strong> Todos los usuarios usan la contraseña <code>demo123</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          © {new Date().getFullYear()} Reservations System
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
