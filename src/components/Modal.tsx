"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
import { Button } from "./Button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
  className
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative z-10 w-full bg-white shadow-xl",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
            <h2 className="font-display text-xl uppercase tracking-wider text-black">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="font-sans text-neutral-400 transition-colors hover:text-black"
              aria-label="Cerrar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-neutral-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

Modal.Footer = function ModalFooter({
  onCancel,
  onConfirm,
  cancelText = "Cancelar",
  confirmText = "Confirmar",
  isConfirming = false,
}: {
  onCancel: () => void
  onConfirm: () => void
  cancelText?: string
  confirmText?: string
  isConfirming?: boolean
}) {
  return (
    <>
      <Button variant="ghost" size="md" onClick={onCancel} disabled={isConfirming}>
        {cancelText}
      </Button>
      <Button variant="primary" size="md" onClick={onConfirm} disabled={isConfirming}>
        {isConfirming ? "Procesando..." : confirmText}
      </Button>
    </>
  )
}

export interface ModalFooterProps {
  onCancel: () => void
  onConfirm: () => void
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
  return (
    <>
      <Button variant="ghost" size="md" onClick={onCancel} disabled={isConfirming}>
        {cancelText}
      </Button>
      <Button variant="primary" size="md" onClick={onConfirm} disabled={isConfirming}>
        {isConfirming ? "Procesando..." : confirmText}
      </Button>
    </>
  )
}
