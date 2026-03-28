/**
 * Setup file for Vitest
 * Configuración global para todos los tests
 */

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup después de cada test
afterEach(() => {
  cleanup()
})

// Configurar expect
expect.extend({})
