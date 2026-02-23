import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tableBlocks } from "@/drizzle/schema"
import { eq, and, gte } from "drizzle-orm"
import { z } from "zod"

const createBlockSchema = z.object({
  tableId: z.string().uuid("ID de mesa inválido"),
  restaurantId: z.string().uuid("ID de restaurante inválido"),
  blockDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  reason: z.enum(["mantenimiento", "evento_privado", "reservado", "otro"]),
  notes: z.string().optional(),
})

// GET /api/admin/table-blocks - List table blocks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get("restaurantId")
    const date = searchParams.get("date")
    const tableId = searchParams.get("tableId")

    const conditions = []

    if (restaurantId) {
      conditions.push(eq(tableBlocks.restaurantId, restaurantId))
    }

    if (date) {
      conditions.push(eq(tableBlocks.blockDate, date))
    } else {
      // Only show future blocks if no date specified
      const today = new Date().toISOString().split("T")[0]
      conditions.push(gte(tableBlocks.blockDate, today))
    }

    if (tableId) {
      conditions.push(eq(tableBlocks.tableId, tableId))
    }

    const blocks = await db.query.tableBlocks.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        table: true,
        restaurant: true,
      },
      orderBy: (blocks, { asc }) => [asc(blocks.blockDate), asc(blocks.startTime)],
    })

    return NextResponse.json({ blocks })
  } catch (error) {
    console.error("Error fetching table blocks:", error)
    return NextResponse.json(
      { error: "Error al obtener bloqueos" },
      { status: 500 }
    )
  }
}

// POST /api/admin/table-blocks - Create a new table block
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createBlockSchema.parse(body)

    // Validate time range
    if (validatedData.startTime >= validatedData.endTime) {
      return NextResponse.json(
        { error: "La hora fin debe ser posterior a la hora inicio" },
        { status: 400 }
      )
    }

    // Check for overlapping blocks
    const existingBlocks = await db.query.tableBlocks.findMany({
      where: and(
        eq(tableBlocks.tableId, validatedData.tableId),
        eq(tableBlocks.blockDate, validatedData.blockDate)
      ),
    })

    for (const block of existingBlocks) {
      // Check for overlap
      const newStart = validatedData.startTime
      const newEnd = validatedData.endTime
      const existingStart = block.startTime
      const existingEnd = block.endTime

      const overlaps = newStart < existingEnd && newEnd > existingStart

      if (overlaps) {
        return NextResponse.json(
          { error: "Ya existe un bloqueo para esta mesa en el horario seleccionado" },
          { status: 409 }
        )
      }
    }

    // Create block
    const [newBlock] = await db
      .insert(tableBlocks)
      .values({
        tableId: validatedData.tableId,
        restaurantId: validatedData.restaurantId,
        blockDate: validatedData.blockDate,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        reason: validatedData.reason,
        notes: validatedData.notes,
        createdBy: "admin",
      })
      .returning()

    // Return with table info
    const result = await db.query.tableBlocks.findFirst({
      where: eq(tableBlocks.id, newBlock.id),
      with: {
        table: true,
      },
    })

    return NextResponse.json({ block: result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating table block:", error)
    return NextResponse.json(
      { error: "Error al crear bloqueo" },
      { status: 500 }
    )
  }
}
