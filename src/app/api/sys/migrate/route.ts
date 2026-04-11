import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function POST() {
  try {
    // Crear tabla failed_reservations directamente con SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS failed_reservations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_name text NOT NULL,
        customer_phone text NOT NULL,
        reservation_date text NOT NULL,
        reservation_time text NOT NULL,
        party_size integer NOT NULL,
        special_requests text,
        failure_reason text NOT NULL,
        action_attempted text NOT NULL,
        restaurant_id uuid,
        session_id text,
        partial_data jsonb,
        recovery_status text NOT NULL DEFAULT 'pending',
        recovered_at timestamp,
        recovered_by text,
        created_at timestamp DEFAULT now(),
        expires_at timestamp
      )
    `)

    // Crear índices
    await db.execute(sql`CREATE INDEX IF NOT EXISTS failed_reservations_phone_idx ON failed_reservations(customer_phone)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS failed_reservations_status_idx ON failed_reservations(recovery_status)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS failed_reservations_date_idx ON failed_reservations(reservation_date)`)
    await db.execute(sql`CREATE INDEX IF NOT EXISTS failed_reservations_created_idx ON failed_reservations(created_at)`)

    return NextResponse.json({
      success: true,
      message: "Tabla failed_reservations creada correctamente"
    })
  } catch (error) {
    console.error("[Migrate] Error:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
