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

// Helper para crear mock de reserva completo
function createMockReservation(overrides: Partial<any> = {}) {
  return {
    id: 'mock-id-1',
    reservationCode: 'RES-TEST1',
    customerId: 'customer-1',
    customerName: 'Carlos García',
    customerPhone: '612345678',
    restaurantId: 'restaurant-1',
    reservationDate: '2026-03-30',
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
      vi.mocked(checkLegacyAvailability).mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      const result = await processVoiceAction('checkAvailability', {
        date: '2026-03-30',
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(true)
      expect(checkLegacyAvailability).toHaveBeenCalledWith({
        fecha: '2026-03-30',
        hora: '20:00',
        invitados: 4,
        restaurante: 'default',
      })
    })

    it('debería usar restaurantId personalizado si se proporciona', async () => {
      vi.mocked(checkLegacyAvailability).mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      await processVoiceAction('checkAvailability', {
        date: '2026-03-30',
        time: '20:00',
        partySize: 4,
        restaurantId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // UUID válido
      })

      expect(checkLegacyAvailability).toHaveBeenCalledWith({
        fecha: '2026-03-30',
        hora: '20:00',
        invitados: 4,
        restaurante: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      })
    })

    it('debería manejar errores de disponibilidad', async () => {
      // Cuando available es false, success debería ser false según la lógica actual
      vi.mocked(checkLegacyAvailability).mockResolvedValue({
        success: false,
        available: false,
        message: 'No hay disponibilidad',
        availableTables: [],
      })

      const result = await processVoiceAction('checkAvailability', {
        date: '2026-03-30',
        time: '20:00',
        partySize: 10, // Grupo grande
      })

      // Según la lógica actual: success = result.success || result.available === true
      // Si ambos son false, success es false
      expect(result.success).toBe(false)
      expect(result.message).toContain('No hay disponibilidad')
    })

    it('debería manejar excepciones', async () => {
      vi.mocked(checkLegacyAvailability).mockRejectedValue(new Error('DB Error'))

      const result = await processVoiceAction('checkAvailability', {
        date: '2026-03-30',
        time: '20:00',
        partySize: 4,
      } as unknown)

      expect(result.success).toBe(false)
      expect(result.message).toContain('No pude verificar')
    })
  })

  describe('createReservation', () => {
    it('debería crear reserva cuando hay disponibilidad', async () => {
      vi.mocked(checkLegacyAvailability).mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      vi.mocked(createLegacyReservation).mockResolvedValue({
        success: true,
        reservationCode: 'RES-TEST1',
        message: 'Reserva creada',
        data: {} as any,
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: '2026-03-30',
        time: '20:00',
        partySize: 4,
      })

      expect(result.success).toBe(true)
      expect(result.reservationCode).toBe('RES-TEST1')
      expect(createLegacyReservation).toHaveBeenCalledWith({
        nombre: 'Carlos García',
        numero: '612345678',
        fecha: '2026-03-30',
        hora: '20:00',
        invitados: 4,
        fuente: 'VOICE',
        restaurante: 'default',
        observaciones: undefined,
      })
    })

    it('debería incluir specialRequests si se proporcionan', async () => {
      vi.mocked(checkLegacyAvailability).mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      vi.mocked(createLegacyReservation).mockResolvedValue({
        success: true,
        reservationCode: 'RES-TEST1',
        message: 'Reserva creada',
        data: {} as any,
      })

      await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: '2026-03-30',
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
      vi.mocked(checkLegacyAvailability).mockResolvedValue({
        success: false,
        available: false,
        message: 'No hay disponibilidad',
        availableTables: [],
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: '2026-03-30',
        time: '20:00',
        partySize: 4,
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('No hay disponibilidad')
      expect(createLegacyReservation).not.toHaveBeenCalled()
    })

    it('debería manejar errores al crear reserva', async () => {
      vi.mocked(checkLegacyAvailability).mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      vi.mocked(createLegacyReservation).mockResolvedValue({
        success: false,
        error: 'Error al crear',
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Carlos García',
        customerPhone: '612345678',
        date: '2026-03-30',
        time: '20:00',
        partySize: 4,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('getReservation', () => {
    it('debería obtener reserva por código', async () => {
      vi.mocked(getLegacyReservation).mockResolvedValue({
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
      vi.mocked(getLegacyReservation).mockResolvedValue({
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
      vi.mocked(getLegacyReservation).mockResolvedValue({
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
      vi.mocked(cancelLegacyReservation).mockResolvedValue({
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
      vi.mocked(cancelLegacyReservation).mockResolvedValue({
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
      vi.mocked(getLegacyReservation).mockResolvedValue({
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
      vi.mocked(getLegacyReservation).mockResolvedValue({
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
      vi.mocked(getLegacyReservation).mockResolvedValue({
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
      vi.mocked(logLegacyCall).mockResolvedValue({
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
})
