import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { reservationSessions } from "@/drizzle/schema"
import { eq } from "drizzle-orm"
import { redis } from "@/lib/redis"
import { nanoid } from "nanoid"
import { z } from "zod"

const IVR_SESSION_TTL = 30 * 60 // 30 minutes

// IVR conversation states
type ConversationStep =
  | "greeting"
  | "ask_date"
  | "ask_time"
  | "ask_party_size"
  | "ask_name"
  | "confirm_details"
  | "complete"
  | "error"

interface IVRSessionState {
  step: ConversationStep
  data: {
    restaurantId?: string
    date?: string
    time?: string
    partySize?: number
    customerName?: string
    phoneNumber?: string
  }
  errors: string[]
}

const startCallSchema = z.object({
  phoneNumber: z.string().regex(/^3\d{9}$/, "Número de teléfono inválido"),
  restaurantId: z.string().uuid().optional(),
})

const processInputSchema = z.object({
  input: z.string(),
  inputType: z.enum(["speech", "dtmf"]),
})

// POST /api/ivr/session/start - Start a new IVR session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === "start") {
      return await handleStartSession(body)
    }

    if (action === "process") {
      return await handleProcessInput(body)
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error) {
    console.error("IVR error:", error)
    return NextResponse.json(
      { error: "Error en el sistema IVR" },
      { status: 500 }
    )
  }
}

async function handleStartSession(body: unknown) {
  const validatedData = startCallSchema.parse(body)

  // Generate unique session ID
  const sessionId = nanoid()

  // Create initial session state
  const sessionState: IVRSessionState = {
    step: "greeting",
    data: {
      phoneNumber: validatedData.phoneNumber,
      restaurantId: validatedData.restaurantId,
    },
    errors: [],
  }

  // Store in database
  const expiresAt = new Date(Date.now() + IVR_SESSION_TTL * 1000)
  await db.insert(reservationSessions).values({
    sessionId,
    phoneNumber: validatedData.phoneNumber,
    restaurantId: validatedData.restaurantId,
    conversationState: sessionState,
    collectedData: {},
    expiresAt,
  })

  // Cache in Redis for fast access
  await redis.setex(
    `ivr:${sessionId}`,
    IVR_SESSION_TTL,
    JSON.stringify(sessionState)
  )

  // Return initial response
  return NextResponse.json({
    sessionId,
    message: "¡Bienvenido a nuestro sistema de reservas! Por favor, dígame la fecha para su reserva.",
    expectedInput: "date",
    hints: "Por ejemplo: mañana, el próximo viernes, 15 de enero",
  })
}

async function handleProcessInput(body: unknown) {
  const validatedData = processInputSchema.parse(body)
  const sessionId = body as { sessionId: string }

  // Get session state from Redis (faster) or DB
  let sessionState: IVRSessionState | null = null

  const cachedState = await redis.get(`ivr:${sessionId.sessionId}`)
  if (cachedState) {
    sessionState = JSON.parse(cachedState) as IVRSessionState
  } else {
    // Fallback to database
    const session = await db.query.reservationSessions.findFirst({
      where: eq(reservationSessions.sessionId, sessionId.sessionId),
    })

    if (!session) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    }

    sessionState = session.conversationState as IVRSessionState
  }

  if (!sessionState) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 400 })
  }

  // Process input based on current step
  const result = await processIVRInput(sessionState, validatedData.input, validatedData.inputType)

  // Update session state
  await redis.setex(
    `ivr:${sessionId.sessionId}`,
    IVR_SESSION_TTL,
    JSON.stringify(result.state)
  )

  return NextResponse.json(result.response)
}

