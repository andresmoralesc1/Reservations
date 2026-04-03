import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

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

// Relations will be defined in reservations.ts to avoid circular dependencies
// export const customersRelations = relations(customers, ({ many }) => ({
//   reservations: many(reservations),
// }))

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
