import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

// GET /api/reservations/code/[code] - Get reservation by code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    // Remove RES- prefix if present
    const reservationCode = code.toUpperCase().replace(/^RES-/, "")

    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.reservationCode, `RES-${reservationCode}`),
      with: {
        restaurant: true,
        customer: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error("Error fetching reservation by code:", error)
    return NextResponse.json(
      { error: "Error al obtener reserva" },
      { status: 500 }
    )
  }
}
