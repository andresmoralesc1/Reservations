/**
 * Mock Redis para Tests
 *
 * Mock de ioredis para tests unitarios sin conectar a Redis real.
 */

import { vi } from 'vitest'

// ============ Mock Data Store ============
interface RedisData {
  [key: string]: {
    value: string
    ttl?: number
    expiresAt?: number
  }
}

const mockStore: RedisData = {}

// ============ Reset function ============
export function resetMockRedis() {
  Object.keys(mockStore).forEach(key => delete mockStore[key])
}

// ============ Mock Redis Client ============
class MockRedis {
  private data: RedisData = mockStore

  // Get value
  async get(key: string): Promise<string | null> {
    this.checkExpiry(key)
    return this.data[key]?.value || null
  }

  // Set value
  async set(key: string, value: string): Promise<'OK' | null>
  async set(key: string, value: string, mode: 'EX', seconds: number): Promise<'OK' | null>
  async set(key: string, value: string, mode?: string, seconds?: number): Promise<'OK' | null> {
    if (mode === 'EX' && seconds) {
      this.data[key] = {
        value,
        ttl: seconds,
        expiresAt: Date.now() + seconds * 1000,
      }
    } else {
      this.data[key] = { value }
    }
    return 'OK'
  }

  // Set with expiration
  async setex(key: string, seconds: number, value: string): Promise<'OK' | null> {
    return this.set(key, value, 'EX', seconds)
  }

  // Delete key
  async del(key: string): Promise<number> {
    this.checkExpiry(key)
    const existed = key in this.data
    delete this.data[key]
    return existed ? 1 : 0
  }

  // Delete multiple keys
  async delMultiple(...keys: string[]): Promise<number> {
    let count = 0
    for (const key of keys) {
      count += await this.del(key)
    }
    return count
  }

  // Check if key exists
  async exists(key: string): Promise<number> {
    this.checkExpiry(key)
    return key in this.data ? 1 : 0
  }

  // Set multiple values
  async mset(...keyValues: string[]): Promise<'OK'> {
    for (let i = 0; i < keyValues.length; i += 2) {
      await this.set(keyValues[i], keyValues[i + 1])
    }
    return 'OK'
  }

  // Get multiple values
  async mget(...keys: string[]): Promise<Array<string | null>> {
    return Promise.all(keys.map(key => this.get(key)))
  }

  // Increment
  async incr(key: string): Promise<number> {
    this.checkExpiry(key)
    const current = parseInt(this.data[key]?.value || '0', 10)
    const newValue = current + 1
    this.data[key] = { value: newValue.toString() }
    return newValue
  }

  // Increment by
  async incrby(key: string, increment: number): Promise<number> {
    this.checkExpiry(key)
    const current = parseInt(this.data[key]?.value || '0', 10)
    const newValue = current + increment
    this.data[key] = { value: newValue.toString() }
    return newValue
  }

  // Decrement
  async decr(key: string): Promise<number> {
    this.checkExpiry(key)
    const current = parseInt(this.data[key]?.value || '0', 10)
    const newValue = current - 1
    this.data[key] = { value: newValue.toString() }
    return newValue
  }

  // Set hash field
  async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.data[key]) {
      this.data[key] = { value: '{}' }
    }
    const hash = JSON.parse(this.data[key].value)
    hash[field] = value
    this.data[key].value = JSON.stringify(hash)
    return 1
  }

  // Get hash field
  async hget(key: string, field: string): Promise<string | null> {
    if (!this.data[key]) return null
    const hash = JSON.parse(this.data[key].value)
    return hash[field] || null
  }

  // Get all hash fields
  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.data[key]) return {}
    return JSON.parse(this.data[key].value)
  }

  // Delete hash field
  async hdel(key: string, field: string): Promise<number> {
    if (!this.data[key]) return 0
    const hash = JSON.parse(this.data[key].value)
    const existed = field in hash
    delete hash[field]
    this.data[key].value = JSON.stringify(hash)
    return existed ? 1 : 0
  }

  // Check hash field exists
  async hexists(key: string, field: string): Promise<number> {
    if (!this.data[key]) return 0
    const hash = JSON.parse(this.data[key].value)
    return field in hash ? 1 : 0
  }

  // Add to sorted set
  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.data[key]) {
      this.data[key] = { value: '[]' }
    }
    const set = JSON.parse(this.data[key].value) as Array<[number, string]>
    const existed = set.some(([_, m]) => m === member)
    set.push([score, member])
    set.sort((a, b) => a[0] - b[0])
    this.data[key].value = JSON.stringify(set)
    return existed ? 0 : 1
  }

  // Get range from sorted set
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.data[key]) return []
    const set = JSON.parse(this.data[key].value) as Array<[number, string]>
    return set.slice(start, stop + 1).map(([_, m]) => m)
  }

  // Remove from sorted set
  async zrem(key: string, member: string): Promise<number> {
    if (!this.data[key]) return 0
    const set = JSON.parse(this.data[key].value) as Array<[number, string]>
    const idx = set.findIndex(([_, m]) => m === member)
    if (idx >= 0) {
      set.splice(idx, 1)
      this.data[key].value = JSON.stringify(set)
      return 1
    }
    return 0
  }

  // Get TTL
  async ttl(key: string): Promise<number> {
    if (!this.data[key]) return -2
    if (!this.data[key].expiresAt) return -1
    const ttl = Math.floor((this.data[key].expiresAt! - Date.now()) / 1000)
    return ttl > 0 ? ttl : -2
  }

  // Flush all
  async flushall(): Promise<'OK'> {
    Object.keys(this.data).forEach(key => delete this.data[key])
    return 'OK'
  }

  // Connect (for compatibility)
  async connect(): Promise<void> {
    // No-op for mock
  }

  // Disconnect
  async disconnect(): Promise<void> {
    // No-op for mock
  }

  // Quit
  async quit(): Promise<'OK'> {
    return 'OK'
  }

  // Ping
  async ping(): Promise<'PONG'> {
    return 'PONG'
  }

  // Helper: Check expiration
  private checkExpiry(key: string): void {
    if (this.data[key]?.expiresAt && Date.now() > this.data[key].expiresAt!) {
      delete this.data[key]
    }
  }

  // Helper: Get all data (for testing)
  _getData(): RedisData {
    return { ...this.data }
  }
}

// ============ Create mock instance ============
export const mockRedis = new MockRedis()

// ============ Vitest Module Mock ============
vi.mock('ioredis', () => ({
  default: vi.fn(() => mockRedis),
}))

export default mockRedis
