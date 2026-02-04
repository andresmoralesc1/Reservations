import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tables, reservations } from "@/drizzle/schema"
import { eq, and, sql } from "drizzle-orm"

// GET /api/admin/tables/[id] - Get a single table
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const table = await db.query.tables.findFirst({
      where: eq(tables.id, id),
    })

    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 })
    }

    // Get upcoming reservations for this table
    const today = new Date().toISOString().split("T")[0]
    const tableReservations = await db.query.reservations.findMany({
      where: and(
        sql`${reservations.tableIds} @> ${sql`ARRAY[${id}::uuid]`}`,
        sql`${reservations.reservationDate} >= ${today}`,
        sql`${reservations.status} != ${sql`'CANCELADO'`}`
      ),
      orderBy: [reservations.reservationDate, reservations.reservationTime],
    })

    return NextResponse.json({
      table,
      reservations: tableReservations,
    })
  } catch (error) {
    console.error("Error fetching table:", error)
    return NextResponse.json(
      { error: "Error al obtener mesa" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/tables/[id] - Update a table
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { tableNumber, capacity, location, isAccessible } = body

    // Check if table exists
    const existing = await db.query.tables.findFirst({
      where: eq(tables.id, id),
    })

    if (!existing) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 })
    }

    // Check if new table number conflicts with another table
    if (tableNumber && tableNumber !== existing.tableNumber) {
      const conflict = await db.query.tables.findFirst({
        where: and(
          eq(tables.restaurantId, existing.restaurantId),
          eq(tables.tableNumber, tableNumber),
          sql`${tables.id} != ${id}`
        ),
      })

      if (conflict) {
        return NextResponse.json(
          { error: "El número de mesa ya existe" },
          { status: 409 }
        )
      }
    }

    const updates: Record<string, unknown> = {}
    if (tableNumber !== undefined) updates.tableNumber = tableNumber
    if (capacity !== undefined) updates.capacity = capacity
    if (location !== undefined) updates.location = location
    if (isAccessible !== undefined) updates.isAccessible = isAccessible

    const [updated] = await db
      .update(tables)
      .set(updates)
      .where(eq(tables.id, id))
      .returning()

    return NextResponse.json({ table: updated })
  } catch (error) {
    console.error("Error updating table:", error)
    return NextResponse.json(
      { error: "Error al actualizar mesa" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/tables/[id] - Delete a table
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if table exists
    const existing = await db.query.tables.findFirst({
      where: eq(tables.id, id),
    })

    if (!existing) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 })
    }

    // Check for active or future reservations
    const today = new Date().toISOString().split("T")[0]
    const activeReservations = await db.query.reservations.findMany({
      where: and(
        sql`${reservations.tableIds} @> ${sql`ARRAY[${id}::uuid]`}`,
        sql`${reservations.reservationDate} >= ${today}`,
        sql`${reservations.status} != ${sql`'CANCELADO'`}`
      ),
      limit: 1,
    })

    if (activeReservations.length > 0) {
      return NextResponse.json(
        {
          error: "No se puede eliminar la mesa. Tiene reservas activas o futuras.",
          reservations: activeReservations.length,
        },
        { status: 409 }
      )
    }

    await db.delete(tables).where(eq(tables.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting table:", error)
    return NextResponse.json(
      { error: "Error al eliminar mesa" },
      { status: 500 }
    )
  }
}
