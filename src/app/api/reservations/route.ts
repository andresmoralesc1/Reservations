import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservations, customers, reservationHistory, tables, services } from "@/drizzle/schema"
import { eq, and, desc } from "drizzle-orm"
import { generateReservationCode, normalizePhoneNumber } from "@/lib/utils"
import { availabilityChecker } from "@/services/availability"
import { servicesAvailability } from "@/lib/availability/services-availability"
import { z } from "zod"

// Validation schema for creating a reservation
const createReservationSchema = z.object({
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  customerPhone: z.string().regex(/^3\d{9}$/, "Número de teléfono inválido"),
  restaurantId: z.string().uuid("ID de restaurante inválido"),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  partySize: z.number().int().min(1).max(50),
  specialRequests: z.string().optional(),
  source: z.enum(["IVR", "WHATSAPP", "MANUAL", "WEB"]).default("IVR"),
  sessionId: z.string().optional(),
})

// GET /api/reservations - List reservations with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const date = searchParams.get("date")
    const restaurantId = searchParams.get("restaurantId")
    const code = searchParams.get("code")
    const phone = searchParams.get("phone")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // If searching by code, return single reservation
    if (code) {
      const reservation = await db.query.reservations.findFirst({
        where: eq(reservations.reservationCode, code),
        with: {
          restaurant: true,
          customer: true,
        },
      })

      if (!reservation) {
        return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
      }

      return NextResponse.json({ reservation })
    }

    // Build query conditions
    const conditions = []

    if (status) {
      conditions.push(eq(reservations.status, status))
    }
    if (date) {
      conditions.push(eq(reservations.reservationDate, date))
    }
    if (restaurantId) {
      conditions.push(eq(reservations.restaurantId, restaurantId))
    }
    if (phone) {
      conditions.push(eq(reservations.customerPhone, phone))
    }

    // Query with conditions
    const resultList = await db.query.reservations.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        restaurant: true,
        customer: true,
      },
      orderBy: [desc(reservations.createdAt)],
      limit,
      offset,
    })

    return NextResponse.json({
      reservations: resultList,
      meta: {
        limit,
        offset,
        count: resultList.length,
      },
    })
  } catch (error) {
    console.error("Error fetching reservations:", error)
    return NextResponse.json(
      { error: "Error al obtener reservas" },
      { status: 500 }
    )
  }
}

// POST /api/reservations - Create a new reservation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = createReservationSchema.parse(body)

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(validatedData.customerPhone)

    // Check if there's an active service for the requested date/time
    const activeServices = await servicesAvailability.getActiveServicesForDateTime(
      validatedData.reservationDate,
      validatedData.reservationTime,
      validatedData.restaurantId
    )

    if (activeServices.length === 0) {
      return NextResponse.json(
        {
          error: "No hay servicio configurado para esta fecha y hora",
          message: "El restaurante no tiene servicio configurado para la fecha y hora solicitada",
        },
        { status: 400 }
      )
    }

    // Use first matching service (following "first created wins" rule)
    const activeService = activeServices[0]

    // Check availability with services validation
    const availability = await servicesAvailability.checkAvailabilityWithServices({
      restaurantId: validatedData.restaurantId,
      date: validatedData.reservationDate,
      time: validatedData.reservationTime,
      partySize: validatedData.partySize,
    })

    if (!availability.available) {
      return NextResponse.json(
        {
          error: availability.message || "No hay disponibilidad para la fecha y hora seleccionadas",
          service: availability.service,
          alternativeSlots: availability.alternativeSlots,
        },
        { status: 409 }
      )
    }

    // Find or create customer
    let customer = await db.query.customers.findFirst({
      where: eq(customers.phoneNumber, normalizedPhone),
    })

    if (!customer) {
      const [newCustomer] = await db
        .insert(customers)
        .values({
          phoneNumber: normalizedPhone,
          name: validatedData.customerName,
        })
        .returning()
      customer = newCustomer
    } else if (customer.name !== validatedData.customerName) {
      // Update customer name if different
      const [updated] = await db
        .update(customers)
        .set({ name: validatedData.customerName })
        .where(eq(customers.id, customer.id))
        .returning()
      customer = updated
    }

    // Generate reservation code
    const reservationCode = generateReservationCode()

    // Calculate session expiry (30 minutes from now)
    const sessionExpiresAt = validatedData.sessionId
      ? new Date(Date.now() + 30 * 60 * 1000)
      : null

    // Create reservation
    const [newReservation] = await db
      .insert(reservations)
      .values({
        reservationCode,
        customerId: customer.id,
        customerName: validatedData.customerName,
        customerPhone: normalizedPhone,
        restaurantId: validatedData.restaurantId,
        reservationDate: validatedData.reservationDate,
        reservationTime: validatedData.reservationTime,
        partySize: validatedData.partySize,
        tableIds: availability.suggestedTables || [],
        status: "PENDIENTE",
        source: validatedData.source,
        sessionId: validatedData.sessionId,
        sessionExpiresAt,
        specialRequests: validatedData.specialRequests,
        // Service info
        serviceId: activeService.id,
        estimatedDurationMinutes: activeService.defaultDurationMinutes,
      })
      .returning()

    // Record history
    await db.insert(reservationHistory).values({
      reservationId: newReservation.id,
      oldStatus: null,
      newStatus: "PENDIENTE",
      changedBy: validatedData.source,
      metadata: {
        source: validatedData.source,
        sessionId: validatedData.sessionId,
        serviceId: activeService.id,
        serviceName: activeService.name,
      },
    })

    // Return the created reservation
    const result = await db.query.reservations.findFirst({
      where: eq(reservations.id, newReservation.id),
      with: {
        restaurant: true,
        customer: true,
      },
    })

    return NextResponse.json(
      { reservation: result },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating reservation:", error)
    return NextResponse.json(
      { error: "Error al crear reserva" },
      { status: 500 }
    )
  }
}
