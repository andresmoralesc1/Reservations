"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  zIndex?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className,
  zIndex = "50"
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: parseInt(zIndex) }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative z-10 w-full bg-white border border-neutral-200 flex flex-col max-h-[90vh] rounded-lg shadow-2xl",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 flex-shrink-0">
            <h2 className="font-display text-xl uppercase tracking-[0.1em] text-black">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-black transition-colors"
              aria-label="Cerrar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto flex-1 text-black">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export interface ModalFooterProps {
  onCancel: () => void
  onConfirm: () => void | Promise<void>
  cancelText?: string
  confirmText?: string
  isConfirming?: boolean
}

export function ModalFooter({
  onCancel,
  onConfirm,
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  isConfirming = false,
}: ModalFooterProps) {
  const [internalProcessing, setInternalProcessing] = useState(false)

  const handleConfirm = async () => {
    // Si ya se está procesando externamente, solo llamar a la función
    if (isConfirming) {
      await onConfirm()
      return
    }

    // Si no, manejar el estado internamente
    setInternalProcessing(true)
    try {
      await onConfirm()
    } finally {
      setInternalProcessing(false)
    }
  }

  const disabled = isConfirming || internalProcessing

  return (
    <>
      <button
        onClick={onCancel}
        disabled={disabled}
        className="px-4 py-2 bg-transparent border border-neutral-300 text-black rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cancelText}
      </button>
      <button
        onClick={handleConfirm}
        disabled={disabled}
        className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {disabled ? "Procesando..." : confirmText}
      </button>
    </>
  )
}
