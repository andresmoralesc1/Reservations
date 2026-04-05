/**
 * Mock Factories for Tests
 *
 * Centralized factory functions to create test data that matches
 * the current Drizzle schema. This prevents TypeScript errors when
 * the schema evolves.
 */

import type { Reservation, Table, Service, Customer } from "@/drizzle/schema"

// ============ RESERVATION ============

/**
 * Creates a mock Reservation with all required fields from the schema.
 * Use overrides to customize specific fields for testing.
 */
export function createMockReservation(overrides?: Partial<Reservation>): Reservation {
  const base: Reservation = {
    // Primary key
    id: "mock-reservation-id",

    // Code
    reservationCode: "MOCK-12345",

    // Customer
    customerId: "mock-customer-id",
    customerName: "Mock Customer",
    customerPhone: "612345678",

    // Reservation details
    restaurantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    reservationDate: "2026-04-15",
    reservationTime: "14:00",
    partySize: 4,
    tableIds: ["mock-table-1"],

    // Status
    status: "PENDIENTE",
    source: "WEB",

    // Service info
    serviceId: null,
    estimatedDurationMinutes: 90,
    actualEndTime: null,

    // Session
    sessionId: null,
    sessionExpiresAt: null,

    // Special
    specialRequests: null,
    isComplexCase: false,

    // Audit
    createdAt: new Date("2026-04-15T10:00:00Z"),
    confirmedAt: null,
    cancelledAt: null,
    updatedAt: new Date("2026-04-15T10:00:00Z"),

    // Soft Delete
    deletedAt: null,
    deletedBy: null,
  }

  return { ...base, ...overrides }
}

// ============ TABLE ============

/**
 * Creates a mock Table with all required fields from the schema.
 */
export function createMockTable(overrides?: Partial<Table>): Table {
  const base: Table = {
    // Primary key
    id: "mock-table-id",

    // Restaurant
    restaurantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",

    // Table info
    tableNumber: "1",
    tableCode: "T-1",
    capacity: 4,
    location: "interior",
    isAccessible: false,

    // Visual layout
    shape: "rectangular",
    positionX: 0,
    positionY: 0,
    rotation: 0,
    width: 100,
    height: 80,
    diameter: 80,
    stoolCount: 0,
    stoolPositions: null,

    // Audit
    createdAt: new Date("2026-04-15T10:00:00Z"),

    // Soft Delete
    deletedAt: null,
    deletedBy: null,
  }

  return { ...base, ...overrides }
}

// ============ SERVICE ============

/**
 * Creates a mock Service with all required fields from the schema.
 */
export function createMockService(overrides?: Partial<Service>): Service {
  const base: Service = {
    // Primary key
    id: "mock-service-id",

    // Restaurant
    restaurantId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",

    // Basic config
    name: "Mock Service",
    description: "Mock service description",
    isActive: true,

    // Service type
    serviceType: "comida",

    // Season and days
    season: "todos",
    dayType: "all",

    // Schedule
    startTime: "13:00",
    endTime: "16:00",

    // Turn config
    defaultDurationMinutes: 90,
    bufferMinutes: 15,
    slotGenerationMode: "auto",

    // Optional fields
    dateRange: null,
    manualSlots: null,
    availableTableIds: null,

    // Audit
    createdAt: new Date("2026-04-15T10:00:00Z"),
    updatedAt: new Date("2026-04-15T10:00:00Z"),

    // Soft Delete
    deletedAt: null,
    deletedBy: null,
  }

  return { ...base, ...overrides }
}

// ============ CUSTOMER ============

/**
 * Creates a mock Customer with all required fields from the schema.
 */
export function createMockCustomer(overrides?: Partial<Customer>): Customer {
  const base: Customer = {
    // Primary key
    id: "mock-customer-id",

    // Customer info
    phoneNumber: "612345678",
    name: "Mock Customer",
    noShowCount: 0,
    tags: null,
    gdprConsentedAt: new Date("2026-04-15T10:00:00Z"),

    // Audit
    createdAt: new Date("2026-04-15T10:00:00Z"),
    updatedAt: new Date("2026-04-15T10:00:00Z"),
  }

  return { ...base, ...overrides }
}

// ============ COMMON OVERRIDES ============

/**
 * Common preset overrides for different test scenarios
 */
export const MockPresets = {
  reservation: {
    confirmed: () => ({ status: "CONFIRMADO" as const, confirmedAt: new Date() }),
    cancelled: () => ({ status: "CANCELADO" as const, cancelledAt: new Date() }),
    noShow: () => ({ status: "NO_SHOW" as const }),
    withService: (serviceId: string) => ({ serviceId }),
    deleted: (deletedBy: string) => ({ deletedAt: new Date(), deletedBy }),
  },

  table: {
    patio: () => ({ location: "patio" as const }),
    terrace: () => ({ location: "terraza" as const }),
    accessible: () => ({ isAccessible: true }),
    circular: () => ({ shape: "circular" as const }),
  },

  service: {
    inactive: () => ({ isActive: false }),
    dinner: () => ({ serviceType: "cena" as const, startTime: "20:00", endTime: "23:00" }),
    weekend: () => ({ dayType: "weekend" as const }),
    deleted: (deletedBy: string) => ({ deletedAt: new Date(), deletedBy }),
  },
} as const
