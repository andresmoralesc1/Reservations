import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

/**
 * GET /api/admin/services/migrate
 * Verify and create services table if needed
 */
export async function GET() {
  try {
    // Try to query the services table
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'services';
    `)

    const tableExists = result.length > 0

    if (!tableExists) {
      // Table doesn't exist, create it
      await db.execute(sql`
        CREATE TABLE "services" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          "restaurant_id" uuid NOT NULL,
          "name" text NOT NULL,
          "description" text,
          "is_active" boolean DEFAULT true,
          "service_type" text NOT NULL,
          "season" text DEFAULT 'todos' NOT NULL,
          "day_type" text DEFAULT 'all' NOT NULL,
          "start_time" text NOT NULL,
          "end_time" text NOT NULL,
          "default_duration_minutes" integer DEFAULT 90 NOT NULL,
          "buffer_minutes" integer DEFAULT 15 NOT NULL,
          "slot_generation_mode" text DEFAULT 'auto' NOT NULL,
          "date_range" jsonb,
          "manual_slots" jsonb,
          "available_table_ids" jsonb,
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now(),
          CONSTRAINT "services_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action
        );
      `)

      await db.execute(sql`
        CREATE INDEX "services_restaurant_idx" ON "services" ("restaurant_id");
      `)

      await db.execute(sql`
        CREATE INDEX "services_active_idx" ON "services" ("is_active");
      `)

      await db.execute(sql`
        CREATE INDEX "services_service_type_idx" ON "services" ("service_type");
      `)

      await db.execute(sql`
        ALTER TABLE "services" ADD CONSTRAINT "services_restaurant_id_day_type_start_time_unique" UNIQUE("restaurant_id", "day_type", "start_time");
      `)

      return NextResponse.json({
        success: true,
        message: "Table 'services' created successfully",
        existed: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Table 'services' already exists",
      existed: true,
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    )
  }
}
