"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info" | "warning"
  duration?: number
  undo?: () => void
  undoLabel?: string
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (message: string, type?: Toast["type"], options?: { undo?: () => void; undoLabel?: string; duration?: number }) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

interface ToastProviderProps {
  children?: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (
    message: string,
    type: Toast["type"] = "info",
    options?: { undo?: () => void; undoLabel?: string; duration?: number }
  ) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      message,
      type,
      duration: options?.duration ?? (options?.undo ? 8000 : 3000),
      undo: options?.undo,
      undoLabel: options?.undoLabel ?? "Deshacer",
    }

    setToasts((prev) => [...prev, newToast])

    if (newToast.duration && !options?.undo) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const clearToasts = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

const TYPE_STYLES = {
  success: "bg-emerald-500 text-white",
  error: "bg-red-500 text-white",
  info: "bg-black text-white",
  warning: "bg-amber-500 text-white",
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(() => onRemove(toast.id), 200)
  }

  const handleUndo = () => {
    toast.undo?.()
    handleRemove()
  }

  useEffect(() => {
    if (!toast.undo) {
      const timer = setTimeout(handleRemove, toast.duration ?? 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  return (
    <div
      className={`
        ${TYPE_STYLES[toast.type]}
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        transition-all duration-200 min-w-[300px] max-w-md
        ${isExiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
      `}
    >
      <div className="flex-1 font-sans text-sm">{toast.message}</div>
      <div className="flex items-center gap-2">
        {toast.undo && (
          <button
            onClick={handleUndo}
            className="px-3 py-1 text-xs font-medium uppercase bg-white/20 hover:bg-white/30 rounded transition-colors"
          >
            {toast.undoLabel}
          </button>
        )}
        <button
          onClick={handleRemove}
          className="p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Cerrar"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
