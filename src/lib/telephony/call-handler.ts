/**
 * Call Handler - Flujo de llamadas telefónicas
 *
 * Este módulo maneja la lógica del flujo de llamada cuando se integra
 * con SignalWire u otro proveedor de telefonía.
 */

import { CallInfo } from "./signalwire-gateway";

// ============ Estados de llamada ============

export enum CallState {
  INCOMING = "incoming", // Llamada entrante, no contestada
  GREETING = "greeting", // Reproduciendo saludo
  LISTENING = "listening", // Escuchando al usuario
  PROCESSING = "processing", // Procesando con el bot
  SPEAKING = "speaking", // Bot está hablando
  CONFIRMING = "confirming", // Esperando confirmación
  COMPLETED = "completed", // Llamada completada exitosamente
  FAILED = "failed", // Llamada falló
  HANGUP = "hangup", // Llamada terminada
}

export interface CallSession {
  callId: string;
  callerNumber: string;
  state: CallState;
  startTime: Date;
  lastActivity: Date;
  transcription: string[];
  context: Record<string, unknown>;
}

// ============ Manager de sesiones ============

class CallSessionManager {
  private sessions: Map<string, CallSession> = new Map();
  private readonly SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutos

  /**
   * Crea una nueva sesión de llamada
   */
  createSession(callInfo: CallInfo): CallSession {
    const session: CallSession = {
      callId: callInfo.callId,
      callerNumber: callInfo.from,
      state: CallState.INCOMING,
      startTime: new Date(),
      lastActivity: new Date(),
      transcription: [],
      context: {},
    };

    this.sessions.set(callInfo.callId, session);
    console.log(`[CallHandler] Created session for call ${callInfo.callId}`);

    return session;
  }

  /**
   * Obtiene una sesión existente
   */
  getSession(callId: string): CallSession | undefined {
    return this.sessions.get(callId);
  }

  /**
   * Actualiza el estado de una sesión
   */
  updateState(callId: string, state: CallState): boolean {
    const session = this.sessions.get(callId);
    if (!session) return false;

    session.state = state;
    session.lastActivity = new Date();
    console.log(`[CallHandler] Call ${callId} state: ${state}`);

    return true;
  }

  /**
   * Agrega una transcripción a la sesión
   */
  addTranscript(callId: string, text: string): boolean {
    const session = this.sessions.get(callId);
    if (!session) return false;

    session.transcription.push(text);
    session.lastActivity = new Date();

    return true;
  }

  /**
   * Cierra y limpia una sesión
   */
  closeSession(callId: string): void {
    const session = this.sessions.get(callId);
    if (session) {
      const duration = Date.now() - session.startTime.getTime();
      console.log(
        `[CallHandler] Closed session ${callId}. Duration: ${Math.floor(duration / 1000)}s`
      );
      this.sessions.delete(callId);
    }
  }

  /**
   * Limpia sesiones expiradas (debe llamarse periódicamente)
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [callId, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > this.SESSION_TIMEOUT) {
        console.log(`[CallHandler] Cleaning up expired session ${callId}`);
        this.sessions.delete(callId);
      }
    }
  }
}

// Singleton instance
const sessionManager = new CallSessionManager();

// Limpiar sesiones expiradas cada minuto
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    sessionManager.cleanupExpiredSessions();
  }, 60 * 1000);
}

// ============ Funciones de flujo de llamada ============

/**
 * Inicia el manejo de una llamada entrante
 */
export function handleIncomingCall(callInfo: CallInfo): string {
  const session = sessionManager.createSession(callInfo);

  // Actualizar estado
  sessionManager.updateState(callInfo.callId, CallState.GREETING);

  // Retornar instrucciones XML para SignalWire
  return `
    <Response>
      <Pause length="1" />
      <Say language="es-ES" voice="female">
        Hola, gracias por llamar a El Posit.
        En un momento te atenderá nuestro asistente virtual.
      </Say>
      <Pause length="1" />
    </Response>
  `;
}

/**
 * Procesa el resultado del bot de voz y genera la respuesta
 */
export function processBotResult(
  callId: string,
  botResponse: string,
  nextState?: CallState
): string {
  const session = sessionManager.getSession(callId);
  if (!session) {
    console.error(`[CallHandler] Session not found: ${callId}`);
    return '<Response><Hangup /></Response>';
  }

  // Guardar transcripción
  sessionManager.addTranscript(callId, `Bot: ${botResponse}`);

  // Actualizar estado si se proporciona
  if (nextState) {
    sessionManager.updateState(callId, nextState);
  }

  // Generar respuesta XML
  return `
    <Response>
      <Say language="es-ES" voice="female">
        ${escapeXml(botResponse)}
      </Say>
    </Response>
  `;
}

/**
 * Termina una llamada con un mensaje de despedida
 */
export function endCall(callId: string, goodbyeMessage?: string): string {
  const session = sessionManager.getSession(callId);
  if (!session) {
    return '<Response><Hangup /></Response>';
  }

  sessionManager.updateState(callId, CallState.COMPLETED);

  const message =
    goodbyeMessage || "Gracias por llamar a El Posit. Que tengas un buen día.";

  const response = `
    <Response>
      <Say language="es-ES" voice="female">
        ${escapeXml(message)}
      </Say>
      <Hangup />
    </Response>
  `;

  // Cerrar sesión después de un momento
  setTimeout(() => {
    sessionManager.closeSession(callId);
  }, 1000);

  return response;
}

/**
 * Transfiere la llamada a un humano
 */
export function transferToHuman(callId: string, targetNumber?: string): string {
  const session = sessionManager.getSession(callId);
  if (!session) {
    return '<Response><Hangup /></Response>';
  }

  sessionManager.updateState(callId, CallState.HANGUP);

  if (targetNumber) {
    return `
      <Response>
        <Say language="es-ES" voice="female">
          Te estamos transfiriendo con un asistente.
        </Say>
        <Dial>${targetNumber}</Dial>
      </Response>
    `;
  }

  return `
    <Response>
      <Say language="es-ES" voice="female">
        Lo siento, no hay asistentes disponibles en este momento.
        Te atenderemos pronto. Gracias.
      </Say>
      <Hangup />
    </Response>
  `;
}

// ============ Utilidades ============

/**
 * Escapa caracteres especiales para XML
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Obtiene el manager de sesiones (para testing/debugging)
 */
export function getSessionManager(): CallSessionManager {
  return sessionManager;
}

/**
 * Obtiene información de una sesión (para debugging)
 */
export function getSessionInfo(callId: string): CallSession | undefined {
  return sessionManager.getSession(callId);
}
