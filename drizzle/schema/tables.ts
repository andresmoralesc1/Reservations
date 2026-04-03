import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { restaurants } from "./restaurants"

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

// Relations
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

// Types
export type Table = typeof tables.$inferSelect
export type NewTable = typeof tables.$inferInsert
export type TableBlock = typeof tableBlocks.$inferSelect
export type NewTableBlock = typeof tableBlocks.$inferInsert
