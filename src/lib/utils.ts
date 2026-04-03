import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

// Import phone utilities from phone-utils to avoid duplication
import {
  normalizeSpanishPhone,
  isValidSpanishPhone,
  formatPhoneForWhatsApp,
  formatPhoneForDisplay,
  getPhoneType,
  comparePhones,
} from "./voice/phone-utils"

// Re-export for convenience
export {
  normalizeSpanishPhone,
  isValidSpanishPhone,
  formatPhoneForWhatsApp,
  formatPhoneForDisplay,
  getPhoneType,
  comparePhones,
}

// Alias for backward compatibility
// TODO: Migrate all imports to use normalizeSpanishPhone directly
export const normalizePhoneNumber = normalizeSpanishPhone

export function cn(...inputs: (string | number | boolean | undefined | null)[]) {
  return twMerge(clsx(inputs))
}

export function generateReservationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // No ambiguous chars
  let result = ""
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `RES-${result}`
}

export function formatReservationDate(
  dateStr: string,
  timeStr: string
): string {
  const dateTime = new Date(`${dateStr}T${timeStr}`)
  return format(dateTime, "EEEE, d 'de' MMMM 'a las' HH:mm")
}

// ============ Teléfonos Españoles ============
// NOTA: Las funciones de teléfono han sido movidas a src/lib/voice/phone-utils.ts
// para evitar duplicación. Aquí se re-exportan para compatibilidad.
// - normalizeSpanishPhone (alias: normalizePhoneNumber)
// - isValidSpanishPhone
// - formatPhoneForDisplay
// - formatPhoneForWhatsApp
// - getPhoneType
// - comparePhones

// ============ Utilidades Retry ============

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  throw lastError
}
