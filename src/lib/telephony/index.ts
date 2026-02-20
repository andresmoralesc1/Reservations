/**
 * Telephony Module
 *
 * Exporta todas las funciones y tipos para integración telefónica.
 * Este módulo prepara la integración con SignalWire u otros proveedores.
 */

// ============ SignalWire Gateway ============
export {
  getSignalWireConfig,
  isSignalWireConfigured,
  initializeSignalWireSession,
  handleIncomingCall,
  generateSignalWireToken,
  handleSignalWireWebhook,
} from "./signalwire-gateway";

export type {
  SignalWireConfig,
  CallInfo,
  SignalWireEvent,
} from "./signalwire-gateway";

// ============ Call Handler ============
export {
  handleIncomingCall as handleIncomingCallFlow,
  processBotResult,
  endCall,
  transferToHuman,
  getSessionManager,
  getSessionInfo,
} from "./call-handler";

export {
  CallState,
} from "./call-handler";

export type {
  CallSession,
} from "./call-handler";

// ============ Instrucciones de configuración ============

/**
 * Para activar la integración telefónica con SignalWire:
 *
 * 1. Crear cuenta en SignalWire.com
 * 2. Configurar variables de entorno:
 *    SIGNALWIRE_PROJECT_ID=tu_project_id
 *    SIGNALWIRE_ACCESS_TOKEN=tu_access_token
 *    SIGNALWIRE_SPACE_URL=tu_space.signalwire.com
 * 3. Crear endpoint de webhook:
 *    /api/telephony/signalwire/webhook
 * 4. Configurar el número en SignalWire para apuntar al webhook
 * 5. Implementar la conexión WebRTC entre SignalWire y Pipecat bot
 *
 * Documentación: https://developer.signalwire.com/
 */
