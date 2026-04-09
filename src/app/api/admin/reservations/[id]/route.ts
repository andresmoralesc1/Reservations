import { NextRequest, NextResponse } from "next/server"
import { approveReservation, rejectReservation, markNoShow, ReservationNotFoundError } from "@/lib/services"
import { invalidateReservationCache } from "@/lib/cache"

// POST /api/admin/reservations/[id] - Actions on reservation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    console.log(`[API] POST /api/admin/reservations/${id}`, { action })

    let updated

    if (action === "approve") {
      updated = await approveReservation(id)
    } else if (action === "reject") {
      const { reason } = body
      updated = await rejectReservation(id, reason)
    } else {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
    }

    // Invalidar caché (no bloquea si falla)
    try {
      await invalidateReservationCache(updated.restaurantId, updated.reservationDate)
    } catch (cacheError) {
      console.warn("[API] Cache invalidation failed (non-critical):", cacheError)
    }

    return NextResponse.json({ reservation: updated })
  } catch (error) {
    if (error instanceof ReservationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error("[API] Admin action error:", error)
    return NextResponse.json(
      { error: "Error en la acción", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PUT /api/admin/reservations/[id] - Update reservation (No Show)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log(`[API] PUT /api/admin/reservations/${id}`, { status: body.status })

    // Handle status changes
    if (body.status === "NO_SHOW") {
      const updated = await markNoShow(id)

      // Invalidar caché (no bloquea si falla)
      try {
        await invalidateReservationCache(updated.restaurantId, updated.reservationDate)
      } catch (cacheError) {
        console.warn("[API] Cache invalidation failed (non-critical):", cacheError)
      }

      return NextResponse.json({ reservation: updated })
    }

    return NextResponse.json({ error: "Acción no soportada" }, { status: 400 })
  } catch (error) {
    console.error("[API] Update error:", error)
    return NextResponse.json(
      { error: "Error al actualizar", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
