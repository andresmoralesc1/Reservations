import { NextResponse } from "next/server"

// Configuración para App Router
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

interface TelegramNotifyParams {
  from: string
  to: string
  text: string
  otp?: string
}

/**
 * Notifica SMS entrante a Telegram (opcional)
 * Solo funciona si están configuradas las variables de entorno
 */
async function notifyTelegram({ from, to, text, otp }: TelegramNotifyParams): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  // Si no hay configuración de Telegram, retornar silenciosamente
  if (!botToken || !chatId) {
    return
  }

  try {
    let message = `📩 SMS entrante Telnyx\nDe: ${from}\nPara: ${to}\nTexto: ${text}`

    if (otp) {
      message += `\n🔑 OTP detectado: ${otp}`
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`

    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    })
  } catch (error) {
    // Loguear error pero no propagar
    console.error("[Telnyx Webhook] Error sending Telegram notification:", error)
  }
}

/**
 * GET handler - Verificación de que el endpoint está vivo
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "telnyx-sms webhook alive",
  })
}

/**
 * POST handler - Recibe webhooks de SMS de Telnyx
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 200 })
    }

    // Estructura esperada de Telnyx v2
    const telnyxData = body as {
      data?: {
        event_type?: string
        payload?: {
          from?: { phone_number?: string }
          to?: Array<{ phone_number?: string }>
          text?: string
          received_at?: string
        }
      }
    }

    const eventType = telnyxData?.data?.event_type

    // Si no es el evento que esperamos, responder pero no procesar
    if (eventType !== "message.received") {
      return NextResponse.json({
        ok: true,
        ignored: eventType || "unknown",
      }, { status: 200 })
    }

    // Extraer datos del SMS con optional chaining
    const payload = telnyxData?.data?.payload
    const from = payload?.from?.phone_number || "unknown"
    const to = payload?.to?.[0]?.phone_number || "unknown"
    const text = payload?.text || ""
    const receivedAt = payload?.received_at || new Date().toISOString()

    // Loguear con separadores visibles
    console.log("==== Telnyx SMS Webhook ====")
    console.log(`At:    ${receivedAt}`)
    console.log(`From:  ${from}`)
    console.log(`To:    ${to}`)
    console.log(`Text:  ${text}`)
    console.log("============================")

    // Detectar OTP con regex: 6 dígitos con guion o espacio opcional
    const otpMatch = text.match(/\b(\d{3})[- ]?(\d{3})\b/)
    let otpCode: string | undefined

    if (otpMatch) {
      // Código limpio sin separador
      otpCode = `${otpMatch[1]}${otpMatch[2]}`
      console.log(`🔑 POSSIBLE OTP: ${otpCode}`)
    }

    // Notificar a Telegram si está configurado
    await notifyTelegram({ from, to, text, otp: otpCode })

    return NextResponse.json({
      ok: true,
      processed: "message.received",
      otp_detected: !!otpCode,
    }, { status: 200 })

  } catch (error) {
    // Siempre retornar 200 para evitar reintentos en bucle durante depuración
    console.error("[Telnyx Webhook] Error processing request:", error)
    return NextResponse.json({
      ok: false,
      error: "Internal error",
    }, { status: 200 })
  }
}
