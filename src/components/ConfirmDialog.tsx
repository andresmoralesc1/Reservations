"use client"

import { Modal, ModalFooter } from "./Modal"

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "warning" | "info"
  isConfirming?: boolean
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
  isConfirming = false
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      icon: (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-posit-red/10">
          <svg className="h-6 w-6 text-posit-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      ),
    },
    warning: {
      icon: (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10">
          <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      ),
    },
    info: {
      icon: (
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-black/10">
          <svg className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
    },
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="flex items-start gap-4">
        {variantConfig[variant].icon}
        <div className="flex-1">
          <p className="font-serif text-neutral-600">
            {message}
          </p>
        </div>
      </div>
      <ModalFooter
        onCancel={onClose}
        onConfirm={onConfirm}
        cancelText={cancelText}
        confirmText={confirmText}
        isConfirming={isConfirming}
      />
    </Modal>
  )
}
