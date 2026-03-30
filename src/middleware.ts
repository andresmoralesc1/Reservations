/**
 * Middleware de Next.js
 *
 * - Rate limiting con Redis
 * - Logging de requests
 * - Placeholder para autenticación (próximamente)
 */

import { NextResponse, type NextRequest } from "next/server"

// Configuración
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
  protectedPaths: ["/admin", "/api/admin"],
  rateLimit: {
    // 100 requests por minuto por IP
    windowMs: 60 * 1000,
    maxRequests: 100,
    // Límites más estrictos para APIs
    apiWindowMs: 60 * 1000,
    apiMaxRequests: 200,
  },
}

// Cliente de Redis para rate limiting
let redis: any | null = null

function getRedisClient() {
  if (!process.env.REDIS_URL) return null

  if (!redis) {
    try {
      // Importar dinámicamente para no fallar si Redis no está disponible
      const Redis = require("ioredis")
      redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => Math.min(times * 50, 500),
      })
    } catch (error) {
      console.error("[Middleware] Redis connection error:", error)
      return null
    }
  }

  return redis
}

/**
 * Rate limiting con Redis
 */
async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return true // Si no hay Redis, no limitamos

  const key = `ratelimit:${identifier}`
  const window = Math.floor(Date.now() / windowMs)

  try {
    const current = await client.incr(`${key}:${window}`)

    if (current === 1) {
      await client.expire(`${key}:${window}`, Math.ceil(windowMs / 1000))
    }

    return current <= maxRequests
  } catch (error) {
    console.error("[Middleware] Rate limit error:", error)
    return true // En caso de error, permitir la request
  }
}

/**
 * Obtener identificador para rate limiting (IP o userId)
 */
function getIdentifier(request: NextRequest): string {
  // Intentar obtener userId del token si está autenticado
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    return `user:${authHeader.slice(7)}`
  }

  // Si no hay usuario, usar IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  return `ip:${ip}`
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

  // En producción, enviar a servicio de logging
}

/**
 * Respuesta de error de rate limit
 */
function rateLimitResponse() {
  return NextResponse.json(
    {
      error: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: 60,
    },
    { status: 429 }
  )
}

/**
 * Respuesta de no autorizado
 */
function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    },
    { status: 401 }
  )
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const url = new URL(request.url)

  // Determinar si es ruta de admin
  const isAdminPath = url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin")

  // Rate limiting para todas las requests
  const identifier = getIdentifier(request)
  const maxRequests = isAdminPath
    ? config.rateLimit.apiMaxRequests
    : config.rateLimit.maxRequests
  const windowMs = isAdminPath
    ? config.rateLimit.apiWindowMs
    : config.rateLimit.windowMs

  const isAllowed = await checkRateLimit(identifier, maxRequests, windowMs)

  if (!isAllowed) {
    logRequest(request, 429)
    return rateLimitResponse()
  }

  // Autenticación (TODO: Implementar con Supabase Auth)
  const isProtectedPath = config.protectedPaths.some((path) =>
    url.pathname === path || url.pathname.startsWith(`${path}/`)
  )

  if (isProtectedPath) {
    // Por ahora, solo loggear requerimiento de auth
    console.log("[Middleware] Auth required for:", url.pathname)

    // Descomentar cuando se implemente auth:
    // const authenticated = await isAuthenticated(request)
    // if (!authenticated) {
    //   logRequest(request, 401)
    //   return unauthorizedResponse()
    // }
  }

  // Continuar con la request
  const response = NextResponse.next()

  // Agregar header de request ID para tracing
  response.headers.set("x-request-id", crypto.randomUUID())

  // Log de la request completada
  const latency = Date.now() - startTime
  logRequest(request, 200, latency)

  return response
}
