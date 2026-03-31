/**
 * Script para crear la tabla daily_analytics
 * Ejecutar: npx tsx scripts/create-daily-analytics.ts
 */

import * as dotenv from "dotenv"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

dotenv.config({ path: ".env.local" })

const databaseUrl = process.env.DATABASE_URL!
const client = postgres(databaseUrl, { max: 1 })
const db = drizzle(client)

async function createDailyAnalyticsTable() {
  console.log("🔨 Creating daily_analytics table...")

  await client.unsafe(`
    CREATE TABLE IF NOT EXISTS "daily_analytics" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "restaurant_id" uuid NOT NULL,
      "date" text NOT NULL,
      "total_reservations" integer DEFAULT 0 NOT NULL,
      "confirmed_count" integer DEFAULT 0 NOT NULL,
      "pending_count" integer DEFAULT 0 NOT NULL,
      "cancelled_count" integer DEFAULT 0 NOT NULL,
      "no_show_count" integer DEFAULT 0 NOT NULL,
      "total_covers" integer DEFAULT 0 NOT NULL,
      "avg_party_size" integer,
      "source_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "hourly_breakdown" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "confirmation_rate" integer DEFAULT 0 NOT NULL,
      "no_show_rate" integer DEFAULT 0 NOT NULL,
      "calculated_at" timestamp DEFAULT now() NOT NULL,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now(),
      CONSTRAINT "daily_analytics_restaurant_id_date_unique" UNIQUE("restaurant_id","date")
    );
  `)

  console.log("✅ Created daily_analytics table")

  console.log("🔨 Creating indexes...")

  await client.unsafe(`
    CREATE INDEX IF NOT EXISTS "daily_analytics_restaurant_date_idx"
    ON "daily_analytics" USING btree ("restaurant_id","date");
  `)

  await client.unsafe(`
    CREATE INDEX IF NOT EXISTS "daily_analytics_date_idx"
    ON "daily_analytics" USING btree ("date");
  `)

  console.log("✅ Created indexes")

  console.log("🔨 Creating foreign key...")

  try {
    await client.unsafe(`
      ALTER TABLE "daily_analytics"
      ADD CONSTRAINT "daily_analytics_restaurant_id_restaurants_id_fk"
      FOREIGN KEY ("restaurant_id")
      REFERENCES "public"."restaurants"("id")
      ON DELETE cascade ON UPDATE no action;
    `)
    console.log("✅ Created foreign key")
  } catch (e: any) {
    if (e.code === "42P07") {
      console.log("ℹ️ Foreign key already exists, skipping...")
    } else {
      throw e
    }
  }

  console.log("✅ daily_analytics table created successfully!")

  await client.end()
}

createDailyAnalyticsTable().catch(console.error)
