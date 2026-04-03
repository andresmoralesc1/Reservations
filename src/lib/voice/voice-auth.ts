/**
 * Voice Authentication
 *
 * Valida que las requests al voice-bridge vienen de Pipecat.
 * Previene accesos no autorizados al endpoint de voz.
 *
 * Seguridad:
 * - Usa timing-safe comparison para prevenir timing attacks
 * - Valida longitud mínima de la key
 * - Log de intentos fallidos sin revelar información sensible
 */

import type { NextRequest } from "next/server"
import { timingSafeEqual } from "crypto"
import { createLogger } from "@/lib/logger"

const logger = createLogger({ module: "voice-auth" })

// ============ Configuración ============
const API_KEY_HEADER = "x-voice-bridge-key"
const API_KEY_ALT_HEADER = "authorization" // "Bearer <key>"
const MIN_API_KEY_LENGTH = 32 // Longitud mínima de seguridad

// ============ Tipos ============
export interface AuthResult {
  valid: boolean
  error?: string
}

// ============ Función principal ============

/**
 * Valida una API key de forma segura usando timing-safe comparison
 *
 * @param provided - Key proporcionada en la request
 * @param expected - Key esperada (de env var)
 * @returns true si la key es válida
 */
function validateApiKey(provided: string, expected: string): boolean {
  // 1. Validación de longitud primero (timing-safe no es necesario aquí)
  if (provided.length !== expected.length) {
    return false
  }

  // 2. Validación de longitud mínima
  if (expected.length < MIN_API_KEY_LENGTH) {
    logger.error({
      msg: "VOICE_BRIDGE_API_KEY too short",
      expectedLength: expected.length,
      minLength: MIN_API_KEY_LENGTH,
    })
    return false
  }

  // 3. Comparación timing-safe para prevenir timing attacks
  // timingSafeEqual solo funciona con Buffers de igual longitud
  try {
    return timingSafeEqual(
      Buffer.from(provided, "utf-8"),
      Buffer.from(expected, "utf-8")
    )
  } catch {
    return false
  }
}

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
      logger.debug({
        msg: "Development mode: allowing unauthenticated request",
      })
      return { valid: true }
    }
  }

  // Obtener API key esperada
  const expectedKey = process.env.VOICE_BRIDGE_API_KEY

  if (!expectedKey) {
    logger.error({
      msg: "VOICE_BRIDGE_API_KEY not configured",
    })
    return {
      valid: false,
      error: "Voice bridge not configured properly",
    }
  }

  // Buscar key en headers (prioridad: x-voice-bridge-key, luego Authorization)
  const providedKey = request.headers.get(API_KEY_HEADER) ||
                      extractBearerToken(request.headers.get(API_KEY_ALT_HEADER))

  if (!providedKey) {
    logger.warn({
      msg: "Voice bridge authentication failed: missing credentials",
      ip: getClientIp(request),
    })
    return {
      valid: false,
      error: "Missing authentication credentials",
    }
  }

  // Validar key con timing-safe comparison
  const isValid = validateApiKey(providedKey, expectedKey)

  if (!isValid) {
    logger.warn({
      msg: "Voice bridge authentication failed: invalid API key",
      ip: getClientIp(request),
      providedKeyLength: providedKey.length,
      // NO loggear la key proporcionada ni la esperada por seguridad
    })
    return {
      valid: false,
      error: "Invalid authentication credentials",
    }
  }

  return { valid: true }
}

/**
 * Obtiene la IP del cliente de forma segura
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
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
