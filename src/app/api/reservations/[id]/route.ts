import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations, customers, reservationHistory } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { z } from "zod"

// Validation schema for updating a reservation
const updateReservationSchema = z.object({
  customerName: z.string().min(2).optional(),
  customerPhone: z.string().regex(/^3\d{9}$/).optional(),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  partySize: z.number().int().min(1).max(50).optional(),
  specialRequests: z.string().optional(),
  status: z.enum(["PENDIENTE", "CONFIRMADO", "CANCELADO", "NO_SHOW"]).optional(),
  tableIds: z.array(z.string().uuid()).optional(),
})

// GET /api/reservations/[id] - Get a specific reservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.id, id),
      with: {
        restaurant: true,
        customer: true,
        whatsappMessages: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ reservation })
  } catch (error) {
    console.error("Error fetching reservation:", error)
    return NextResponse.json(
      { error: "Error al obtener reserva" },
      { status: 500 }
    )
  }
}

// PUT /api/reservations/[id] - Update a reservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Get existing reservation
    const existing = await db.query.reservations.findFirst({
      where: eq(reservations.id, id),
    })

    if (!existing) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    // Validate input
    const validatedData = updateReservationSchema.parse(body)

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (validatedData.customerName) updateData.customerName = validatedData.customerName
    if (validatedData.reservationDate) updateData.reservationDate = validatedData.reservationDate
    if (validatedData.reservationTime) updateData.reservationTime = validatedData.reservationTime
    if (validatedData.partySize) updateData.partySize = validatedData.partySize
    if (validatedData.specialRequests !== undefined) updateData.specialRequests = validatedData.specialRequests
    if (validatedData.tableIds) updateData.tableIds = validatedData.tableIds

    // Handle status changes with timestamps
    if (validatedData.status && validatedData.status !== existing.status) {
      updateData.status = validatedData.status

      if (validatedData.status === "CONFIRMADO") {
        updateData.confirmedAt = new Date()
      } else if (validatedData.status === "CANCELADO") {
        updateData.cancelledAt = new Date()
      }

      // Record history
      await db.insert(reservationHistory).values({
        reservationId: id,
        oldStatus: existing.status,
        newStatus: validatedData.status,
        changedBy: "ADMIN",
        metadata: {
          previousData: existing,
          updateData: validatedData,
        },
      })
    }

    // Update customer if name/phone changed
    if (validatedData.customerName || validatedData.customerPhone) {
      if (existing.customerId) {
        const customerUpdate: Record<string, unknown> = {}
        if (validatedData.customerName) customerUpdate.name = validatedData.customerName
        if (validatedData.customerPhone) customerUpdate.phoneNumber = validatedData.customerPhone

        await db
          .update(customers)
          .set(customerUpdate)
          .where(eq(customers.id, existing.customerId))
      }
    }

    // Update reservation
    const [updated] = await db
      .update(reservations)
      .set(updateData)
      .where(eq(reservations.id, id))
      .returning()

    // Return updated reservation
    const result = await db.query.reservations.findFirst({
      where: eq(reservations.id, id),
      with: {
        restaurant: true,
        customer: true,
      },
    })

    return NextResponse.json({ reservation: result })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating reservation:", error)
    return NextResponse.json(
      { error: "Error al actualizar reserva" },
      { status: 500 }
    )
  }
}

// DELETE /api/reservations/[id] - Cancel a reservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get existing reservation
    const existing = await db.query.reservations.findFirst({
      where: eq(reservations.id, id),
    })

    if (!existing) {
      return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
    }

    // Update status to CANCELLED
    const [updated] = await db
      .update(reservations)
      .set({
        status: "CANCELADO",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, id))
      .returning()

    // Record history
    await db.insert(reservationHistory).values({
      reservationId: id,
      oldStatus: existing.status,
      newStatus: "CANCELADO",
      changedBy: "SYSTEM",
    })

    return NextResponse.json({ reservation: updated })
  } catch (error) {
    console.error("Error cancelling reservation:", error)
    return NextResponse.json(
      { error: "Error al cancelar reserva" },
      { status: 500 }
    )
  }
}
