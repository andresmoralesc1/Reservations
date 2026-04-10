/**
 * Voice Bridge API Endpoint
 *
 * Puente entre Pipecat Voice Bot y la API de Reservations.
 *
 * ANTES: Recibía { action, params } → processVoiceAction() → fetch(/api/reservations) → DB
 * AHORA: Recibe { action, params } → processVoiceAction() → DB directo
 *
 * Latencia: ~3-5s → ~50-100ms
 *
 * Actions:
 * - checkAvailability: Verifica disponibilidad
 * - createReservation: Crea nueva reserva
 * - getReservation: Consulta reserva por código
 * - cancelReservation: Cancela reserva
 * - modifyReservation: Modifica fecha/hora/personas
 * - logCallStart: Inicia registro de llamada
 * - logCallAction: Registra acción durante llamada
 * - logCallEnd: Finaliza registro de llamada
 */

import { NextRequest, NextResponse } from "next/server"
import { validateVoiceBridgeRequest } from "@/lib/voice/voice-auth"
import { processVoiceAction } from "@/lib/voice/voice-service"
import { logCallStart, logCallAction, logCallEnd } from "@/lib/voice/call-logger"
import { isValidVoiceAction } from "@/lib/voice/voice-types"
import type { VoiceAction, CallEndReason } from "@/lib/voice/voice-types"
import { createLogger, logError } from "@/lib/logger"
import { rateLimit, getRateLimitIdentifier, RateLimitError } from "@/lib/rate-limit"

const logger = createLogger({ module: "voice-bridge" })

// ============ POST Handler ============

export async function POST(request: NextRequest) {
  // 1. Validar autenticación
  const auth = validateVoiceBridgeRequest(request)
  if (!auth.valid) {
    logger.warn({
      msg: "Voice bridge: acceso denegado",
      error: auth.error,
    })
    return NextResponse.json(
      { error: auth.error || "Unauthorized", message: "Acceso no autorizado" },
      { status: 401 }
    )
  }

  // 2. Rate limiting global (60 req/min por IP)
  const identifier = getRateLimitIdentifier(request)
  const globalLimit = await rateLimit({
    identifier,
    limit: 60,
    windowSeconds: 60,
    action: "voice-bridge",
  })

  if (!globalLimit.allowed) {
    const retryAfter = globalLimit.resetAt
      ? Math.ceil((globalLimit.resetAt.getTime() - Date.now()) / 1000)
      : 60

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        message: `Has excedido el límite de requests. Intenta de nuevo en ${retryAfter} segundos.`,
        retryAfter,
        limit: globalLimit.limit,
      },
      {
        status: 429,
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": globalLimit.limit.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  try {
    const body = await request.json()
    const { action, params, callId, callLogId } = body

    // Log de llamada entrante o acción
    if (action === "logCallStart") {
      logger.info({
        msg: "Llamada entrante",
        callerPhone: params?.callerPhone,
        restaurantId: params?.restaurantId,
        callId,
      })
    }

    // 2. Manejar acciones especiales de logging
    if (action === "logCallStart") {
      const logId = await logCallStart({
        callerPhone: params?.callerPhone || "unknown",
        restaurantId: params?.restaurantId || "",
      })
      return NextResponse.json({ success: true, callLogId: logId })
    }

    if (action === "logCallEnd" && callLogId) {
      await logCallEnd(callLogId, {
        durationSecs: params?.durationSecs || 0,
        endReason: params?.endReason as CallEndReason || "completed",
        cost: params?.cost,
        summary: params?.summary,
        reservationId: params?.reservationId,
      })
      return NextResponse.json({ success: true })
    }

    // 3. Validar que se proporcionó una acción
    if (!action || !isValidVoiceAction(action)) {
      return NextResponse.json(
        { error: "Invalid action", message: `Acción no válida: ${action}` },
        { status: 400 }
      )
    }

    // 4. Rate limiting específico por acción
    let specificLimit: Awaited<ReturnType<typeof rateLimit>> | null = null

    if (action === "createReservation") {
      specificLimit = await rateLimit({
        identifier,
        limit: 5,
        windowSeconds: 60,
        action: "voice-bridge:create",
      })
    } else if (action === "cancelReservation" || action === "modifyReservation") {
      specificLimit = await rateLimit({
        identifier,
        limit: 10,
        windowSeconds: 60,
        action: "voice-bridge:mutation",
      })
    }

    if (specificLimit && !specificLimit.allowed) {
      const retryAfter = specificLimit.resetAt
        ? Math.ceil((specificLimit.resetAt.getTime() - Date.now()) / 1000)
        : 60

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: `Has excedido el límite para esta acción. Intenta de nuevo en ${retryAfter} segundos.`,
          retryAfter,
          limit: specificLimit.limit,
          action,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": specificLimit.limit.toString(),
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    // 5. Ejecutar la acción
    const result = await processVoiceAction(action as VoiceAction, params || {})

    // 6. Loguear acción si hay callLogId
    if (callLogId) {
      await logCallAction(callLogId, {
        action: action as VoiceAction,
        success: result.success,
        params,
        error: result.success ? undefined : result.message,
      })
    }

    // 7. Retornar resultado
    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: result.data,
      reservationCode: result.reservationCode,
      reservation: result.reservation,
      availableSlots: result.availableSlots,
      suggestedTables: result.suggestedTables,
    })
  } catch (error) {
    logError("Error en voice bridge", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.",
      },
      { status: 500 }
    )
  }
}

