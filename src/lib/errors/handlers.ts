/**
 * Handlers para manejo de errores
 */

import { AppError, ApiError } from "./index"

/**
 * Determina si un error es operacional (esperado) o programático (bug)
 */
export function isErrorOperational(error: unknown): error is AppError {
  return error instanceof AppError && error.isOperational
}

/**
 * Logger de errores - En producción enviar a servicio de monitoring
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  const errorData = error instanceof AppError
    ? { ...error.toJSON(), ...context }
    : { timestamp: new Date().toISOString(), error: String(error), ...context }

  // En desarrollo, log completo a consola
  if (process.env.NODE_ENV === "development") {
    console.error("[ERROR]", errorData)
    if (error instanceof Error && error.stack) {
      console.error("[STACK]", error.stack)
    }
    return
  }

  // En producción, aquí se enviaría a Sentry, DataDog, etc.
  // TODO: Integrar con servicio de monitoring
  console.error("[ERROR]", JSON.stringify(errorData))

  // Ejemplo de integración con Sentry (cuando se agregue):
  // Sentry.captureException(error, { extra: context })
}

/**
 * Handler principal de errores - Único punto de entrada
 */
export function handleError(error: unknown, context?: Record<string, unknown>): ApiError {
  // Log del error
  logError(error, context)

  // Si ya es un ApiError, retornarlo
  if (error instanceof ApiError) {
    return error
  }

  // Si es un AppError, convertir a ApiError
  if (error instanceof AppError) {
    return new ApiError(error.message, error.statusCode, error.code, error.context)
  }

  // Errores de JavaScript nativos
  if (error instanceof Error) {
    const errorMap: Record<string, { message: string; statusCode: number; code: string }> = {
      "TypeError": { message: "Invalid data type", statusCode: 400, code: "TYPE_ERROR" },
      "SyntaxError": { message: "Invalid syntax", statusCode: 400, code: "SYNTAX_ERROR" },
      "ReferenceError": { message: "Invalid reference", statusCode: 500, code: "REFERENCE_ERROR" },
      "RangeError": { message: "Value out of range", statusCode: 400, code: "RANGE_ERROR" },
    }

    const errorType = error.constructor.name
    const mapped = errorMap[errorType]

    if (mapped) {
      return new ApiError(error.message || mapped.message, mapped.statusCode, mapped.code, {
        originalError: error.message,
      })
    }
  }

  // Error desconocido
  return new ApiError(
    error instanceof Error ? error.message : "An unexpected error occurred",
    500,
    "INTERNAL_ERROR",
    { originalError: String(error) }
  )
}

/**
 * Handler para API routes de Next.js
 */
export function handleApiError(error: unknown): {
  error: string
  code: string
  statusCode: number
  context?: Record<string, unknown>
} {
  const apiError = handleError(error)

  return {
    error: apiError.message,
    code: apiError.code,
    statusCode: apiError.statusCode,
    ...(process.env.NODE_ENV === "development" && { context: apiError.context }),
  }
}

/**
 * Wrapper para funciones async que captura errores
 * Útil para controladores de ruta
 */
export function handleAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T
): (...args: Parameters<T>) => Promise<unknown> {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}

/**
 * Type guard para verificar si un valor es un Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error
}

/**
 * Extraer mensaje de error seguro para mostrar al usuario
 */
export function getUserMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }

  if (error instanceof Error) {
    // En producción no mostrar errores técnicos
    if (process.env.NODE_ENV === "production") {
      return "Ha ocurrido un error. Por favor, intenta nuevamente."
    }
    return error.message
  }

  return "Ha ocurrido un error inesperado."
}

/**
 * Crear respuesta de error para API routes
 */
export function errorResponse(error: unknown, init?: ResponseInit): Response {
  const handled = handleApiError(error)

  return Response.json(handled, {
    status: handled.statusCode,
    ...init,
  })
}
