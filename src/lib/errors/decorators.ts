/**
 * Decoradores y utilidades para manejo de errores
 */

import { handleError } from "./handlers"

/**
 * Decorador para agregar logging a funciones asíncronas
 */
export function withErrorLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: string
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, { function: context || fn.name, args })
      throw error
    }
  }) as T
}

/**
 * Decorador para funciones de API route que automáticamente maneja errores
 */
export function withApiHandler<T extends (...args: unknown[]) => Promise<Response>>(
  fn: T
): T {
  return (async (...args: unknown[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      const handled = handleError(error, { function: fn.name })

      return Response.json(
        {
          error: handled.message,
          code: handled.code,
          ...(process.env.NODE_ENV === "development" && { context: handled.context }),
        },
        { status: handled.statusCode }
      )
    }
  }) as T
}

/**
 * Retry wrapper para operaciones que pueden fallar transitoriamente
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    delayMs?: number
    backoffMultiplier?: number
    onRetry?: (attempt: number, error: unknown) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options

  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        break
      }

      onRetry?.(attempt, error)

      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Timeout wrapper para operaciones que pueden colgar
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = "Operation timed out"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
  })

  return Promise.race([fn(), timeoutPromise])
}
