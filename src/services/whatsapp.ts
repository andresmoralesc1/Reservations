import { db } from "@/lib/db"
import { whatsappMessages, reservations, customers } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

interface WhatsAppMessage {
  to: string
  message: string
  buttons?: Array<{ id: string; text: string }>
}

interface WhatsAppResponse {
  success: boolean
  messageId?: string
  error?: string
}

export class WhatsAppService {
  private apiUrl: string

  constructor() {
    this.apiUrl = process.env.OPENWA_API_URL || "http://openwa-whatsapp:3002"
  }

  /**
   * Send a reservation confirmation with interactive buttons
   */
  async sendReservationConfirmation(reservationId: string): Promise<WhatsAppResponse> {
    try {
      // Get reservation details
      const reservation = await db.query.reservations.findFirst({
        where: eq(reservations.id, reservationId),
        with: {
          restaurant: true,
          customer: true,
        },
      })

      if (!reservation) {
        return { success: false, error: "Reserva no encontrada" }
      }

      // Format phone number (add +57 prefix if needed)
      const phone = this.formatPhoneNumber(reservation.customerPhone)

      // Create confirmation message
      const message = this.createConfirmationMessage(reservation)

      // Send via OpenWABA
      const response = await this.sendToWhatsApp({
        to: phone,
        message: message.text,
        buttons: message.buttons,
      })

      if (response.success && response.messageId) {
        // Record in database
        await db.insert(whatsappMessages).values({
          reservationId,
          messageId: response.messageId,
          direction: "outbound",
          status: "sent",
        })
      }

      return response
    } catch (error) {
      console.error("Error sending WhatsApp confirmation:", error)
      return { success: false, error: "Error al enviar mensaje" }
    }
  }

  /**
   * Send a reservation reminder
   */
  async sendReservationReminder(reservationId: string): Promise<WhatsAppResponse> {
    try {
      const reservation = await db.query.reservations.findFirst({
        where: eq(reservations.id, reservationId),
        with: {
          restaurant: true,
        },
      })

      if (!reservation) {
        return { success: false, error: "Reserva no encontrada" }
      }

      const phone = this.formatPhoneNumber(reservation.customerPhone)
      const parts = [
        "Recordatorio de reserva",
        "",
        "Hola " + reservation.customerName + ", este es un recordatorio de tu reserva para:",
        "Fecha: " + this.formatDate(reservation.reservationDate),
        "Hora: " + reservation.reservationTime,
        "Personas: " + reservation.partySize,
        "Lugar: " + ((reservation as any).restaurant?.name || "Nuestro restaurante"),
        "",
        "Codigo de reserva: " + reservation.reservationCode,
        "",
        "Podras asistir?",
      ]
      const message = parts.join("\n")

      return await this.sendToWhatsApp({
        to: phone,
        message,
        buttons: [
          { id: "confirm_attendance", text: "Si, asistire" },
          { id: "need_reschedule", text: "Necesito cambiar" },
          { id: "cancel_reservation", text: "Cancelar" },
        ],
      })
    } catch (error) {
      console.error("Error sending reminder:", error)
      return { success: false, error: "Error al enviar recordatorio" }
    }
  }

  /**
   * Handle webhook response from WhatsApp
   */
  async handleWebhook(payload: unknown): Promise<void> {
    try {
      // Parse the webhook payload from OpenWABA
      const data = payload as {
        messageId?: string
        from?: string
        text?: string
        buttonId?: string
      }

      if (!data.messageId) return

      // Update message status if it's a delivery/read receipt
      // This would depend on the specific OpenWABA webhook format

      // Handle button responses
      if (data.buttonId) {
        await this.handleButtonResponse(data.buttonId, data.from || "")
      }
    } catch (error) {
      console.error("Error handling webhook:", error)
    }
  }

  /**
   * Handle button response from WhatsApp
   */
  private async handleButtonResponse(buttonId: string, phone: string): Promise<void> {
    const normalizedPhone = phone.replace(/\D/g, "").replace(/^57/, "")

    const customer = await db.query.customers.findFirst({
      where: eq(customers.phoneNumber, normalizedPhone),
    })

    if (!customer) return

    // Find pending reservation for this customer
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.customerPhone, normalizedPhone),
      with: {
        restaurant: true,
      },
    })

    if (!reservation) return

    switch (buttonId) {
      case "confirm_attendance":
        await db
          .update(reservations)
          .set({ status: "CONFIRMADO", confirmedAt: new Date() })
          .where(eq(reservations.id, reservation.id))
        break

      case "need_reschedule":
        // Send message to contact restaurant
        await this.sendToWhatsApp({
          to: this.formatPhoneNumber(normalizedPhone),
          message: "Entendido. Por favor contáctanos al restaurante para reprogramar tu reserva.",
        })
        break

      case "cancel_reservation":
        await db
          .update(reservations)
          .set({ status: "CANCELADO", cancelledAt: new Date() })
          .where(eq(reservations.id, reservation.id))
        await this.sendToWhatsApp({
          to: this.formatPhoneNumber(normalizedPhone),
          message: "Tu reserva ha sido cancelada. Esperamos verte pronto.",
        })
        break
    }
  }

  /**
   * Send message via OpenWABA API
   */
  private async sendToWhatsApp(data: WhatsAppMessage): Promise<WhatsAppResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/api/sendText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: data.to,
          text: data.message,
          buttons: data.buttons,
        }),
      })

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        messageId: result.id || result.messageId,
      }
    } catch (error) {
      console.error("WhatsApp API error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Create confirmation message with buttons
   */
  private createConfirmationMessage(reservation: any): { text: string; buttons?: Array<{ id: string; text: string }> } {
    const parts = [
      "Reserva Confirmada",
      "",
      "Hola " + reservation.customerName + ", tu reserva ha sido confirmada:",
      "",
      "Fecha: " + this.formatDate(reservation.reservationDate),
      "Hora: " + reservation.reservationTime,
      "Personas: " + reservation.partySize,
      "Lugar: " + ((reservation as any).restaurant?.name || "Nuestro restaurante"),
      "",
      "Codigo: " + reservation.reservationCode,
      "",
      "Deseas confirmar asistencia?",
    ]
    const text = parts.join("\n")

    return {
      text,
      buttons: [
        { id: "confirm_attendance", text: "Confirmar" },
        { id: "need_reschedule", text: "Reprogramar" },
        { id: "cancel_reservation", text: "Cancelar" },
      ],
    }
  }

  /**
   * Format phone number for WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, "")
    if (cleaned.startsWith("57") && cleaned.length === 12) {
      return cleaned + "@c.us"
    }
    if (cleaned.length === 10) {
      return "57" + cleaned + "@c.us"
    }
    throw new Error("Invalid phone number format")
  }

  /**
   * Format date for display
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }
}

export const whatsappService = new WhatsAppService()
