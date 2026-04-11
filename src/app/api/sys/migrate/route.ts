import { NextResponse } from "next/server"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { db } from "@/lib/db"
import path from "path"

export async function POST() {
  try {
    // Ruta absoluta para serverless environments
    const migrationsFolder = path.join(process.cwd(), "drizzle/migrations")
    await migrate(db, { migrationsFolder })

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
