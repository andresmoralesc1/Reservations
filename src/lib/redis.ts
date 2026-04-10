import Redis from "ioredis"

const redisUrl = process.env.REDIS_URL

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
  zadd: async () => 1,
  zcard: async () => 0,
  zrange: async () => [],
  zremrangebyscore: async () => 0,
} as unknown as Redis

let redisClient: Redis | null = null
let connectionFailed = false

function createRedisClient(): Redis {
  if (!redisUrl) return redisMock
  if (connectionFailed) return redisMock
  if (redisClient) return redisClient

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 2000)),
      connectTimeout: 5000,
      lazyConnect: false,
    })

    redisClient.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message)
    })

    return redisClient
  } catch (err) {
    console.warn("[Redis] Failed to create client:", err)
    connectionFailed = true
    return redisMock
  }
}

export const getRedis = (): Redis => createRedisClient()
export const redisEnabled = (): boolean => !!redisUrl && !connectionFailed
export type RedisClient = Redis
