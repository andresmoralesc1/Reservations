/**
 * Tipos centralizados para Servicios
 */

/**
 * Tipos de servicio
 */
export type ServiceType =
  | "comida"
  | "cena"

/**
 * Temporadas
 */
export type Season =
  | "invierno"
  | "primavera"
  | "verano"
  | "otoño"
  | "todos"

/**
 * Tipos de día
 */
export type DayType =
  | "weekday"  // Lunes-Viernes
  | "weekend"  // Sábado-Domingo
  | "all"      // Todos los días

/**
 * Modos de generación de turnos
 */
export type SlotGenerationMode =
  | "auto"     // Generado automáticamente
  | "manual"   // Turnos manuales específicos

/**
 * Servicio completo
 */
export interface Service {
  id: string
  restaurantId: string
  name: string
  description?: string
  isActive: boolean
  serviceType: ServiceType
  season: Season
  dayType: DayType
  startTime: string // HH:MM
  endTime: string // HH:MM
  defaultDurationMinutes: number
  bufferMinutes: number // Tiempo entre turnos
  slotGenerationMode: SlotGenerationMode
  dateRange?: { // Rango de fechas opcional
    start: string // YYYY-MM-DD
    end: string // YYYY-MM-DD
  }
  manualSlots?: string[] // Turnos manuales si mode=manual
  availableTableIds?: string[] // Mesas asignadas a este servicio
  createdAt: Date
  updatedAt: Date
}

/**
 * Servicio simplificado para listas
 */
export interface ServiceListItem {
  id: string
  name: string
  serviceType: ServiceType
  season: Season
  dayType: DayType
  startTime: string
  endTime: string
  isActive: boolean
}

/**
 * DTO para crear servicio
 */
export interface CreateServiceDTO {
  restaurantId: string
  name: string
  description?: string
  serviceType: ServiceType
  season: Season
  dayType: DayType
  startTime: string
  endTime: string
  defaultDurationMinutes: number
  bufferMinutes: number
  slotGenerationMode: SlotGenerationMode
  dateRange?: { start: string; end: string }
  manualSlots?: string[]
  availableTableIds?: string[]
}

/**
 * DTO para actualizar servicio
 */
export interface UpdateServiceDTO {
  name?: string
  description?: string
  isActive?: boolean
  serviceType?: ServiceType
  season?: Season
  dayType?: DayType
  startTime?: string
  endTime?: string
  defaultDurationMinutes?: number
  bufferMinutes?: number
  slotGenerationMode?: SlotGenerationMode
  dateRange?: { start: string; end: string }
  manualSlots?: string[]
  availableTableIds?: string[]
}

/**
 * Turno disponible
 */
export interface AvailableSlot {
  time: string // HH:MM
  available: boolean
  availableTables: string[]
  reason?: string
}

/**
 * Servicio con información de disponibilidad
 */
export interface ServiceWithAvailability extends Service {
  availableSlots: AvailableSlot[]
  date: string
}

/**
 * Filtros para búsqueda de servicios
 */
export interface ServiceFilters {
  serviceType?: ServiceType
  season?: Season
  dayType?: DayType
  isActive?: boolean
  date?: string // Para verificar si aplica en esa fecha
}

/**
 * Validación de configuración de servicio
 */
export interface ServiceValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Función para validar configuración de servicio
 */
export function validateServiceConfig(service: Partial<CreateServiceDTO>): ServiceValidationResult {
  const errors: string[] = []

  // Validar tipo de servicio
  if (service.serviceType && !['comida', 'cena'].includes(service.serviceType)) {
    errors.push('El tipo de servicio debe ser "comida" o "cena"')
  }

  // Validar rangos de tiempo
  if (service.startTime && service.endTime) {
    const start = parseTimeToMinutes(service.startTime)
    const end = parseTimeToMinutes(service.endTime)

    if (start >= end) {
      errors.push('La hora de inicio debe ser anterior a la hora de fin')
    }

    if (service.serviceType === 'comida') {
      const comidaStart = parseTimeToMinutes('13:00')
      const comidaEnd = parseTimeToMinutes('16:00')
      if (start < comidaStart || end > comidaEnd) {
        errors.push('El servicio de comida debe estar entre 13:00 y 16:00')
      }
    }

    if (service.serviceType === 'cena') {
      const cenaStart = parseTimeToMinutes('20:00')
      const cenaEnd = parseTimeToMinutes('23:00')
      if (start < cenaStart || end > cenaEnd) {
        errors.push('El servicio de cena debe estar entre 20:00 y 23:00')
      }
    }
  }

  // Validar duración
  if (service.defaultDurationMinutes !== undefined) {
    if (service.defaultDurationMinutes < 60 || service.defaultDurationMinutes > 180) {
      errors.push('La duración debe estar entre 60 y 180 minutos')
    }
  }

  // Validar buffer
  if (service.bufferMinutes !== undefined) {
    if (service.bufferMinutes < 10 || service.bufferMinutes > 30) {
      errors.push('El tiempo de buffer debe estar entre 10 y 30 minutos')
    }
  }

  // Validar modo de generación
  if (service.slotGenerationMode && !['auto', 'manual'].includes(service.slotGenerationMode)) {
    errors.push('El modo de generación debe ser "auto" o "manual"')
  }

  // Si es manual, requiere turnos
  if (service.slotGenerationMode === 'manual' && (!service.manualSlots || service.manualSlots.length === 0)) {
    errors.push('En modo manual, debes especificar los turnos')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Helper: Convertir tiempo HH:MM a minutos desde medianoche
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
