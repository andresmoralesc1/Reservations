import { NextRequest, NextResponse } from "next/server"
import { config } from "@/lib/config/env"
import { createLegacyReservation, getLegacyReservation, cancelLegacyReservation, listLegacyReservations } from "@/lib/services/legacy-service"
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
  // Spanish fields (legacy)
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

// GET /api/reservations - Listar o consultar reservas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const restaurant = searchParams.get("restaurante")
    const date = searchParams.get("fecha")
    const status = searchParams.get("estatus")
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
      const result = await getLegacyReservation(code)
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 404 })
      }
      return NextResponse.json({ reservation: result.data })
    }

    // Listar con filtros
    const result = await listLegacyReservations({
      restaurante: restaurant || undefined,
      fecha: date || undefined,
      estatus: status || undefined,
      limit
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      reservations: result.data,
      meta: { count: result.data?.length || 0 }
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

    // Normalize to Spanish format for legacy service
    const nombre = validatedData.nombre || validatedData.customerName!
    const numero = validatedData.numero || validatedData.customerPhone!
    const fecha = validatedData.fecha || validatedData.reservationDate!
    const hora = validatedData.hora || validatedData.reservationTime!
    const invitados = validatedData.invitados || validatedData.partySize!
    const fuente = validatedData.fuente || validatedData.source || "MANUAL"
    const restaurante = validatedData.restaurante || validatedData.restaurantId || "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    const observaciones = validatedData.observaciones || validatedData.specialRequests

    // Crear reserva usando servicio legacy
    const result = await createLegacyReservation({
      nombre,
      numero,
      fecha,
      hora,
      invitados,
      idMesa: validatedData.idMesa,
      fuente,
      restaurante,
      observaciones,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Invalidar caché de dashboard/analytics
    await invalidateReservationCache(restaurante, fecha)

    return NextResponse.json({
      reservation: result.data,
      reservationCode: result.reservationCode
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
