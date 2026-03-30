/**
 * Validaciones para el módulo legacy
 */

import type { CreateReservationParams, CheckAvailabilityParams } from './types'

/**
 * Normaliza un número de teléfono español
 * - Elimina todos los caracteres no numéricos
 * - Elimina el prefijo +34 si está presente
 */
export function normalizeSpanishPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, "")
  // Eliminar prefijo 34 si está presente y el número tiene 11 dígitos
  return normalized.startsWith("34") && normalized.length === 11
    ? normalized.slice(2)
    : normalized
}

/**
 * Valida que un número de teléfono español tenga el formato correcto
 * - Debe tener 9 dígitos (sin contar el prefijo internacional)
 * - Debe comenzar con 6 o 7 (móviles) o 8/9 (fijos)
 */
export function validateSpanishPhone(phone: string): boolean {
  const normalized = normalizeSpanishPhone(phone)
  const phoneRegex = /^[67]\d{8}$|^[89]\d{8}$/
  return phoneRegex.test(normalized)
}

/**
 * Valida los datos de creación de reserva
 */
export function validateReservationData(data: CreateReservationParams): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validar nombre
  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres')
  }

  // Validar teléfono
  if (!data.numero || !validateSpanishPhone(data.numero)) {
    errors.push('El número de teléfono no es válido')
  }

  // Validar fecha (formato YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!data.fecha || !dateRegex.test(data.fecha)) {
    errors.push('La fecha debe tener el formato YYYY-MM-DD')
  } else {
    const date = new Date(data.fecha)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) {
      errors.push('La fecha no puede ser anterior a hoy')
    }
  }

  // Validar hora (formato HH:MM)
  const timeRegex = /^\d{2}:\d{2}$/
  if (!data.hora || !timeRegex.test(data.hora)) {
    errors.push('La hora debe tener el formato HH:MM')
  } else {
    const [hours, minutes] = data.hora.split(':').map(Number)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      errors.push('La hora no es válida')
    }
  }

  // Validar número de invitados
  if (!data.invitados || data.invitados < 1 || data.invitados > 50) {
    errors.push('El número de invitados debe estar entre 1 y 50')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valida los datos de verificación de disponibilidad
 */
export function validateAvailabilityData(data: CheckAvailabilityParams): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Validar fecha
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!data.fecha || !dateRegex.test(data.fecha)) {
    errors.push('La fecha debe tener el formato YYYY-MM-DD')
  }

  // Validar hora
  const timeRegex = /^\d{2}:\d{2}$/
  if (!data.hora || !timeRegex.test(data.hora)) {
    errors.push('La hora debe tener el formato HH:MM')
  }

  // Validar número de invitados
  if (!data.invitados || data.invitados < 1 || data.invitados > 50) {
    errors.push('El número de invitados debe estar entre 1 y 50')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valida que dos números de teléfono coincidan (flexible)
 * Permite coincidencias parciales para manejar diferentes formatos
 */
export function phonesMatch(phone1: string, phone2: string): boolean {
  const normalized1 = normalizeSpanishPhone(phone1)
  const normalized2 = normalizeSpanishPhone(phone2)

  return normalized1 === normalized2 ||
    normalized1.includes(normalized2) ||
    normalized2.includes(normalized1)
}