async function processIVRInput(
  state: IVRSessionState,
  input: string,
  inputType: string
): Promise<{
  state: IVRSessionState
  response: {
    message: string
    expectedInput?: string
    hints?: string
    completed?: boolean
    reservationCode?: string
  }
}> {
  const input_lower = input.toLowerCase().trim()

  switch (state.step) {
    case "greeting":
      state.step = "ask_date"
      return {
        state,
        response: {
          message: "¿Para qué fecha desea hacer la reserva?",
          expectedInput: "date",
          hints: "Puede decir: mañana, el próximo viernes, o una fecha específica",
        },
      }

    case "ask_date": {
      // Parse date (simplified - use NLU in production)
      const date = parseDateInput(input_lower)
      if (!date) {
        state.errors.push("No pude entender la fecha")
        return {
          state,
          response: {
            message: "No entendí la fecha. ¿Podría decirla de otra forma?",
            expectedInput: "date",
            hints: "Por ejemplo: mañana, 15 de enero, el próximo viernes",
          },
        }
      }

      state.data.date = date
      state.step = "ask_time"
      return {
        state,
        response: {
          message: `Entendido, ${date}. ¿A qué hora prefiere la reserva?`,
          expectedInput: "time",
          hints: "Nuestro horario es de 12:00 PM a 10:00 PM",
        },
      }
    }

    case "ask_time": {
      const time = parseTimeInput(input_lower)
      if (!time) {
        state.errors.push("No pude entender la hora")
        return {
          state,
          response: {
            message: "No entendí la hora. ¿Podría decirla de otra forma?",
            expectedInput: "time",
            hints: "Por ejemplo: 7 de la noche, 19:00, 7 PM",
          },
        }
      }

      state.data.time = time
      state.step = "ask_party_size"
      return {
        state,
        response: {
          message: "¿Para cuántas personas es la reserva?",
          expectedInput: "number",
          hints: "Puede decir: dos personas, 4, para 6 personas",
        },
      }
    }

    case "ask_party_size": {
      const partySize = parseNumberInput(input_lower)
      if (!partySize || partySize < 1 || partySize > 50) {
        state.errors.push("Número de personas inválido")
        return {
          state,
          response: {
            message: "¿Para cuántas personas? Aceptamos reservas de 1 a 50 personas.",
            expectedInput: "number",
          },
        }
      }

      state.data.partySize = partySize
      state.step = "ask_name"
      return {
        state,
        response: {
          message: "¿A nombre de quién será la reserva?",
          expectedInput: "text",
          hints: "Por favor, diga su nombre completo",
        },
      }
    }

    case "ask_name": {
      const name = input.trim()
      if (name.length < 2) {
        state.errors.push("Nombre inválido")
        return {
          state,
          response: {
            message: "No pude entender el nombre. ¿Podría repetirlo?",
            expectedInput: "text",
          },
        }
      }

      state.data.customerName = name
      state.step = "confirm_details"
      return {
        state,
        response: {
          message: `Perfecto. Confirmando su reserva:\n\nFecha: ${state.data.date}\nHora: ${state.data.time}\nPersonas: ${state.data.partySize}\nNombre: ${name}\n\n¿Es correcto? Digamos sí para confirmar o no para modificar.`,
          expectedInput: "confirmation",
        },
      }
    }

    case "confirm_details": {
      if (input_lower.includes("sí") || input_lower.includes("si") || input_lower.includes("yes") || input_lower === "1") {
        // Create reservation
        // TODO: Call the reservations API to create the actual reservation
        state.step = "complete"
        const reservationCode = `RES-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

        return {
          state,
          response: {
            message: `¡Perfecto! Su reserva ha sido confirmada con el código: ${reservationCode}. Recibirá un mensaje de WhatsApp con los detalles. ¡Gracias por llamar!`,
            completed: true,
            reservationCode,
          },
        }
      } else {
        // Start over
        state.step = "ask_date"
        state.data = {
          phoneNumber: state.data.phoneNumber,
        }
        return {
          state,
          response: {
            message: "Entendido. Comencemos de nuevo. ¿Para qué fecha desea hacer la reserva?",
            expectedInput: "date",
          },
        }
      }
    }

    default:
      return {
        state,
        response: {
          message: "Lo siento, hubo un error en el sistema. Por favor, intente nuevamente.",
        },
      }
  }
}

// Helper functions for parsing IVR input (simplified - use NLU in production)
function parseDateInput(input: string): string | null {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Check for common phrases
  if (input.includes("hoy")) {
    return today.toISOString().split("T")[0]
  }
  if (input.includes("mañana") || input.includes("manana")) {
    return tomorrow.toISOString().split("T")[0]
  }

  // Try to parse specific date formats
  const datePatterns = [
    /(\d{1,2})\s+de\s+(\w+)/i,
    /(\d{1,2})\s+\/\s+(\d{1,2})\s+\/\s+(\d{2,4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
  ]

  for (const pattern of datePatterns) {
    const match = input.match(pattern)
    if (match) {
      // Return date in YYYY-MM-DD format
      // This is simplified - proper implementation would handle month names in Spanish
      const today_str = today.toISOString().split("T")[0]
      return today_str
    }
  }

  return null
}

function parseTimeInput(input: string): string | null {
  // Extract time patterns
  const patterns = [
    /(\d{1,2}):(\d{2})/,
    /(\d{1,2})\s*(?:pm|am|de la tarde|de la mañana)/i,
  ]

  for (const pattern of patterns) {
    const match = input.match(pattern)
    if (match) {
      // Return time in HH:MM format
      const hours = match[1] || match[2]
      const minutes = match[2] || "00"
      return `${String(hours).padStart(2, "0")}:${minutes}`
    }
  }

  return null
}

function parseNumberInput(input: string): number | null {
  const match = input.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

// DELETE /api/ivr?sessionId=xxx - End IVR session
export async function DELETE(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId")

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID requerido" }, { status: 400 })
  }

  await redis.del(`ivr:${sessionId}`)

  return NextResponse.json({ success: true })
}
