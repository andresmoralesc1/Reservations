import { pgTable, uuid, text, integer, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { restaurants } from "./restaurants"

// Tabla de analíticas diarias pre-calculadas
// Se pobla cada noche via cron job para optimizar consultas de 7+ días
export const dailyAnalytics = pgTable("daily_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD

  // Conteos por estado
  totalReservations: integer("total_reservations").notNull().default(0),
  confirmedCount: integer("confirmed_count").notNull().default(0),
  pendingCount: integer("pending_count").notNull().default(0),
  cancelledCount: integer("cancelled_count").notNull().default(0),
  noShowCount: integer("no_show_count").notNull().default(0),

  // Métricas de covers
  totalCovers: integer("total_covers").notNull().default(0),
  avgPartySize: integer("avg_party_size"), // Stored as integer * 10 (e.g., 2.5 = 25)

  // Desglose por origen
  sourceBreakdown: jsonb("source_breakdown").$type<Record<string, number>>().notNull().default({}),

  // Desglose por hora (13-23)
  hourlyBreakdown: jsonb("hourly_breakdown").$type<Array<{
    hour: number
    count: number
    covers: number
  }>>().notNull().default([]),

  // Métricas derivadas
  confirmationRate: integer("confirmation_rate").notNull().default(0), // 0-100
  noShowRate: integer("no_show_rate").notNull().default(0), // 0-100

  // Metadatos
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Índice único para prevenir duplicados
  uniqueRestaurantDate: unique().on(table.restaurantId, table.date),
  // Índices para consultas de rango
  restaurantDateIdx: index("daily_analytics_restaurant_date_idx").on(table.restaurantId, table.date),
  dateIdx: index("daily_analytics_date_idx").on(table.date),
}))

// Relations
export const dailyAnalyticsRelations = relations(dailyAnalytics, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [dailyAnalytics.restaurantId],
    references: [restaurants.id],
  }),
}))

// Types
export type DailyAnalytics = typeof dailyAnalytics.$inferSelect
export type NewDailyAnalytics = typeof dailyAnalytics.$inferInsert
