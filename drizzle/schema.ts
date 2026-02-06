import { pgTable, uuid, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core"

export const restaurants = pgTable("restaurants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  timezone: text("timezone").default("America/Bogota"),
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
})

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
})

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
})

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

export type Restaurant = typeof restaurants.$inferSelect
export type NewRestaurant = typeof restaurants.$inferInsert
export type Table = typeof tables.$inferSelect
export type NewTable = typeof tables.$inferInsert
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
