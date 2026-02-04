import Redis from "ioredis"
import * as dotenv from "dotenv"

dotenv.config({ path: "../../.env" })

const redisUrl = process.env.REDIS_URL

// Redis es opcional - si no hay URL, usamos un mock
let redis: Redis | null = null

if (redisUrl) {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) return null // Stop retrying after 3 attempts
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    lazyConnect: true,
  })

  redis.on("error", (err) => {
    console.warn("Redis connection error (running without cache):", err.message)
  })
}

// Mock Redis para desarrollo sin Redis
const redisMock = {
  get: async () => null,
  set: async () => "OK",
  del: async () => 1,
  exists: async () => 0,
  expire: async () => 1,
  setex: async () => "OK",
  quit: async () => "OK",
} as unknown as Redis

export const getRedis = () => redis || redisMock
export const redisEnabled = () => !!redis

export type RedisClient = Redis
