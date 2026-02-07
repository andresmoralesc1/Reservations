import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as dotenv from "dotenv"
import * as schema from "../../drizzle/schema"

dotenv.config()

const connectionString =
  process.env.DATABASE_URL || "postgresql://neuralflow@postgres:5432/reservations_db"

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // Ignore notices
})

export const db = drizzle(client, { schema })
export type Database = typeof db
