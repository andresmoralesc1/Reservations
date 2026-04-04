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
    { email: "admin@posit.com", label: "Admin", color: "bg-[#E53935] text-white hover:bg-[#C62828]" },
    { email: "manager@posit.com", label: "Manager", color: "bg-[#2196F3] text-white hover:bg-[#1976D2]" },
    { email: "staff@posit.com", label: "Staff", color: "bg-[#4CAF50] text-white hover:bg-[#388E3C]" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    console.log("Attempting login with:", { email, password })

    const success = await login(email, password)

    if (success) {
      router.push(redirectTo)
    } else {
      setError("Credenciales inválidas. Usa los botones de acceso rápido.")
      setIsSubmitting(false)
    }
  }

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("demo123")
    setError("")
    setIsSubmitting(true)

    console.log("Quick login for:", demoEmail)

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
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A84B]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] px-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Reservations
          </h1>
          <p className="text-[#A0A0A0]">Inicia sesión para continuar</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-[#E53935]/20 border border-[#E53935]/30 text-[#E53935] px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B]"
                placeholder="usuario@ejemplo.com"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#A0A0A0] mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-[#333333] text-white rounded-lg focus:outline-none focus:border-[#D4A84B]"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#D4A84B] text-black py-3 rounded-lg font-medium hover:bg-[#E5B95C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-[#333333]"></div>
            <span className="text-sm text-[#666666]">o</span>
            <div className="flex-1 h-px bg-[#333333]"></div>
          </div>

          {/* Quick Login (Demo) */}
          <div className="mt-6">
            <p className="text-sm text-[#666666] mb-3 text-center">
              Acceso rápido (demo):
            </p>
            <div className="space-y-2">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  onClick={() => quickLogin(user.email)}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${user.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {user.label} ({user.email})
                </button>
              ))}
            </div>
          </div>

          {/* Demo Credentials Notice */}
          <div className="mt-6 p-3 bg-[#D4A84B]/10 border border-[#D4A84B]/30 rounded-lg">
            <p className="text-xs text-[#D4A84B]">
              <strong>Modo demo:</strong> Todos los usuarios usan la contraseña <code className="bg-[#2a2a2a] px-1 rounded">demo123</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#666666] mt-6">
          © {new Date().getFullYear()} Reservations System
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4A84B]"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
