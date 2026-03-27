/**
 * Legacy Schema - Adaptado a las tablas existentes en Supabase
 *
 * Tablas existentes:
 * - reservas (no reservations)
 * - mesas_disponibles (no tables)
 * - info_llamadas (no call_logs)
 * - reservas_temporales (no reservation_sessions)
 */

import { pgTable, text, integer, timestamp, jsonb, bigint, index, boolean } from "drizzle-orm/pg-core"

// ============ Tabla: reservas ============
export const reservas = pgTable("reservas", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  idReserva: text("id_reserva").notNull().unique(),
  idMesa: text("id_mesa").notNull(),
  nombre: text("nombre").notNull(),
  fecha: text("fecha").notNull(), // YYYY-MM-DD
  hora: text("hora").notNull(), // HH:MM
  invitados: integer("invitados").notNull(),
  estatus: text("estatus").notNull(), // CONFIRMED, PENDING, CANCELLED, etc
  detalles: text("detalles"),
  numero: text("numero"), // teléfono
  email: text("email"),
  fuente: text("fuente"), // WEB, WHATSAPP, VOICE, MANUAL
  restaurante: text("restaurante"),
  observaciones: text("observaciones"),
  fechaConfirmacion: timestamp("fecha_confirmacion"),
  fechaCancelacion: timestamp("fecha_cancelacion"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  fechaIdx: index("reservas_fecha_idx").on(table.fecha),
  estatusIdx: index("reservas_estatus_idx").on(table.estatus),
  restauranteIdx: index("reservas_restaurante_idx").on(table.restaurante),
}))

// ============ Tabla: mesas_disponibles ============
export const mesasDisponibles = pgTable("mesas_disponibles", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  idMesa: text("id_mesa").notNull().unique(),
  numero: text("numero").notNull(), // número de mesa
  capacidad: integer("capacidad").notNull(),
  ubicacion: text("ubicacion"), // interior, terraza, patio
  restaurante: text("restaurante"),
  activa: boolean("activa").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

// ============ Tabla: info_llamadas ============
export const infoLlamadas = pgTable("info_llamadas", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  idLlamada: text("id_llamada"),
  resId: text("res_id"), // ID de reserva asociada
  telefono: text("telefono"),
  fechaLlamada: timestamp("fecha_llamada"),
  duracionLlamada: text("duracion_llamada"), // numeric stored as text
  motivoFinalizacion: text("motivo_finalizacion"), // completed, hangup, error
  peticionesAdicionales: text("peticiones_adicionales"),
  costeLlamada: text("coste_llamada"), // numeric stored as text
  restaurante: text("restaurante"),
  resultado: text("resultado"),
  accionesRealizadas: jsonb("acciones_realizadas"),
  createdAt: timestamp("created_at").defaultNow(),
})

// ============ Tabla: reservas_temporales ============
export const reservasTemporales = pgTable("reservas_temporales", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  sessionId: text("session_id").notNull().unique(),
  telefono: text("telefono").notNull(),
  restaurante: text("restaurante"),
  collectedData: jsonb("collected_data"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
})

// ============ Tipos TypeScript ============
export type Reserva = typeof reservas.$inferSelect
export type MesaDisponible = typeof mesasDisponibles.$inferSelect
export type InfoLlamada = typeof infoLlamadas.$inferSelect
export type ReservaTemporal = typeof reservasTemporales.$inferSelect
