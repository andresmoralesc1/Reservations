/**
 * Table Service Tests
 *
 * Tests unitarios para table.service.ts
 * Usan mocks de base de datos, no conectan a Supabase real.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock de services-availability ANTES de importar el servicio
vi.mock('@/lib/availability/services-availability', () => ({
  servicesAvailability: {
    checkAvailabilityWithServices: vi.fn(),
  },
}))

// Mock del módulo db ANTES de importar el servicio
vi.mock('@/lib/db', () => {
  const mockTablesQuery = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  }
  const mockReservationsQuery = {
    findMany: vi.fn(),
  }
  const mockServicesQuery = {
    findMany: vi.fn(),
  }
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()

  return {
    db: {
      query: {
        tables: mockTablesQuery,
        reservations: mockReservationsQuery,
        services: mockServicesQuery,
      },
      insert: mockInsert,
      update: mockUpdate,
      delete: vi.fn(),
    },
  }
})

import {
  getTables,
  getTableById,
  getAvailableTables,
  assignTablesToReservation,
  createTable,
  deleteTable,
} from '@/lib/services/table.service'
import { db } from '@/lib/db'
import { servicesAvailability } from '@/lib/availability/services-availability'

const mockTablesQuery = (db as any).query.tables
const mockReservationsQuery = (db as any).query.reservations
const mockServicesQuery = (db as any).query.services
const mockInsert = (db as any).insert
const mockUpdate = (db as any).update
const mockCheckAvailability = servicesAvailability.checkAvailabilityWithServices as any

describe('Table Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getTables', () => {
    it('debería obtener todas las mesas de un restaurante', async () => {
      // Arrange
      const restaurantId = 'rest-1'
      const tables = [
        { id: 't1', tableNumber: '1', tableCode: 'I-1', capacity: 2, restaurantId },
        { id: 't2', tableNumber: '2', tableCode: 'I-2', capacity: 4, restaurantId },
        { id: 't3', tableNumber: '3', tableCode: 'T-1', capacity: 6, restaurantId },
      ]

      mockTablesQuery.findMany.mockResolvedValue(tables)

      // Act
      const result = await getTables(restaurantId)

      // Assert
      expect(result).toHaveLength(3)
      expect(mockTablesQuery.findMany).toHaveBeenCalled()
    })

    it('debería retornar array vacío si no hay mesas', async () => {
      // Arrange
      mockTablesQuery.findMany.mockResolvedValue([])

      // Act
      const result = await getTables('rest-1')

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getTableById', () => {
    it('debería obtener mesa por ID existente', async () => {
      // Arrange
      const table = {
        id: 'table-5',
        tableNumber: '5',
        tableCode: 'P-1',
        capacity: 8,
        restaurantId: 'rest-1',
      }

      mockTablesQuery.findFirst.mockResolvedValue(table)

      // Act
      const result = await getTableById('table-5')

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe('table-5')
      expect(result.tableCode).toBe('P-1')
    })

    it('debería lanzar error con ID inexistente', async () => {
      // Arrange
      mockTablesQuery.findFirst.mockResolvedValue(null)

      // Act & Assert
      await expect(getTableById('fake-id'))
        .rejects
        .toThrow('Mesa no encontrada')
    })
  })

  describe('getAvailableTables', () => {
    beforeEach(() => {
      // Mock de checkAvailabilityWithServices para simular el filtrado por capacidad
      // y excluir mesas con reservas confirmadas/pendientes que se solapan en tiempo
      mockCheckAvailability.mockImplementation(async (params: any) => {
        // Obtener todas las mesas y reservas del mock
        const allTables = await mockTablesQuery.findMany() as any[]
        const reservations = await mockReservationsQuery.findMany() as any[]

        // Helper para convertir tiempo HH:MM a minutos
        const timeToMinutes = (time: string) => {
          const [hours, mins] = time.split(':').map(Number)
          return hours * 60 + mins
        }

        const requestedTime = timeToMinutes(params.time)

        // Obtener IDs de mesas ocupadas (reservas CONFIRMADO o PENDIENTE que se solapan)
        const occupiedTableIds = new Set<string>()
        for (const res of reservations) {
          if (res.status === 'CONFIRMADO' || res.status === 'PENDIENTE') {
            const resStart = timeToMinutes(res.reservationTime)
            const resEnd = resStart + (res.estimatedDurationMinutes || 90)

            // Verificar si hay solapamiento: la reserva ocupa la mesa si
            // la hora solicitada está dentro del rango de la reserva
            if (requestedTime >= resStart && requestedTime < resEnd) {
              for (const tableId of (res.tableIds || [])) {
                occupiedTableIds.add(tableId)
              }
            }
          }
        }

        // Filtrar por capacidad Y que no estén ocupadas
        const filteredTables = allTables.filter((t: any) =>
          t.capacity >= params.partySize && !occupiedTableIds.has(t.id)
        )

        return {
          available: filteredTables.length > 0,
          availableTables: filteredTables,
          suggestedTables: filteredTables.map((t: any) => t.id),
          service: null,
        }
      })
    })

    it('debería obtener mesas disponibles para fecha/hora y tamaño de grupo', async () => {
      // Arrange
      const restaurantId = 'rest-1'
      const date = '2026-04-15'
      const time = '20:00'
      const partySize = 4

      const allTables = [
        { id: 't1', tableNumber: '1', tableCode: 'I-1', capacity: 2, restaurantId },
        { id: 't2', tableNumber: '2', tableCode: 'I-2', capacity: 4, restaurantId },
        { id: 't3', tableNumber: '3', tableCode: 'T-1', capacity: 6, restaurantId },
        { id: 't4', tableNumber: '4', tableCode: 'P-1', capacity: 8, restaurantId },
      ]

      mockTablesQuery.findMany.mockResolvedValue(allTables)
      mockReservationsQuery.findMany.mockResolvedValue([])

      // Act
      const result = await getAvailableTables(restaurantId, date, time, partySize)

      // Assert
      expect(result).toHaveLength(3) // I-2 (4), T-1 (6), P-1 (8)
      expect(result.every(t => t.capacity >= 4)).toBe(true)
    })

    it('debería excluir mesas con reservas solapadas', async () => {
      // Arrange
      const restaurantId = 'rest-1'
      const date = '2026-04-15'
      const time = '20:00'
      const partySize = 4

      const allTables = [
        { id: 'table-1', tableNumber: '1', tableCode: 'I-1', capacity: 4, restaurantId },
        { id: 'table-2', tableNumber: '2', tableCode: 'I-2', capacity: 4, restaurantId },
      ]

      const existingReservation = {
        id: 'res-1',
        restaurantId,
        reservationDate: date,
        reservationTime: time,
        status: 'CONFIRMADO',
        tableIds: ['table-1'],
        estimatedDurationMinutes: 90,
      }

      mockTablesQuery.findMany.mockResolvedValue(allTables)
      mockReservationsQuery.findMany.mockResolvedValue([existingReservation])

      // Act
      const result = await getAvailableTables(restaurantId, date, time, partySize)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('table-2')
    })

    it('debería incluir mesa si reserva termina antes de la hora solicitada', async () => {
      // Arrange
      const restaurantId = 'rest-1'
      const date = '2026-04-15'
      const time = '21:30'
      const partySize = 4

      const allTables = [
        { id: 'table-1', tableNumber: '1', tableCode: 'I-1', capacity: 4, restaurantId },
      ]

      const existingReservation = {
        id: 'res-1',
        restaurantId,
        reservationDate: date,
        reservationTime: '13:00',
        status: 'CONFIRMADO',
        tableIds: ['table-1'],
        estimatedDurationMinutes: 90,
      }

      mockTablesQuery.findMany.mockResolvedValue(allTables)
      mockReservationsQuery.findMany.mockResolvedValue([existingReservation])

      // Act
      const result = await getAvailableTables(restaurantId, date, time, partySize)

      // Assert
      expect(result).toHaveLength(1)
    })

    it('debería ignorar reservas NO_SHOW para disponibilidad', async () => {
      // Arrange
      const restaurantId = 'rest-1'
      const date = '2026-04-15'
      const time = '20:00'
      const partySize = 2

      const allTables = [
        { id: 'table-1', tableNumber: '1', tableCode: 'I-1', capacity: 2, restaurantId },
      ]

      // Las reservas NO_SHOW no se incluyen en la query (solo CONFIRMADO y PENDIENTE)
      // Simulamos que no hay reservas confirmadas/pendientes
      mockTablesQuery.findMany.mockResolvedValue(allTables)
      mockReservationsQuery.findMany.mockResolvedValue([])

      // Act
      const result = await getAvailableTables(restaurantId, date, time, partySize)

      // Assert
      expect(result).toHaveLength(1) // Mesa disponible
    })

    it('debería considerar PENDIENTE y CONFIRMADO como ocupadas', async () => {
      // Arrange
      const restaurantId = 'rest-1'
      const date = '2026-04-15'
      const time = '20:00'
      const partySize = 2

      const allTables = [
        { id: 'table-1', tableNumber: '1', tableCode: 'I-1', capacity: 2, restaurantId },
      ]

      const pendingReservation = {
        id: 'res-1',
        restaurantId,
        reservationDate: date,
        reservationTime: time,
        status: 'PENDIENTE',
        tableIds: ['table-1'],
        estimatedDurationMinutes: 90,
      }

      mockTablesQuery.findMany.mockResolvedValue(allTables)
      mockReservationsQuery.findMany.mockResolvedValue([pendingReservation])

      // Act
      const result = await getAvailableTables(restaurantId, date, time, partySize)

      // Assert
      expect(result).toHaveLength(0)
    })

    it('debería manejar múltiples reservas en el mismo horario', async () => {
      // Arrange
      const restaurantId = 'rest-1'
      const date = '2026-04-15'
      const time = '20:00'
      const partySize = 2

      const allTables = [
        { id: 't1', tableNumber: '1', tableCode: 'I-1', capacity: 2, restaurantId },
        { id: 't2', tableNumber: '2', tableCode: 'I-2', capacity: 2, restaurantId },
        { id: 't3', tableNumber: '3', tableCode: 'I-3', capacity: 2, restaurantId },
      ]

      const reservations = [
        {
          id: 'res-1',
          reservationDate: date,
          reservationTime: time,
          status: 'CONFIRMADO',
          tableIds: ['t1', 't2'],
          estimatedDurationMinutes: 90,
        },
      ]

      mockTablesQuery.findMany.mockResolvedValue(allTables)
      mockReservationsQuery.findMany.mockResolvedValue(reservations)

      // Act
      const result = await getAvailableTables(restaurantId, date, time, partySize)

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('t3')
    })
  })

  describe('assignTablesToReservation', () => {
    it('debería asignar mesas a una reserva', async () => {
      // Arrange
      const reservation = {
        id: 'res-assign',
        reservationCode: 'RES-ASSIGN',
        tableIds: [],
      }

      const tableIds = ['table-1', 'table-2']

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{
              ...reservation,
              tableIds,
            }])
          })
        })
      })

      // Act
      const result = await assignTablesToReservation({
        reservationId: 'res-assign',
        tableIds,
      })

      // Assert
      expect(result.tableIds).toEqual(tableIds)
    })
  })

  describe('createTable', () => {
    it('debería crear nueva mesa', async () => {
      // Arrange
      const tableData = {
        restaurantId: 'rest-1',
        tableNumber: '10',
        tableCode: 'I-10',
        capacity: 6,
        location: 'interior',
      }

      const newTable = {
        id: 'new-table-id',
        ...tableData,
        createdAt: new Date(),
      }

      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newTable])
        })
      })

      // Act
      const result = await createTable(tableData)

      // Assert
      expect(result.tableNumber).toBe('10')
      expect(result.tableCode).toBe('I-10')
      expect(result.capacity).toBe(6)
    })
  })

  describe('deleteTable', () => {
    it('debería eliminar mesa (soft delete)', async () => {
      // Arrange
      const tableId = 'table-to-delete'
      const deletedBy = 'admin@restaurant.com'

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({})
        })
      })

      // Act
      const result = await deleteTable(tableId, deletedBy)

      // Assert
      expect(result.success).toBe(true)
    })
  })
})
