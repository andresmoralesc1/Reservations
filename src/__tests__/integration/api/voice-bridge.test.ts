/**
 * Tests de integración para Voice Bridge API
 *
 * Prueba el endpoint /api/voice-bridge con peticiones HTTP reales.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST, GET } from '@/app/api/voice-bridge/route'
import { NextRequest } from 'next/server'

// Mock de db.ts para evitar error de DATABASE_URL
vi.mock('@/lib/db', () => ({
  db: {},
}))

// Mock de los servicios
vi.mock('@/lib/services', () => ({
  createReservation: vi.fn(),
  getReservationByCode: vi.fn(),
  cancelReservation: vi.fn(),
  listReservations: vi.fn(),
}))

vi.mock('@/lib/availability/services-availability', () => ({
  servicesAvailability: {
    checkAvailabilityWithServices: vi.fn(),
  },
}))

vi.mock('@/lib/voice/call-logger', () => ({
  logCallStart: vi.fn(),
  logCallAction: vi.fn(),
  logCallEnd: vi.fn(),
}))

import {
  createReservation,
  getReservationByCode,
  cancelReservation,
} from '@/lib/services'
import { servicesAvailability } from '@/lib/availability/services-availability'
import { logCallStart, logCallAction, logCallEnd } from '@/lib/voice/call-logger'

// Type assertions
const mockCheckAvailability = servicesAvailability.checkAvailabilityWithServices as ReturnType<typeof vi.fn>
const mockCreateReservation = createReservation as ReturnType<typeof vi.fn>
const mockGetReservationByCode = getReservationByCode as ReturnType<typeof vi.fn>
const mockCancelReservation = cancelReservation as ReturnType<typeof vi.fn>
const mockLogCallStart = logCallStart as ReturnType<typeof vi.fn>
const mockLogCallAction = logCallAction as ReturnType<typeof vi.fn>
const mockLogCallEnd = logCallEnd as ReturnType<typeof vi.fn>

// Helper para generar fecha futura válida
function getFutureDate(daysFromNow = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

// Test API Key
const TEST_API_KEY = 'test-api-key-for-integration-tests'

function createMockVoiceRequest(body: any, apiKey?: string): NextRequest {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers['x-voice-bridge-key'] = apiKey
  }

  return new NextRequest('http://localhost:3000/api/voice-bridge', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

function createMockGetRequest(apiKey?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (apiKey) {
    headers['x-voice-bridge-key'] = apiKey
  }

  return new NextRequest('http://localhost:3000/api/voice-bridge', {
    method: 'GET',
    headers,
  })
}

describe('Integration: Voice Bridge API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set development mode for easier testing
    vi.stubEnv('NODE_ENV', 'development')
    process.env.VOICE_BRIDGE_API_KEY = TEST_API_KEY
  })

  describe('GET /api/voice-bridge', () => {
    it('debería retornar información del bridge (200)', async () => {
      const request = createMockGetRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe('Reservations Voice Bridge')
      expect(data.version).toBeDefined()
      expect(data.actions).toBeInstanceOf(Array)
      expect(data.actions.length).toBeGreaterThan(0)
    })

    it('debería incluir documentación de todas las acciones', async () => {
      const request = createMockGetRequest()
      const response = await GET(request)
      const data = await response.json()

      const actionNames = data.actions.map((a: any) => a.name)
      expect(actionNames).toContain('checkAvailability')
      expect(actionNames).toContain('createReservation')
      expect(actionNames).toContain('getReservation')
      expect(actionNames).toContain('cancelReservation')
      expect(actionNames).toContain('modifyReservation')
    })
  })

  describe('POST /api/voice-bridge - checkAvailability', () => {
    it('debería verificar disponibilidad (200)', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
        service: null,
        suggestedTables: [],
      })

      const request = createMockVoiceRequest({
        action: 'checkAvailability',
        params: {
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBeDefined()
      expect(mockCheckAvailability).toHaveBeenCalled()
    })

    it('debería rechazar con parámetros inválidos (200 con success: false)', async () => {
      const request = createMockVoiceRequest({
        action: 'checkAvailability',
        params: {
          date: 'fecha-invalida',
          time: '20:00',
          partySize: 4,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Parámetros inválidos')
    })

    it('debería registrar llamada si se proporciona callLogId', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
        service: null,
        suggestedTables: [],
      })
      mockLogCallAction.mockResolvedValue(undefined)

      const request = createMockVoiceRequest({
        action: 'checkAvailability',
        callLogId: 'log-123',
        params: {
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(mockLogCallAction).toHaveBeenCalledWith('log-123', expect.objectContaining({
        action: 'checkAvailability',
        success: true,
      }))
    })
  })

  describe('POST /api/voice-bridge - createReservation', () => {
    it('debería crear reserva exitosamente (200)', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
        service: null,
        suggestedTables: [],
      })

      mockCreateReservation.mockResolvedValue({
        reservationCode: 'RES-TEST1',
        id: 'res-1',
        customerName: 'Carlos García',
        customerPhone: '612345678',
        reservationDate: getFutureDate(),
        reservationTime: '20:00',
        partySize: 4,
        status: 'CONFIRMADO',
      } as any)

      const request = createMockVoiceRequest({
        action: 'createReservation',
        params: {
          customerName: 'Carlos García',
          customerPhone: '612345678',
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.reservationCode).toBe('RES-TEST1')
      expect(mockCreateReservation).toHaveBeenCalled()
    })

    it('debería rechazar teléfono inválido', async () => {
      const request = createMockVoiceRequest({
        action: 'createReservation',
        params: {
          customerName: 'Carlos García',
          customerPhone: '123', // Teléfono muy corto
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Parámetros inválidos')
    })

    it('debería fallar si no hay disponibilidad', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: false,
        message: 'No hay disponibilidad',
        availableTables: [],
        service: null,
        suggestedTables: [],
      })

      const request = createMockVoiceRequest({
        action: 'createReservation',
        params: {
          customerName: 'Carlos García',
          customerPhone: '612345678',
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.message).toContain('No hay disponibilidad')
      expect(mockCreateReservation).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/voice-bridge - getReservation', () => {
    it('debería obtener reserva por código (200)', async () => {
      mockGetReservationByCode.mockResolvedValue({
        reservationCode: 'RES-TEST1',
        customerName: 'Carlos García',
        customerPhone: '612345678',
        reservationDate: getFutureDate(),
        reservationTime: '20:00',
        partySize: 4,
        status: 'CONFIRMADO',
      } as any)

      const request = createMockVoiceRequest({
        action: 'getReservation',
        params: {
          code: 'RES-TEST1',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.reservation).toBeDefined()
      expect(data.reservation.reservationCode).toBe('RES-TEST1')
    })

    it('debería rechazar código con formato inválido', async () => {
      const request = createMockVoiceRequest({
        action: 'getReservation',
        params: {
          code: 'INVALID-CODE',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.message).toContain('Parámetros inválidos')
    })

    it('debería retornar mensaje descriptivo si no existe', async () => {
      mockGetReservationByCode.mockRejectedValue(new Error('No encontré ninguna reserva'))

      const request = createMockVoiceRequest({
        action: 'getReservation',
        params: {
          code: 'RES-T1T1E',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
      expect(data.message).toContain('No encontré')
    })
  })

  describe('POST /api/voice-bridge - cancelReservation', () => {
    it('debería cancelar reserva con teléfono correcto (200)', async () => {
      mockGetReservationByCode.mockResolvedValue({
        customerPhone: '612345678',
      } as any)
      mockCancelReservation.mockResolvedValue({
        reservationCode: 'RES-TEST1',
      } as any)

      const request = createMockVoiceRequest({
        action: 'cancelReservation',
        params: {
          code: 'RES-TEST1',
          phone: '612345678',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('cancelada')
    })

    it('debería fallar si el teléfono no coincide', async () => {
      mockGetReservationByCode.mockResolvedValue({
        customerPhone: '611111111',
      } as any)

      const request = createMockVoiceRequest({
        action: 'cancelReservation',
        params: {
          code: 'RES-TEST1',
          phone: '999999999',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(false)
    })
  })

  describe('POST /api/voice-bridge - modifyReservation', () => {
    it('debería verificar teléfono antes de modificar', async () => {
      mockGetReservationByCode.mockResolvedValue({
        reservationCode: 'RES-TEST1',
        customerPhone: '612345678',
        status: 'CONFIRMADO',
      } as any)

      const request = createMockVoiceRequest({
        action: 'modifyReservation',
        params: {
          code: 'RES-TEST1',
          phone: '612345678',
          changes: {
            newPartySize: 6,
          },
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('no está disponible')
    })
  })

  describe('POST /api/voice-bridge - logCallStart', () => {
    it('debería registrar inicio de llamada', async () => {
      mockLogCallStart.mockResolvedValue('log-123')

      const request = createMockVoiceRequest({
        action: 'logCallStart',
        params: {
          callerPhone: '612345678',
          restaurantId: 'default-restaurant-id',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.callLogId).toBe('log-123')
      expect(mockLogCallStart).toHaveBeenCalled()
    })
  })

  describe('POST /api/voice-bridge - logCallEnd', () => {
    it('debería registrar fin de llamada', async () => {
      mockLogCallEnd.mockResolvedValue(undefined)

      const request = createMockVoiceRequest({
        action: 'logCallEnd',
        callLogId: 'log-123',
        params: {
          durationSecs: 120,
          endReason: 'completed',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockLogCallEnd).toHaveBeenCalledWith('log-123', expect.objectContaining({
        durationSecs: 120,
        endReason: 'completed',
      }))
    })
  })

  describe('POST /api/voice-bridge - Authentication', () => {
    beforeEach(() => {
      // Set production mode to test authentication
      vi.stubEnv('NODE_ENV', 'production')
    })

    it('debería rechazar sin autenticación en producción (401)', async () => {
      const request = createMockVoiceRequest({
        action: 'checkAvailability',
        params: {
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Missing authentication credentials')
    })

    it('debería aceptar con API key correcta (200)', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
        service: null,
        suggestedTables: [],
      })

      const request = createMockVoiceRequest({
        action: 'checkAvailability',
        params: {
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      }, TEST_API_KEY)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('debería rechazar con API key incorrecta (401)', async () => {
      const request = createMockVoiceRequest({
        action: 'checkAvailability',
        params: {
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      }, 'wrong-api-key')

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid authentication credentials')
    })

    it('debería aceptar Authorization Bearer header', async () => {
      mockCheckAvailability.mockResolvedValue({
        available: true,
        message: 'Hay disponibilidad',
        availableTables: [],
        service: null,
        suggestedTables: [],
      })

      const request = new NextRequest('http://localhost:3000/api/voice-bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_API_KEY}`,
        },
        body: JSON.stringify({
          action: 'checkAvailability',
          params: {
            date: getFutureDate(),
            time: '20:00',
            partySize: 4,
          },
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('POST /api/voice-bridge - Error handling', () => {
    it('debería rechazar acción inválida (400)', async () => {
      const request = createMockVoiceRequest({
        action: 'invalidAction',
        params: {},
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid action')
    })

    it('debería manejar errores del servidor (500)', async () => {
      mockCheckAvailability.mockRejectedValue(new Error('Database connection failed'))

      const request = createMockVoiceRequest({
        action: 'checkAvailability',
        params: {
          date: getFutureDate(),
          time: '20:00',
          partySize: 4,
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200) // El servicio maneja el error internamente
      expect(data.success).toBe(false)
      expect(data.message).toContain('No pude verificar')
    })

    it('debería manejar JSON inválido en el body', async () => {
      const request = new NextRequest('http://localhost:3000/api/voice-bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json{{{',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
    })
  })
})
