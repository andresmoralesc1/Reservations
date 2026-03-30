/**
 * Legacy Reservation Service - Modularizado
 *
 * Este archivo mantiene backward compatibility con el módulo original.
 * Todas las funciones son re-exportadas desde sus módulos especializados.
 *
 * Estructura del módulo:
 * - types.ts: Tipos internos
 * - validators.ts: Validaciones de datos
 * - creators.ts: Creación de reservas
 * - finders.ts: Consulta de reservas
 * - cancelers.ts: Cancelación de reservas
 * - checkers.ts: Verificación de disponibilidad
 * - call-logging.ts: Registro de llamadas
 */

// Tipos
export type {
  ReservationSource,
  CreateReservationParams,
  ListReservationsParams,
  LegacyCallParams,
  CheckAvailabilityParams,
  LegacyResult,
  ReservationResult,
  ReservationWithRelations,
} from './types'

// Validadores (para uso externo si es necesario)
export {
  normalizeSpanishPhone,
  validateSpanishPhone,
  validateReservationData,
  validateAvailabilityData,
  phonesMatch,
} from './validators'

// Creadores
export { createLegacyReservation } from './creators'

// Buscadores
export { getLegacyReservation, listLegacyReservations } from './finders'

// Canceladores
export { cancelLegacyReservation } from './cancelers'

// Verificadores
export { checkLegacyAvailability } from './checkers'

// Logging
export { logLegacyCall } from './call-logging'
