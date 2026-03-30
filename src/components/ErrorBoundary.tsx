"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "./Button"
import { ErrorFallback, ErrorFallbackProps } from "./ErrorFallback"
import { logError } from "@/lib/errors"

interface Props {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
  fallbackProps?: Partial<ErrorFallbackProps>
  variant?: "page" | "section" | "inline"
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary - Captura errores en componentes React y muestra una UI amigable
 *
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 *
 * @example Con fallback personalizado
 * <ErrorBoundary fallbackProps={{ title: "Error personalizado" }}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log del error usando nuestro sistema centralizado
    logError(error, {
      componentStack: errorInfo.componentStack,
      digest: (errorInfo as any).digest,
    })

    // Callback personalizado si se proporciona
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Fallback personalizado proporcionado como función
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      // Usar el componente ErrorFallback con las props proporcionadas
      return (
        <ErrorFallback
          error={this.state.error}
          retry={this.handleRetry}
          variant={this.props.variant}
          {...this.props.fallbackProps}
        />
      )
    }

    return this.props.children
  }
}

/**
 * HOC para envolver componentes con ErrorBoundary
 *
 * @example
 * export default withErrorBoundary(MyComponent, {
 *   fallbackProps: { title: "Error en Mi Componente" }
 * })
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Hook para usar ErrorBoundary en componentes funcionales
 * Requiere que el componente esté envuelto en un ErrorBoundary
 */
export function useErrorHandler() {
  return (error: Error) => {
    throw error
  }
}
