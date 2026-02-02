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

export function isValidColombianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "")
  return cleaned.length === 10 && /^3\d{9}$/.test(cleaned)
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("57") && cleaned.length === 12) {
    return cleaned.substring(2)
  }
  if (cleaned.length === 10) {
    return cleaned
  }
  throw new Error("Invalid Colombian phone number")
}

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
