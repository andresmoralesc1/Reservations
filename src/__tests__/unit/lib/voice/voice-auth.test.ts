/**
 * Tests para voice-auth.ts
 *
 * Validación de autenticación del voice bridge.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { validateVoiceBridgeRequest, generateApiKey } from '@/lib/voice/voice-auth'

// Mock NextRequest
class MockNextRequest {
  public readonly headers: {
    has: (name: string) => boolean
    get: (name: string) => string | null
  }

  constructor(init: { headers?: Record<string, string> } = {}) {
    const headersMap = new Map<string, string>()
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        headersMap.set(key.toLowerCase(), value)
      })
    }

    this.headers = {
      has: (name: string) => headersMap.has(name.toLowerCase()),
      get: (name: string) => headersMap.get(name.toLowerCase()) || null,
    }
  }
}

describe('voice-auth', () => {
  const TEST_API_KEY = 'test-api-key-12345'
  let originalNodeEnv: string | undefined
  let originalApiKey: string | undefined

  beforeEach(() => {
    // Guardar valores originales
    originalNodeEnv = process.env.NODE_ENV
    originalApiKey = process.env.VOICE_BRIDGE_API_KEY

    // Reset environment - usar una técnica diferente para NODE_ENV
    process.env.VOICE_BRIDGE_API_KEY = TEST_API_KEY
    // Mockear NODE_ENV para pruebas
    vi.stubEnv('NODE_ENV', 'test')
  })

  afterEach(() => {
    // Restaurar valores originales
    vi.unstubAllEnvs()

    // Nota: No restauramos NODE_ENV directamente porque es read-only
    // Los tests subsiguientes usarán vi.stubEnv para controlar su valor

    if (originalApiKey !== undefined) {
      process.env.VOICE_BRIDGE_API_KEY = originalApiKey
    } else {
      delete process.env.VOICE_BRIDGE_API_KEY
    }
  })

  describe('en desarrollo (NODE_ENV=development)', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
    })

    it('debería permitir requests sin autenticación en desarrollo', () => {
      const request = new MockNextRequest() as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('debería permitir requests con header correcto en desarrollo', () => {
      const request = new MockNextRequest({
        headers: { 'x-voice-bridge-key': TEST_API_KEY },
      }) as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(true)
    })

    it('debería rechazar con API key incorrecta en desarrollo', () => {
      const request = new MockNextRequest({
        headers: { 'x-voice-bridge-key': 'wrong-key' },
      }) as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid authentication credentials')
    })
  })

  describe('en producción', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production')
    })

    it('debería rechazar requests sin autenticación', () => {
      const request = new MockNextRequest() as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Missing authentication credentials')
    })

    it('debería aceptar con x-voice-bridge-key correcto', () => {
      const request = new MockNextRequest({
        headers: { 'x-voice-bridge-key': TEST_API_KEY },
      }) as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(true)
    })

    it('debería aceptar con Authorization Bearer correcto', () => {
      const request = new MockNextRequest({
        headers: { 'authorization': `Bearer ${TEST_API_KEY}` },
      }) as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(true)
    })

    it('debería rechazar con API key incorrecta', () => {
      const request = new MockNextRequest({
        headers: { 'x-voice-bridge-key': 'wrong-key' },
      }) as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid authentication credentials')
    })

    it('debería rechazar con Authorization Bearer incorrecto', () => {
      const request = new MockNextRequest({
        headers: { 'authorization': 'Bearer wrong-key' },
      }) as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(false)
    })

    it('debería rechazar con Authorization sin Bearer', () => {
      const request = new MockNextRequest({
        headers: { 'authorization': TEST_API_KEY },
      }) as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(false)
    })

    it('debería priorizar x-voice-bridge-key sobre Authorization', () => {
      const request = new MockNextRequest({
        headers: {
          'x-voice-bridge-key': TEST_API_KEY,
          'authorization': 'Bearer wrong-key',
        },
      }) as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(true)
    })
  })

  describe('cuando VOICE_BRIDGE_API_KEY no está configurada', () => {
    beforeEach(() => {
      delete process.env.VOICE_BRIDGE_API_KEY
    })

    it('debería rechazar siempre', () => {
      const request = new MockNextRequest({
        headers: { 'x-voice-bridge-key': 'any-key' },
      }) as any
      const result = validateVoiceBridgeRequest(request)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Voice bridge not configured properly')
    })
  })

  describe('generateApiKey', () => {
    it('debería generar una key de 64 caracteres hexadecimales', () => {
      const key = generateApiKey()
      expect(key).toHaveLength(64)
      expect(key).toMatch(/^[0-9a-f]{64}$/)
    })

    it('debería generar keys diferentes', () => {
      const key1 = generateApiKey()
      const key2 = generateApiKey()
      expect(key1).not.toBe(key2)
    })
  })
})
