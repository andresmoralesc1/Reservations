import Redis from "ioredis"

const redisUrl = process.env.REDIS_URL

// Mock Redis para desarrollo sin Redis
const redisMock = {
  get: async () => null,
  set: async () => "OK",
  setex: async () => "OK",
  del: async () => 1,
  exists: async () => 0,
  expire: async () => 1,
  quit: async () => "OK",
  getBuffer: async () => null,
  keys: async () => [],
  flushdb: async () => "OK",
  on: () => {},
  incr: async () => 1,
  zadd: async () => 1,
  zremrangebyscore: async () => 0,
  zcard: async () => 0,
  zrange: async () => [],
  ttl: async () => -1,
} as unknown as Redis

// Singleton lazy - solo se conecta cuando se llama a getRedis()
let redisInstance: Redis | null = null
let redisInitialized = false

/**
 * Obtiene la instancia de Redis (lazy connection)
 *
 * La primera vez que se llama, intenta conectar.
 * Si falla, devuelve el mock (fail-open).
 */
export function getRedis(): Redis {
  // Si ya tenemos una instancia (conectada o mock), retornarla
  if (redisInitialized) {
    return redisInstance ?? redisMock
  }

  redisInitialized = true

  // Si no hay REDIS_URL, usar mock
  if (!redisUrl) {
    redisInstance = redisMock
    return redisMock
  }

  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // No reintentar automáticamente
      connectTimeout: 2000,
      lazyConnect: true, // No conectar hasta que se necesite
    })

    // Manejo de errores - si falla la conexión, usar mock
    redis.on("error", (error) => {
      console.warn("[Redis] Connection error, using mock:", error.message)
      redisInstance = redisMock
    })

    // Intentar conectar
    redis.connect().catch((error) => {
      console.warn("[Redis] Failed to connect, using mock:", error.message)
      redisInstance = redisMock
    })

    redisInstance = redis
    return redis
  } catch (error) {
    console.warn("[Redis] Failed to create client, using mock:", error)
    redisInstance = redisMock
    return redisMock
  }
}

/**
 * Redis está habilitado si REDIS_URL está configurado
 */
export function redisEnabled(): boolean {
  return !!redisUrl
}

export type RedisClient = Redis
