import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config/env"
import { z } from "zod"
import { servicesAvailability } from "@/lib/availability/services-availability"

// Validation schema
const checkAvailabilitySchema = z.object({
  restaurant_id: z.string().uuid().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  party_size: z.number().int().min(1).max(200, "El tamaño del grupo debe estar entre 1 y 200"),
})

// Default restaurant ID from demo environment
const DEFAULT_RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Voice-Bridge-Key',
    },
  })
}

// POST /api/reservations/check-availability
export async function POST(request: NextRequest) {
  try {
    // Validate voice bridge key if present
    const voiceBridgeKey = request.headers.get("X-Voice-Bridge-Key")
    if (voiceBridgeKey && voiceBridgeKey !== process.env.VOICE_BRIDGE_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Parse and validate body
    const body = await request.json()

    // Support both snake_case and camelCase field names
    const normalizedBody = {
      restaurant_id: body.restaurant_id || body.restaurantId || undefined,
      date: body.date,
      time: body.time || body.reservationTime,
      party_size: body.party_size || body.partySize,
    }

    const validatedData = checkAvailabilitySchema.parse(normalizedBody)

    // Use default restaurant ID if not provided
    const restaurantId = validatedData.restaurant_id || DEFAULT_RESTAURANT_ID || config.restaurantId

    // Validate that date is in the future
    const requestedDate = new Date(validatedData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (requestedDate < today) {
      return NextResponse.json(
        { error: "La fecha debe ser hoy o en el futuro" },
        { status: 400 }
      )
    }

    // Check availability using the unified service
    const result = await servicesAvailability.checkAvailabilityWithServices({
      restaurantId,
      date: validatedData.date,
      time: validatedData.time,
      partySize: validatedData.party_size,
    })

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("[POST /api/reservations/check-availability] Error:", error)
    return NextResponse.json(
      { error: "Error al verificar disponibilidad" },
      { status: 503 }
    )
  }
}
