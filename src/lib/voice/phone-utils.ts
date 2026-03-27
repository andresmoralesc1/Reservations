/**
 * Phone Utilities (Spain)
 *
 * Normalización y validación de números de teléfono españoles.
 * Reemplaza la validación colombiana por española.
 */

// ============ Constantes ============
const SPAIN_COUNTRY_CODE = "34"
const SPAIN_PREFIX = "+34"

// Regex para teléfonos españoles
// Móvil: 6 o 7 seguido de 8 dígitos
const MOBILE_REGEX = /^(\+?34)?\s*[67]\d{2}\s?\d{3}\s?\d{3}$/
// Fijo: 8 o 9 seguido de 8 dígitos
const LANDLINE_REGEX = /^(\+?34)?\s*[89]\d{2}\s?\d{3}\s?\d{3}$/
// Normalizado: 9 dígitos exactos
const CLEAN_REGEX = /^[6789]\d{8}$/

// ============ Funciones principales ============

/**
 * Normaliza un teléfono español al formato de 9 dígitos sin prefijo
 *
 * @param phone - Teléfono en cualquier formato español
 * @returns Teléfono normalizado (9 dígitos)
 * @throws Error si el formato no es válido
 *
 * @example
 * normalizeSpanishPhone("+34 612 345 678") // => "612345678"
 * normalizeSpanishPhone("612345678")        // => "612345678"
 * normalizeSpanishPhone("34 612-34-56-78") // => "612345678"
 */
export function normalizeSpanishPhone(phone: string): string {
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
  if (!CLEAN_REGEX.test(digits)) {
    throw new Error(
      `Teléfono español inválido: "${phone}". ` +
      `Formato esperado: +34 6XX XXX XXX (móvil) o +34 9XX XXX XXX (fijo)`
    )
  }

  return digits
}

/**
 * Valida si un teléfono español es válido
 *
 * @param phone - Teléfono a validar
 * @returns true si es válido
 *
 * @example
 * isValidSpanishPhone("+34 612 345 678") // => true
 * isValidSpanishPhone("612345678")        // => true
 * isValidSpanishPhone("123456789")        // => false
 */
export function isValidSpanishPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false
  }

  try {
    normalizeSpanishPhone(phone)
    return true
  } catch {
    return false
  }
}

/**
 * Formatea un teléfono para WhatsApp/Twilio
 *
 * @param phone - Teléfono en cualquier formato español
 * @returns Formato "34612345678@c.us" para WhatsApp
 *
 * @example
 * formatPhoneForWhatsApp("+34 612 345 678") // => "34612345678@c.us"
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const normalized = normalizeSpanishPhone(phone)
  return `${SPAIN_COUNTRY_CODE}${normalized}@c.us`
}

/**
 * Formatea un teléfono para mostrar en UI
 *
 * @param phone - Teléfono en cualquier formato español
 * @returns Formato "+34 612 345 678"
 *
 * @example
 * formatPhoneForDisplay("612345678")  // => "+34 612 345 678"
 * formatPhoneForDisplay("+34612345678") // => "+34 612 345 678"
 */
export function formatPhoneForDisplay(phone: string): string {
  const normalized = normalizeSpanishPhone(phone)

  // Formatear como +34 XXX XXX XXX
  return `${SPAIN_PREFIX} ${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`
}

/**
 * Extrae el tipo de teléfono (móvil o fijo)
 *
 * @param phone - Teléfono normalizado o sin normalizar
 * @returns "mobile" | "landline" | null
 */
export function getPhoneType(phone: string): "mobile" | "landline" | null {
  try {
    const normalized = normalizeSpanishPhone(phone)
    const firstDigit = normalized[0]

    if (firstDigit === "6" || firstDigit === "7") {
      return "mobile"
    }
    if (firstDigit === "8" || firstDigit === "9") {
      return "landline"
    }
    return null
  } catch {
    return null
  }
}

/**
 * Compara dos teléfonos españoles normalizándolos
 *
 * @param phone1 - Primer teléfono
 * @param phone2 - Segundo teléfono
 * @returns true si son el mismo teléfono
 */
export function comparePhones(phone1: string, phone2: string): boolean {
  try {
    const norm1 = normalizeSpanishPhone(phone1)
    const norm2 = normalizeSpanishPhone(phone2)
    return norm1 === norm2
  } catch {
    return false
  }
}
