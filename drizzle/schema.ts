/**
 * Drizzle Schema - Main Entry Point
 *
 * This file re-exports everything from the modular schema structure
 * located in ./schema/ for backward compatibility.
 *
 * Schema structure:
 * - schema/restaurants.ts  - Restaurants table
 * - schema/customers.ts     - Customers table
 * - schema/services.ts      - Services configuration
 * - schema/tables.ts        - Tables and table blocks
 * - schema/reservations.ts  - Reservations, archive, history, sessions, WhatsApp
 * - schema/voice.ts         - Call logs for voice bot
 * - schema/analytics.ts     - Daily analytics pre-calculated
 */

import { relations } from "drizzle-orm"

// Tables
export {
  restaurants,
  type Restaurant,
  type NewRestaurant,
} from "./schema/restaurants"

export {
  customers,
  type Customer,
  type NewCustomer,
} from "./schema/customers"

export {
  services,
  type Service,
  type NewService,
} from "./schema/services"

export {
  tables,
  tableBlocks,
  type Table,
  type NewTable,
  type TableBlock,
  type NewTableBlock,
} from "./schema/tables"

export {
  reservations,
  reservationsArchive,
  reservationHistory,
  reservationSessions,
  whatsappMessages,
  type Reservation,
  type NewReservation,
  type ReservationHistory,
  type NewReservationHistory,
  type ReservationSession,
  type NewReservationSession,
  type WhatsappMessage,
  type NewWhatsappMessage,
} from "./schema/reservations"

export {
  callLogs,
  type CallLog,
  type NewCallLog,
} from "./schema/voice"

export {
  dailyAnalytics,
  type DailyAnalytics,
  type NewDailyAnalytics,
} from "./schema/analytics"

// Relations (defined here to avoid circular dependencies)
import { restaurants } from "./schema/restaurants"
import { customers } from "./schema/customers"
import { services } from "./schema/services"
import { tables, tableBlocks } from "./schema/tables"
import {
  reservations,
  reservationsArchive,
  reservationHistory,
  reservationSessions,
  whatsappMessages,
} from "./schema/reservations"
import { callLogs } from "./schema/voice"
import { dailyAnalytics } from "./schema/analytics"

export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  tables: many(tables),
  services: many(services),
  reservations: many(reservations),
  reservationSessions: many(reservationSessions),
  tableBlocks: many(tableBlocks),
  callLogs: many(callLogs),
}))

export const customersRelations = relations(customers, ({ many }) => ({
  reservations: many(reservations),
}))

export const servicesRelations = relations(services, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [services.restaurantId],
    references: [restaurants.id],
  }),
  reservations: many(reservations),
}))

export const tablesRelations = relations(tables, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [tables.restaurantId],
    references: [restaurants.id],
  }),
  blocks: many(tableBlocks),
}))

export const tableBlocksRelations = relations(tableBlocks, ({ one }) => ({
  table: one(tables, {
    fields: [tableBlocks.tableId],
    references: [tables.id],
  }),
  restaurant: one(restaurants, {
    fields: [tableBlocks.restaurantId],
    references: [restaurants.id],
  }),
}))

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  customer: one(customers, {
    fields: [reservations.customerId],
    references: [customers.id],
  }),
  restaurant: one(restaurants, {
    fields: [reservations.restaurantId],
    references: [restaurants.id],
  }),
  service: one(services, {
    fields: [reservations.serviceId],
    references: [services.id],
  }),
  tables: many(tables),
  history: many(reservationHistory),
  whatsappMessages: many(whatsappMessages),
}))

export const reservationHistoryRelations = relations(reservationHistory, ({ one }) => ({
  reservation: one(reservations, {
    fields: [reservationHistory.reservationId],
    references: [reservations.id],
  }),
}))

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  reservation: one(reservations, {
    fields: [whatsappMessages.reservationId],
    references: [reservations.id],
  }),
}))

export const reservationSessionsRelations = relations(reservationSessions, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [reservationSessions.restaurantId],
    references: [restaurants.id],
  }),
}))

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

export const dailyAnalyticsRelations = relations(dailyAnalytics, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [dailyAnalytics.restaurantId],
    references: [restaurants.id],
  }),
}))
