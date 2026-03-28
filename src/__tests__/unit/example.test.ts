/**
 * Test de ejemplo para verificar configuración
 */

import { describe, it, expect } from 'vitest'

describe('Configuración de Tests', () => {
  it('debería cargar Vitest correctamente', () => {
    expect(true).toBe(true)
  })

  it('debería tener acceso a expect', () => {
    expect(1 + 1).toBe(2)
  })

  it('debería poder importar tipos del proyecto', async () => {
    const types = await import('@/types/reservation')
    expect(types).toBeDefined()
    expect(types.STATUS_MAP).toBeDefined()
  })
})
