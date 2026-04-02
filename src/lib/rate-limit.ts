/**
 * Rate Limiting con Redis
 *
 * Limita la frecuencia de requests por identificador (IP, user, etc.)
 */

import { getRedis, redisEnabled } from "./redis"

/**
 * Resultado del rate limit check
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt?: Date
  limit: number
}

/**
 * Configuraciones predefinidas de rate limit
 */
export const RateLimitConfig = {
  /** Reservas: 10 por minuto */
  reservations: {
    limit: 10,
    windowSeconds: 60,
  },
  /** Admin: 100 por minuto */
  admin: {
    limit: 100,
    windowSeconds: 60,
  },
  /** Login: 5 intentos cada 15 minutos */
  login: {
    limit: 5,
    windowSeconds: 900, // 15 minutos
  },
  /** Availability check: 20 por minuto */
  availability: {
    limit: 20,
    windowSeconds: 60,
  },
  /** IVR: 30 por minuto */
  ivr: {
    limit: 30,
    windowSeconds: 60,
  },
} as const

/**
 * Genera la key de Redis para rate limiting
 */
function getRateLimitKey(identifier: string, action: string): string {
  return `ratelimit:${action}:${identifier}`
}

/**
 * Verifica y aplica rate limiting usando Redis con sliding window
 *
 * @param options.identifier - Identificador único (IP, userId, etc.)
 * @param options.limit - Máximo de requests permitidas
 * @param options.windowSeconds - Ventana de tiempo en segundos
 * @param options.action - Nombre de la acción (para la key)
 * @returns RateLimitResult con allowed, remaining, resetAt
 */
export async function rateLimit(options: {
  identifier: string
  limit: number
  windowSeconds: number
  action?: string
}): Promise<RateLimitResult> {
  const { identifier, limit, windowSeconds, action = "default" } = options

  // Si Redis no está disponible, permitir todo (fail-open)
  if (!redisEnabled()) {
    return {
      allowed: true,
      remaining: limit,
      limit,
    }
  }

  try {
    const redis = getRedis()
    const key = getRateLimitKey(identifier, action)
    const now = Date.now()
    const windowStart = now - windowSeconds * 1000

    // Usar una sorted set para sliding window
    // Score = timestamp, Member = UUID único del request

    // Remover entries fuera de la ventana
    await redis.zremrangebyscore(key, 0, windowStart)

    // Contar requests en la ventana actual
    const count = await redis.zcard(key)

    // Verificar si excede el límite
    if (count >= limit) {
      // Obtener el timestamp del request más antiguo
      const oldest = await redis.zrange(key, 0, 0, "WITHSCORES")
      const resetAt = oldest.length > 1 ? new Date(Number(oldest[1]) + windowSeconds * 1000) : undefined

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit,
      }
    }

    // Agregar este request a la ventana
    await redis.zadd(key, now, crypto.randomUUID())

    // Configurar expiración de la key (windowSeconds + 1 de margen)
    await redis.expire(key, windowSeconds + 1)

    return {
      allowed: true,
      remaining: limit - count - 1,
      limit,
    }
  } catch (error) {
    // En caso de error con Redis, permitir todo (fail-open)
    console.warn("[RateLimit] Error checking rate limit:", error)
    return {
      allowed: true,
      remaining: limit,
      limit,
    }
  }
}

/**
 * Rate limit simplificado con contador (menos preciso pero más rápido)
 */
export async function rateLimitSimple(options: {
  identifier: string
  limit: number
  windowSeconds: number
  action?: string
}): Promise<RateLimitResult> {
  const { identifier, limit, windowSeconds, action = "default" } = options

  // Si Redis no está disponible, permitir todo
  if (!redisEnabled()) {
    return {
      allowed: true,
      remaining: limit,
      limit,
    }
  }

  try {
    const redis = getRedis()
    const key = getRateLimitKey(identifier, action)

    // Incrementar contador
    const current = await redis.incr(key)

    // Si es el primer request, configurar expiración
    if (current === 1) {
      await redis.expire(key, windowSeconds)
    }

    // Verificar límite
    if (current > limit) {
      const ttl = await redis.ttl(key)
      const resetAt = ttl > 0 ? new Date(Date.now() + ttl * 1000) : undefined

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit,
      }
    }

    return {
      allowed: true,
      remaining: limit - current,
      limit,
    }
  } catch (error) {
    console.warn("[RateLimit] Error checking rate limit:", error)
    return {
      allowed: true,
      remaining: limit,
      limit,
    }
  }
}

/**
 * Obtiene el identificador para rate limiting desde una request
 */
export function getRateLimitIdentifier(
  request: Request,
  options?: { useUserId?: boolean }
): string {
  // Priorizar user ID si está disponible
  if (options?.useUserId) {
    // En el futuro se puede extraer de JWT o sesión
    // Por ahora usamos IP
  }

  // Extraer IP de headers
  const headers = request.headers
  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() || // Cloudflare
    "unknown"

  return ip
}

/**
 * Helper para aplicar rate limiting y retornar error si excede
 */
export async function checkRateLimitOrThrow(
  identifier: string,
  config: { limit: number; windowSeconds: number },
  action?: string
): Promise<void> {
  const result = await rateLimit({ identifier, ...config, action })

  if (!result.allowed) {
    throw new RateLimitError(result)
  }
}

/**
 * Error personalizado para rate limit exceeded
 */
export class RateLimitError extends Error {
  public readonly retryAfter: number
  public readonly limit: number

  constructor(result: RateLimitResult) {
    super("Rate limit exceeded")
    this.name = "RateLimitError"
    this.limit = result.limit

    // Calcular retry-after
    if (result.resetAt) {
      this.retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)
    } else {
      this.retryAfter = 60 // Default
    }
  }

  toResponse() {
    return Response.json(
      {
        error: "Rate limit exceeded",
        message: `Has excedido el límite de requests. Intenta de nuevo en ${this.retryAfter} segundos.`,
        retryAfter: this.retryAfter,
        limit: this.limit,
      },
      {
        status: 429,
        headers: {
          "Retry-After": this.retryAfter.toString(),
          "X-RateLimit-Limit": this.limit.toString(),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }
}
