/**
 * Services Layer - Exportaciones
 *
 * Capa de lógica de negocio centralizada.
 * Las API routes deben usar estos servicios en lugar de tener lógica directa.
 */

// Reservation Service
export {
  createReservation,
  getReservationByCode,
  getReservationById,
  listReservations,
  approveReservation,
  rejectReservation,
  cancelReservation,
  markNoShow,
  updateReservation,
  assignTables,
  deleteReservation,
  countByStatus,
  getReservationsByDateRange,
  getPendingReservations,
  type CreateReservationInput,
  type UpdateReservationInput,
  type ReservationFilters,
} from "./reservation.service"

export { ReservationError, ReservationNotFoundError } from "./reservation.service"

// Analytics Service
export {
  getDashboardStats,
  getChartData,
  getOccupancyStats,
  getTopNoShows,
  getReservationTrends,
  type DashboardStatsOptions,
  type EnhancedStats,
  type ChartData,
} from "./analytics.service"

// Analytics Aggregation Service (Pre-calculated daily metrics)
export {
  calculateAndStoreDailyAnalytics,
  backfillDailyAnalytics,
  getPreCalculatedAnalytics,
  getHybridAnalytics,
  type DailyAnalyticsInput,
} from "./analytics-aggregate.service"

// Table Service
export {
  getTables,
  getTableById,
  getAvailableTables,
  getTablesWithAvailability,
  assignTablesToReservation,
  createTable,
  updateTable,
  deleteTable,
  createBulkTables,
  type TableAvailability,
  type AssignTableInput,
} from "./table.service"

// Customer Service
export {
  findOrCreateCustomer,
  getCustomerByPhone,
  getCustomerById,
  updateCustomer,
  incrementNoShowCount,
  getCustomerStats,
  getRiskCustomers,
  searchCustomers,
  addCustomerTag,
  removeCustomerTag,
  type CustomerInput,
  type CustomerStats,
} from "./customer.service"
