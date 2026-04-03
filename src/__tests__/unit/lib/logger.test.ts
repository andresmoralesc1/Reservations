/**
 * Tests para el logger
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { logger, createLogger, logError, logPerformance } from '@/lib/logger'

describe('Logger', () => {
  // Mock de console para capturar logs
  let mockLogs: unknown[] = []

  beforeEach(() => {
    mockLogs = []
    // Nota: En un entorno real usaríamos pino transports para capturar logs
    // Para este test solo verificamos que el logger se crea correctamente
  })

  it('debería crear el logger por defecto', () => {
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.debug).toBe('function')
  })

  it('debería crear logger child con contexto', () => {
    const childLogger = createLogger({ module: 'test-module' })
    expect(childLogger).toBeDefined()
  })

  it('debería loggear mensajes en diferentes niveles', () => {
    // Estos tests solo verifican que las funciones existen y no lanzan error
    expect(() => logger.debug('Debug message')).not.toThrow()
    expect(() => logger.info('Info message')).not.toThrow()
    expect(() => logger.warn('Warning message')).not.toThrow()
    expect(() => logger.error('Error message')).not.toThrow()
  })

  it('debería incluir metadata en los logs', () => {
    expect(() => {
      logger.info('Test con metadata', { userId: '123', action: 'test' })
    }).not.toThrow()
  })

  it('debería manejar logError correctamente', () => {
    const error = new Error('Test error')
    expect(() => {
      logError('Error de prueba', error, { context: 'test' })
    }).not.toThrow()
  })

  it('debería manejar logPerformance correctamente', () => {
    expect(() => {
      logPerformance('database_query', 150, { query: 'SELECT * FROM users' })
    }).not.toThrow()
  })

  it('debería crear logger child con múltiples contextos', () => {
    const child1 = createLogger({ module: 'api' })
    const child2 = child1.child({ endpoint: 'reservations' })
    expect(child2).toBeDefined()
  })
})