// ============ GET Handler ============

/**
 * GET endpoint para información del bridge
 */
export async function GET() {
  return NextResponse.json({
    name: "Reservations Voice Bridge",
    version: "2.0.0",
    description: "Direct DB access voice bridge - no more HTTP round-trips",
    latency: "~50-100ms (was ~3-5s with HTTP)",
    authentication: {
      method: "API Key via X-Voice-Bridge-Key or Authorization: Bearer <key>",
      devMode: "Allows unauthenticated requests when NODE_ENV=development",
    },
    actions: [
      {
        name: "checkAvailability",
        description: "Check table availability for a specific date/time",
        params: {
          date: "string (YYYY-MM-DD)",
          time: "string (HH:MM)",
          partySize: "number",
          restaurantId: "string (optional, uses default)",
        },
      },
      {
        name: "createReservation",
        description: "Create a new reservation",
        params: {
          customerName: "string",
          customerPhone: "string (Spanish format: +34 6XX XXX XXX or 6XXXXXXXX)",
          restaurantId: "string (optional, uses default)",
          date: "string (YYYY-MM-DD)",
          time: "string (HH:MM)",
          partySize: "number",
          specialRequests: "string (optional)",
        },
      },
      {
        name: "getReservation",
        description: "Get reservation by code",
        params: {
          code: "string (RES-XXXXX)",
        },
      },
      {
        name: "cancelReservation",
        description: "Cancel a reservation",
        params: {
          code: "string (RES-XXXXX)",
          phone: "string (for verification)",
        },
      },
      {
        name: "modifyReservation",
        description: "Modify an existing reservation",
        params: {
          code: "string (RES-XXXXX)",
          phone: "string (for verification)",
          changes: {
            newDate: "string (optional)",
            newTime: "string (optional)",
            newPartySize: "number (optional)",
          },
        },
      },
      {
        name: "logCallStart",
        description: "Register the start of a voice call",
        params: {
          callerPhone: "string",
          restaurantId: "string",
        },
      },
      {
        name: "logCallEnd",
        description: "Register the end of a voice call",
        params: {
          durationSecs: "number",
          endReason: "string (completed, hangup, error, timeout, no_show)",
          cost: "string (optional)",
          summary: "string (optional)",
          reservationId: "string (optional)",
        },
      },
    ],
    example: {
      action: "createReservation",
      callLogId: "uuid-from-logCallStart",
      params: {
        customerName: "Carlos García",
        customerPhone: "612345678",
        date: "2026-04-01",
        time: "21:00",
        partySize: 4,
        specialRequests: "Mesa en terraza si es posible",
      },
    },
    phoneFormats: {
      spanish: "+34 6XX XXX XXX (mobile) or +34 9XX XXX XXX (landline) or 9 digits without prefix",
    },
    rateLimiting: {
      description: "Rate limiting por IP address",
      global: {
        limit: 60,
        window: "60 seconds",
        action: "voice-bridge",
      },
      specific: [
        {
          action: "createReservation",
          limit: 5,
          window: "60 seconds",
          key: "voice-bridge:create",
        },
        {
          actions: ["cancelReservation", "modifyReservation"],
          limit: 10,
          window: "60 seconds",
          key: "voice-bridge:mutation",
        },
      ],
      headers: {
        "Retry-After": "Seconds until reset",
        "X-RateLimit-Limit": "Request limit",
        "X-RateLimit-Remaining": "Remaining requests",
      },
      errorResponse: {
        status: 429,
        body: {
          error: "Rate limit exceeded",
          message: "Descripción del error",
          retryAfter: "seconds",
          limit: "number",
        },
      },
    },
  })
}
