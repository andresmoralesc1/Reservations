import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { restaurants } from "./restaurants"
import { services } from "./services"
import { customers } from "./customers"
import { tables } from "./tables"

export const reservations = pgTable("reservations", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationCode: text("reservation_code").notNull().unique(),

  // Cliente
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),

  // Reserva
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "restrict" }),
  reservationDate: text("reservation_date").notNull(), // DATE as text for timezone handling
  reservationTime: text("reservation_time").notNull(), // TIME as text
  partySize: integer("party_size").notNull(),
  tableIds: uuid("table_ids").array(),

  // Estado
  status: text("status").notNull().default("PENDIENTE"), // PENDIENTE, CONFIRMADO, CANCELADO, NO_SHOW
  source: text("source").notNull().default("IVR"), // IVR, WHATSAPP, MANUAL, WEB

  // Service info
  serviceId: uuid("service_id").references(() => services.id, { onDelete: "set null" }),
  estimatedDurationMinutes: integer("estimated_duration_minutes").default(90),
  actualEndTime: text("actual_end_time"), // HH:MM cuando realmente se liberó la mesa

  // Bloqueo de sesión
  sessionId: text("session_id").unique(),
  sessionExpiresAt: timestamp("session_expires_at"),

  // Especial
  specialRequests: text("special_requests"),
  isComplexCase: boolean("is_complex_case").default(false),

  // Audit
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
  updatedAt: timestamp("updated_at").defaultNow(),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by"), // Email o username de quien eliminó el registro
}, (table) => ({
  // Índices para rendimiento de búsquedas comunes
  dateRestaurantIdx: index("reservations_date_restaurant_idx").on(table.reservationDate, table.restaurantId),
  dateServiceIdx: index("reservations_date_service_idx").on(table.reservationDate, table.serviceId),
  statusIdx: index("reservations_status_idx").on(table.status),
  deletedAtIdx: index("reservations_deleted_at_idx").on(table.deletedAt),

  // Índices optimizados para Analíticas y Dashboard
  statusDateIdx: index("reservations_status_date_idx").on(table.status, table.reservationDate),
  codeIdx: index("reservations_code_idx").on(table.reservationCode),
  customerStatusIdx: index("reservations_customer_status_idx").on(table.customerId, table.status),
  sourceDateIdx: index("reservations_source_date_idx").on(table.source, table.reservationDate),
}))

// Archivo de reservas históricas
export const reservationsArchive = pgTable("reservations_archive", {
  id: uuid("id").primaryKey(),
  reservationCode: text("reservation_code").notNull(),

  // Cliente
  customerId: uuid("customer_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),

  // Reserva
  restaurantId: uuid("restaurant_id").notNull(),
  reservationDate: text("reservation_date").notNull(),
  reservationTime: text("reservation_time").notNull(),
  partySize: integer("party_size").notNull(),
  tableIds: uuid("table_ids").array(),

  // Estado final
  status: text("status").notNull(),
  source: text("source").notNull(),

  // Service info
  serviceId: uuid("service_id"),
  estimatedDurationMinutes: integer("estimated_duration_minutes"),
  actualEndTime: text("actual_end_time"),

  // Especial
  specialRequests: text("special_requests"),
  isComplexCase: boolean("is_complex_case").default(false),

  // Timestamps originales
  createdAt: timestamp("created_at").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
  updatedAt: timestamp("updated_at").notNull(),

  // Metadatos de archivo
  archivedAt: timestamp("archived_at").notNull().defaultNow(),
  archiveReason: text("archive_reason").notNull(), // 'expired_pending', 'old_reservation', 'manual'
  daysSinceCreation: integer("days_since_creation").notNull(),
}, (table) => ({
  // Índices para búsquedas en archivo
  dateRestaurantIdx: index("reservations_archive_date_restaurant_idx").on(table.reservationDate, table.restaurantId),
  statusIdx: index("reservations_archive_status_idx").on(table.status),
  archivedAtIdx: index("reservations_archive_archived_at_idx").on(table.archivedAt),
  customerPhoneIdx: index("reservations_archive_customer_phone_idx").on(table.customerPhone),
}))

// Historial de cambios en reservas
export const reservationHistory = pgTable("reservation_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id")
    .notNull()
    .references(() => reservations.id, { onDelete: "cascade" }),
  oldStatus: text("old_status"),
  newStatus: text("new_status").notNull(),
  changedBy: text("changed_by").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
})

// Sesiones de conversación para reservas
export const reservationSessions = pgTable("reservation_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: text("session_id").notNull().unique(),
  phoneNumber: text("phone_number").notNull(),
  restaurantId: uuid("restaurant_id").references(() => restaurants.id),
  conversationState: jsonb("conversation_state").notNull().$type<{
    step: string
    data: Record<string, unknown>
  }>(),
  collectedData: jsonb("collected_data").notNull().$type<Record<string, unknown>>(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Índice para búsquedas de sesiones activas (sin WHERE en Drizzle, se filtra a nivel de app)
  expiresAtIdx: index("reservation_sessions_expires_at_idx").on(table.expiresAt),
  phoneNumberIdx: index("reservation_sessions_phone_number_idx").on(table.phoneNumber),
}))

// Mensajes de WhatsApp
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id")
    .notNull()
    .references(() => reservations.id, { onDelete: "cascade" }),
  messageId: text("message_id").notNull(),
  direction: text("direction").notNull(), // 'outbound', 'inbound'
  status: text("status").default("sent"), // 'sent', 'delivered', 'read', 'failed'
  sentAt: timestamp("sent_at").defaultNow(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
})

// Reservas fallidas para recuperación posterior
export const failedReservations = pgTable("failed_reservations", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Datos del cliente intentados
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),

  // Datos de la reserva intentada
  reservationDate: text("reservation_date").notNull(),
  reservationTime: text("reservation_time").notNull(),
  partySize: integer("party_size").notNull(),
  specialRequests: text("special_requests"),

  // Metadata del fallo
  failureReason: text("failure_reason").notNull(),
  actionAttempted: text("action_attempted").notNull(),
  restaurantId: uuid("restaurant_id"),
  sessionId: text("session_id"),
  partialData: jsonb("partial_data").$type<Record<string, unknown>>(),

  // Estado de recuperación
  recoveryStatus: text("recovery_status").notNull().default("pending"),
  recoveredAt: timestamp("recovered_at"),
  recoveredBy: text("recovered_by"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => ({
  phoneIdx: index("failed_reservations_phone_idx").on(table.customerPhone),
  statusIdx: index("failed_reservations_status_idx").on(table.recoveryStatus),
  dateIdx: index("failed_reservations_date_idx").on(table.reservationDate),
  createdAtIdx: index("failed_reservations_created_idx").on(table.createdAt),
}))

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  reservations: many(reservations),
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

// Types
export type Reservation = typeof reservations.$inferSelect
export type NewReservation = typeof reservations.$inferInsert
export type ReservationHistory = typeof reservationHistory.$inferSelect
export type NewReservationHistory = typeof reservationHistory.$inferInsert
export type ReservationSession = typeof reservationSessions.$inferSelect
export type NewReservationSession = typeof reservationSessions.$inferInsert
export type WhatsappMessage = typeof whatsappMessages.$inferSelect
export type NewWhatsappMessage = typeof whatsappMessages.$inferInsert
export type FailedReservation = typeof failedReservations.$inferSelect
export type NewFailedReservation = typeof failedReservations.$inferInsert
