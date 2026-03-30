/**
 * E2E Test Helpers
 * Funciones reutilizables para los tests
 */

import { Page, Locator } from "@playwright/test"

/**
 * Genera datos de prueba para una reserva
 */
export function generateReservationData(override?: Partial<ReservationData>): ReservationData {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]

  return {
    name: "Test User",
    phone: "+34612345678",
    date: tomorrow,
    time: "20:00",
    guests: 4,
    ...override,
  }
}

export interface ReservationData {
  name: string
  phone: string
  date: string
  time: string
  guests: number
}

/**
 * Llena el formulario de reserva con los datos proporcionados
 */
export async function fillReservationForm(
  page: Page,
  data: ReservationData
): Promise<void> {
  // Nombre
  const nameInput = page.locator('input[name="name"], input[placeholder*="nombre" i]').first()
  if (await nameInput.isVisible()) {
    await nameInput.fill(data.name)
  }

  // Teléfono
  const phoneInput = page.locator('input[name="phone"], input[placeholder*="teléfono" i]').first()
  if (await phoneInput.isVisible()) {
    await phoneInput.fill(data.phone)
  }

  // Fecha
  const dateInput = page.locator('input[name="date"], input[type="date"]').first()
  if (await dateInput.isVisible()) {
    await dateInput.fill(data.date)
  }

  // Comensales
  const guestsInput = page.locator('input[name="guests"], input[type="number"]').first()
  if (await guestsInput.isVisible()) {
    await guestsInput.fill(String(data.guests))
  }

  // Hora (si hay selector)
  const timeButton = page.locator(`button:has-text("${data.time}")`).first()
  if (await timeButton.isVisible()) {
    await timeButton.click()
  }
}

/**
 * Envía el formulario de reserva
 */
export async function submitReservationForm(page: Page): Promise<void> {
  const submitButton = page.locator('button[type="submit"], button:has-text("Reservar"), button:has-text("Enviar")').first()
  await submitButton.click()
}

/**
 * Espera a que aparezca un toast de éxito
 */
export async function waitForSuccessToast(page: Page, timeout: number = 5000): Promise<void> {
  await page.locator('text=/éxito|confirmada|creada|success/i').first().waitFor({ state: "visible", timeout })
}

/**
 * Espera a que aparezca un mensaje de error
 */
export async function waitForErrorMessage(page: Page, timeout: number = 5000): Promise<void> {
  await page.locator('text=/error|incorrecto|inválido/i').first().waitFor({ state: "visible", timeout })
}

/**
 * Login en el panel de admin (cuando esté implementado)
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/admin")

  const url = page.url()
  if (!url.includes("/login")) {
    return // Ya está logueado o no hay auth
  }

  const email = process.env.TEST_ADMIN_EMAIL || "admin@example.com"
  const password = process.env.TEST_ADMIN_PASSWORD || "admin123"

  await page.fill('input[name="email"], input[type="email"]', email)
  await page.fill('input[name="password"], input[type="password"]', password)
  await page.click('button[type="submit"]')

  await page.waitForURL(/\/admin|\/dashboard/, { timeout: 5000 })
}

/**
 * Selecciona una fecha en el date picker del admin
 */
export async function selectAdminDate(page: Page, date: string): Promise<void> {
  const dateInput = page.locator('input[type="date"], [data-testid="date-selector"]').first()

  if (await dateInput.isVisible()) {
    await dateInput.fill(date)
    await page.waitForTimeout(500) // Esperar recarga de datos
  }
}

/**
 * Cuenta el número de reservas en la lista
 */
export async function getReservationCount(page: Page): Promise<number> {
  const list = page.locator('[data-testid="reservations-list"], table tbody tr, .reservation-item')

  if (await list.isVisible()) {
    return await list.count()
  }

  return 0
}

/**
 * Verifica que una reserva con ciertos datos existe en la lista
 */
export async function reservationExists(page: Page, data: Partial<ReservationData>): Promise<boolean> {
  const rows = page.locator('[data-testid="reservations-list"] tr, table tbody tr, .reservation-item')

  if (!(await rows.isVisible())) {
    return false
  }

  const count = await rows.count()

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i)
    const text = await row.textContent()

    if (data.name && text?.includes(data.name)) return true
    if (data.phone && text?.includes(data.phone)) return true
    if (data.time && text?.includes(data.time)) return true
  }

  return false
}

/**
 * Genera un código de reserva único para testing
 */
export function generateTestCode(): string {
  return `TEST${Date.now().toString(36).toUpperCase()}`
}

/**
 * Fechas helper
 */
export const dates = {
  today: () => new Date().toISOString().split("T")[0],
  tomorrow: () => new Date(Date.now() + 86400000).toISOString().split("T")[0],
  nextWeek: () => new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  yesterday: () => new Date(Date.now() - 86400000).toISOString().split("T")[0],
  inDays: (n: number) => new Date(Date.now() + n * 86400000).toISOString().split("T")[0],
}

/**
 * Espera a que desaparezca un loader/spinner
 */
export async function waitForLoader(page: Page): Promise<void> {
  const loader = page.locator('.loader, .spinner, [role="progressbar"], [data-testid="loading"]')

  if (await loader.isVisible({ timeout: 1000 }).catch(() => false)) {
    await loader.waitFor({ state: "hidden", timeout: 10000 })
  }
}

/**
 * Toma screenshot con nombre automático
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `screenshots/${name}-${Date.now()}.png`,
    fullPage: true,
  })
}

/**
 * Configuración de viewports comunes
 */
export const viewports = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
  "mobile-large": { width: 414, height: 896 },
}
