import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tables } from "@/drizzle/schema"
import { eq, and, sql } from "drizzle-orm"

// POST /api/admin/tables/bulk - Create multiple tables
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, count, capacity, location, isAccessible, startingNumber } = body

    // Validation
    if (!restaurantId || !count || !capacity || !location) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    if (count < 1 || count > 50) {
      return NextResponse.json(
        { error: "El número de mesas debe estar entre 1 y 50" },
        { status: 400 }
      )
    }

    if (capacity < 1 || capacity > 20) {
      return NextResponse.json(
        { error: "La capacidad debe estar entre 1 y 20" },
        { status: 400 }
      )
    }

    if (!["patio", "interior", "terraza"].includes(location)) {
      return NextResponse.json(
        { error: "Ubicación inválida" },
        { status: 400 }
      )
    }

    // Determine starting number
    let currentNumber = 1
    if (startingNumber) {
      currentNumber = startingNumber
    } else {
      // Find the highest table number for this restaurant
      const existingTables = await db.query.tables.findMany({
        where: eq(tables.restaurantId, restaurantId),
        columns: { tableNumber: true },
      })

      for (const table of existingTables) {
        const num = parseInt(table.tableNumber.replace(/\D/g, ""), 10)
        if (!isNaN(num) && num >= currentNumber) {
          currentNumber = num + 1
        }
      }
    }

    // Create tables
    const createdTables = []
    const errors = []

    for (let i = 0; i < count; i++) {
      const tableNumber = `M-${currentNumber + i}`

      // Check if table number already exists
      const existing = await db.query.tables.findFirst({
        where: and(
          eq(tables.restaurantId, restaurantId),
          eq(tables.tableNumber, tableNumber)
        ),
      })

      if (existing) {
        errors.push({
          tableNumber,
          error: "El número de mesa ya existe",
        })
        continue
      }

      try {
        const [created] = await db
          .insert(tables)
          .values({
            restaurantId,
            tableNumber,
            capacity,
            location,
            isAccessible: isAccessible || false,
          })
          .returning()

        createdTables.push(created)
      } catch (err) {
        errors.push({
          tableNumber,
          error: err instanceof Error ? err.message : "Error desconocido",
        })
      }
    }

    return NextResponse.json({
      tables: createdTables,
      count: createdTables.length,
      errors,
    }, { status: errors.length > 0 ? 207 : 201 })
  } catch (error) {
    console.error("Error creating tables in bulk:", error)
    return NextResponse.json(
      { error: "Error al crear mesas" },
      { status: 500 }
    )
  }
}
