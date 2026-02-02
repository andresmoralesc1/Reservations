import { NextRequest, NextResponse } from "next/server"
import { whatsappService } from "@/services/whatsapp"

// POST /api/whatsapp/send-confirmation - Send confirmation message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, reservationId } = body

    if (action === "send-confirmation") {
      const result = await whatsappService.sendReservationConfirmation(reservationId)
      return NextResponse.json(result)
    }

    if (action === "send-reminder") {
      const result = await whatsappService.sendReservationReminder(reservationId)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  } catch (error) {
    console.error("WhatsApp API error:", error)
    return NextResponse.json(
      { error: "Error en el servicio de WhatsApp" },
      { status: 500 }
    )
  }
}

// POST /api/whatsapp/webhook - Handle WhatsApp webhook
export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json()
    await whatsappService.handleWebhook(payload)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    )
  }
}
