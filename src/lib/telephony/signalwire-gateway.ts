/**
 * SignalWire Gateway
 *
 * Este módulo prepara la integración con SignalWire para telefonía.
 * SignalWire permite conectar llamadas telefónicas (PSTN/SIP) con WebRTC.
 *
 * Para completar la integración se necesita:
 * 1. Cuenta de SignalWire con credenciales
 * 2. Configurar un número de teléfono
 * 3. Crear un contexto SIP/WebRTC
 *
 * Documentación: https://developer.signalwire.com/
 */

// ============ Tipos ============

export interface SignalWireConfig {
  projectId: string;
  accessToken: string;
  spaceUrl: string; // ej: "example.signalwire.com"
}

export interface CallInfo {
  callId: string;
  from: string; // Número del llamante
  to: string; // Número llamado
  state: "ringing" | "answered" | "ended" | "failed";
  startTime?: Date;
  endTime?: Date;
}

export interface SignalWireEvent {
  event: string;
  call: CallInfo;
  params?: Record<string, unknown>;
}

// ============ Configuración ============

/**
 * Obtiene la configuración de SignalWire desde variables de entorno
 */
export function getSignalWireConfig(): SignalWireConfig | null {
  const projectId = process.env.SIGNALWIRE_PROJECT_ID;
  const accessToken = process.env.SIGNALWIRE_ACCESS_TOKEN;
  const spaceUrl = process.env.SIGNALWIRE_SPACE_URL;

  if (!projectId || !accessToken || !spaceUrl) {
    console.warn(
      "[SignalWire] Missing configuration. Set SIGNALWIRE_PROJECT_ID, SIGNALWIRE_ACCESS_TOKEN, and SIGNALWIRE_SPACE_URL."
    );
    return null;
  }

  return { projectId, accessToken, spaceUrl };
}

/**
 * Verifica si SignalWire está configurado
 */
export function isSignalWireConfigured(): boolean {
  return getSignalWireConfig() !== null;
}

// ============ Funciones de preparación ============

/**
 * Inicializa una sesión WebRTC con SignalWire
 *
 * Esta función se usará cuando se implemente la integración completa.
 *
 * @param token - Token de sesión JWT de SignalWire
 * @returns Promise con la configuración de WebRTC
 */
export async function initializeSignalWireSession(token: string) {
  // TODO: Implementar cuando se active SignalWire
  // 1. Conectar al WebSocket de SignalWire
  // 2. Establecer PeerConnection WebRTC
  // 3. Conectar con el bot Pipecat

  console.warn(
    "[SignalWire] initializeSignalWireSession not yet implemented. Configure SignalWire credentials first."
  );

  throw new Error("SignalWire integration not yet implemented");
}

/**
 * Maneja una llamada entrante de SignalWire
 *
 * Esta función será llamada por el webhook de SignalWire cuando
 * llegue una llamada telefónica.
 *
 * @param event - Evento de llamada de SignalWire
 * @returns Instructions para SignalWire (XML/JSON)
 */
export function handleIncomingCall(event: SignalWireEvent): string {
  // TODO: Implementar flujo de llamada entrante
  // 1. Crear sesión de IVR
  // 2. Conectar con bot Pipecat
  // 3. Manejar colgar/transferir

  console.warn(
    "[SignalWire] handleIncomingCall not yet implemented. Configure SignalWire credentials first."
  );

  // Respuesta temporal: reproducir mensaje y colgar
  return `
    <Response>
      <Say language="es-ES" voice="female">
        Hola, gracias por llamar a El Posit. Nuestro sistema de voz por inteligencia artificial estará disponible pronto.
        Por favor, llama más tarde o usa nuestra aplicación web.
      </Say>
      <Hangup />
    </Response>
  `;
}

/**
 * Genera un token JWT para una sesión de SignalWire
 *
 * @param userId - ID del usuario (opcional)
 * @returns Token JWT firmado
 */
export function generateSignalWireToken(userId?: string): string | null {
  // TODO: Implementar generación de JWT con credenciales de SignalWire
  // Requiere: jsonwebtoken o similar

  console.warn(
    "[SignalWire] generateSignalWireToken not yet implemented."
  );

  return null;
}

// ============ Webhook Handlers ============

/**
 * Webhook para eventos de llamada de SignalWire
 *
 * Este endpoint será usado por SignalWire para notificar eventos:
 * - Llamada entrante
 * - Llamada contestada
 * - Llamada terminada
 * - DTMF (teclas presionadas)
 *
 * @param request - Request del webhook
 * @returns Response para SignalWire
 */
export async function handleSignalWireWebhook(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const event = body as SignalWireEvent;

    console.log("[SignalWire] Received event:", event.event);

    // Router de eventos
    switch (event.event) {
      case "call.received":
      case "call.answered":
      case "call.ended":
        // TODO: Implementar manejo de eventos
        break;

      default:
        console.log("[SignalWire] Unhandled event:", event.event);
    }

    // Por ahora, devolver respuesta básica
    return new Response(
      handleIncomingCall(event),
      {
        headers: { "Content-Type": "application/xml" },
      }
    );
  } catch (error) {
    console.error("[SignalWire] Webhook error:", error);
    return new Response(
      '<Response><Hangup /></Response>',
      {
        headers: { "Content-Type": "application/xml" },
        status: 500,
      }
    );
  }
}

// ============ Exportar para uso futuro ============

/**
 * Instrucciones para configurar SignalWire:
 *
 * 1. Crear cuenta en https://signalwire.com/
 * 2. Obtener un número de teléfono
 * 3. Configurar variables de entorno:
 *    - SIGNALWIRE_PROJECT_ID
 *    - SIGNALWIRE_ACCESS_TOKEN
 *    - SIGNALWIRE_SPACE_URL
 * 4. Configurar webhook URL:
 *    https://tu-dominio.com/api/telephony/signalwire/webhook
 * 5. Implementar la integración WebRTC
 */
