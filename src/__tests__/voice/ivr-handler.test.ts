/**
 * IVR Handler Tests
 *
 * Tests para el flujo completo de reservas por voz.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock de dependencias
vi.mock('@/lib/services/legacy-service', () => ({
  checkLegacyAvailability: vi.fn(),
  createLegacyReservation: vi.fn(),
  getLegacyReservation: vi.fn(),
  cancelLegacyReservation: vi.fn(),
  logLegacyCall: vi.fn(),
}))

import { processVoiceAction } from '@/lib/voice/voice-service'
import {
  checkLegacyAvailability,
  createLegacyReservation,
  getLegacyReservation,
  cancelLegacyReservation,
} from '@/lib/services/legacy-service'

// Type assertions
const mockCheckLegacyAvailability = checkLegacyAvailability as ReturnType<typeof vi.fn>
const mockCreateLegacyReservation = createLegacyReservation as ReturnType<typeof vi.fn>
const mockGetLegacyReservation = getLegacyReservation as ReturnType<typeof vi.fn>
const mockCancelLegacyReservation = cancelLegacyReservation as ReturnType<typeof vi.fn>

// Helper para generar fecha futura válida
function getFutureDate(daysFromNow = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

describe('IVR Handler - Flujo Completo de Reserva por Voz', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Escenario 1: Reserva exitosa', () => {
    it('debería completar flujo: verificar disponibilidad → crear reserva', async () => {
      // Paso 1: Verificar disponibilidad
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay mesas disponibles',
      })

      const availabilityResult = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '21:00',
        partySize: 4,
      })

      expect(availabilityResult.success).toBe(true)

      // Paso 2: Crear reserva
      mockCreateLegacyReservation.mockResolvedValue({
        success: true,
        reservationCode: 'RES-VOICE-1',
      })

      const createResult = await processVoiceAction('createReservation', {
        customerName: 'Carlos Ruiz',
        customerPhone: '611222333',
        date: getFutureDate(),
        time: '21:00',
        partySize: 4,
      })

      expect(createResult.success).toBe(true)
      expect(createResult.reservationCode).toBe('RES-VOICE-1')
    })
  })

  describe('Escenario 2: Sin disponibilidad', () => {
    it('debería informar sin disponibilidad', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: false,
        available: false,
        message: 'No hay mesas disponibles',
      })

      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '21:00',
        partySize: 8,
      })

      expect(result.success).toBe(false)
    })

    it('debería fallar al crear reserva si no hay disponibilidad', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: false,
        available: false,
        message: 'No hay mesas',
        availableTables: [],
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Grupo grande',
        customerPhone: '699999999',
        date: getFutureDate(),
        time: '21:00',
        partySize: 8,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Escenario 3: Consultar reserva', () => {
    it('debería recuperar detalles de reserva por código', async () => {
      mockGetLegacyReservation.mockResolvedValue({
        success: true,
        data: {
          reservationCode: 'RES-T1ST1',
          customerName: 'Ana Martínez',
          customerPhone: '611111111',
          reservationDate: getFutureDate(),
          reservationTime: '20:30',
          partySize: 3,
          status: 'CONFIRMADO',
        },
      })

      const result = await processVoiceAction('getReservation', {
        code: 'RES-T1ST1',
      })

      expect(result.success).toBe(true)
      expect(result.reservation).toBeDefined()
    })

    it('debería fallar con código inexistente', async () => {
      mockGetLegacyReservation.mockResolvedValue({
        success: false,
        message: 'Reserva no encontrada',
      })

      const result = await processVoiceAction('getReservation', {
        code: 'RES-T1T1E',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Escenario 4: Cancelar reserva', () => {
    it('debería cancelar reserva correctamente', async () => {
      mockCancelLegacyReservation.mockResolvedValue({
        success: true,
        message: 'Reserva cancelada',
      })

      const result = await processVoiceAction('cancelReservation', {
        code: 'RES-T1ST1',
        phone: '611111111',
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain('cancelada')
    })

    it('debería fallar con teléfono incorrecto', async () => {
      mockCancelLegacyReservation.mockResolvedValue({
        success: false,
        message: 'El teléfono no coincide',
      })

      const result = await processVoiceAction('cancelReservation', {
        code: 'RES-T1ST1',
        phone: '699999999',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Escenario 5: Modificar reserva', () => {
    it('debería informar que no está implementado', async () => {
      mockGetLegacyReservation.mockResolvedValue({
        success: true,
        data: {
          reservationCode: 'RES-T1ST1',
          customerName: 'Pedro',
          customerPhone: '622222222',
          reservationDate: getFutureDate(),
          reservationTime: '20:00',
          partySize: 2,
          status: 'PENDIENTE',
        },
      })

      const result = await processVoiceAction('modifyReservation', {
        code: 'RES-T1ST1',
        phone: '622222222',
        changes: { newPartySize: 4 },
      })

      // La modificación retorna success=true pero con mensaje de no disponible
      expect(result.success).toBe(true)
      expect(result.message).toContain('no está disponible')
    })
  })

  describe('Escenario 6: Manejo de errores', () => {
    it('debería manejar error en disponibilidad', async () => {
      mockCheckLegacyAvailability.mockRejectedValue(
        new Error('Error de conexión')
      )

      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        time: '21:00',
        partySize: 2,
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain('No pude verificar')
    })

    it('debería manejar error al crear reserva', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
      })

      mockCreateLegacyReservation.mockRejectedValue(
        new Error('Timeout')
      )

      const result = await processVoiceAction('createReservation', {
        customerName: 'Juan',
        customerPhone: '600000000',
        date: getFutureDate(),
        time: '21:00',
        partySize: 2,
      })

      expect(result.success).toBe(false)
    })
  })

  describe('Escenario 7: Validación', () => {
    it('debería rechazar código vacío', async () => {
      const result = await processVoiceAction('getReservation', {
        code: '',
      })

      expect(result.success).toBe(false)
    })

    it('debería rechazar código mal formado', async () => {
      const result = await processVoiceAction('getReservation', {
        code: 'INVALID',
      })

      expect(result.success).toBe(false)
    })

    it('debería rechazar parámetros faltantes', async () => {
      const result = await processVoiceAction('checkAvailability', {
        date: getFutureDate(),
        // Falta time y partySize
      } as any)

      expect(result.success).toBe(false)
    })
  })

  describe('Escenario 8: Formatos de teléfono', () => {
    it('debería aceptar +34 XXX XXX XXX', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
      })

      mockCreateLegacyReservation.mockResolvedValue({
        success: true,
        reservationCode: 'RES-PHONE-1',
        message: 'Reserva creada',
        data: {} as any,
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Cliente Internacional',
        customerPhone: '+34 612 345 678',
        date: getFutureDate(),
        time: '21:00',
        partySize: 2,
      })

      expect(result.success).toBe(true)
    })

    it('debería aceptar 9 dígitos', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
      })

      mockCreateLegacyReservation.mockResolvedValue({
        success: true,
        reservationCode: 'RES-PHONE-2',
        message: 'Reserva creada',
        data: {} as any,
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Cliente Nacional',
        customerPhone: '612345678',
        date: getFutureDate(),
        time: '21:00',
        partySize: 2,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Escenario 9: Solicitudes especiales', () => {
    it('debería crear reserva con solicitudes especiales', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
      })

      mockCreateLegacyReservation.mockResolvedValue({
        success: true,
        reservationCode: 'RES-SPECIAL-1',
        message: 'Reserva creada',
        data: {} as any,
      })

      const result = await processVoiceAction('createReservation', {
        customerName: 'Cliente Exigente',
        customerPhone: '633333333',
        date: getFutureDate(),
        time: '21:00',
        partySize: 4,
        specialRequests: 'Silla alta para bebé',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('Escenario 10: Acción no reconocida', () => {
    it('debería rechazar acción desconocida', async () => {
      const result = await processVoiceAction('unknownAction' as any, {})

      expect(result.success).toBe(false)
      expect(result.message).toContain('no reconocida')
    })
  })
})
