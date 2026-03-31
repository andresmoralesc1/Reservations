/**
 * Middleware de Next.js
 *
 * - Logging de requests
 * - Placeholder para autenticación (próximamente)
 */

import { NextResponse, type NextRequest } from "next/server"

// Configuración
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

export async function middleware(request: NextRequest) {
  const startTime = Date.now()

  // Continuar con la request
  const response = NextResponse.next()

  // Agregar header de request ID para tracing
  response.headers.set("x-request-id", crypto.randomUUID())

  // Log de la request completada
  const latency = Date.now() - startTime
  logRequest(request, 200, latency)

  return response
}
