/**
 * Tipos centralizados del sistema
 *
 * Single source of truth para todos los tipos.
 * Importa desde aquí para evitar duplicación.
 */

// Reservation types
export {
  ReservationStatus,
  STATUS_TO_ENGLISH,
  STATUS_TO_SPANISH,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_MAP,
  STATUS_REVERSE_MAP,
  translateStatusToEnglish,
  translateStatusToSpanish,
  isValidReservationStatus,
} from './reservation'

export type {
  ReservationStatusEnum,
  Reservation,
  ReservationSource,
  CreateReservationDTO,
  UpdateReservationDTO,
  ReservationListItem,
  ReservationWithRelations,
  ReservationFilters,
  ReservationStats,
  LegacyStatusMap,
} from './reservation'

// Table types
export type {
  Table,
  TableLocation,
  TableShape,
  TableListItem,
  CreateTableDTO,
  UpdateTableDTO,
  TableWithStatus,
  TableBlock,
  TableFilters,
  TableStats,
} from './table'

// Service types
export {
  validateServiceConfig,
} from './service'

export type {
  Service,
  ServiceType,
  Season,
  DayType,
  SlotGenerationMode,
  ServiceListItem,
  CreateServiceDTO,
  UpdateServiceDTO,
  AvailableSlot,
  ServiceWithAvailability,
  ServiceFilters,
  ServiceValidationResult,
} from './service'
