import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

// POST /api/admin/reservations/[id]/approve - Approve reservation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === "approve") {
      return await approveAction(id)
    }

    if (action === "reject") {
      const { reason } = body
      return await rejectAction(id, reason)
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error) {
    console.error("Admin action error:", error)
    return NextResponse.json(
      { error: "Error en la acción" },
      { status: 500 }
    )
  }
}

async function approveAction(id: string) {
  const existing = await db.query.reservations.findFirst({
    where: eq(reservations.id, id),
  })

  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  const [updated] = await db
    .update(reservations)
    .set({
      status: "CONFIRMADO",
      confirmedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reservations.id, id))
    .returning()

  return NextResponse.json({ reservation: updated })
}

async function rejectAction(id: string, reason?: string) {
  const existing = await db.query.reservations.findFirst({
    where: eq(reservations.id, id),
  })

  if (!existing) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
  }

  const [updated] = await db
    .update(reservations)
    .set({
      status: "CANCELADO",
      cancelledAt: new Date(),
      updatedAt: new Date(),
      specialRequests: existing.specialRequests
        ? `${existing.specialRequests}\n\nRechazado: ${reason || "Sin razón especificada"}`
        : `Rechazado: ${reason || "Sin razón especificada"}`,
    })
    .where(eq(reservations.id, id))
    .returning()

  return NextResponse.json({ reservation: updated })
}
