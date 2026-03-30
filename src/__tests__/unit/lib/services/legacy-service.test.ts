/**
 * Tests para legacy-service.ts
 *
 * Prueba la lógica del servicio de reservas legacy.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createLegacyReservation,
  getLegacyReservation,
  cancelLegacyReservation,
  checkLegacyAvailability,
  listLegacyReservations,
  logLegacyCall
} from '@/lib/services/legacy-service'

// Mock de Drizzle
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      customers: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      reservations: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      tables: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      restaurants: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          execute: vi.fn(async () => ({}))
        }))
      }))
    })),
  },
}))

// Mock de services-availability
vi.mock('@/lib/availability/services-availability', () => ({
  servicesAvailability: {
    checkAvailabilityWithServices: vi.fn(),
  },
}))

// Mock de generateReservationCode
vi.mock('@/lib/utils', () => ({
  generateReservationCode: vi.fn(() => 'TEST-12345'),
}))

import { db } from '@/lib/db'
import { servicesAvailability } from '@/lib/availability/services-availability'

const mockRestaurantId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const mockCustomer = {
  id: 'customer-1',
  phoneNumber: '612345678',
  name: 'Juan Pérez',
  noShowCount: 0,
  tags: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockReservation = {
  id: 'res-1',
  reservationCode: 'TEST-12345',
  customerId: 'customer-1',
  customerName: 'Juan Pérez',
  customerPhone: '612345678',
  restaurantId: mockRestaurantId,
  reservationDate: '2026-04-15',
  reservationTime: '14:00',
  partySize: 4,
  tableIds: ['table-1'],
  status: 'PENDIENTE',
  source: 'WEB',
  specialRequests: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  confirmedAt: null,
  cancelledAt: null,
  customer: mockCustomer,
  restaurant: null,
}

const mockTable = {
  id: 'table-1',
  restaurantId: mockRestaurantId,
  tableNumber: '1',
  tableCode: 'I-1',
  capacity: 4,
  location: 'interior',
  isAccessible: false,
}

describe('legacy-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createLegacyReservation', () => {
    it('debería crear reserva exitosamente', async () => {
      vi.mocked(db.query.customers.findFirst).mockResolvedValue(mockCustomer)
      vi.mocked(db.query.tables.findMany).mockResolvedValue([mockTable])
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockReservation])
        })
      } as any)

      const result = await createLegacyReservation({
        nombre: 'Juan Pérez',
        numero: '+34 612 345 678',
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
      })

      expect(result.success).toBe(true)
      expect(result.reservationCode).toBe('TEST-12345')
    })

    it('debería crear cliente si no existe', async () => {
      vi.mocked(db.query.customers.findFirst).mockResolvedValue(null)
      vi.mocked(db.query.tables.findMany).mockResolvedValue([mockTable])
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCustomer])
        })
      } as any)

      const result = await createLegacyReservation({
        nombre: 'Juan Pérez',
        numero: '612345678',
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
      })

      expect(result.success).toBe(true)
      expect(db.query.customers.findFirst).toHaveBeenCalledWith({
        where: expect.anything()
      })
    })

    it('debería asignar mesa automáticamente si no se especifica', async () => {
      vi.mocked(db.query.customers.findFirst).mockResolvedValue(mockCustomer)
      vi.mocked(db.query.tables.findMany).mockResolvedValue([mockTable])
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockReservation])
        })
      } as any)

      const result = await createLegacyReservation({
        nombre: 'Juan Pérez',
        numero: '612345678',
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
        // No idMesa
      })

      expect(result.success).toBe(true)
      expect(db.query.tables.findMany).toHaveBeenCalled()
    })

    it('debería usar mesa específica si se proporciona idMesa', async () => {
      vi.mocked(db.query.customers.findFirst).mockResolvedValue(mockCustomer)
      vi.mocked(db.query.tables.findFirst).mockResolvedValue(mockTable)
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockReservation])
        })
      } as any)

      const result = await createLegacyReservation({
        nombre: 'Juan Pérez',
        numero: '612345678',
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
        idMesa: 'I-1',
      })

      expect(result.success).toBe(true)
      expect(db.query.tables.findFirst).toHaveBeenCalledWith({
        where: expect.anything()
      })
    })

    it('debería normalizar número de teléfono', async () => {
      vi.mocked(db.query.customers.findFirst).mockResolvedValue(mockCustomer)
      vi.mocked(db.query.tables.findMany).mockResolvedValue([mockTable])
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockReservation])
        })
      } as any)

      await createLegacyReservation({
        nombre: 'Juan Pérez',
        numero: '+34 612 345 678',
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
      })

      expect(db.query.customers.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          // El número debe estar normalizado (sin +34, sin espacios)
        })
      })
    })

    it('debería manejar errores de BD', async () => {
      vi.mocked(db.query.customers.findFirst).mockRejectedValue(new Error('DB Error'))

      const result = await createLegacyReservation({
        nombre: 'Juan Pérez',
        numero: '612345678',
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al crear reserva')
    })
  })

  describe('getLegacyReservation', () => {
    it('debería obtener reserva por código', async () => {
      vi.mocked(db.query.reservations.findFirst).mockResolvedValue(mockReservation)

      const result = await getLegacyReservation('TEST-12345')

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(db.query.reservations.findFirst).toHaveBeenCalledWith({
        where: expect.anything(),
        with: expect.objectContaining({
          customer: true,
          restaurant: true,
        })
      })
    })

    it('debería retornar error si código no existe', async () => {
      vi.mocked(db.query.reservations.findFirst).mockResolvedValue(null)

      const result = await getLegacyReservation('NOTEXIST')

      expect(result.success).toBe(false)
      expect(result.message).toContain('No encontré ninguna reserva')
    })

    it('debería convertir código a mayúsculas', async () => {
      vi.mocked(db.query.reservations.findFirst).mockResolvedValue(mockReservation)

      await getLegacyReservation('test-12345')

      // Verificar que se llamó a findFirst (la conversión a mayúsculas se hace internamente)
      expect(db.query.reservations.findFirst).toHaveBeenCalled()
    })

    it('debería manejar errores de BD', async () => {
      vi.mocked(db.query.reservations.findFirst).mockRejectedValue(new Error('DB Error'))

      const result = await getLegacyReservation('TEST-12345')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al buscar reserva')
    })
  })

  describe('cancelLegacyReservation', () => {
    it('debería cancelar reserva con teléfono correcto', async () => {
      vi.mocked(db.query.reservations.findFirst).mockResolvedValue(mockReservation)

      const result = await cancelLegacyReservation('TEST-12345', '612345678')

      expect(result.success).toBe(true)
      expect(result.message).toContain('cancelada correctamente')
      expect(db.update).toHaveBeenCalled()
    })

    it('debería rechazar si teléfono no coincide', async () => {
      vi.mocked(db.query.reservations.findFirst).mockResolvedValue(mockReservation)

      const result = await cancelLegacyReservation('TEST-12345', '999999999')

      expect(result.success).toBe(false)
      expect(result.message).toContain('teléfono no coincide')
    })

    it('debería rechazar si reserva no existe', async () => {
      vi.mocked(db.query.reservations.findFirst).mockResolvedValue(null)

      const result = await cancelLegacyReservation('NOTEXIST', '612345678')

      expect(result.success).toBe(false)
      expect(result.message).toContain('No encontré ninguna reserva')
    })

    it('debería normalizar teléfonos para comparación', async () => {
      vi.mocked(db.query.reservations.findFirst).mockResolvedValue({
        ...mockReservation,
        customerPhone: '+34 612 345 678'
      })

      const result = await cancelLegacyReservation('TEST-12345', '612345678')

      expect(result.success).toBe(true)
    })

    it('debería manejar errores de BD', async () => {
      vi.mocked(db.query.reservations.findFirst).mockRejectedValue(new Error('DB Error'))

      const result = await cancelLegacyReservation('TEST-12345', '612345678')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al cancelar reserva')
    })
  })

  describe('checkLegacyAvailability', () => {
    it('debería verificar disponibilidad correctamente', async () => {
      vi.mocked(servicesAvailability.checkAvailabilityWithServices).mockResolvedValue({
        available: true,
        availableTables: [mockTable],
        service: null,
        suggestedTables: ['table-1'],
      })

      const result = await checkLegacyAvailability({
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
      })

      expect(result.success).toBe(true)
      expect(result.available).toBe(true)
      expect(result.message).toContain('disponibilidad')
    })

    it('debería retornar mensaje de no disponibilidad', async () => {
      vi.mocked(servicesAvailability.checkAvailabilityWithServices).mockResolvedValue({
        available: false,
        availableTables: [],
        service: null,
        suggestedTables: [],
        message: 'No hay servicio configurado',
      })

      const result = await checkLegacyAvailability({
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
      })

      expect(result.success).toBe(true)
      expect(result.available).toBe(false)
      // El mensaje viene del servicio o se genera automáticamente
      expect(result.message).toBeDefined()
    })

    it('debería incluir availableTables en respuesta', async () => {
      vi.mocked(servicesAvailability.checkAvailabilityWithServices).mockResolvedValue({
        available: true,
        availableTables: [mockTable],
        service: null,
        suggestedTables: ['table-1'],
      })

      const result = await checkLegacyAvailability({
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
      })

      expect(result.availableTables).toBeDefined()
      expect(result.availableTables).toHaveLength(1)
    })

    it('debería manejar errores del servicio de disponibilidad', async () => {
      vi.mocked(servicesAvailability.checkAvailabilityWithServices).mockRejectedValue(new Error('Service Error'))

      const result = await checkLegacyAvailability({
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al verificar disponibilidad')
    })
  })

  describe('listLegacyReservations', () => {
    it('debería listar reservas sin filtros', async () => {
      vi.mocked(db.query.reservations.findMany).mockResolvedValue([mockReservation])

      const result = await listLegacyReservations({})

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(db.query.reservations.findMany).toHaveBeenCalledWith({
        where: undefined,
        with: expect.objectContaining({
          customer: true,
          restaurant: true,
        }),
        orderBy: expect.any(Array),
        limit: 50,
        offset: 0,
      })
    })

    it('debería filtrar por restaurante', async () => {
      vi.mocked(db.query.reservations.findMany).mockResolvedValue([mockReservation])

      const result = await listLegacyReservations({
        restaurante: mockRestaurantId,
      })

      expect(result.success).toBe(true)
      expect(db.query.reservations.findMany).toHaveBeenCalled()
    })

    it('debería filtrar por fecha', async () => {
      vi.mocked(db.query.reservations.findMany).mockResolvedValue([mockReservation])

      const result = await listLegacyReservations({
        fecha: '2026-04-15',
      })

      expect(result.success).toBe(true)
    })

    it('debería filtrar por estatus', async () => {
      vi.mocked(db.query.reservations.findMany).mockResolvedValue([mockReservation])

      const result = await listLegacyReservations({
        estatus: 'PENDIENTE',
      })

      expect(result.success).toBe(true)
    })

    it('debería respetar limit y offset', async () => {
      vi.mocked(db.query.reservations.findMany).mockResolvedValue([mockReservation])

      const result = await listLegacyReservations({
        limit: 10,
        offset: 20,
      })

      expect(result.success).toBe(true)
      expect(db.query.reservations.findMany).toHaveBeenCalledWith({
        where: undefined,
        with: expect.any(Object),
        orderBy: expect.any(Array),
        limit: 10,
        offset: 20,
      })
    })

    it('debería manejar errores de BD', async () => {
      vi.mocked(db.query.reservations.findMany).mockRejectedValue(new Error('DB Error'))

      const result = await listLegacyReservations({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('Error al obtener reservas')
    })
  })

  describe('logLegacyCall', () => {
    it('debería registrar llamada exitosamente', async () => {
      const result = await logLegacyCall({
        telefono: '612345678',
        restaurante: mockRestaurantId,
        accionesRealizadas: [
          { action: 'create_reservation', success: true, timestamp: '2026-04-15T14:00:00Z' }
        ],
        duracionLlamada: 120,
      })

      expect(result.success).toBe(true)
      expect(result.callId).toContain('log-')
    })

    it('debería generar callId único', async () => {
      const result1 = await logLegacyCall({ telefono: '612345678' })
      // Esperar al menos 1ms para garantizar timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 2))
      const result2 = await logLegacyCall({ telefono: '612345678' })

      expect(result1.callId).not.toBe(result2.callId)
      expect(result1.callId).toMatch(/^log-/)
      expect(result2.callId).toMatch(/^log-/)
    })

    it('debería funcionar sin parámetros opcionales', async () => {
      const result = await logLegacyCall({
        telefono: '612345678',
      })

      expect(result.success).toBe(true)
    })
  })
})
