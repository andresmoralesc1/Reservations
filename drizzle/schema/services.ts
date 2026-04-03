import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { restaurants } from "./restaurants"

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

// Note: servicesRelations is defined in schema/index.ts to include reservations
// Types
export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
