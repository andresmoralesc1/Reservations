import { NextResponse } from "next/server"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db } from "@/lib/db"

export async function POST() {
  try {
    await migrate(db, { migrationsFolder: "drizzle/migrations" })

    return NextResponse.json({
      success: true,
      message: "Migración ejecutada correctamente"
    })
  } catch (error) {
    console.error("[Migrate] Error:", error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
