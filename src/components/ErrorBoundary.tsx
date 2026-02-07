"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "./Button"

interface Props {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleRetry)
      }

      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-lg p-8 max-w-md w-full text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="font-display text-2xl uppercase tracking-wider text-black mb-2">
              Algo salió mal
            </h2>
            <p className="font-sans text-neutral-500 mb-6">
              Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-sm text-neutral-400 cursor-pointer">
                  Ver detalles del error
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto bg-red-50 p-2 rounded">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button
              variant="primary"
              size="md"
              onClick={this.handleRetry}
              className="w-full"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook-based error boundary for simpler usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, retry: () => void) => ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
