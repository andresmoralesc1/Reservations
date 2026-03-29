/**
 * Punto de entrada para módulos del panel de administración
 * Exporta tipos, hooks y componentes
 */

// Tipos
export type {
  Table,
  Reservation,
  EnhancedStats,
  ChartData,
  FilterValue,
} from "./types"

export { filterOptions, RESTAURANT_ID } from "./types"

// Hooks
export {
  useAdminStats,
  useFilters,
  useReservations,
  useReservationActions,
  useReservationSelection,
} from "./hooks"

// Componentes
export {
  AdminStats,
  AdminCharts,
  FilterBar,
  ActionBar,
  ReservationsList,
  PageHeader,
} from "./components"
