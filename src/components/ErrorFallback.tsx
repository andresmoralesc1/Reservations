/**
 * Componente de fallback para errores
 * UI amigable para mostrar cuando algo sale mal
 */

import { ComponentType } from "react"
import { Button } from "./Button"

export interface ErrorFallbackProps {
  error: Error
  retry: () => void
  title?: string
  message?: string
  showDetails?: boolean
  variant?: "page" | "section" | "inline"
}

/**
 * Variante de página completa - ocupa toda la pantalla
 */
export function FullPageError({
  error,
  retry,
  title = "Algo salió mal",
  message,
}: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 rounded-lg p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="font-display text-2xl uppercase tracking-wider text-black mb-2">
          {title}
        </h2>
        <p className="font-sans text-neutral-500 mb-6">
          {message || "Ha ocurrido un error inesperado. Por favor, intenta de nuevo."}
        </p>
        <ErrorDetails error={error} />
        <Button variant="primary" size="md" onClick={retry} className="w-full">
          Intentar de nuevo
        </Button>
      </div>
    </div>
  )
}

/**
 * Variante de sección - para errores dentro de un componente
 */
export function SectionError({
  error,
  retry,
  title = "Error",
  message,
}: ErrorFallbackProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="font-display text-lg uppercase tracking-wider text-red-900 mb-2">
        {title}
      </h3>
      <p className="font-sans text-red-700 mb-4 text-sm">
        {message || "No se pudo cargar esta sección. Intenta nuevamente."}
      </p>
      <ErrorDetails error={error} variant="compact" />
      <Button
        variant="secondary"
        size="sm"
        onClick={retry}
        className="mt-3"
      >
        Reintentar
      </Button>
    </div>
  )
}

/**
 * Variante inline - para espacios pequeños
 */
export function InlineError({
  error,
  retry,
  message,
}: ErrorFallbackProps) {
  return (
    <div className="flex items-center gap-2 text-red-600 text-sm">
      <span>⚠️</span>
      <span className="flex-1">{message || error.message}</span>
      {retry && (
        <button
          onClick={retry}
          className="text-red-700 underline hover:no-underline"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

/**
 * Componente de detalles del error (colapsable)
 */
interface ErrorDetailsProps {
  error: Error
  variant?: "full" | "compact"
}

function ErrorDetails({ error, variant = "full" }: ErrorDetailsProps) {
  if (variant === "compact") {
    return (
      <details className="mb-4 text-left">
        <summary className="text-sm text-red-600 cursor-pointer hover:text-red-700">
          Ver detalles
        </summary>
        <pre className="mt-2 text-xs text-red-800 overflow-auto bg-red-100 p-2 rounded font-mono">
          {error.message}
        </pre>
      </details>
    )
  }

  return (
    <details className="mb-6 text-left">
      <summary className="text-sm text-neutral-400 cursor-pointer hover:text-neutral-500">
        Ver detalles del error
      </summary>
      <div className="mt-3 p-3 bg-neutral-100 rounded text-left overflow-auto">
        <p className="text-sm font-mono text-red-600 mb-2">{error.message}</p>
        {error.stack && (
          <pre className="text-xs text-neutral-600 overflow-auto max-h-40">
            {error.stack}
          </pre>
        )}
      </div>
    </details>
  )
}

/**
 * ErrorFallback principal - selecciona la variante apropiada
 */
export function ErrorFallback(props: ErrorFallbackProps) {
  const variant = props.variant || "page"

  switch (variant) {
    case "section":
      return <SectionError {...props} />
    case "inline":
      return <InlineError {...props} />
    default:
      return <FullPageError {...props} />
  }
}

/**
 * HOC para envolver componentes con ErrorFallback
 * Nota: Este es un wrapper básico que requiere un ErrorBoundary externo
 */
export function withErrorFallback<P extends object>(
  Component: ComponentType<P>,
  fallbackProps?: Partial<ErrorFallbackProps>
) {
  return function WithErrorFallbackWrapper(props: P) {
    // Este componente está diseñado para ser usado dentro de un ErrorBoundary
    // El ErrorBoundary capturará el error y pasará el Error real a ErrorFallback
    return <Component {...props} />
  }
}
