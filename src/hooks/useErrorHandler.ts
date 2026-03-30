/**
 * Hook personalizado para manejo de errores en componentes
 */

import { useState, useCallback } from "react"
import { AppError, ApiError, handleError, getUserMessage } from "@/lib/errors"

export interface ErrorState {
  error: string | null
  code: string | null
  isError: boolean
}

export interface UseErrorHandlerReturn extends ErrorState {
  setError: (error: unknown) => void
  clearError: () => void
  safeExecute: <T>(fn: () => Promise<T>) => Promise<T | null>
  safeExecuteSync: <T>(fn: () => T) => T | null
}

/**
 * Hook para manejar errores en componentes con estado
 *
 * @example
 * const { error, setError, clearError, safeExecute } = useErrorHandler()
 *
 * const handleSubmit = async () => {
 *   await safeExecute(async () => {
 *     // Operación que puede fallar
 *   })
 * }
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [state, setState] = useState<ErrorState>({
    error: null,
    code: null,
    isError: false,
  })

  const setError = useCallback((error: unknown) => {
    const handled = handleError(error)
    setState({
      error: getUserMessage(error),
      code: handled.code,
      isError: true,
    })
  }, [])

  const clearError = useCallback(() => {
    setState({ error: null, code: null, isError: false })
  }, [])

  const safeExecute = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      clearError()
      return await fn()
    } catch (error) {
      setError(error)
      return null
    }
  }, [setError, clearError])

  const safeExecuteSync = useCallback(<T>(fn: () => T): T | null => {
    try {
      clearError()
      return fn()
    } catch (error) {
      setError(error)
      return null
    }
  }, [setError, clearError])

  return {
    ...state,
    setError,
    clearError,
    safeExecute,
    safeExecuteSync,
  }
}

/**
 * Hook simplificado para operaciones async con manejo de errores
 */
export function useAsyncOperation<T = unknown>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const handler = useErrorHandler()

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    try {
      handler.clearError()
      const result = await fn()
      setData(result)
      return result
    } catch (error) {
      handler.setError(error)
      return null
    } finally {
      setLoading(false)
    }
  }, [handler])

  return {
    data,
    loading,
    error: handler.error,
    isError: handler.isError,
    execute,
    clearError: handler.clearError,
  }
}

/**
 * Hook para mostrar toast de error automáticamente
 */
export function useErrorToast(toast: (message: string, type: "success" | "error") => void) {
  const handler = useErrorHandler()

  const showError = useCallback((error: unknown) => {
    handler.setError(error)
    const message = getUserMessage(error)
    toast(message, "error")
  }, [handler, toast])

  return {
    ...handler,
    setError: showError,
  }
}
