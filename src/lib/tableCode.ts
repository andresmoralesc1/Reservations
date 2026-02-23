import { db } from "@/lib/db"
import { tables } from "@/drizzle/schema"
import { eq, sql } from "drizzle-orm"

/**
 * Genera un código de mesa único basado en la ubicación
 * Formato: {prefijo}-{número}
 * - Interior: I-1, I-2, I-3...
 * - Terraza: T-1, T-2, T-3...
 * - Patio: P-1, P-2, P-3...
 * - Otro: M-1, M-2, M-3...
 */
export async function generateTableCode(
  restaurantId: string,
  location: string | null
): Promise<string> {
  // Determinar prefijo según ubicación
  const prefixMap: Record<string, string> = {
    interior: "I",
    terraza: "T",
    patio: "P",
  }

  const prefix = location ? (prefixMap[location.toLowerCase()] || "M") : "M"

  // Buscar el último número usado para este prefijo en este restaurante
  const result = await db
    .select({ count: sql<number>`count(*)`.as("count") })
    .from(tables)
    .where(eq(tables.restaurantId, restaurantId))

  // Opción más precisa: buscar el máximo número para este prefijo específico
  const tablesWithPrefix = await db.query.tables.findMany({
    where: eq(tables.restaurantId, restaurantId),
    columns: { tableCode: true },
  })

  const prefixCodes = tablesWithPrefix
    .map((t) => t.tableCode)
    .filter((code) => code.startsWith(prefix + "-"))
    .map((code) => parseInt(code.split("-")[1] || "0", 10))

  const maxNumber = prefixCodes.length > 0 ? Math.max(...prefixCodes) : 0
  const nextNumber = maxNumber + 1

  return `${prefix}-${nextNumber}`
}

/**
 * Formatea el código de mesa para mostrar
 */
export function formatTableCode(tableCode: string): string {
  return tableCode
}

/**
 * Extrae la ubicación del código de mesa
 */
export function extractLocationFromCode(tableCode: string): string | null {
  const prefix = tableCode.split("-")[0]
  const locationMap: Record<string, string | null> = {
    I: "interior",
    T: "terraza",
    P: "patio",
    M: null,
  }
  return locationMap[prefix] || null
}
