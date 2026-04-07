/**
 * Logger Configuration
 *
 * Sistema de logging basado en Pino:
 * - Ligero y rápido (ideal para serverless)
 * - JSON en producción para parseo
 * - Pretty print en desarrollo para legibilidad
 * - Niveles: debug, info, warn, error
 */

import pino from 'pino'

// Tipo para los metadatos del logger
export type LogMetadata = Record<string, unknown>

// Determinar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production'

// Configuración del transporte - JSON simple para evitar problemas con webpack
const transport = undefined // JSON en ambos ambientes para máxima compatibilidad

// Configuración base del logger
const baseConfig = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  // En producción, usar timestamp Unix para rendimiento
  // En desarrollo, usar timestamp ISO para legibilidad
  timestamp: isProduction ? pino.stdTimeFunctions.epochTime : pino.stdTimeFunctions.isoTime,
  formatters: {
    // Agregar caller (archivo y línea) a los logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: Pino's log formatter expects 'any' type - this is a third-party library signature
    log(object: any) {
      const { level, time, ...rest } = object
      return {
        level,
        time,
        ...rest,
      }
    },
  },
}

// Crear el logger
export const logger = pino(baseConfig, transport)

/**
 * Logger child con contexto predeterminado
 *
 * Útil para agregar contexto específico a módulos
 *
 * @example
 * import { createLogger } from '@/lib/logger'
 * const dbLogger = createLogger({ module: 'database' })
 * dbLogger.info('Query ejecutada', { query: 'SELECT * FROM...' })
 */
export function createLogger(context: Record<string, string>) {
  return logger.child(context)
}

// Exportar el logger por defecto y el tipo
export default logger

/**
 * Wrapper para logs de errores con stack trace
 *
 * @param message Mensaje del error
 * @param error Objeto Error
 * @param metadata Metadatos adicionales
 */
export function logError(
  message: string,
  error: unknown,
  metadata?: LogMetadata
): void {
  const errorObj = error instanceof Error ? error : new Error(String(error))

  logger.error({
    msg: message,
    error: {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
      ...metadata,
    },
  })
}

/**
 * Wrapper para logs de performance
 *
 * @param operation Nombre de la operación
 * @param duration Duración en ms
 * @param metadata Metadatos adicionales
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: LogMetadata
): void {
  logger.debug({
    msg: `Performance: ${operation}`,
    performance: {
      operation,
      duration,
      unit: 'ms',
      ...metadata,
    },
  })
}
