import { defineConfig } from "drizzle-kit"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

// Validar que DATABASE_URL esté definido
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not defined. Please set it in your .env.local file.\n" +
    "You can copy .env.example to .env.local and configure your database credentials."
  )
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
})
