import Redis from "ioredis"
import * as dotenv from "dotenv"

dotenv.config({ path: "../../.env" })

const redisUrl = process.env.REDIS_URL || "redis://redis-n8n:6379/2"

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

export type RedisClient = typeof redis
