import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../../drizzle/schema"

// DATABASE_URL is required - no fallback to avoid exposing credentials
const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required')
}

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // Ignore notices
})

export const db = drizzle(client, { schema })
export type Database = typeof db
