/**
 * Logger Configuration
 *
 * Sistema de logging simple para serverless
 * - Usa console.log/error/warn para máxima compatibilidad
 * - JSON en producción para parseo
 * - Soporta dos firmas: logger.info(msg, meta) o logger.info({ msg, ...meta })
 * - Niveles: debug, info, warn, error
 */

// Tipo para los metadatos del logger
export type LogMetadata = Record<string, unknown>

// Determinar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production'

// Normaliza los argumentos del logger
// Soporta: logger.info(msg, meta) o logger.info({ msg, ...meta })
function normalizeArgs(args: unknown[]): { msg: string; meta: LogMetadata } {
  if (args.length === 0) return { msg: '', meta: {} }

  const first = args[0]

  // Si el primer argumento es un objeto con 'msg', usar formato de pino
  if (typeof first === 'object' && first !== null && 'msg' in first) {
    const { msg, ...rest } = first as { msg: string; [key: string]: unknown }
    return { msg, meta: rest as LogMetadata }
  }

  // Si no, usar formato simple (msg, meta)
  const msg = typeof first === 'string' ? first : JSON.stringify(first)
  const meta = args.length > 1 && typeof args[1] === 'object' && args[1] !== null
    ? args[1] as LogMetadata
    : {}

  return { msg, meta }
}

// Logger simple sin dependencias externas
const logger = {
  info: (...args: unknown[]) => {
    const { msg, meta } = normalizeArgs(args)
    if (isProduction) {
      console.log(JSON.stringify({ level: 'info', msg, ...meta }))
    } else {
      console.log('[INFO]', msg, Object.keys(meta).length > 0 ? meta : '')
    }
  },
  warn: (...args: unknown[]) => {
    const { msg, meta } = normalizeArgs(args)
    if (isProduction) {
      console.warn(JSON.stringify({ level: 'warn', msg, ...meta }))
    } else {
      console.warn('[WARN]', msg, Object.keys(meta).length > 0 ? meta : '')
    }
  },
  error: (...args: unknown[]) => {
    const { msg, meta } = normalizeArgs(args)
    if (isProduction) {
      console.error(JSON.stringify({ level: 'error', msg, ...meta }))
    } else {
      console.error('[ERROR]', msg, Object.keys(meta).length > 0 ? meta : '')
    }
  },
  debug: (...args: unknown[]) => {
    if (!isProduction) {
      const { msg, meta } = normalizeArgs(args)
      console.log('[DEBUG]', msg, Object.keys(meta).length > 0 ? meta : '')
    }
  },
  child: (context: Record<string, string>) => ({
    info: (...args: unknown[]) => {
      const { msg, meta } = normalizeArgs(args)
      logger.info({ msg, ...context, ...meta })
    },
    warn: (...args: unknown[]) => {
      const { msg, meta } = normalizeArgs(args)
      logger.warn({ msg, ...context, ...meta })
    },
    error: (...args: unknown[]) => {
      const { msg, meta } = normalizeArgs(args)
      logger.error({ msg, ...context, ...meta })
    },
    debug: (...args: unknown[]) => {
      const { msg, meta } = normalizeArgs(args)
      logger.debug({ msg, ...context, ...meta })
    },
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
