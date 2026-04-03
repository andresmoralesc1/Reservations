import { pgTable, uuid, text, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { restaurants } from "./restaurants"
import { reservations } from "./reservations"

// Voice call logs - Registra llamadas del bot de voz (Pipecat)
// Reemplaza la tabla "info_llamadas" que n8n usaba en Supabase
export const callLogs = pgTable("call_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id").references(() => reservations.id, { onDelete: "set null" }),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  callerPhone: text("caller_phone").notNull(), // +34 6XX XXX XXX
  callStartedAt: timestamp("call_started_at").notNull().defaultNow(),
  callDurationSecs: integer("call_duration_secs"), // Duración en segundos
  callEndReason: text("call_end_reason"), // 'completed', 'hangup', 'error', 'timeout', 'no_show'
  callCost: text("call_cost"), // Coste estimado (Cartesia + GPT)
  callSummary: text("call_summary"), // Resumen generado por GPT al final
  actionsTaken: jsonb("actions_taken").$type<Array<{
    action: string
    success: boolean
    timestamp: string
    params?: Record<string, unknown>
    error?: string
  }>>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Índices para búsquedas eficientes
  callerPhoneIdx: index("call_logs_caller_phone_idx").on(table.callerPhone),
  restaurantDateIdx: index("call_logs_restaurant_date_idx").on(table.restaurantId, table.callStartedAt),
  reservationIdx: index("call_logs_reservation_idx").on(table.reservationId),
}))

// Relations
export const callLogsRelations = relations(callLogs, ({ one }) => ({
  reservation: one(reservations, {
    fields: [callLogs.reservationId],
    references: [reservations.id],
  }),
  restaurant: one(restaurants, {
    fields: [callLogs.restaurantId],
    references: [restaurants.id],
  }),
}))

// Types
export type CallLog = typeof callLogs.$inferSelect
export type NewCallLog = typeof callLogs.$inferInsert
