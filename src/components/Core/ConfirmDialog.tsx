/**
 * ConfirmDialog (Core Version) - Modal de confirmación mejorado
 *
 * Versión mejorada con más opciones de personalización
 *
 * @example
 * <ConfirmDialog
 *   isOpen={showDialog}
 *   onClose={() => setShowDialog(false)}
 *   onConfirm={handleConfirm}
 *   title="¿Eliminar reserva?"
 *   message="Esta acción no se puede deshacer"
 *   variant="danger"
 * />
 */

"use client"

import { Modal } from "@/components/Modal"
import { Button } from "@/components/Button"
import { cn } from "@/lib/utils"

export type ConfirmVariant = "danger" | "warning" | "info" | "success"

const variantConfig = {
  danger: {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    buttonVariant: "danger" as const,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  warning: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    buttonVariant: "primary" as const,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    buttonVariant: "primary" as const,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  success: {
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    buttonVariant: "primary" as const,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string | React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  isConfirming?: boolean
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isConfirming = false,
  size = "sm",
  showIcon = true,
  className,
}: ConfirmDialogProps) {
  const config = variantConfig[variant]

  const handleConfirm = async () => {
    await onConfirm()
  }

  const footer = (
    <>
      <Button
        variant="ghost"
        size="md"
        onClick={onClose}
        disabled={isConfirming}
      >
        {cancelText}
      </Button>
      <Button
        variant={config.buttonVariant}
        size="md"
        onClick={handleConfirm}
        loading={isConfirming}
        disabled={isConfirming}
      >
        {confirmText}
      </Button>
    </>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} size={size} className={className}>
      <div className="flex items-start gap-4">
        {showIcon && (
          <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full", config.iconBg)}>
            <span className={config.iconColor}>{config.icon}</span>
          </div>
        )}

        <div className="flex-1">
          {typeof message === "string" ? (
            <p className="font-serif text-sm text-neutral-600">{message}</p>
          ) : (
            message
          )}
        </div>
      </div>
    </Modal>
  )
}
