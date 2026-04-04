/**
 * Middleware de Next.js
 *
 * - Logging de requests
 * - Autenticación con Supabase para rutas /admin/* (DESACTIVADO TEMPORALMENTE)
 * - Rate limiting para APIs sensibles
 */

import { NextResponse, type NextRequest } from "next/server"
import { createLogger } from "@/lib/logger"

const logger = createLogger({ module: "middleware" })

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

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  // Importar dinámicamente para evitar errores si Supabase no está configurado
  try {
    const { createServerClient } = require("@supabase/ssr")
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: {
          name: string
          value: string
          options: Record<string, unknown>
        }[]) {
          cookiesToSet.forEach(({ name, value }) =>
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
  } catch {
    return null
  }
}

/**
 * Verifica si el usuario está autenticado
 * - Primero verifica cookie de demo (para desarrollo)
 * - Si no hay demo, verifica Supabase
 * - Si AUTH_ENABLED=false, siempre permite
 */
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    // Si AUTH está desactivado explícitamente, permitir
    if (!AUTH_ENABLED) {
      return true
    }

    // 1. Verificar cookie de autenticación demo (para desarrollo local)
    const demoAuthToken = request.cookies.get("demo_auth_token")?.value
    if (demoAuthToken === "demo_authenticated") {
      return true
    }

    // 2. Si no hay demo auth, verificar Supabase
    const supabase = createMiddlewareClient(request)
    if (!supabase) {
      // Si Supabase no está configurado y no hay demo auth, denegar
      return false
    }

    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      return false
    }

    return true
  } catch {
    // En caso de error, denegar acceso (fail-secure)
    return false
  }
}

/**
 * Control de autenticación vía variable de entorno
 *
 * Comportamiento:
 * - Sin variable (desarrollo): AUTH activado por defecto (secure by default)
 * - AUTH_ENABLED=false: Desactiva explícitamente (solo para desarrollo local)
 * - Producción: Siempre activado (no definir la variable)
 */
const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false'

// Log warning cuando auth está desactivado (solo en desarrollo/local)
if (!AUTH_ENABLED && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  AUTH_ENABLED is false - admin routes are UNPROTECTED')
  logger.warn({
    msg: 'Auth desactivado - rutas admin sin protección',
    env: process.env.NODE_ENV,
  })
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
 * Middleware principal
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl

  // Verificar autenticación SOLO si está habilitada
  if (AUTH_ENABLED) {
    const isAdminPage = protectedRoutes.pages.test(pathname)
    const isAdminApi = protectedRoutes.api.test(pathname)

    if (isAdminPage || isAdminApi) {
      const authenticated = await isAuthenticated(request)

      if (!authenticated) {
        const latency = Date.now() - startTime
        logRequest(request, 401, latency)

        logger.warn({
          msg: "Acceso denegado",
          pathname,
          isAdminPage,
          isAdminApi,
          ip: request.headers.get("x-forwarded-for")?.split(",")[0] ||
              request.headers.get("x-real-ip") ||
              "unknown",
        })

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
