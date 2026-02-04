"use client"

import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

type ToastVariant = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  message: string
  variant: ToastVariant
}

let toastCounter = 0
const listeners: Set<(toasts: Toast[]) => void> = new Set()
let toasts: Toast[] = []

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]))
}

export function toast(message: string, variant: ToastVariant = "info") {
  const id = `toast-${toastCounter++}`
  const newToast: Toast = { id, message, variant }
  toasts = [...toasts, newToast]
  notifyListeners()

  setTimeout(() => {
    removeToast(id)
  }, 5000)
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  notifyListeners()
}

export function ToastProvider() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([])

  useEffect(() => {
    listeners.add(setCurrentToasts)
    return () => {
      listeners.delete(setCurrentToasts)
    }
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {currentToasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const variantClasses = {
    success: "bg-green-700 text-white border-green-800",
    error: "bg-posit-red text-white border-posit-red-dark",
    warning: "bg-amber-500 text-black border-amber-600",
    info: "bg-black text-white border-neutral-800",
  }

  const icons = {
    success: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    error: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    warning: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    info: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 border px-4 py-3 shadow-lg",
        "min-w-[300px] max-w-md animate-in slide-in-from-right",
        variantClasses[toast.variant]
      )}
    >
      <div className="flex-shrink-0">
        {icons[toast.variant]}
      </div>
      <p className="flex-1 font-sans text-sm">{toast.message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 opacity-70 transition-opacity hover:opacity-100"
        aria-label="Cerrar"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
