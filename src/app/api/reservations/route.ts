import { NextRequest, NextResponse } from "next/server"
import {
  createReservation,
  getReservationByCode,
  listReservations,
  cancelReservation as cancelReservationService
} from "@/lib/services"
import { validateRequestBody, formatZodError, CreateReservationSchema, spanishPhoneSchema } from "@/lib/schemas/reservation-schemas"
import { z } from "zod"
import { invalidateReservationCache } from "@/lib/cache"
import { checkRateLimitOrThrow, getRateLimitIdentifier, RateLimitConfig, RateLimitError } from "@/lib/rate-limit"
import { createLogger } from "@/lib/logger"

const logger = createLogger({ module: "api-reservations" })

/**
 * Schema híbrido que acepta campos en español o inglés
 * Mantiene compatibilidad con el sistema existente
 */
const HybridCreateReservationSchema = z.object({
  // Spanish fields (legacy compatibility)
  nombre: z.string().min(2).optional(),
  numero: spanishPhoneSchema.optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  invitados: z.number().int().min(1).max(50).optional(),
  idMesa: z.string().optional(),
  fuente: z.enum(["WEB", "WHATSAPP", "VOICE", "MANUAL", "IVR"]).optional(),
  restaurante: z.string().optional(),
  observaciones: z.string().max(500).optional(),
  // English fields (admin modal)
  customerName: z.string().min(2).optional(),
  customerPhone: spanishPhoneSchema.optional(),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  partySize: z.number().int().min(1).max(50).optional(),
  specialRequests: z.string().max(500).optional(),
  source: z.enum(["WEB", "WHATSAPP", "VOICE", "MANUAL", "IVR"]).optional(),
  restaurantId: z.string().optional(),
  confirmImmediately: z.boolean().optional(),
}).refine(
  (data) => {
    // Either Spanish or English fields must be provided
    const hasSpanish = data.nombre && data.numero && data.fecha && data.hora && data.invitados
    const hasEnglish = data.customerName && data.customerPhone && data.reservationDate && data.reservationTime && data.partySize
    return hasSpanish || hasEnglish
  },
  { message: "Se requieren todos los campos (en español o inglés)" }
)

const DEFAULT_RESTAURANT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"

// GET /api/reservations - Listar o consultar reservas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const restaurant = searchParams.get("restaurante") || searchParams.get("restaurantId")
    const date = searchParams.get("fecha") || searchParams.get("date")
    const status = searchParams.get("estatus") || searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    logger.debug({
      msg: "GET /api/reservations",
      code,
      restaurant,
      date,
      status,
      limit,
    })

    // Buscar por código
    if (code) {
      try {
        const reservation = await getReservationByCode(code)
        return NextResponse.json({ reservation })
      } catch {
        return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 })
      }
    }

    // Listar con filtros
    const reservations = await listReservations({
      restaurantId: restaurant || DEFAULT_RESTAURANT_ID,
      date: date || undefined,
      status: status || undefined,
      limit
    })

    return NextResponse.json({
      reservations,
      meta: { count: reservations.length }
    })
  } catch (error) {
    logger.error({ msg: "Error en GET /api/reservations", error })
    return NextResponse.json({ error: "Error al obtener reservas" }, { status: 500 })
  }
}

// POST /api/reservations - Crear reserva
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 reservas por minuto por IP
    const identifier = getRateLimitIdentifier(request)
    try {
      await checkRateLimitOrThrow(identifier, RateLimitConfig.reservations, "reservations")
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.warn({
          msg: "Rate limit hit",
          identifier,
          limit: RateLimitConfig.reservations.limit,
          windowSeconds: RateLimitConfig.reservations.windowSeconds,
        })
        return error.toResponse()
      }
      throw error
    }

    const body = await request.json()

    logger.debug({
      msg: "POST /api/reservations - Request entrante",
      customerName: body.nombre || body.customerName,
      customerPhone: body.numero || body.customerPhone,
      date: body.fecha || body.reservationDate,
      time: body.hora || body.reservationTime,
      partySize: body.invitados || body.partySize,
      source: body.fuente || body.source,
    })

    // Validar datos con schema mejorado
    const validated = validateRequestBody(body, HybridCreateReservationSchema)

    if (!validated.success) {
      return NextResponse.json(validated.error, { status: 400 })
    }

    const validatedData = validated.data

    // Normalize to English format for new service
    const customerName = validatedData.nombre || validatedData.customerName!
    const customerPhone = validatedData.numero || validatedData.customerPhone!
    const reservationDate = validatedData.fecha || validatedData.reservationDate!
    const reservationTime = validatedData.hora || validatedData.reservationTime!
    const partySize = validatedData.invitados || validatedData.partySize!
    const source = validatedData.fuente || validatedData.source || "MANUAL"
    const restaurantId = validatedData.restaurante || validatedData.restaurantId || DEFAULT_RESTAURANT_ID
    const specialRequests = validatedData.observaciones || validatedData.specialRequests

    // Parse table IDs from idMesa if provided
    const tableIds = validatedData.idMesa ? [validatedData.idMesa] : undefined

    // Crear reserva usando el nuevo servicio
    const reservation = await createReservation({
      customerName,
      customerPhone,
      reservationDate,
      reservationTime,
      partySize,
      restaurantId,
      source,
      specialRequests,
      tableIds
    })

    // Invalidar caché de dashboard/analytics
    await invalidateReservationCache(restaurantId, reservationDate)

    return NextResponse.json({
      reservation,
      reservationCode: reservation.reservationCode
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        formatZodError(error),
        { status: 400 }
      )
    }
    console.error("[API Reservations] Error creating:", error)
    return NextResponse.json({ error: "Error al crear reserva" }, { status: 500 })
  }
}
