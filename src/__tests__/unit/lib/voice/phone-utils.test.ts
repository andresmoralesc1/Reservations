/**
 * Tests para phone-utils.ts
 *
 * Validación y normalización de teléfonos españoles.
 */

import { describe, it, expect } from 'vitest'
import {
  normalizeSpanishPhone,
  isValidSpanishPhone,
  formatPhoneForWhatsApp,
  formatPhoneForDisplay,
  getPhoneType,
  comparePhones,
} from '@/lib/voice/phone-utils'

describe('phone-utils', () => {
  describe('normalizeSpanishPhone', () => {
    it('debería normalizar teléfono móvil con prefijo +34', () => {
      expect(normalizeSpanishPhone('+34 612 345 678')).toBe('612345678')
      expect(normalizeSpanishPhone('+34612345678')).toBe('612345678')
    })

    it('debería normalizar teléfono móvil sin prefijo', () => {
      expect(normalizeSpanishPhone('612345678')).toBe('612345678')
      expect(normalizeSpanishPhone('612 34 56 78')).toBe('612345678')
      expect(normalizeSpanishPhone('612-34-56-78')).toBe('612345678')
    })

    it('debería normalizar teléfono fijo (empieza con 8 o 9)', () => {
      expect(normalizeSpanishPhone('+34 912 345 678')).toBe('912345678')
      expect(normalizeSpanishPhone('812345678')).toBe('812345678')
    })

    it('debería normalizar con prefijo 34 sin +', () => {
      expect(normalizeSpanishPhone('34 612 345 678')).toBe('612345678')
      expect(normalizeSpanishPhone('34612345678')).toBe('612345678')
    })

    it('debería lanzar error para teléfono inválido', () => {
      expect(() => normalizeSpanishPhone('123456789')).toThrow()
      expect(() => normalizeSpanishPhone('512345678')).toThrow() // No empieza con 6,7,8,9
      expect(() => normalizeSpanishPhone('')).toThrow()
      expect(() => normalizeSpanishPhone('61234567')).toThrow() // 8 dígitos
      expect(() => normalizeSpanishPhone('61234567890')).toThrow() // 11 dígitos
    })

    it('debería lanzar error para input no string', () => {
      expect(() => normalizeSpanishPhone(null as any)).toThrow()
      expect(() => normalizeSpanishPhone(undefined as any)).toThrow()
    })
  })

  describe('isValidSpanishPhone', () => {
    it('debería validar teléfonos móviles correctos', () => {
      expect(isValidSpanishPhone('+34 612 345 678')).toBe(true)
      expect(isValidSpanishPhone('612345678')).toBe(true)
      expect(isValidSpanishPhone('712345678')).toBe(true) // Los 7 también son móviles
    })

    it('debería validar teléfonos fijos correctos', () => {
      expect(isValidSpanishPhone('+34 912 345 678')).toBe(true)
      expect(isValidSpanishPhone('912345678')).toBe(true)
      expect(isValidSpanishPhone('812345678')).toBe(true)
    })

    it('debería rechazar teléfonos inválidos', () => {
      expect(isValidSpanishPhone('123456789')).toBe(false)
      expect(isValidSpanishPhone('512345678')).toBe(false)
      expect(isValidSpanishPhone('61234567')).toBe(false) // 8 dígitos
      expect(isValidSpanishPhone('')).toBe(false)
    })

    it('debería manejar inputs no string', () => {
      expect(isValidSpanishPhone(null as any)).toBe(false)
      expect(isValidSpanishPhone(undefined as any)).toBe(false)
    })
  })

  describe('formatPhoneForWhatsApp', () => {
    it('debería formatear para WhatsApp', () => {
      expect(formatPhoneForWhatsApp('612345678')).toBe('34612345678@c.us')
      expect(formatPhoneForWhatsApp('+34 612 345 678')).toBe('34612345678@c.us')
    })

    it('debería lanzar error para teléfono inválido', () => {
      expect(() => formatPhoneForWhatsApp('123456789')).toThrow()
    })
  })

  describe('formatPhoneForDisplay', () => {
    it('debería formatear para display UI', () => {
      expect(formatPhoneForDisplay('612345678')).toBe('+34 612 345 678')
      expect(formatPhoneForDisplay('+34612345678')).toBe('+34 612 345 678')
      expect(formatPhoneForDisplay('912345678')).toBe('+34 912 345 678')
    })

    it('debería lanzar error para teléfono inválido', () => {
      expect(() => formatPhoneForDisplay('123456789')).toThrow()
    })
  })

  describe('getPhoneType', () => {
    it('debería identificar móviles (empiezan con 6 o 7)', () => {
      expect(getPhoneType('612345678')).toBe('mobile')
      expect(getPhoneType('712345678')).toBe('mobile')
      expect(getPhoneType('+34 612 345 678')).toBe('mobile')
    })

    it('debería identificar fijos (empiezan con 8 o 9)', () => {
      expect(getPhoneType('912345678')).toBe('landline')
      expect(getPhoneType('812345678')).toBe('landline')
      expect(getPhoneType('+34 912 345 678')).toBe('landline')
    })

    it('debería retornar null para teléfonos inválidos', () => {
      expect(getPhoneType('123456789')).toBeNull()
      expect(getPhoneType('')).toBeNull()
    })
  })

  describe('comparePhones', () => {
    it('debería comparar teléfonos equivalentes', () => {
      expect(comparePhones('612345678', '612345678')).toBe(true)
      expect(comparePhones('612345678', '+34 612 345 678')).toBe(true)
      expect(comparePhones('+34612345678', '612 34 56 78')).toBe(true)
    })

    it('debería retornar false para teléfonos diferentes', () => {
      expect(comparePhones('612345678', '623456789')).toBe(false)
    })

    it('debería retornar false para teléfonos inválidos', () => {
      expect(comparePhones('123456789', '612345678')).toBe(false)
    })
  })
})
