/**
 * Logger Configuration
 *
 * Sistema de logging simple para serverless
 * - Usa console.log/error/warn para máxima compatibilidad
 * - JSON en producción para parseo
 * - Niveles: debug, info, warn, error
 */

// Tipo para los metadatos del logger
export type LogMetadata = Record<string, unknown>

// Determinar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production'

// Logger simple sin dependencias externas
const logger = {
  info: (msg: string, meta?: LogMetadata) => {
    if (isProduction) {
      console.log(JSON.stringify({ level: 'info', msg, ...meta }))
    } else {
      console.log('[INFO]', msg, meta || '')
    }
  },
  warn: (msg: string, meta?: LogMetadata) => {
    if (isProduction) {
      console.warn(JSON.stringify({ level: 'warn', msg, ...meta }))
    } else {
      console.warn('[WARN]', msg, meta || '')
    }
  },
  error: (msg: string, meta?: LogMetadata) => {
    if (isProduction) {
      console.error(JSON.stringify({ level: 'error', msg, ...meta }))
    } else {
      console.error('[ERROR]', msg, meta || '')
    }
  },
  debug: (msg: string, meta?: LogMetadata) => {
    if (!isProduction) {
      console.log('[DEBUG]', msg, meta || '')
    }
  },
  child: (context: Record<string, string>) => ({
    info: (msg: string, meta?: LogMetadata) => logger.info(msg, { ...context, ...meta }),
    warn: (msg: string, meta?: LogMetadata) => logger.warn(msg, { ...context, ...meta }),
    error: (msg: string, meta?: LogMetadata) => logger.error(msg, { ...context, ...meta }),
    debug: (msg: string, meta?: LogMetadata) => logger.debug(msg, { ...context, ...meta }),
  }),
}

export { logger }

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
