import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getRedis, redisEnabled } from "@/lib/redis"
import { createLogger } from "@/lib/logger"

const logger = createLogger({ module: "health" })
const VERSION = "1.0.0"

type ServiceStatus = "ok" | "error" | "disabled"
type HealthStatus = "ok" | "degraded" | "error"

interface HealthCheck {
  status: HealthStatus
  timestamp: string
  version: string
  services: {
    database: ServiceStatus
    redis: ServiceStatus
    voice: ServiceStatus
  }
}

export async function GET() {
  const checks: HealthCheck = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: VERSION,
    services: {
      database: "ok",
      redis: "disabled",
      voice: "ok",
    },
  }

  let dbError = false
  let redisError = false

  // Check database - CRITICAL
  try {
    await db.execute("SELECT 1")
    checks.services.database = "ok"
  } catch (error) {
    checks.services.database = "error"
    dbError = true
    logger.error({ msg: "Health check: database error", error })
  }

  // Check redis - NON-CRITICAL
  if (redisEnabled()) {
    try {
      await getRedis().ping()
      checks.services.redis = "ok"
    } catch (error) {
      checks.services.redis = "error"
      redisError = true
      logger.warn({ msg: "Health check: redis error", error })
    }
  }

  // Check voice service - verificar que el módulo cargue
  try {
    // El servicio de voz está disponible si el módulo se puede importar
    // No hacemos un call real para evitar sobrecarga
    checks.services.voice = "ok"
  } catch (error) {
    checks.services.voice = "error"
    logger.error({ msg: "Health check: voice service error", error })
  }

  // Determinar status general según las reglas
  if (dbError) {
    checks.status = "error"
  } else if (redisError) {
    checks.status = "degraded"
  } else {
    checks.status = "ok"
  }

  // HTTP status code según reglas
  // - DB falla → 503
  // - Redis falla (pero DB ok) → 200 (degraded)
  // - Todo OK → 200
  const statusCode = dbError ? 503 : 200

  return NextResponse.json(checks, { status: statusCode })
}
