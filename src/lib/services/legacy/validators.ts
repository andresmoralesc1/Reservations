/**
 * Validaciones para el módulo legacy
 */

import type { CreateReservationParams, CheckAvailabilityParams } from './types'
// Import phone utilities from the centralized module
import {
  normalizeSpanishPhone,
  isValidSpanishPhone,
  comparePhones,
} from '@/lib/voice/phone-utils'

// Re-export for backward compatibility within legacy module
export { normalizeSpanishPhone, isValidSpanishPhone }

// Alias for backward compatibility
export const validateSpanishPhone = isValidSpanishPhone

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
 * NOTA: Ahora usa comparePhones de phone-utils para consistencia
 */
export const phonesMatch = comparePhones
