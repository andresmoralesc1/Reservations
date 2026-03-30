/**
 * E2E Tests - Flujo completo de reservas
 */

import { test, expect } from "@playwright/test"

test.describe("Reservas - Flujo Principal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reservar")
  })

  test("debería cargar la página de reservas", async ({ page }) => {
    await expect(page.locator("h1, h2").filter({ hasText: /reservar/i })).toBeVisible()
  })

  test("debería mostrar el formulario de reserva", async ({ page }) => {
    // Verificar que los campos principales existen
    await expect(page.locator('input[name="name"], input[placeholder*="nombre" i]')).toBeVisible()
    await expect(page.locator('input[name="phone"], input[placeholder*="teléfono" i]')).toBeVisible()
    await expect(page.locator('input[name="date"], input[type="date"]')).toBeVisible()
  })

  test("debería validar campos requeridos", async ({ page }) => {
    // Intentar enviar formulario vacío
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    // Debería mostrar mensajes de validación
    const errorVisible = await page.locator('text=/campo.*obligatorio/i, text=/required/i').isVisible()
    expect(errorVisible).toBeTruthy()
  })

  test("flujo completo: crear reserva exitosamente", async ({ page }) => {
    // Datos de prueba
    const testData = {
      name: "Juan Pérez",
      phone: "+34612345678",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Mañana
      guests: "4",
      time: "20:00",
    }

    // Llenar formulario
    await page.fill('input[name="name"], input[placeholder*="nombre" i]', testData.name)
    await page.fill('input[name="phone"], input[placeholder*="teléfono" i]', testData.phone)
    await page.fill('input[name="date"], input[type="date"]', testData.date)

    // Seleccionar número de comensales
    const guestsInput = page.locator('input[name="guests"], input[type="number"]').first()
    if (await guestsInput.isVisible()) {
      await guestsInput.fill(testData.guests)
    }

    // Seleccionar hora si hay un selector
    const timeSelector = page.locator('[data-testid="time-selector"], .time-slots').first()
    if (await timeSelector.isVisible()) {
      await page.locator(`button:has-text("${testData.time}")`).click()
    }

    // Enviar formulario
    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    // Esperar confirmación (puede ser un modal, redirect o toast)
    await expect(page.locator('text=/confirmación|reserva.*creada|código/i').first()).toBeVisible({
      timeout: 10000,
    })
  })

  test("debería verificar disponibilidad antes de reservar", async ({ page }) => {
    // Seleccionar fecha
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
    await page.fill('input[name="date"], input[type="date"]', tomorrow)

    // Click en verificar disponibilidad
    const checkButton = page.locator('button:has-text("disponibilidad"), button:has-text("verificar")').first()

    if (await checkButton.isVisible()) {
      await checkButton.click()

      // Debería mostrar horarios disponibles o mensaje
      await expect(page.locator('.time-slots, [data-testid="available-slots], text=/no.*disponible/i').first()).toBeVisible({
        timeout: 10000,
      })
    }
  })

  test("debería mostrar error para fecha inválida", async ({ page }) => {
    // Intentar seleccionar fecha pasada
    const pastDate = new Date(Date.now() - 86400000).toISOString().split("T")[0]
    await page.fill('input[name="date"], input[type="date"]', pastDate)

    const submitButton = page.locator('button[type="submit"]').first()
    await submitButton.click()

    // Debería mostrar error de fecha inválida
    const errorVisible = await page.locator('text=/fecha.*inválida|fecha.*pasada/i').isVisible()
    expect(errorVisible).toBeTruthy()
  })
})

test.describe("Reservas - Búsqueda por Código", () => {
  test("debería buscar reserva existente por código", async ({ page }) => {
    await page.goto("/reservar")

    // Click en link de "ya tengo reserva" o similar
    const searchLink = page.locator('a:has-text("ya tengo"), a:has-text("consultar"), a:has-text("código")').first()

    if (await searchLink.isVisible()) {
      await searchLink.click()

      // Ingresar código de prueba
      const testCode = "ABC123"
      await page.fill('input[name="code"], input[placeholder*="código" i]', testCode)

      // Buscar
      await page.locator('button:has-text("buscar"), button:has-text("consultar")').click()

      // Debería mostrar resultado o error de no encontrado
      await expect(page.locator('text=/no.*encontrada|reserva.*detalles/i').first()).toBeVisible({
        timeout: 5000,
      })
    }
  })
})

test.describe("Reservas - Responsive", () => {
  test("debería funcionar en móvil", async ({ page }) => {
    // Simular viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/reservar")

    // Verificar que el formulario es usable en móvil
    await expect(page.locator('input[name="name"], input[placeholder*="nombre" i]')).toBeVisible()

    // Verificar que los botones son touch-friendly (al menos 44px de altura)
    const submitButton = page.locator('button[type="submit"]').first()
    const box = await submitButton.boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })
})
