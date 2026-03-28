import { NextRequest, NextResponse } from "next/server"
import { withDebugProtection } from "@/middleware/debug-protection"
import { db } from "@/lib/db"
import { tables } from "@/drizzle/schema"
import { config } from "@/lib/config/env"

export const POST = withDebugProtection(async () => {
  try {
    // Check if tables already exist
    const existing = await db.query.tables.findMany({
      where: (tables, { eq }) => eq(tables.restaurantId, config.restaurantId),
    })

    if (existing.length > 0) {
      return NextResponse.json({
        error: "Ya existen mesas. Elimínalas primero o usa el panel de admin.",
        existingCount: existing.length,
      })
    }

    // Create 30 tables distributed across zones
    // 10 Interior (2-4 pax)
    // 10 Terraza (2-6 pax)
    // 10 Patio (4-8 pax)
    const tablesToCreate = []

    // Interior: 10 tables, mixed capacities
    for (let i = 1; i <= 10; i++) {
      const capacity = i <= 6 ? 2 : 4
      tablesToCreate.push({
        restaurantId: config.restaurantId,
        tableNumber: `I-${i}`,
        tableCode: `I-${i}`,
        capacity,
        location: "interior",
        isAccessible: i === 1, // First table accessible
        shape: "rectangular",
        positionX: ((i - 1) % 5) * 120,
        positionY: Math.floor((i - 1) / 5) * 100,
        width: capacity <= 2 ? 80 : 100,
        height: capacity <= 2 ? 80 : 80,
      })
    }

    // Terraza: 10 tables, mixed capacities
    for (let i = 1; i <= 10; i++) {
      const capacity = i <= 4 ? 2 : i <= 8 ? 4 : 6
      tablesToCreate.push({
        restaurantId: config.restaurantId,
        tableNumber: `T-${i}`,
        tableCode: `T-${i}`,
        capacity,
        location: "terraza",
        isAccessible: i === 1,
        shape: "rectangular",
        positionX: ((i - 1) % 5) * 120,
        positionY: Math.floor((i - 1) / 5) * 100,
        width: capacity <= 2 ? 80 : 100,
        height: capacity <= 2 ? 80 : 80,
      })
    }

    // Patio: 10 tables, larger capacities
    for (let i = 1; i <= 10; i++) {
      const capacity = i <= 3 ? 4 : i <= 7 ? 6 : 8
      tablesToCreate.push({
        restaurantId: config.restaurantId,
        tableNumber: `P-${i}`,
        tableCode: `P-${i}`,
        capacity,
        location: "patio",
        isAccessible: i === 1,
        shape: i <= 3 ? "rectangular" : "rectangular",
        positionX: ((i - 1) % 5) * 120,
        positionY: Math.floor((i - 1) / 5) * 100,
        width: capacity <= 4 ? 100 : 120,
        height: 80,
      })
    }

    // Insert all tables
    const created = await db.insert(tables).values(tablesToCreate).returning()

    return NextResponse.json({
      success: true,
      message: `Se crearon ${created.length} mesas exitosamente`,
      tables: created.map(t => ({
        tableCode: t.tableCode,
        capacity: t.capacity,
        location: t.location,
      }))
    })
  } catch (error) {
    console.error("Error initializing tables:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al crear mesas" },
      { status: 500 }
    )
  }
})
