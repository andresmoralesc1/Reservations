/**
 * Tests de estrés para Voice Bridge API
 *
 * Prueba el comportamiento bajo carga con múltiples llamadas simultáneas.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/voice-bridge/route'
import { NextRequest } from 'next/server'

// Mock de los servicios
vi.mock('@/lib/services/legacy-service', () => ({
  createLegacyReservation: vi.fn(),
  getLegacyReservation: vi.fn(),
  cancelLegacyReservation: vi.fn(),
  checkLegacyAvailability: vi.fn(),
  logLegacyCall: vi.fn(),
}))

vi.mock('@/lib/voice/call-logger', () => ({
  logCallStart: vi.fn(),
  logCallAction: vi.fn(),
  logCallEnd: vi.fn(),
}))

import {
  createLegacyReservation,
  getLegacyReservation,
  cancelLegacyReservation,
  checkLegacyAvailability,
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

function createMockVoiceRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/voice-bridge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('Stress Test: Voice Bridge API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NODE_ENV', 'development')
    process.env.VOICE_BRIDGE_API_KEY = 'test-key'
  })

  describe('Concurrent checkAvailability calls', () => {
    it('debería manejar 10 llamadas simultáneas de checkAvailability', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        POST(createMockVoiceRequest({
          action: 'checkAvailability',
          params: {
            date: getFutureDate(),
            time: `${18 + Math.floor(i / 4)}:00`,
            partySize: 2 + (i % 4),
          },
        }))
      )

      const results = await Promise.all(concurrentRequests)

      expect(results.length).toBe(10)
      results.forEach(response => {
        expect(response.status).toBe(200)
      })
      expect(mockCheckLegacyAvailability).toHaveBeenCalledTimes(10)
    })

    it('debería manejar 50 llamadas simultáneas de checkAvailability', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      const concurrentRequests = Array.from({ length: 50 }, (_, i) =>
        POST(createMockVoiceRequest({
          action: 'checkAvailability',
          params: {
            date: getFutureDate(),
            time: '20:00',
            partySize: 2 + (i % 8),
          },
        }))
      )

      const startTime = Date.now()
      const results = await Promise.all(concurrentRequests)
      const duration = Date.now() - startTime

      expect(results.length).toBe(50)
      results.forEach(response => {
        expect(response.status).toBe(200)
      })
      expect(mockCheckLegacyAvailability).toHaveBeenCalledTimes(50)

      // Todas las llamadas deben completarse en un tiempo razonable
      expect(duration).toBeLessThan(5000)
    })

    it('debería manejar 100 llamadas simultáneas de checkAvailability', async () => {
      mockCheckLegacyAvailability.mockImplementation(async () => {
        // Simular un pequeño delay de red
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
        return {
          success: true,
          available: true,
          message: 'Hay disponibilidad',
          availableTables: [],
        }
      })

      const concurrentRequests = Array.from({ length: 100 }, (_, i) =>
        POST(createMockVoiceRequest({
          action: 'checkAvailability',
          params: {
            date: getFutureDate(),
            time: '20:00',
            partySize: 2 + (i % 10),
          },
        }))
      )

      const startTime = Date.now()
      const results = await Promise.allSettled(concurrentRequests)
      const duration = Date.now() - startTime

      expect(results.length).toBe(100)

      const fulfilled = results.filter(r => r.status === 'fulfilled')
      const rejected = results.filter(r => r.status === 'rejected')

      // Todas deben completarse exitosamente
      expect(fulfilled.length).toBe(100)
      expect(rejected.length).toBe(0)
      expect(mockCheckLegacyAvailability).toHaveBeenCalledTimes(100)

      // Performance check: debe ser rápido incluso con 100 llamadas
      expect(duration).toBeLessThan(10000)
    })
  })

  describe('Concurrent createReservation calls', () => {
    it('debería manejar 20 llamadas simultáneas de createReservation', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      mockCreateLegacyReservation.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 30))
        return {
          success: true,
          reservationCode: `RES-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          message: 'Reserva creada',
          data: {} as any,
        }
      })

      const concurrentRequests = Array.from({ length: 20 }, (_, i) =>
        POST(createMockVoiceRequest({
          action: 'createReservation',
          params: {
            customerName: `Cliente ${i + 1}`,
            customerPhone: '612345678',
            date: getFutureDate(),
            time: '20:00',
            partySize: 2 + (i % 6),
          },
        }))
      )

      const results = await Promise.allSettled(concurrentRequests)

      expect(results.length).toBe(20)

      const fulfilled = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<Response>[]
      const rejected = results.filter(r => r.status === 'rejected')

      expect(rejected.length).toBe(0)
      expect(fulfilled.length).toBe(20)

      // Verificar respuestas
      for (const result of fulfilled) {
        const data = await result.value.json()
        expect(data.success).toBe(true)
        expect(data.reservationCode).toBeDefined()
      }
    })

    it('debería manejar mix de éxito y error en createReservation concurrente', async () => {
      let callCount = 0
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      mockCreateLegacyReservation.mockImplementation(async () => {
        callCount++
        // Simular que 30% de las llamadas fallan
        if (callCount % 10 < 3) {
          return {
            success: false,
            error: 'Error al crear reserva',
          }
        }
        return {
          success: true,
          reservationCode: `RES-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          message: 'Reserva creada',
          data: {} as any,
        }
      })

      const concurrentRequests = Array.from({ length: 30 }, (_, i) =>
        POST(createMockVoiceRequest({
          action: 'createReservation',
          params: {
            customerName: `Cliente ${i + 1}`,
            customerPhone: '612345678',
            date: getFutureDate(),
            time: '20:00',
            partySize: 4,
          },
        }))
      )

      const results = await Promise.allSettled(concurrentRequests)
      const data = await Promise.all(
        results
          .filter(r => r.status === 'fulfilled')
          .map(async r => await (r as PromiseFulfilledResult<Response>).value.json())
      )

      // Algunas deben ser exitosas, otras fallidas
      const successful = data.filter(d => d.success === true)
      const failed = data.filter(d => d.success === false)

      expect(successful.length).toBeGreaterThan(0)
      expect(failed.length).toBeGreaterThan(0)
      expect(successful.length + failed.length).toBe(30)
    })
  })

  describe('Mixed concurrent operations', () => {
    it('debería manejar mix de checkAvailability, createReservation y getReservation', async () => {
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

      mockGetLegacyReservation.mockResolvedValue({
        success: true,
        data: {
          reservationCode: 'RES-TEST1',
          customerName: 'Test Cliente',
          customerPhone: '612345678',
          reservationDate: getFutureDate(),
          reservationTime: '20:00',
          partySize: 4,
          status: 'CONFIRMADO',
        },
      })

      const requests = [
        // 10 checkAvailability
        ...Array.from({ length: 10 }, () =>
          POST(createMockVoiceRequest({
            action: 'checkAvailability',
            params: {
              date: getFutureDate(),
              time: '20:00',
              partySize: 4,
            },
          }))
        ),
        // 5 createReservation
        ...Array.from({ length: 5 }, () =>
          POST(createMockVoiceRequest({
            action: 'createReservation',
            params: {
              customerName: 'Test Cliente',
              customerPhone: '612345678',
              date: getFutureDate(),
              time: '20:00',
              partySize: 4,
            },
          }))
        ),
        // 5 getReservation
        ...Array.from({ length: 5 }, () =>
          POST(createMockVoiceRequest({
            action: 'getReservation',
            params: {
              code: 'RES-TEST1',
            },
          }))
        ),
      ]

      const startTime = Date.now()
      const results = await Promise.allSettled(requests)
      const duration = Date.now() - startTime

      expect(results.length).toBe(20)

      const fulfilled = results.filter(r => r.status === 'fulfilled')
      expect(fulfilled.length).toBe(20)

      // Verificar que todos los servicios fueron llamados
      // Nota: createReservation también llama a checkLegacyAvailability internamente
      expect(mockCheckLegacyAvailability).toHaveBeenCalledTimes(15) // 10 directas + 5 desde create
      expect(mockCreateLegacyReservation).toHaveBeenCalledTimes(5)
      expect(mockGetLegacyReservation).toHaveBeenCalledTimes(5)

      // Performance check
      expect(duration).toBeLessThan(3000)
    })
  })

  describe('Error handling under load', () => {
    it('debería manejar correctamente errores parciales en carga alta', async () => {
      mockCheckLegacyAvailability.mockImplementation(async () => {
        // 20% de error aleatorio
        if (Math.random() < 0.2) {
          throw new Error('Random DB error')
        }
        return {
          success: true,
          available: true,
          message: 'Hay disponibilidad',
          availableTables: [],
        }
      })

      const concurrentRequests = Array.from({ length: 50 }, (_, i) =>
        POST(createMockVoiceRequest({
          action: 'checkAvailability',
          params: {
            date: getFutureDate(),
            time: '20:00',
            partySize: 4,
          },
        }))
      )

      const results = await Promise.allSettled(concurrentRequests)

      // Todas las peticiones deben completarse (aunque algunas con error)
      expect(results.length).toBe(50)

      const fulfilled = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<Response>[]

      // Obtener datos de las respuestas
      const responseDatas = await Promise.all(
        fulfilled.map(async r => await r.value.json())
      )

      // Algunas deben ser exitosas, otras con error
      const successful = responseDatas.filter(d => d.success === true)
      const failed = responseDatas.filter(d => d.success === false)

      expect(successful.length + failed.length).toBe(50)
      expect(successful.length).toBeGreaterThan(30) // Al menos 60% éxito
    })

    it('debería manejar timeouts simulados', async () => {
      mockCheckLegacyAvailability.mockImplementation(async () => {
        // Simular timeout para algunas peticiones
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100))
        return {
          success: true,
          available: true,
          message: 'Hay disponibilidad',
          availableTables: [],
        }
      })

      const concurrentRequests = Array.from({ length: 10 }, () =>
        POST(createMockVoiceRequest({
          action: 'checkAvailability',
          params: {
            date: getFutureDate(),
            time: '20:00',
            partySize: 4,
          },
        }))
      )

      const results = await Promise.allSettled(concurrentRequests)

      // Todas deben completarse eventualmente
      expect(results.length).toBe(10)

      const fulfilled = results.filter(r => r.status === 'fulfilled')
      expect(fulfilled.length).toBe(10)
    })
  })

  describe('Rate limiting behavior', () => {
    it('no debería tener rate limiting hardcoded (verificación)', async () => {
      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      // Enviar 100 peticiones rápidamente
      const concurrentRequests = Array.from({ length: 100 }, (_, i) =>
        POST(createMockVoiceRequest({
          action: 'checkAvailability',
          params: {
            date: getFutureDate(),
            time: '20:00',
            partySize: 4,
          },
        }))
      )

      const results = await Promise.allSettled(concurrentRequests)

      // No debería haber respuestas 429 (Too Many Requests)
      const responses = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<Response>).value)

      const rateLimited = responses.filter(r => r.status === 429)

      expect(rateLimited.length).toBe(0)
      expect(results.length).toBe(100)
    })
  })

  describe('Memory leak prevention', () => {
    it('no debería acumular mocks indefinidamente', async () => {
      // Resetear mocks antes del test
      vi.clearAllMocks()

      mockCheckLegacyAvailability.mockResolvedValue({
        success: true,
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
      })

      // Hacer muchas peticiones en secuencia
      for (let i = 0; i < 50; i++) {
        await POST(createMockVoiceRequest({
          action: 'checkAvailability',
          params: {
            date: getFutureDate(),
            time: '20:00',
            partySize: 4,
          },
        }))
      }

      // Verificar que los mocks no están acumulando llamadas antiguas
      expect(mockCheckLegacyAvailability).toHaveBeenCalledTimes(50)

      // Limpiar y verificar
      vi.clearAllMocks()

      // Nueva petción debe empezar desde cero
      await POST(createMockVoiceRequest({
        action: 'checkAvailability',
        params: {
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      }))

      expect(mockCheckLegacyAvailability).toHaveBeenCalledTimes(1)
    })
  })
})
