import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { tables } from "@/drizzle/schema"
import { eq, and, sql, desc } from "drizzle-orm"

// GET /api/admin/tables - Get all tables with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restaurantId = searchParams.get("restaurantId")
    const location = searchParams.get("location")

    const conditions = []

    if (restaurantId) {
      conditions.push(eq(tables.restaurantId, restaurantId))
    }

    if (location) {
      conditions.push(eq(tables.location, location))
    }

    const resultList = await db.query.tables.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [sql`CAST(${tables.tableNumber} AS INTEGER)`],
    })

    return NextResponse.json({
      tables: resultList,
      count: resultList.length,
    })
  } catch (error) {
    console.error("Error fetching tables:", error)
    return NextResponse.json(
      { error: "Error al obtener mesas" },
      { status: 500 }
    )
  }
}

// POST /api/admin/tables - Create a new table
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      restaurantId,
      tableNumber,
      capacity,
      location,
      isAccessible,
      shape,
      positionX,
      positionY,
      rotation,
      width,
      height,
      diameter,
      stoolCount,
      stoolPositions,
    } = body

    // Validation
    if (!restaurantId || !tableNumber || !capacity || !location) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      )
    }

    // Validate shape
    const validShapes = ["circular", "cuadrada", "rectangular", "barra"]
    if (shape && !validShapes.includes(shape)) {
      return NextResponse.json(
        { error: "Forma inválida. Debe ser: circular, cuadrada, rectangular o barra" },
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

    // Check if table number already exists for this restaurant
    const existing = await db.query.tables.findFirst({
      where: and(
        eq(tables.restaurantId, restaurantId),
        eq(tables.tableNumber, tableNumber)
      ),
    })

    if (existing) {
      return NextResponse.json(
        { error: "El número de mesa ya existe" },
        { status: 409 }
      )
    }

    const [created] = await db
      .insert(tables)
      .values({
        restaurantId,
        tableNumber,
        capacity,
        location,
        isAccessible: isAccessible || false,
        shape: shape || "rectangular",
        positionX: positionX ?? 0,
        positionY: positionY ?? 0,
        rotation: rotation ?? 0,
        width: width ?? (shape === "circular" ? 80 : shape === "cuadrada" ? 80 : 120),
        height: height ?? (shape === "circular" ? 80 : shape === "cuadrada" ? 80 : 80),
        diameter: diameter ?? 80,
        stoolCount: stoolCount ?? 0,
        stoolPositions: stoolPositions ?? null,
      })
      .returning()

    return NextResponse.json({ table: created }, { status: 201 })
  } catch (error) {
    console.error("Error creating table:", error)
    return NextResponse.json(
      { error: "Error al crear mesa" },
      { status: 500 }
    )
  }
}
