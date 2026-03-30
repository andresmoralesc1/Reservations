import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST() {
  try {
    // Crear índices optimizados para Dashboard y Analíticas
    const indexes = [
      // Para Analíticas (agrupar por estado y fecha)
      `CREATE INDEX IF NOT EXISTS "reservations_status_date_idx" ON "reservations" ("status", "reservation_date")`,

      // Para búsqueda por código
      `CREATE INDEX IF NOT EXISTS "reservations_code_idx" ON "reservations" ("reservation_code")`,

      // Para el conteo de no-shows por cliente
      `CREATE INDEX IF NOT EXISTS "reservations_customer_status_idx" ON "reservations" ("customer_id", "status")`,

      // Para análisis por origen y fecha
      `CREATE INDEX IF NOT EXISTS "reservations_source_date_idx" ON "reservations" ("source", "reservation_date")`,

      // Para sesiones activas
      `CREATE INDEX IF NOT EXISTS "reservation_sessions_expires_at_idx" ON "reservation_sessions" ("expires_at")`,

      `CREATE INDEX IF NOT EXISTS "reservation_sessions_phone_number_idx" ON "reservation_sessions" ("phone_number")`,
    ]

    const results: string[] = []

    for (const sql of indexes) {
      await db.execute(sql)
      results.push(sql.split('"')[1] || sql)
    }

    return NextResponse.json({
      success: true,
      message: "Índices creados exitosamente",
      indexes: results,
    })
  } catch (error) {
    console.error("[Migrations] Error creating indexes:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
