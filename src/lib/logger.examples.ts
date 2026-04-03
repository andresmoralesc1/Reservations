/**
 * EJEMPLOS DE USO DEL LOGGER
 *
 * Este archivo muestra cómo usar el logger en diferentes situaciones.
 */

import { logger, createLogger, logError, logPerformance } from './logger'

// ============================================
// 1. LOGS BÁSICOS
// ============================================

// Info - para eventos importantes del flujo normal
logger.info({
  msg: 'Reserva creada exitosamente',
  reservationCode: 'RES-ABC12',
  customerName: 'María García',
  customerPhone: '612345678',
  date: '2026-04-10',
  time: '20:00',
  partySize: 4,
})

// Debug - para información detallada durante desarrollo
logger.debug({
  msg: 'Verificando disponibilidad',
  date: '2026-04-10',
  time: '20:00',
  partySize: 4,
  restaurantId: 'default',
})

// Warn - para situaciones inusuales pero no críticas
logger.warn({
  msg: 'Disponibilidad baja',
  date: '2026-04-10',
  time: '20:00',
  availableTables: 1,
  requestedPartySize: 8,
})

// Error - para errores y excepciones
logger.error({
  msg: 'Error al crear reserva',
  error: 'Database connection timeout',
  dto: { customerName: 'Juan', phone: '611111111' },
})

// ============================================
// 2. LOGGER CON CONTEXTO (createLogger)
// ============================================

// Crear un logger específico para un módulo
const dbLogger = createLogger({ module: 'database' })
dbLogger.info({
  msg: 'Conexión establecida',
  pool: 'supabase',
  maxConnections: 10,
})

const apiLogger = createLogger({ module: 'api', endpoint: '/reservations' })
apiLogger.info({
  msg: 'POST /api/reservations',
  body: { customerName: 'Test' },
})

// Logger anidado con más contexto
const reservationLogger = createLogger({ module: 'reservations' })
const createReservationLogger = reservationLogger.child({ action: 'create' })
createReservationLogger.info({
  msg: 'Iniciando validación',
  dto: { customerPhone: '612345678' },
})

// ============================================
// 3. LOG ERROR CON STACK TRACE
// ============================================

try {
  // ... código que puede fallar
  throw new Error('Database connection failed')
} catch (err) {
  logError('Fallo al conectar a la base de datos', err, {
    database: 'supabase',
    retries: 3,
  })
}

// ============================================
// 4. LOG PERFORMANCE
// ============================================

// Medir duración de operaciones
const startTime = Date.now()
// ... operación ...
const duration = Date.now() - startTime

logPerformance('createReservation', duration, {
  restaurantId: 'default',
  partySize: 4,
})

// Con async/await
async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    return await fn()
  } finally {
    logPerformance(operation, Date.now() - start)
  }
}

// Uso:
await measurePerformance('checkAvailability', async () => {
  // ... lógica de verificación ...
  return { available: true }
})

// ============================================
// 5. METADATA COMPLEJA
// ============================================

logger.info({
  msg: 'Reserva modificada',
  reservationCode: 'RES-ABC12',
  changes: {
    before: { partySize: 4, time: '20:00' },
    after: { partySize: 6, time: '21:00' },
  },
  modifiedBy: 'admin@restaurante.com',
  ipAddress: '192.168.1.100',
})

// ============================================
// 6. LOGS EN API ROUTE
// ============================================

import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const apiLogger = createLogger({ module: 'api', method: 'POST' })

  try {
    const body = await request.json()
    apiLogger.info({
      msg: 'Request recibida',
      path: '/reservations',
      body,
    })

    // ... lógica del endpoint ...

    apiLogger.info({
      msg: 'Respuesta exitosa',
      status: 201,
      reservationCode: 'RES-ABC12',
    })
    return Response.json({ success: true })
  } catch (err) {
    logError('Error en POST /reservations', err, {
      body: await request.json(),
    })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// 7. FORMATO DE SALIDA
// ============================================

/*
// DESARROLLO (NODE_ENV=development):
{
  "level": "info",
  "time": "16:20:30",
  "msg": "Reserva creada exitosamente",
  "reservationCode": "RES-ABC12",
  "customerName": "María García"
}

// PRODUCCIÓN (NODE_ENV=production):
{"level":30,"time":1712809230123,"msg":"Reserva creada exitosamente","reservationCode":"RES-ABC12"}
*/
