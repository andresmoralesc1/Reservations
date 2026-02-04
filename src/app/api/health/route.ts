import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getRedis, redisEnabled } from "@/lib/redis"

export async function GET() {
  const checks = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      database: "unknown",
      redis: "unknown",
    },
  }

  // Check database
  try {
    await db.execute("SELECT 1")
    checks.services.database = "ok"
  } catch (error) {
    checks.services.database = "error"
    checks.status = "degraded"
  }

  // Check redis
  if (redisEnabled()) {
    try {
      await getRedis().ping()
      checks.services.redis = "ok"
    } catch (error) {
      checks.services.redis = "error"
      checks.status = "degraded"
    }
  } else {
    checks.services.redis = "disabled"
  }

  const statusCode = checks.status === "ok" ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
