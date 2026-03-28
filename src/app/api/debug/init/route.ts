import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tables } from "@/drizzle/schema"
import { withDebugProtection } from "@/middleware/debug-protection"
import { config } from "@/lib/config/env"

export const GET = withDebugProtection(async () => {
  try {
    // Check if tables already exist
    const existing = await db.query.tables.findMany({
      columns: { id: true },
      where: (tables, { eq }) => eq(tables.restaurantId, config.restaurantId),
    })

    if (existing.length > 0) {
      return NextResponse.json({
        error: "Ya existen mesas. Ve a /admin/tables para gestionarlas.",
        existingCount: existing.length,
      })
    }

    // Create 30 tables: 10 Interior, 10 Terraza, 10 Patio
    const tablesToCreate = []

    // Interior: 10 tables
    for (let i = 1; i <= 10; i++) {
      const capacity = i <= 6 ? 2 : 4
      tablesToCreate.push({
        restaurantId: config.restaurantId,
        tableNumber: `I-${i}`,
        tableCode: `I-${i}`,
        capacity,
        location: "interior",
        isAccessible: i === 1,
        shape: "rectangular",
        positionX: ((i - 1) % 5) * 120,
        positionY: Math.floor((i - 1) / 5) * 100,
        width: capacity <= 2 ? 80 : 100,
        height: 80,
      })
    }

    // Terraza: 10 tables
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
        height: 80,
      })
    }

    // Patio: 10 tables
    for (let i = 1; i <= 10; i++) {
      const capacity = i <= 3 ? 4 : i <= 7 ? 6 : 8
      tablesToCreate.push({
        restaurantId: config.restaurantId,
        tableNumber: `P-${i}`,
        tableCode: `P-${i}`,
        capacity,
        location: "patio",
        isAccessible: i === 1,
        shape: "rectangular",
        positionX: ((i - 1) % 5) * 120,
        positionY: Math.floor((i - 1) / 5) * 100,
        width: capacity <= 4 ? 100 : 120,
        height: 80,
      })
    }

    const created = await db.insert(tables).values(tablesToCreate).returning()

    return NextResponse.json({
      success: true,
      message: `✅ ${created.length} mesas creadas`,
      summary: {
        total: created.length,
        interior: 10,
        terraza: 10,
        patio: 10,
      },
      tables: created.map(t => ({
        code: t.tableCode,
        capacity: t.capacity,
        location: t.location,
      }))
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
})
