import { NextRequest, NextResponse } from "next/server"
import { approveReservation, rejectReservation, ReservationNotFoundError } from "@/lib/services"

// POST /api/admin/reservations/[id] - Actions on reservation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === "approve") {
      const updated = await approveReservation(id)
      return NextResponse.json({ reservation: updated })
    }

    if (action === "reject") {
      const { reason } = body
      const updated = await rejectReservation(id, reason)
      return NextResponse.json({ reservation: updated })
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error("Admin action error:", error)
    return NextResponse.json(
      { error: "Error en la acción" },
      { status: 500 }
    )
  }
}

// PUT /api/admin/reservations/[id] - Update reservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Handle status changes
    if (body.status === "NO_SHOW") {
      const { markNoShow } = await import("@/lib/services")
      const updated = await markNoShow(id)
      return NextResponse.json({ reservation: updated })
    }

    return NextResponse.json({ error: "Acción no soportada" }, { status: 400 })
  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}
