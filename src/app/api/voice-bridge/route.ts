/**
 * Voice Bridge API Endpoint
 *
 * Este endpoint actúa como puente entre el bot Pipecat y la API de Reservations.
 * El bot puede enviar function calls a este endpoint para ejecutar acciones
 * como crear, consultar, modificar o cancelar reservas.
 *
 * Usage:
 * POST /api/voice-bridge
 * {
 *   "action": "createReservation" | "getReservation" | "cancelReservation" | "modifyReservation" | "checkAvailability",
 *   "params": { ... }
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import {
  processVoiceAction,
  formatResultForVoice,
} from "@/lib/voice-actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    // Validar que se proporcionó una acción
    if (!action) {
      return NextResponse.json(
        { error: "Action is required", message: "Debes especificar una acción" },
        { status: 400 }
      );
    }

    // Ejecutar la acción
    const result = await processVoiceAction(action, params || {});

    // Retornar resultado
    return NextResponse.json({
      success: result.success,
      message: result.message,
      voiceMessage: formatResultForVoice(result),
      reservationCode: result.reservationCode,
      reservation: result.reservation,
      availableSlots: result.availableSlots,
    });
  } catch (error) {
    console.error("[Voice Bridge] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.",
        voiceMessage: "Lo siento, ocurrió un error. Por favor intenta nuevamente.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint para información del bridge
 */
export async function GET() {
  return NextResponse.json({
    name: "Reservations Voice Bridge",
    version: "1.0.0",
    description: "API bridge between Pipecat Voice Bot and Reservations API",
    actions: [
      {
        name: "createReservation",
        description: "Create a new reservation",
        params: {
          customerName: "string",
          customerPhone: "string",
          restaurantId: "string (optional, uses default)",
          reservationDate: "string (YYYY-MM-DD)",
          reservationTime: "string (HH:MM)",
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
        name: "checkAvailability",
        description: "Check availability for a specific date/time",
        params: {
          date: "string (YYYY-MM-DD)",
          time: "string (HH:MM)",
          partySize: "number",
        },
      },
    ],
    example: {
      action: "createReservation",
      params: {
        customerName: "Juan Pérez",
        customerPhone: "+573001234567",
        reservationDate: "2026-02-22",
        reservationTime: "19:00",
        partySize: 4,
      },
    },
  });
}
