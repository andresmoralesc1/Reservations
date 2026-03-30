import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  timezone: text("timezone").default("Europe/Madrid"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export const tables = pgTable("tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  tableNumber: text("table_number").notNull(),
  tableCode: text("table_code").notNull(), // I-1, I-2, T-1, T-2, P-1, P-2
  capacity: integer("capacity").notNull(),
  location: text("location"), // 'patio', 'interior', 'terraza'
  isAccessible: boolean("is_accessible").default(false),

  // Visual layout fields
  shape: text("shape").notNull().default("rectangular"), // 'circular', 'cuadrada', 'rectangular', 'barra'
  positionX: integer("position_x").default(0), // Posición X en el canvas (px)
  positionY: integer("position_y").default(0), // Posición Y en el canvas (px)
  rotation: integer("rotation").default(0), // Rotación en grados (0-360)
  width: integer("width").default(100), // Ancho en px (para rectangular/cuadrada/barra)
  height: integer("height").default(80), // Alto en px (para rectangular/cuadrada)
  diameter: integer("diameter").default(80), // Diámetro en px (para circular)
  stoolCount: integer("stool_count").default(0), // Número de sillas (para barra)
  stoolPositions: jsonb("stool_positions").$type<number[]>(), // Posiciones de sillas en barra

  createdAt: timestamp("created_at").defaultNow(),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by"), // Email o username de quien eliminó el registro
}, (table) => ({
  // Índice único para código de mesa por restaurante
  tableCodeIdx: index("tables_table_code_idx").on(table.tableCode, table.restaurantId),
  deletedAtIdx: index("tables_deleted_at_idx").on(table.deletedAt),
}))

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // Configuración básica
  name: text("name").notNull(), // "Comida Invierno - Semana"
  description: text("description"),
  isActive: boolean("is_active").default(true),

  // Tipo de servicio (comida o cena)
  serviceType: text("service_type").notNull(), // 'comida', 'cena'

  // Temporada y días
  season: text("season").notNull().default("todos"), // 'invierno', 'primavera', 'verano', 'otoño', 'todos'
  dayType: text("day_type").notNull().default("all"), // 'weekday', 'weekend', 'all'

  // Horario del servicio
  startTime: text("start_time").notNull(), // '13:00' (comida) o '20:00' (cena)
  endTime: text("end_time").notNull(),   // '16:00' (comida) o '23:00' (cena)

  // Configuración de turnos
  defaultDurationMinutes: integer("default_duration_minutes").notNull().default(90),
  bufferMinutes: integer("buffer_minutes").notNull().default(15),
  slotGenerationMode: text("slot_generation_mode").notNull().default("auto"), // 'auto', 'manual'

  // Rango de fechas (opcional, para temporadas específicas)
  dateRange: jsonb("date_range").$type<{
    start: string // YYYY-MM-DD
    end: string // YYYY-MM-DD
  }>(),

  // Turnos manuales (si slotGenerationMode = 'manual')
  manualSlots: jsonb("manual_slots").$type<string[]>(), // ['13:00', '14:30', '15:00']

  // Mesas disponibles en este service (null = todas las mesas del restaurant)
  availableTableIds: jsonb("available_table_ids").$type<string[]>(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),

  // Soft Delete
  deletedAt: timestamp("deleted_at"),
  deletedBy: text("deleted_by"), // Email o username de quien eliminó el registro
}, (table) => ({
  // Índices para rendimiento
  restaurantIdx: index("services_restaurant_idx").on(table.restaurantId),
  activeIdx: index("services_active_idx").on(table.isActive),
  serviceTypeIdx: index("services_service_type_idx").on(table.serviceType),
  // Prevenir services solapados para mismo restaurant, día y hora
  uniqueService: unique().on(table.restaurantId, table.dayType, table.startTime),
  deletedAtIdx: index("services_deleted_at_idx").on(table.deletedAt),
}))

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  phoneNumber: text("phone_number").notNull().unique(),
  name: text("name"),
  noShowCount: integer("no_show_count").default(0),
  tags: text("tags").array(),
  gdprConsentedAt: timestamp("gdpr_consented_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

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

export const tableBlocks = pgTable("table_blocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  tableId: uuid("table_id")
    .notNull()
    .references(() => tables.id, { onDelete: "cascade" }),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),
  blockDate: text("block_date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM
  reason: text("reason").notNull(), // 'mantenimiento', 'evento_privado', 'reservado', 'otro'
  notes: text("notes"), // Notas adicionales
  createdBy: text("created_by").notNull(), // 'admin', 'system'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Índices para búsquedas eficientes
  tableIdx: index("table_blocks_table_idx").on(table.tableId),
  restaurantDateIdx: index("table_blocks_restaurant_date_idx").on(table.restaurantId, table.blockDate),
}))

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

export type Restaurant = typeof restaurants.$inferSelect
export type NewRestaurant = typeof restaurants.$inferInsert
export type Table = typeof tables.$inferSelect
export type NewTable = typeof tables.$inferInsert
export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
export type Reservation = typeof reservations.$inferSelect
export type NewReservation = typeof reservations.$inferInsert
export type ReservationHistory = typeof reservationHistory.$inferSelect
export type NewReservationHistory = typeof reservationHistory.$inferInsert
export type ReservationSession = typeof reservationSessions.$inferSelect
export type NewReservationSession = typeof reservationSessions.$inferInsert
export type WhatsappMessage = typeof whatsappMessages.$inferSelect
export type NewWhatsappMessage = typeof whatsappMessages.$inferInsert
export type TableBlock = typeof tableBlocks.$inferSelect
export type NewTableBlock = typeof tableBlocks.$inferInsert
export type CallLog = typeof callLogs.$inferSelect
export type NewCallLog = typeof callLogs.$inferInsert

// Drizzle Relations
export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  tables: many(tables),
  services: many(services),
  reservations: many(reservations),
  reservationSessions: many(reservationSessions),
  tableBlocks: many(tableBlocks),
  callLogs: many(callLogs),
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
