/**
 * API Route Helpers con manejo de errores integrado
 *
 * @example
 * import { withApiHandler } from '@/lib/errors/api-handler'
 *
 * export const GET = withApiHandler(async (req) => {
 *   // Tu lógica aquí
 *   return Response.json({ data })
 * }, { requireAuth: true })
 */

import { NextRequest, NextResponse } from "next/server"
import { handleError, errorResponse, ApiError, UnauthorizedError } from "./index"

export interface ApiHandlerOptions {
  requireAuth?: boolean
  allowedMethods?: string[]
  logRequests?: boolean
}

type ApiHandler = (req: NextRequest, context?: { params: Record<string, string> }) => Promise<Response>

/**
 * Wrapper para API routes con manejo de errores automático
 */
export function withApiHandler(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
): ApiHandler {
  return async (req, context) => {
    try {
      // Verificar método permitido
      if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
        throw new ApiError(`Method ${req.method} not allowed`, 405, "METHOD_NOT_ALLOWED")
      }

      // Verificar autenticación (básica, se puede extender)
      if (options.requireAuth) {
        const authHeader = req.headers.get("authorization")
        if (!authHeader?.startsWith("Bearer ")) {
          throw new UnauthorizedError()
        }
        // TODO: Validar token con Supabase/JWT
      }

      // Log de request en desarrollo
      if (options.logRequests || process.env.NODE_ENV === "development") {
        console.log(`[API] ${req.method} ${req.url}`)
      }

      return await handler(req, context)
    } catch (error) {
      return errorResponse(error)
    }
  }
}

/**
 * Wrapper para API routes que retornan JSON automáticamente
 */
export function withJsonHandler<T>(
  handler: (req: NextRequest, context?: { params: Record<string, string> }) => Promise<T>,
  options: ApiHandlerOptions = {}
): ApiHandler {
  return withApiHandler(async (req, context) => {
    const data = await handler(req, context)
    return NextResponse.json(data)
  }, options)
}

/**
 * Helper para parsear el body de la request con validación
 */
export async function getValidatedBody<T>(
  req: NextRequest,
  schema?: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await req.json()

    if (schema) {
      return schema.parse(body)
    }

    return body as T
  } catch (error) {
    throw new ApiError("Invalid request body", 400, "INVALID_BODY")
  }
}

/**
 * Helper para obtener query params con validación de tipos
 */
export function getQueryParams(req: NextRequest, params: Record<string, "string" | "number" | "boolean">) {
  const { searchParams } = new URL(req.url)
  const result: Record<string, string | number | boolean> = {}

  for (const [key, type] of Object.entries(params)) {
    const value = searchParams.get(key)

    if (value === null) continue

    switch (type) {
      case "string":
        result[key] = value
        break
      case "number":
        const num = Number(value)
        if (isNaN(num)) {
          throw new ApiError(`Invalid number for parameter '${key}'`, 400, "INVALID_PARAM")
        }
        result[key] = num
        break
      case "boolean":
        result[key] = value === "true" || value === "1"
        break
    }
  }

  return result
}

/**
 * Helper para responses estándar
 */
export const apiResponses = {
  success: (data: unknown, status: number = 200) =>
    NextResponse.json({ success: true, data }, { status }),

  error: (message: string, code: string = "ERROR", status: number = 400) =>
    NextResponse.json({ success: false, error: message, code }, { status }),

  noContent: () => new NextResponse(null, { status: 204 }),

  created: (data: unknown) => NextResponse.json({ success: true, data }, { status: 201 }),

  notFound: (message: string = "Resource not found") =>
    NextResponse.json({ success: false, error: message, code: "NOT_FOUND" }, { status: 404 }),
} as const
