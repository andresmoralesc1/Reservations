// Services Layer - Business Logic Separation
//
// This layer encapsulates all business logic away from API routes.
// Each service is an object with async methods that operate on the database.
//
// Usage:
//   import { reservationService } from '@/services'
//   const reservation = await reservationService.create({...})

export { reservationService } from './reservation.service'
export { tableService } from './table.service'
export { customerService } from './customer.service'

// Re-export types
export type {
  Reservation,
  NewReservation,
  ReservationStatus,
  ReservationSource,
  CreateReservationDto,
  ConfirmReservationDto,
  CancelReservationDto,
  MarkNoShowDto,
  UpdateReservationDto,
  FindByCodeDto,
  FindByPhoneDto,
  ListReservationsDto,
} from './reservation.service'

export type {
  Table,
  NewTable,
  TableBlock,
  GetAvailableTablesDto,
  BlockTableDto,
  UnblockTableDto,
  AssignTableDto,
} from './table.service'

export type {
  Customer,
  NewCustomer,
  FindOrCreateCustomerDto,
  CustomerHistoryDto,
  UpdateCustomerDto,
} from './customer.service'

export { formatPhone } from './customer.service'
