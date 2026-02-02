import { NextResponse } from "next/server"

export async function GET() {
  const docs = {
    title: "Sistema de Reservas - API Documentation",
    version: "1.0.0",
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://reservations.neuralflow.space",
    endpoints: {
      reservations: {
        list: {
          method: "GET",
          path: "/api/reservations",
          description: "List all reservations with optional filters",
          params: {
            status: "Filter by status (PENDIENTE, CONFIRMADO, CANCELADO, NO_SHOW)",
            date: "Filter by date (YYYY-MM-DD)",
            restaurantId: "Filter by restaurant ID",
            phone: "Filter by customer phone",
            limit: "Max results (default: 50)",
            offset: "Pagination offset",
          },
          example: "/api/reservations?status=PENDIENTE&date=2025-01-15",
        },
        create: {
          method: "POST",
          path: "/api/reservations",
          description: "Create a new reservation",
          body: {
            customerName: "string (required, min 2 chars)",
            customerPhone: "string (required, Colombian format: 3XXXXXXXXX)",
            restaurantId: "uuid (required)",
            reservationDate: "string (required, YYYY-MM-DD)",
            reservationTime: "string (required, HH:MM)",
            partySize: "number (required, 1-50)",
            specialRequests: "string (optional)",
            source: "enum (optional: IVR, WHATSAPP, MANUAL, WEB)",
            sessionId: "string (optional, for IVR session locking)",
          },
          example: {
            customerName: "Juan Pérez",
            customerPhone: "3101234567",
            restaurantId: "123e4567-e89b-12d3-a456-426614174000",
            reservationDate: "2025-01-20",
            reservationTime: "19:30",
            partySize: 4,
            specialRequests: "Mesa cerca de la ventana",
            source: "IVR",
          },
        },
        getById: {
          method: "GET",
          path: "/api/reservations/{id}",
          description: "Get reservation by ID",
        },
        update: {
          method: "PUT",
          path: "/api/reservations/{id}",
          description: "Update reservation",
          body: {
            customerName: "string (optional)",
            customerPhone: "string (optional)",
            reservationDate: "string (optional)",
            reservationTime: "string (optional)",
            partySize: "number (optional)",
            specialRequests: "string (optional)",
            status: "enum (optional: PENDIENTE, CONFIRMADO, CANCELADO, NO_SHOW)",
            tableIds: "array of uuid (optional)",
          },
        },
        cancel: {
          method: "DELETE",
          path: "/api/reservations/{id}",
          description: "Cancel a reservation (sets status to CANCELADO)",
        },
        getByCode: {
          method: "GET",
          path: "/api/reservations/code/{code}",
          description: "Get reservation by code (e.g., RES-ABC12)",
        },
      },
      ivr: {
        startSession: {
          method: "POST",
          path: "/api/ivr",
          description: "Start a new IVR session",
          body: {
            action: "start",
            phoneNumber: "string (required, Colombian format)",
            restaurantId: "uuid (optional)",
          },
          response: {
            sessionId: "string",
            message: "string (TTS message to play)",
            expectedInput: "string",
            hints: "string",
          },
        },
        processInput: {
          method: "POST",
          path: "/api/ivr",
          description: "Process IVR user input",
          body: {
            action: "process",
            sessionId: "string (required)",
            input: "string (user speech or DTMF input)",
            inputType: "enum (speech, dtmf)",
          },
        },
        endSession: {
          method: "DELETE",
          path: "/api/ivr?sessionId=xxx",
          description: "End IVR session and release locks",
        },
      },
      whatsapp: {
        sendConfirmation: {
          method: "POST",
          path: "/api/whatsapp",
          description: "Send WhatsApp confirmation message",
          body: {
            action: "send-confirmation",
            reservationId: "uuid (required)",
          },
        },
        sendReminder: {
          method: "POST",
          path: "/api/whatsapp",
          description: "Send WhatsApp reminder message",
          body: {
            action: "send-reminder",
            reservationId: "uuid (required)",
          },
        },
        webhook: {
          method: "PUT",
          path: "/api/whatsapp",
          description: "Handle WhatsApp webhook (button responses, status updates)",
        },
      },
      admin: {
        listReservations: {
          method: "GET",
          path: "/api/admin/reservations",
          description: "List reservations for admin panel",
          params: {
            status: "Filter by status",
            date: "Filter by date",
            restaurantId: "Filter by restaurant",
            limit: "Max results",
            offset: "Pagination offset",
          },
        },
        getPendingQueue: {
          method: "GET",
          path: "/api/admin/reservations/pending",
          description: "Get pending reservations queue with statistics",
          params: {
            daysAhead: "Number of days to look ahead (default: 7)",
          },
        },
        approveReservation: {
          method: "POST",
          path: "/api/admin/reservations/{id}",
          description: "Approve a pending reservation",
          body: {
            action: "approve",
          },
        },
        rejectReservation: {
          method: "POST",
          path: "/api/admin/reservations/{id}",
          description: "Reject a pending reservation",
          body: {
            action: "reject",
            reason: "string (optional)",
          },
        },
      },
      health: {
        check: {
          method: "GET",
          path: "/api/health",
          description: "Health check endpoint",
          response: {
            status: "ok | degraded",
            timestamp: "ISO datetime",
            services: {
              database: "ok | error",
              redis: "ok | error",
            },
          },
        },
      },
    },
    reservationCodes: {
      format: "RES-XXXXX",
      example: "RES-A3B7K",
      description: "5-character alphanumeric code (no ambiguous chars like 0/O, 1/I)",
    },
    statusCodes: {
      PENDIENTE: "Awaiting admin approval",
      CONFIRMADO: "Confirmed by customer/admin",
      CANCELADO: "Cancelled",
      "NO_SHOW": "Customer did not arrive",
    },
    sources: {
      IVR: "Created via phone call",
      WHATSAPP: "Created via WhatsApp",
      MANUAL: "Created by staff manually",
      WEB: "Created via web interface",
    },
  }

  return NextResponse.json(docs)
}
