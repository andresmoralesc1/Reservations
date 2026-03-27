import { NextRequest, NextResponse } from "next/server"
import { createLegacyReservation, getLegacyReservation, cancelLegacyReservation, listLegacyReservations } from "@/lib/services/legacy-service"
import { z } from "zod"

// Validation schema for creating a reservation (supports both Spanish and English field names)
const createReservationSchema = z.object({
  // Spanish fields
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  numero: z.string().min(9, "Número de teléfono inválido").optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)").optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)").optional(),
  invitados: z.number().int().min(1).max(50).optional(),
  idMesa: z.string().optional(),
  fuente: z.enum(["WEB", "WHATSAPP", "VOICE", "MANUAL", "IVR"]).default("WEB").optional(),
  restaurante: z.string().optional(),
  observaciones: z.string().optional(),
  // English fields (admin modal)
  customerName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  customerPhone: z.string().min(9, "Número de teléfono inválido").optional(),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)").optional(),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)").optional(),
  partySize: z.number().int().min(1).max(50).optional(),
  specialRequests: z.string().optional(),
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
    console.error("[API Reservations] Error:", error)
    return NextResponse.json({ error: "Error al obtener reservas" }, { status: 500 })
  }
}

// POST /api/reservations - Crear reserva
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos (supports both Spanish and English)
    const validatedData = createReservationSchema.parse(body)

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

    return NextResponse.json({
      reservation: result.data,
      reservationCode: result.reservationCode
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.errors },
        { status: 400 }
      )
    }
    console.error("[API Reservations] Error creating:", error)
    return NextResponse.json({ error: "Error al crear reserva" }, { status: 500 })
  }
}

// DELETE /api/reservations/[code] - Cancelar reserva
export async function DELETE(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    const { code } = params
    const { numero } = await request.json()

    if (!numero) {
      return NextResponse.json({ error: "Número de teléfono requerido" }, { status: 400 })
    }

    const result = await cancelLegacyReservation(code, numero)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error("[API Reservations] Error canceling:", error)
    return NextResponse.json({ error: "Error al cancelar reserva" }, { status: 500 })
  }
}
