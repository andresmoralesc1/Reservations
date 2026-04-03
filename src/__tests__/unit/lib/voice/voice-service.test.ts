/**
 * Tests para voice-service.ts
 *
 * Lógica de negocio para el servicio de voz.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { processVoiceAction } from '@/lib/voice/voice-service'
import * as voiceTypes from '@/lib/voice/voice-types'

// Mock legacy-service
vi.mock('@/lib/services/legacy-service', () => ({
  createLegacyReservation: vi.fn(),
  getLegacyReservation: vi.fn(),
  cancelLegacyReservation: vi.fn(),
  checkLegacyAvailability: vi.fn(),
  logLegacyCall: vi.fn(),
}))

// Mock utils
vi.mock('@/lib/utils', () => ({
  generateReservationCode: vi.fn(() => 'RES-TEST1'),
}))

import {
  createLegacyReservation,
  getLegacyReservation,
  cancelLegacyReservation,
  checkLegacyAvailability,
  logLegacyCall,
} from '@/lib/services/legacy-service'

// Type assertion simple para los mocks
const mockCheckLegacyAvailability = checkLegacyAvailability as ReturnType<typeof vi.fn>
const mockCreateLegacyReservation = createLegacyReservation as ReturnType<typeof vi.fn>
const mockGetLegacyReservation = getLegacyReservation as ReturnType<typeof vi.fn>
const mockCancelLegacyReservation = cancelLegacyReservation as ReturnType<typeof vi.fn>
const mockLogLegacyCall = logLegacyCall as ReturnType<typeof vi.fn>

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
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(true)
      expect(checkLegacyAvailability).toHaveBeenCalledWith({
        fecha: getFutureDate(),
        hora: '20:00',
        invitados: 4,
        restaurante: 'default',
      })
    })

    it('debería usar restaurantId personalizado si se proporciona', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
        restaurantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // UUID válido
      })

      expect(checkLegacyAvailability).toHaveBeenCalledWith({
        fecha: getFutureDate(),
        hora: '20:00',
        invitados: 4,
        restaurante: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      })
    })

    it('debería manejar errores de disponibilidad', async () => {
      // Cuando available es false, success debería ser false según la lógica actual
      mockCheckLegacyAvailability.mockResolvedValue({
        success: false,
        available: false,
        message: 'No hay disponibilidad',
        availableTables: [],
      })

      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: 10, // Grupo grande
      })

      // Según la lógica actual: success = result.success || result.available === true
      // Si ambos son false, success es false
      expect(result.success).toBe(false)
      expect(result.message).toContain('No hay disponibilidad')
    })

    it('debería manejar excepciones', async () => {
      mockCheckLegacyAvailability.mockRejectedValue(new Error('DB Error'))

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
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      mockCreateLegacyReservation.mockResolvedValue({
        success: true,
        reservationCode: 'RES-TEST1',
        message: 'Reserva creada',
        data: {} as any,
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      })

      expect(result.success).toBe(true)
      expect(result.reservationCode).toBe('RES-TEST1')
      expect(createLegacyReservation).toHaveBeenCalledWith({
        nombre: 'Carlos García',
        numero: '612345678',
        fecha: getFutureDate(),
        hora: '20:00',
        invitados: 4,
        fuente: 'VOICE',
        restaurante: 'default',
        observaciones: undefined,
      })
    })

    it('debería incluir specialRequests si se proporcionan', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      mockCreateLegacyReservation.mockResolvedValue({
        success: true,
        reservationCode: 'RES-TEST1',
        message: 'Reserva creada',
        data: {} as any,
      })

      await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
        specialRequests: 'Mesa en terraza',
      })

      expect(createLegacyReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          observaciones: 'Mesa en terraza',
        })
      )
    })

    it('debería fallar si no hay disponibilidad', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: false,
        available: false,
        message: 'No hay disponibilidad',
        availableTables: [],
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
      expect(createLegacyReservation).not.toHaveBeenCalled()
    })

    it('debería manejar errores al crear reserva', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      mockCreateLegacyReservation.mockResolvedValue({
        success: false,
        error: 'Error al crear',
      })

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
      mockGetLegacyReservation.mockResolvedValue({
        success: true,
        data: createMockReservation({
          reservationCode: 'RES-TEST1',
          status: 'CONFIRMADO',
        }),
      })

      const result = await processVoiceAction('getReservation', {
        code: 'RES-TEST1',
      })

      expect(result.success).toBe(true)
      expect(result.reservation).toBeDefined()
      expect(result.reservation?.reservationCode).toBe('RES-TEST1')
      expect(getLegacyReservation).toHaveBeenCalledWith('RES-TEST1')
    })

    it('debería fallar si no existe la reserva', async () => {
      mockGetLegacyReservation.mockResolvedValue({
        success: false,
        message: 'No encontré ninguna reserva',
      })

      const result = await processVoiceAction('getReservation', {
        code: 'RES-T1T1E', // Formato válido RES-XXXXX
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('No encontré')
    })

    it('debería rechazar código con formato inválido', async () => {
      // El type guard rechaza códigos que no siguen el formato RES-XXXXX
      const result = await processVoiceAction('getReservation', {
        code: 'INVALID-CODE', // No sigue el formato RES-XXXXX
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería formatear el mensaje según el estado', async () => {
      mockGetLegacyReservation.mockResolvedValue({
        success: true,
        data: createMockReservation({
          reservationCode: 'RES-TEST1',
          status: 'PENDIENTE',
        }),
      })

      const result = await processVoiceAction('getReservation', {
        code: 'RES-TEST1',
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('pendiente de confirmación')
    })
  })

  describe('cancelReservation', () => {
    it('debería cancelar reserva con teléfono correcto', async () => {
      mockCancelLegacyReservation.mockResolvedValue({
        success: true,
        message: 'Reserva RES-TEST1 cancelada correctamente',
      })

      const result = await processVoiceAction('cancelReservation', {
        code: 'RES-TEST1',
        phone: '612345678',
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('cancelada')
      expect(cancelLegacyReservation).toHaveBeenCalledWith('RES-TEST1', '612345678')
    })

    it('debería fallar si el teléfono no coincide', async () => {
      mockCancelLegacyReservation.mockResolvedValue({
        success: false,
        message: 'El número de teléfono no coincide',
      })

      const result = await processVoiceAction('cancelReservation', {
        code: 'RES-TEST1',
        phone: '999999999',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('modifyReservation', () => {
    it('debería verificar teléfono antes de modificar', async () => {
      mockGetLegacyReservation.mockResolvedValue({
        success: true,
        data: createMockReservation({
          reservationCode: 'RES-TEST1',
          customerPhone: '612345678',
          status: 'CONFIRMADO',
        }),
      })

      const result = await processVoiceAction('modifyReservation', {
        code: 'RES-TEST1',
        phone: '612345678',
        changes: {
          newPartySize: 6,
        },
      })

      expect(result.success).toBe(true)
      // Por ahora retorna mensaje de no disponible
      expect(result.message).toContain('no está disponible')
    })

    it('debería fallar si el teléfono no coincide', async () => {
      mockGetLegacyReservation.mockResolvedValue({
        success: true,
        data: createMockReservation({
          reservationCode: 'RES-TEST1',
          customerPhone: '612345678',
          status: 'CONFIRMADO',
        }),
      })

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

    it('debería fallar si no existe la reserva', async () => {
      mockGetLegacyReservation.mockResolvedValue({
        success: false,
        message: 'No encontré ninguna reserva',
      })

      const result = await processVoiceAction('modifyReservation', {
        code: 'RES-INVALID',
        phone: '612345678',
        changes: {
          newPartySize: 6,
        },
      })

      expect(result.success).toBe(false)
    })
  })

  describe('logCallStart', () => {
    it('debería registrar inicio de llamada', async () => {
      mockLogLegacyCall.mockResolvedValue({
        success: true,
        callId: 'log-123',
      })

      const result = await processVoiceAction('logCallStart', {
        callerPhone: '612345678',
        restaurantId: 'default-restaurant-id',
      })

      expect(result.success).toBe(true)
      expect((result as any).callLogId).toBe('log-123')
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

    it('debería rechazar fecha inexistente (ej: 30 de febrero)', async () => {
      const result = await processVoiceAction('checkAvailability', {
        date: '2026-02-30', // No existe
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

    it('debería rechazar hora inválida (25:00)', async () => {
      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '25:00', // Hora inválida
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })
  })

  describe('edge cases: teléfonos inválidos', () => {
    it('debería rechazar teléfono muy corto', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

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

    it('debería rechazar teléfono muy largo', async () => {
      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '+34 612 345 678 901 234', // Demasiado largo
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar teléfono que no empieza por 6/7/8/9', async () => {
      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '512345678', // Empieza por 5, no válido
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar teléfono con letras', async () => {
      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: 'seiscientos', // No es numérico
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería aceptar teléfono con prefijo +34', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })
      mockCreateLegacyReservation.mockResolvedValue({
        success: true,
        reservationCode: 'RES-TEST1',
        message: 'Reserva creada',
        data: {} as any,
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '+34 612 345 678', // Válido con prefijo
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      })

      expect(result.success).toBe(true)
    })

    it('debería aceptar teléfono sin prefijo (9 dígitos)', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })
      mockCreateLegacyReservation.mockResolvedValue({
        success: true,
        reservationCode: 'RES-TEST1',
        message: 'Reserva creada',
        data: {} as any,
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678', // Válido sin prefijo
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

    it('debería rechazar partySize negativo', async () => {
      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: -5,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar partySize muy grande (>50)', async () => {
      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '20:00',
        partySize: 51, // Máximo es 50
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar nombre muy corto (<2 caracteres)', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

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

    it('debería rechazar nombre muy largo (>100 caracteres)', async () => {
      const longName = 'A'.repeat(101)
      const result = await processVoiceAction('createReservation', {
        customerName: longName,
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar specialRequests muy largo (>500 caracteres)', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      const longRequest = 'A'.repeat(501)
      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
        specialRequests: longRequest,
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

    it('debería rechazar checkAvailability sin hora', async () => {
      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
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

    it('debería rechazar createReservation sin teléfono', async () => {
      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        date: getFutureDate(),
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })

    it('debería rechazar cancelReservation sin teléfono', async () => {
      const result = await processVoiceAction('cancelReservation', {
        code: 'RES-TEST1',
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Parámetros inválidos')
    })
  })
})
