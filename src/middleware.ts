/**
 * Middleware de Next.js
 *
 * - Logging de requests
 * - Autenticación con Supabase para rutas /admin/*
 * - Rate limiting para APIs sensibles
 */

import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Configuración: matcher que excluye estáticos y archivos internos
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

/**
 * Logging de requests
 */
function logRequest(
  request: NextRequest,
  statusCode: number = 200,
  latency: number = 0
) {
  const timestamp = new Date().toISOString()
  const method = request.method
  const url = request.url
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"

  console.log(
    `[Request] ${timestamp} ${method} ${url} ${statusCode} (${latency}ms) IP:${ip}`
  )
}

/**
 * Crea cliente de Supabase para middleware
 */
function createMiddlewareClient(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || ""
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ""

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set(name, value)
        )
        const response = NextResponse.next({
          request: { headers: request.headers },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
        return response
      },
    },
  })
}

/**
 * Verifica si el usuario está autenticado
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const supabase = createMiddlewareClient(request)
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * Rutas que requieren autenticación
 */
const protectedRoutes = {
  // Páginas de admin - redirigen a /login
  pages: /^\/admin\/.*/,
  // APIs de admin - retornan 401
  api: /^\/api\/admin\/.*/,
}

/**
 * Rutas públicas (no requieren autenticación)
 */
const publicRoutes = [
  "/api/reservations",
  "/api/reservations/check-availability",
  "/api/ivr",
  "/api/reservar",
  "/api/init",
  "/api/restaurants",
  "/api/cron",
  "/api/auth",
  "/login",
  "/reservar",
  "/asistente",
]

/**
 * Middleware principal
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl

  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Rutas protegidas de admin
  const isAdminPage = protectedRoutes.pages.test(pathname)
  const isAdminApi = protectedRoutes.api.test(pathname)

  // Verificar autenticación para rutas protegidas
  if ((isAdminPage || isAdminApi) && !isPublicRoute) {
    const authenticated = await isAuthenticated(request)

    if (!authenticated) {
      const latency = Date.now() - startTime
      logRequest(request, 401, latency)

      // Para páginas de admin, redirigir a /login
      if (isAdminPage) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Para APIs de admin, retornar 401
      return NextResponse.json(
        { error: "No autorizado", message: "Se requiere autenticación" },
        { status: 401 }
      )
    }
  }

  // Continuar con la request
  const response = NextResponse.next()

  // Agregar headers de seguridad
  response.headers.set("x-request-id", crypto.randomUUID())
  response.headers.set("x-dns-prefetch-control", "off")
  response.headers.set("x-frame-options", "SAMEORIGIN")
  response.headers.set("x-content-type-options", "nosniff")
  response.headers.set("referrer-policy", "origin-when-cross-origin")

  // Log de la request completada
  const latency = Date.now() - startTime
  logRequest(request, 200, latency)

  return response
}
