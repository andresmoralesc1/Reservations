import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { redis } from "@/lib/redis"

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
  try {
    await redis.ping()
    checks.services.redis = "ok"
  } catch (error) {
    checks.services.redis = "error"
    checks.status = "degraded"
  }

  const statusCode = checks.status === "ok" ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
