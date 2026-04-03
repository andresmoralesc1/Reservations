/**
 * Tipos compartidos para el panel de administración
 * Los tipos base Table, Reservation y Customer ahora vienen de @/drizzle/schema
 */

import type { Table, Reservation } from "@/drizzle/schema"

export type { Table, Reservation }

// Admin-specific reservation type with extra fields
export type AdminReservation = Reservation & {
  tables?: Table[]
  restaurant?: {
    name: string
    phone: string
    address: string
  }
  customerNoShowCount?: number
  customerTags?: string[]
}

export interface EnhancedStats {
  // Today's stats
  totalToday: number
  confirmedCount: number
  pendingCount: number
  cancelledCount: number
  noShowCount: number
  confirmationRate: number
  avgPartySize: number
  occupancyRate: number
  totalCovers: number

  // Queue stats
  totalPending: number
  expiredSessions: number
  nextHourCount: number

  // Restaurant info
  totalTables: number
  totalCapacity: number
}

export interface ChartData {
  hourly: {
    data: Array<{
      hour: number
      label: string
      count: number
      confirmed: number
      pending: number
      cancelled: number
      covers: number
    }>
    maxCount: number
  }
  statusDistribution: {
    data: {
      PENDIENTE: number
      CONFIRMADO: number
      CANCELADO: number
      NO_SHOW: number
    }
    total: number
    percentages: {
      PENDIENTE: number
      CONFIRMADO: number
      CANCELADO: number
      NO_SHOW: number
    }
  }
}

export type FilterValue = "all" | "pending" | "confirmed" | "cancelled" | "noShows"

export const filterOptions: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "cancelled", label: "Canceladas" },
  { value: "noShows", label: "No-Shows" },
]

// TODO: Get from environment or auth
export const RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
