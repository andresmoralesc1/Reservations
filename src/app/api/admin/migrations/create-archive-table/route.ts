import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * POST /api/admin/migrations/create-archive-table
 *
 * Crea la tabla reservations_archive si no existe
 */
export async function POST() {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "reservations_archive" (
        "id" uuid PRIMARY KEY NOT NULL,
        "reservation_code" text NOT NULL,
        "customer_id" uuid,
        "customer_name" text NOT NULL,
        "customer_phone" text NOT NULL,
        "restaurant_id" uuid NOT NULL,
        "reservation_date" text NOT NULL,
        "reservation_time" text NOT NULL,
        "party_size" integer NOT NULL,
        "table_ids" uuid[],
        "status" text NOT NULL,
        "source" text NOT NULL,
        "service_id" uuid,
        "estimated_duration_minutes" integer,
        "actual_end_time" text,
        "special_requests" text,
        "is_complex_case" boolean DEFAULT false,
        "created_at" timestamp NOT NULL,
        "confirmed_at" timestamp,
        "cancelled_at" timestamp,
        "updated_at" timestamp NOT NULL,
        "archived_at" timestamp DEFAULT now() NOT NULL,
        "archive_reason" text NOT NULL,
        "days_since_creation" integer NOT NULL
      );
    `

    await db.execute(createTableSQL)

    // Crear índices
    const indexes = [
      `CREATE INDEX IF NOT EXISTS "reservations_archive_date_restaurant_idx" ON "reservations_archive" ("reservation_date", "restaurant_id")`,
      `CREATE INDEX IF NOT EXISTS "reservations_archive_status_idx" ON "reservations_archive" ("status")`,
      `CREATE INDEX IF NOT EXISTS "reservations_archive_archived_at_idx" ON "reservations_archive" ("archived_at")`,
      `CREATE INDEX IF NOT EXISTS "reservations_archive_customer_phone_idx" ON "reservations_archive" ("customer_phone")`,
    ]

    for (const indexSQL of indexes) {
      await db.execute(indexSQL)
    }

    return NextResponse.json({
      success: true,
      message: "Tabla reservations_archive creada exitosamente",
    })
  } catch (error) {
    console.error("[Create Archive Table] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al crear tabla",
      },
      { status: 500 }
    )
  }
}
