/**
 * Tests para voice-service.ts
 *
 * Lógica de negocio para el servicio de voz.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock del nuevo servicio de reservas
vi.mock('@/lib/services', () => ({
  createReservation: vi.fn(),
  getReservationByCode: vi.fn(),
  cancelReservation: vi.fn(),
  listReservations: vi.fn(),
}))

// Mock de db
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  },
}))

import {
  createReservation,
  getReservationByCode,
  cancelReservation,
} from '@/lib/services'
import { servicesAvailability } from '@/lib/availability/services-availability'
import { db } from '@/lib/db'

// Importar DESPUÉS de los mocks
import { processVoiceAction } from '@/lib/voice/voice-service'

// Type assertions para los mocks
const mockCreateReservation = createReservation as ReturnType<typeof vi.fn>
const mockGetReservationByCode = getReservationByCode as ReturnType<typeof vi.fn>
const mockCancelReservation = cancelReservation as ReturnType<typeof vi.fn>

// Usar spyOn para el singleton servicesAvailability
const mockCheckAvailability = vi.spyOn(servicesAvailability, 'checkAvailabilityWithServices')

// Helper para generar fecha futura válida (Zod requiere fecha >= hoy)
function getFutureDate(daysFromNow = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

// Helper para crear mock de reserva completo
function createMockReservation(overrides: Partial<any> = {}) {
  return {
    id: 'mock-id-1',
    reservationCode: 'RES-TEST1',
    customerId: 'customer-1',
    customerName: 'Carlos García',
    customerPhone: '612345678',
    restaurantId: 'restaurant-1',
    reservationDate: getFutureDate(),
    reservationTime: '20:00',
    partySize: 4,
    tableIds: [],
    status: 'CONFIRMADO',
    source: 'VOICE',
    sessionId: null,
    sessionExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    confirmedAt: null,
    cancelledAt: null,
    estimatedDurationMinutes: 90,
    actualEndTime: null,
    specialRequests: null,
    isComplexCase: false,
    serviceId: null,
    customer: undefined as any,
    restaurant: undefined as any,
    tables: [],
    history: [],
    whatsappMessages: [],
    ...overrides,
  }
}

describe('voice-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkAvailability', () => {
    it('debería retornar disponibilidad cuando hay mesas', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        availableTables: [],
        service: null,
        suggestedTables: [],
        message: 'Hay disponibilidad',
      })

      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(true)
      expect(mockCheckAvailability).toHaveBeenCalledWith({
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
        restaurantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      })
    })

    it('debería usar restaurantId personalizado si se proporciona', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        availableTables: [],
        service: null,
        suggestedTables: [],
        message: 'Hay disponibilidad',
      })

      const customRestaurantId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567891'

      await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
        restaurantId: customRestaurantId,
      })

      expect(mockCheckAvailability).toHaveBeenCalledWith({
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
        restaurantId: customRestaurantId,
      })
    })

    it('debería manejar errores de disponibilidad', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: false,
        availableTables: [],
        service: null,
        suggestedTables: [],
        message: 'No hay disponibilidad',
      })

      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: 10, // Grupo grande
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('No hay disponibilidad')
    })

    it('debería manejar excepciones', async () => {
      mockCheckAvailability.mockRejectedValue(new Error('DB Error'))

      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('No pude verificar')
    })
  })

  describe('createReservation', () => {
    it('debería crear reserva cuando hay disponibilidad', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        availableTables: [],
        service: null,
        suggestedTables: [],
        message: 'Hay disponibilidad',
      })

      mockCreateReservation.mockResolvedValue(createMockReservation())

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      })

      expect(result.success).toBe(true)
      expect(result.reservationCode).toBe('RES-TEST1')
      expect(mockCreateReservation).toHaveBeenCalledWith({
        customerName: 'Carlos García',
        customerPhone: '612345678',
        reservationDate: getFutureDate(),
        reservationTime: '20:00',
        partySize: 4,
        restaurantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        source: 'VOICE',
        specialRequests: undefined,
        tableIds: undefined,
      })
    })

    it('debería incluir specialRequests si se proporcionan', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        availableTables: [],
        service: null,
        suggestedTables: [],
        message: 'Hay disponibilidad',
      })

      mockCreateReservation.mockResolvedValue(createMockReservation())

      await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
        specialRequests: 'Mesa en terraza',
      })

      expect(mockCreateReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          specialRequests: 'Mesa en terraza',
        })
      )
    })

    it('debería fallar si no hay disponibilidad', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: false,
        availableTables: [],
        service: null,
        suggestedTables: [],
        message: 'No hay disponibilidad',
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('No hay disponibilidad')
      expect(mockCreateReservation).not.toHaveBeenCalled()
    })

    it('debería manejar errores al crear reserva', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        availableTables: [],
        service: null,
        suggestedTables: [],
        message: 'Hay disponibilidad',
      })

      mockCreateReservation.mockRejectedValue(new Error('Error al crear'))

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('getReservation', () => {
    it('debería obtener reserva por código', async () => {
      mockGetReservationByCode.mockResolvedValue(createMockReservation({
        reservationCode: 'RES-TEST1',
        status: 'CONFIRMADO',
      }))

      const result = await processVoiceAction('getReservation', {
        code: 'RES-TEST1',
      })

      expect(result.success).toBe(true)
      expect(result.reservation).toBeDefined()
      expect(result.reservation?.reservationCode).toBe('RES-TEST1')
      expect(mockGetReservationByCode).toHaveBeenCalledWith('RES-TEST1')
    })

    it('debería fallar si no existe la reserva', async () => {
      mockGetReservationByCode.mockRejectedValue(new Error('Reserva no encontrada'))

      const result = await processVoiceAction('getReservation', {
        code: 'RES-T1T1E',
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('No encontré ninguna reserva')
    })

    it('debería formatear el mensaje según el estado', async () => {
      mockGetReservationByCode.mockResolvedValue(createMockReservation({
        reservationCode: 'RES-TEST1',
        status: 'PENDIENTE',
      }))

      const result = await processVoiceAction('getReservation', {
        code: 'RES-TEST1',
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('pendiente de confirmación')
    })
  })

  describe('cancelReservation', () => {
    it('debería cancelar reserva con teléfono correcto', async () => {
      const mockRes = createMockReservation({
        reservationCode: 'RES-TEST1',
        customerPhone: '612345678',
        status: 'CONFIRMADO',
      })
      mockGetReservationByCode.mockResolvedValue(mockRes)
      mockCancelReservation.mockResolvedValue(mockRes)

      const result = await processVoiceAction('cancelReservation', {
        code: 'RES-TEST1',
        phone: '612345678',
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('cancelada')
      expect(mockCancelReservation).toHaveBeenCalledWith(mockRes.id)
    })

    it('debería fallar si el teléfono no coincide', async () => {
      mockGetReservationByCode.mockResolvedValue(createMockReservation({
        reservationCode: 'RES-TEST1',
        customerPhone: '612345678',
        status: 'CONFIRMADO',
      }))

      const result = await processVoiceAction('cancelReservation', {
        code: 'RES-TEST1',
        phone: '999999999',
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('no coincide')
    })
  })

  describe('modifyReservation', () => {
    it('debería verificar teléfono antes de modificar', async () => {
      mockGetReservationByCode.mockResolvedValue(createMockReservation({
        reservationCode: 'RES-TEST1',
        customerPhone: '612345678',
        status: 'CONFIRMADO',
      }))

      const result = await processVoiceAction('modifyReservation', {
        code: 'RES-TEST1',
        phone: '612345678',
        changes: {
          newPartySize: 6,
        },
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('no está disponible')
    })

    it('debería fallar si el teléfono no coincide', async () => {
      mockGetReservationByCode.mockResolvedValue(createMockReservation({
        reservationCode: 'RES-TEST1',
        customerPhone: '612345678',
        status: 'CONFIRMADO',
      }))

      const result = await processVoiceAction('modifyReservation', {
        code: 'RES-TEST1',
        phone: '999999999',
        changes: {
          newPartySize: 6,
        },
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('no coincide')
    })
  })

  describe('logCallStart', () => {
    it('debería registrar inicio de llamada', async () => {
      const mockCallLog = { id: 'call-123' }
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockCallLog]),
        }),
      } as any)

      const result = await processVoiceAction('logCallStart', {
        callerPhone: '612345678',
        restaurantId: 'default-restaurant-id',
      })

      expect(result.success).toBe(true)
      expect((result as any).callLogId).toBe('call-123')
    })
  })

  describe('acciones inválidas', () => {
    it('debería rechazar acción desconocida', async () => {
      const result = await processVoiceAction('unknownAction' as any, {})

      expect(result.success).toBe(false)
      expect(result.message).toContain('no reconocida')
    })
  })

  // ============ EDGE CASES ============
  describe('edge cases: fechas inválidas', () => {
    it('debería rechazar fecha en formato incorrecto', async () => {
      const result = await processVoiceAction('checkAvailability', {
        date: '30/03/2026', // Formato europeo, no ISO
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar fecha pasada', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 10)
      const pastDateStr = pastDate.toISOString().split('T')[0]

      const result = await processVoiceAction('checkAvailability', {
        date: pastDateStr,
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar hora en formato incorrecto', async () => {
      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00:00', // Formato con segundos
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })
  })

  describe('edge cases: teléfonos inválidos', () => {
    it('debería rechazar teléfono muy corto', async () => {
      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612', // Muy corto
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería aceptar teléfono con prefijo +34', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        availableTables: [],
        service: null,
        suggestedTables: [],
        message: 'Hay disponibilidad',
      })
      mockCreateReservation.mockResolvedValue(createMockReservation())

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '+34 612 345 678', // Válido con prefijo
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('edge cases: parámetros inválidos', () => {
    it('debería rechazar partySize de 0', async () => {
      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: 0, // Mínimo es 1
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar nombre muy corto (<2 caracteres)', async () => {
      const result = await processVoiceAction('createReservation', {
        customerName: 'A', // Muy corto
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })
  })

  describe('edge cases: parámetros faltantes', () => {
    it('debería rechazar checkAvailability sin fecha', async () => {
      const result = await processVoiceAction('checkAvailability', {
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar createReservation sin nombre', async () => {
      const result = await processVoiceAction('createReservation', {
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })
  })
})
