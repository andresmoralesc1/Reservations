/**
 * Generate a consistent table code with location prefix
 * Format: {LOCATION_PREFIX}-{TABLE_NUMBER}
 * Examples: I-1, T-1, P-1, B-1
 */
export function generateTableCode(location: string | null, tableNumber: string): string {
  const prefixes: Record<string, string> = {
    interior: "I",
    terraza: "T",
    patio: "P",
    barra: "B",
  }

  const prefix = prefixes[location || ""] || "X"
  return `${prefix}-${tableNumber}`
}

/**
 * Extract location prefix from table code
 * Returns: I, T, P, B or X for unknown
 */
export function getLocationPrefixFromCode(tableCode: string): string {
  const match = tableCode.match(/^([A-Z])-\d+$/)
  return match ? match[1] : "X"
}

/**
 * Get full location name from prefix
 */
export function getLocationNameFromPrefix(prefix: string): string {
  const names: Record<string, string> = {
    I: "Interior",
    T: "Terraza",
    P: "Patio",
    B: "Barra",
    X: "Sin ubicación",
  }
  return names[prefix] || "Sin ubicación"
}

/**
 * Get location key from prefix (inverse of generateTableCode)
 */
export function getLocationKeyFromPrefix(prefix: string): string {
  const keys: Record<string, string> = {
    I: "interior",
    T: "terraza",
    P: "patio",
    B: "barra",
  }
  return keys[prefix] || ""
}
