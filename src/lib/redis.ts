import Redis from "ioredis"
import * as dotenv from "dotenv"

dotenv.config()

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
} as unknown as Redis

// Por defecto usamos el mock (Redis no disponible)
let redisClient: Redis = redisMock

// Redis es opcional - intentamos conectar pero si falla usamos mock
if (redisUrl) {
  try {
    const redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // No reintentar
      connectTimeout: 2000,
      lazyConnect: false, // Intentar conectar inmediatamente
    })

    redis.on("error", () => {
      // Error silencioso - seguimos usando el mock
    })

    redis.on("connect", () => {
      redisClient = redis
    })

    // Si se conecta en 2 segundos, úsalo
    setTimeout(() => {
      if (redis.status !== "ready") {
        redis.disconnect()
        redisClient = redisMock
      }
    }, 2000)
  } catch {
    redisClient = redisMock
  }
}

export const getRedis = () => redisClient
export const redisEnabled = () => redisClient !== redisMock

export type RedisClient = Redis
