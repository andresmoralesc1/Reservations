// Drizzle Schema - Modular Structure
// This file exports all tables, relations, and types from the modular schema

// Tables
export * from "./restaurants"
export * from "./customers"
export * from "./services"
export * from "./tables"
export * from "./reservations"
export * from "./voice"
export * from "./analytics"

// Import all tables for relations
import { restaurants } from "./restaurants"
import { customers } from "./customers"
import { services } from "./services"
import { tables, tableBlocks } from "./tables"
import {
  reservations,
  reservationsArchive,
  reservationHistory,
  reservationSessions,
  whatsappMessages,
} from "./reservations"
import { callLogs } from "./voice"
import { dailyAnalytics } from "./analytics"
import { relations } from "drizzle-orm"

// Restaurants relations (must be here after all other tables are defined)
export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  tables: many(tables),
  services: many(services),
  reservations: many(reservations),
  reservationSessions: many(reservationSessions),
  tableBlocks: many(tableBlocks),
  callLogs: many(callLogs),
}))

// Services relations with reservations (overrides the one in services.ts)
export const servicesRelations = relations(services, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [services.restaurantId],
    references: [restaurants.id],
  }),
  reservations: many(reservations),
}))

// Re-export all other relations (they're already defined in their respective modules)
export { customersRelations } from "./reservations"
export { reservationsRelations, reservationHistoryRelations, whatsappMessagesRelations, reservationSessionsRelations } from "./reservations"
export { tablesRelations, tableBlocksRelations } from "./tables"
export { callLogsRelations } from "./voice"
export { dailyAnalyticsRelations } from "./analytics"
