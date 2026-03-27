/**
 * Voice Authentication
 *
 * Valida que las requests al voice-bridge vienen de Pipecat.
 * Previene accesos no autorizados al endpoint de voz.
 */

import type { NextRequest } from "next/server"

// ============ Configuración ============
const API_KEY_HEADER = "x-voice-bridge-key"
const API_KEY_ALT_HEADER = "authorization" // "Bearer <key>"

// ============ Tipos ============
export interface AuthResult {
  valid: boolean
  error?: string
}

// ============ Función principal ============

/**
 * Valida que una request al voice-bridge esté autenticada
 *
 * @param request - NextRequest a validar
 * @returns AuthResult con valid = true si es válida
 *
 * En desarrollo (NODE_ENV=development), permite requests sin key
 * para facilitar testing con curl/Postman.
 *
 * En producción, rechaza todo lo que no tenga key válida.
 */
export function validateVoiceBridgeRequest(request: NextRequest): AuthResult {
  const isDevelopment = process.env.NODE_ENV === "development"

  // En desarrollo, permitir sin key para testing
  if (isDevelopment) {
    // Si no viene header alguno, permitir en dev
    const hasKey = request.headers.has(API_KEY_HEADER) ||
                   request.headers.has(API_KEY_ALT_HEADER)

    if (!hasKey) {
      console.warn("[Voice Auth] Development mode: allowing unauthenticated request")
      return { valid: true }
    }
  }

  // Obtener API key esperada
  const expectedKey = process.env.VOICE_BRIDGE_API_KEY

  if (!expectedKey) {
    console.error("[Voice Auth] VOICE_BRIDGE_API_KEY not configured")
    return {
      valid: false,
      error: "Voice bridge not configured properly",
    }
  }

  // Buscar key en headers (prioridad: x-voice-bridge-key, luego Authorization)
  const providedKey = request.headers.get(API_KEY_HEADER) ||
                      extractBearerToken(request.headers.get(API_KEY_ALT_HEADER))

  if (!providedKey) {
    return {
      valid: false,
      error: "Missing authentication credentials",
    }
  }

  // Validar key
  if (providedKey !== expectedKey) {
    console.warn("[Voice Auth] Invalid API key provided")
    return {
      valid: false,
      error: "Invalid authentication credentials",
    }
  }

  return { valid: true }
}

/**
 * Extrae token Bearer del header Authorization
 *
 * @param authHeader - Valor del header Authorization
 * @returns Token sin el prefijo "Bearer " o null
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null

  const parts = authHeader.split(" ")
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null
  }

  return parts[1]
}

/**
 * Genera una API key segura aleatoria
 *
 * Útil para generar una key nueva durante setup.
 *
 * @returns Key hexadecimal de 64 caracteres (32 bytes)
 */
export function generateApiKey(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("")
}
