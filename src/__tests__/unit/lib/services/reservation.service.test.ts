/**
 * Reservation Service Tests
 *
 * Tests unitarios para reservation.service.ts
 * Usan mocks de base de datos, no conectan a Supabase real.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock del módulo db ANTES de importar el servicio
// Usamos factory function para evitar problemas de hoisting
vi.mock('@/lib/db', () => {
  const mockCustomersQuery = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  }
  const mockReservationsQuery = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  }
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()

  return {
    db: {
      query: {
        customers: mockCustomersQuery,
        reservations: mockReservationsQuery,
      },
      insert: mockInsert,
      update: mockUpdate,
      select: vi.fn(),
    },
    // Exportamos para poder usarlos en los tests
    __mocks: {
      customersQuery: mockCustomersQuery,
      reservationsQuery: mockReservationsQuery,
      insert: mockInsert,
      update: mockUpdate,
    },
  }
})

// Importar el servicio después del mock
import {
  createReservation,
  getReservationByCode,
  approveReservation,
  cancelReservation,
  ReservationNotFoundError,
  assignTables,
} from '@/lib/services/reservation.service'

// Importar los mocks
import { db } from '@/lib/db'

const mockCustomersQuery = (db as any).query.customers
const mockReservationsQuery = (db as any).query.reservations
const mockInsert = (db as any).insert
const mockUpdate = (db as any).update

describe('Reservation Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createReservation', () => {
    it('debería crear reserva con datos válidos', async () => {
      // Arrange
      const input = {
        customerName: 'Juan Pérez',
        customerPhone: '+34 612 345 678',
        reservationDate: '2026-04-15',
        reservationTime: '20:00',
        partySize: 4,
        restaurantId: 'restaurant-1',
        source: 'WHATSAPP' as const,
      }

      // Cliente no existe
      mockCustomersQuery.findFirst.mockResolvedValue(null)

      // Mock insert de cliente
      const mockCustomer = {
        id: 'cust-123',
        phoneNumber: '+34 612 345 678',
        name: 'Juan Pérez',
        noShowCount: 0,
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock insert de reserva
      const mockReservation = {
        id: 'res-123',
        reservationCode: 'RES-ABC12',
        customerId: 'cust-123',
        customerName: 'Juan Pérez',
        customerPhone: '+34 612 345 678',
        restaurantId: 'restaurant-1',
        reservationDate: '2026-04-15',
        reservationTime: '20:00',
        partySize: 4,
        tableIds: [],
        status: 'PENDIENTE',
        source: 'WHATSAPP',
        specialRequests: null,
        createdAt: new Date(),
        confirmedAt: null,
        cancelledAt: null,
        updatedAt: new Date(),
      }

      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn()
            .mockResolvedValueOnce([mockCustomer]) // Primera llamada (cliente)
            .mockResolvedValueOnce([mockReservation]) // Segunda llamada (reserva)
        })
      })

      // Act
      const result = await createReservation(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.customerName).toBe('Juan Pérez')
      expect(result.reservationDate).toBe('2026-04-15')
      expect(result.reservationTime).toBe('20:00')
      expect(result.partySize).toBe(4)
      expect(result.status).toBe('PENDIENTE')
      expect(result.source).toBe('WHATSAPP')
      expect(result.reservationCode).toMatch(/^RES-/)
    })

    it('debería crear reserva con cliente existente', async () => {
      // Arrange
      const existingCustomer = {
        id: 'cust-existing',
        phoneNumber: '+34 612 345 678',
        name: 'Juan Pérez',
        noShowCount: 0,
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCustomersQuery.findFirst.mockResolvedValue(existingCustomer)

      const mockReservation = {
        id: 'res-456',
        reservationCode: 'RES-XYZ34',
        customerId: 'cust-existing',
        customerName: 'Juan Pérez',
        customerPhone: '+34 612 345 678',
        restaurantId: 'restaurant-1',
        reservationDate: '2026-04-15',
        reservationTime: '21:00',
        partySize: 2,
        tableIds: [],
        status: 'PENDIENTE',
        source: 'MANUAL',
        specialRequests: null,
        createdAt: new Date(),
        confirmedAt: null,
        cancelledAt: null,
        updatedAt: new Date(),
      }

      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockReservation])
        })
      })

      const input = {
        customerName: 'Juan Pérez',
        customerPhone: '+34 612 345 678',
        reservationDate: '2026-04-15',
        reservationTime: '21:00',
        partySize: 2,
        restaurantId: 'restaurant-1',
      }

      // Act
      const result = await createReservation(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.customerId).toBe('cust-existing')
    })

    it('debería crear reserva con solicitudes especiales', async () => {
      // Arrange
      mockCustomersQuery.findFirst.mockResolvedValue(null)

      const mockReservation = {
        id: 'res-789',
        reservationCode: 'RES-SPEC01',
        customerId: 'cust-new',
        customerName: 'María García',
        customerPhone: '+34 623 456 789',
        restaurantId: 'restaurant-1',
        reservationDate: '2026-04-16',
        reservationTime: '14:00',
        partySize: 6,
        tableIds: [],
        status: 'PENDIENTE',
        source: 'MANUAL',
        specialRequests: 'Silla alta para bebé, alérgia a nueces',
        createdAt: new Date(),
        confirmedAt: null,
        cancelledAt: null,
        updatedAt: new Date(),
      }

      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn()
            .mockResolvedValueOnce([{ id: 'cust-new', phoneNumber: '+34 623 456 789' }])
            .mockResolvedValueOnce([mockReservation])
        })
      })

      const input = {
        customerName: 'María García',
        customerPhone: '+34 623 456 789',
        reservationDate: '2026-04-16',
        reservationTime: '14:00',
        partySize: 6,
        restaurantId: 'restaurant-1',
        specialRequests: 'Silla alta para bebé, alérgia a nueces',
      }

      // Act
      const result = await createReservation(input)

      // Assert
      expect(result.specialRequests).toBe('Silla alta para bebé, alérgia a nueces')
    })
  })

  describe('getReservationByCode', () => {
    it('debería buscar reserva por código existente', async () => {
      // Arrange
      const mockReservation = {
        id: 'res-111',
        reservationCode: 'RES-ABC12',
        customerName: 'Carlos López',
        customerPhone: '+34 611 222 333',
        tables: [],
      }

      mockReservationsQuery.findFirst.mockResolvedValue(mockReservation)

      // Act
      const result = await getReservationByCode('RES-ABC12')

      // Assert
      expect(result).toBeDefined()
      expect(result.reservationCode).toBe('RES-ABC12')
      expect(result.customerName).toBe('Carlos López')
    })

    it('debería lanzar error con código inexistente', async () => {
      // Arrange
      mockReservationsQuery.findFirst.mockResolvedValue(null)

      // Act & Assert
      await expect(getReservationByCode('RES-NOEXISTE'))
        .rejects
        .toThrow(ReservationNotFoundError)
      await expect(getReservationByCode('RES-NOEXISTE'))
        .rejects
        .toThrow('Reserva con código RES-NOEXISTE no encontrada')
    })

    it('debería lanzar error con código vacío', async () => {
      // Arrange
      mockReservationsQuery.findFirst.mockResolvedValue(null)

      // Act & Assert
      await expect(getReservationByCode(''))
        .rejects
        .toThrow(ReservationNotFoundError)
    })
  })

  describe('approveReservation', () => {
    it('debería confirmar reserva existente', async () => {
      // Arrange
      const mockReservation = {
        id: 'res-approve',
        reservationCode: 'RES-APPROVE',
        status: 'PENDIENTE',
      }

      mockReservationsQuery.findFirst.mockResolvedValue(mockReservation)

      const updatedReservation = {
        ...mockReservation,
        status: 'CONFIRMADO',
        confirmedAt: new Date(),
      }

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedReservation])
          })
        })
      })

      // Act
      const result = await approveReservation('res-approve')

      // Assert
      expect(result.status).toBe('CONFIRMADO')
      expect(result.confirmedAt).toBeDefined()
    })

    it('debería lanzar error al confirmar reserva inexistente', async () => {
      // Arrange
      mockReservationsQuery.findFirst.mockResolvedValue(null)

      // Act & Assert
      await expect(approveReservation('fake-id'))
        .rejects
        .toThrow(ReservationNotFoundError)
    })
  })

  describe('cancelReservation', () => {
    it('debería cancelar reserva existente', async () => {
      // Arrange
      const mockReservation = {
        id: 'res-cancel',
        reservationCode: 'RES-CANCEL',
        status: 'PENDIENTE',
        specialRequests: null,
      }

      mockReservationsQuery.findFirst.mockResolvedValue(mockReservation)

      const updatedReservation = {
        ...mockReservation,
        status: 'CANCELADO',
        cancelledAt: new Date(),
      }

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedReservation])
          })
        })
      })

      // Act
      const result = await cancelReservation('res-cancel', 'Cliente lo pidió')

      // Assert
      expect(result.status).toBe('CANCELADO')
      expect(result.cancelledAt).toBeDefined()
    })

    it('debería cancelar reserva con razón', async () => {
      // Arrange
      const mockReservation = {
        id: 'res-cancel2',
        reservationCode: 'RES-CANCEL2',
        status: 'CONFIRMADO',
        specialRequests: 'Cumpleaños',
      }

      mockReservationsQuery.findFirst.mockResolvedValue(mockReservation)

      const updatedReservation = {
        ...mockReservation,
        status: 'CANCELADO',
        specialRequests: 'Cumpleaños\n\nCancelado: Cliente enfermo',
        cancelledAt: new Date(),
      }

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedReservation])
          })
        })
      })

      // Act
      const result = await cancelReservation('res-cancel2', 'Cliente enfermo')

      // Assert
      expect(result.status).toBe('CANCELADO')
      expect(result.specialRequests).toContain('Cliente enfermo')
    })
  })

  describe('assignTables', () => {
    it('debería actualizar mesas asignadas', async () => {
      // Arrange
      const mockReservation = {
        id: 'res-tables',
        reservationCode: 'RES-TABLES',
        tableIds: [],
      }

      mockReservationsQuery.findFirst.mockResolvedValue(mockReservation)

      const newTableIds = ['table-1', 'table-2']
      const updatedReservation = {
        ...mockReservation,
        tableIds: newTableIds,
      }

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedReservation])
          })
        })
      })

      // Act
      const result = await assignTables('res-tables', newTableIds)

      // Assert
      expect(result.tableIds).toEqual(newTableIds)
    })
  })
})
