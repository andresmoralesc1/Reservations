/**
 * Mock Database para Tests
 *
 * Mock de Drizzle ORM para tests unitarios sin conectar a DB real.
 */

import { vi } from 'vitest'

// ============ Mock Types ============
export interface MockReservation {
  id: string
  reservationCode: string
  customerId: string | null
  customerName: string
  customerPhone: string
  restaurantId: string
  reservationDate: string
  reservationTime: string
  partySize: number
  tableIds: string[]
  status: string
  source: string
  specialRequests?: string | null
  createdAt: Date
  confirmedAt?: Date | null
  cancelledAt?: Date | null
  updatedAt: Date
  customer?: MockCustomer
}

export interface MockCustomer {
  id: string
  phoneNumber: string
  name: string | null
  noShowCount: number
  tags: string[] | null
  createdAt: Date
  updatedAt: Date
}

export interface MockTable {
  id: string
  restaurantId: string
  tableNumber: string
  tableCode: string
  capacity: number
  location: string | null
  isAccessible: boolean
  shape: string
  positionX: number
  positionY: number
  rotation: number
  width: number
  height: number
  diameter: number
  stoolCount: number
  createdAt: Date
}

// ============ Mock Data Store ============
const mockData = {
  customers: [] as MockCustomer[],
  reservations: [] as MockReservation[],
  tables: [] as MockTable[],
}

// ============ Reset function ============
export function resetMockDb() {
  mockData.customers = []
  mockData.reservations = []
  mockData.tables = []
}

// ============ Mock Customer Queries ============
export const mockCustomersQuery = {
  findFirst: vi.fn(async ({ where }: { where?: any }) => {
    if (where?.phoneNumber) {
      return mockData.customers.find(c => c.phoneNumber === where.phoneNumber)
    }
    if (where?.id) {
      return mockData.customers.find(c => c.id === where.id)
    }
    return null
  }),
  findMany: vi.fn(async () => mockData.customers),
}

// ============ Mock Reservation Queries ============
export const mockReservationsQuery = {
  findFirst: vi.fn(async ({ where }: { where?: any }) => {
    if (where?.reservationCode) {
      return mockData.reservations.find(r => r.reservationCode === where.reservationCode)
    }
    if (where?.id) {
      return mockData.reservations.find(r => r.id === where.id)
    }
    return null
  }),
  findMany: vi.fn(async () => mockData.reservations),
}

// ============ Mock Table Queries ============
export const mockTablesQuery = {
  findFirst: vi.fn(async ({ where }: { where?: any }) => {
    if (where?.tableCode) {
      return mockData.tables.find(t => t.tableCode === where.tableCode)
    }
    if (where?.id) {
      return mockData.tables.find(t => t.id === where.id)
    }
    return mockData.tables[0] || null
  }),
  findMany: vi.fn(async () => mockData.tables),
}

// ============ Mock Insert ============
const mockInsert = vi.fn(() => ({
  values: vi.fn((data: any) => ({
    returning: vi.fn(async () => {
      // Generate mock ID
      const newId = `mock-${Date.now()}`

      if (data.customers) {
        const customer = { id: newId, ...data.customers, createdAt: new Date(), updatedAt: new Date() }
        mockData.customers.push(customer)
        return [customer]
      }

      if (data.reservations) {
        const reservation = { id: newId, ...data.reservations, createdAt: new Date(), updatedAt: new Date() }
        mockData.reservations.push(reservation)
        return [reservation]
      }

      if (data.tables) {
        const table = { id: newId, ...data.tables, createdAt: new Date() }
        mockData.tables.push(table)
        return [table]
      }

      return [{ id: newId, ...data }]
    })
  }))
}))

// ============ Mock Update ============
const mockUpdate = vi.fn((table: any) => ({
  set: vi.fn((data: any) => ({
    where: vi.fn((condition: any) => {
      // Find and update record
      if (table === mockReservationsQuery) {
        const idx = mockData.reservations.findIndex(r => r.reservationCode === condition.reservationCode)
        if (idx >= 0) {
          mockData.reservations[idx] = { ...mockData.reservations[idx], ...data, updatedAt: new Date() }
        }
      }
      return {
        returning: vi.fn(async () => []),
        execute: vi.fn(async () => ({}))
      }
    })
  }))
}))

// ============ Mock DB ============
export const mockDb = {
  query: {
    customers: mockCustomersQuery,
    reservations: mockReservationsQuery,
    tables: mockTablesQuery,
  },
  insert: mockInsert,
  update: mockUpdate,
  select: vi.fn(),
  delete: vi.fn(),
}

// ============ Helper: Add test data ============
export function addMockCustomer(customer: Partial<MockCustomer>) {
  const newCustomer: MockCustomer = {
    id: customer.id || `cust-${Date.now()}`,
    phoneNumber: customer.phoneNumber || '612345678',
    name: customer.name || 'Test Customer',
    noShowCount: customer.noShowCount || 0,
    tags: customer.tags || null,
    createdAt: customer.createdAt || new Date(),
    updatedAt: customer.updatedAt || new Date(),
  }
  mockData.customers.push(newCustomer)
  return newCustomer
}

export function addMockReservation(reservation: Partial<MockReservation>) {
  const newReservation: MockReservation = {
    id: reservation.id || `res-${Date.now()}`,
    reservationCode: reservation.reservationCode || `RES-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    customerId: reservation.customerId || null,
    customerName: reservation.customerName || 'Test Customer',
    customerPhone: reservation.customerPhone || '612345678',
    restaurantId: reservation.restaurantId || 'default-restaurant-id',
    reservationDate: reservation.reservationDate || '2026-03-30',
    reservationTime: reservation.reservationTime || '20:00',
    partySize: reservation.partySize || 2,
    tableIds: reservation.tableIds || [],
    status: reservation.status || 'PENDIENTE',
    source: reservation.source || 'WEB',
    specialRequests: reservation.specialRequests || null,
    createdAt: reservation.createdAt || new Date(),
    confirmedAt: reservation.confirmedAt || null,
    cancelledAt: reservation.cancelledAt || null,
    updatedAt: reservation.updatedAt || new Date(),
  }
  mockData.reservations.push(newReservation)
  return newReservation
}

export function addMockTable(table: Partial<MockTable>) {
  const newTable: MockTable = {
    id: table.id || `table-${Date.now()}`,
    restaurantId: table.restaurantId || 'default-restaurant-id',
    tableNumber: table.tableNumber || '1',
    tableCode: table.tableCode || 'I-1',
    capacity: table.capacity || 4,
    location: table.location || 'interior',
    isAccessible: table.isAccessible || false,
    shape: table.shape || 'rectangular',
    positionX: table.positionX || 0,
    positionY: table.positionY || 0,
    rotation: table.rotation || 0,
    width: table.width || 100,
    height: table.height || 80,
    diameter: table.diameter || 80,
    stoolCount: table.stoolCount || 0,
    createdAt: table.createdAt || new Date(),
  }
  mockData.tables.push(newTable)
  return newTable
}

// ============ Vitest Module Mock ============
vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

export default mockDb
