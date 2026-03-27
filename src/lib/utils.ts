import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

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
// Reemplazan las funciones colombianas anteriores

/**
 * Valida si un teléfono español es válido
 * @param phone - Teléfono a validar
 * @returns true si es válido
 *
 * Móvil: 6 o 7 + 8 dígitos
 * Fijo: 8 o 9 + 8 dígitos
 */
export function isValidSpanishPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false
  }

  const cleaned = phone.replace(/\D/g, "")

  // Con prefijo +34: 11 dígitos (34 + 9)
  // Sin prefijo: 9 dígitos
  const digits = cleaned.startsWith("34") ? cleaned.slice(2) : cleaned

  // Debe tener 9 dígitos y empezar por 6, 7, 8, o 9
  return digits.length === 9 && /^[6789]\d{8}$/.test(digits)
}

/**
 * Normaliza un teléfono español al formato de 9 dígitos sin prefijo
 * @param phone - Teléfono en cualquier formato español
 * @returns Teléfono normalizado (9 dígitos)
 * @throws Error si el formato no es válido
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== "string") {
    throw new Error("El teléfono es requerido")
  }

  // Eliminar todo lo que no sea dígitos
  const cleaned = phone.replace(/\D/g, "")

  // Si tiene prefijo país 34, quitarlo
  let digits = cleaned
  if (digits.startsWith("34") && digits.length === 11) {
    digits = digits.substring(2)
  }

  // Validar que sea un teléfono español correcto (9 dígitos)
  if (!isValidSpanishPhone(phone)) {
    throw new Error(
      `Teléfono español inválido: "${phone}". ` +
      `Formato esperado: +34 6XX XXX XXX (móvil) o +34 9XX XXX XXX (fijo)`
    )
  }

  return digits
}

/**
 * Formatea un teléfono para mostrar en UI
 * @param phone - Teléfono en cualquier formato español
 * @returns Formato "+34 612 345 678"
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizePhoneNumber(phone)
  return `+34 ${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`
}

// ============ Legacy: Renombrar función anterior por compatibilidad ============
// Nota: isValidColombianPhone y normalizeColombianPhone se eliminan
// porque el sistema ahora usa teléfonos españoles exclusivamente

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
