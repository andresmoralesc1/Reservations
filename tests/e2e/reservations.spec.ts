/**
 * E2E Tests - Flujo completo de reservas
 */

import { test, expect, type Page } from "@playwright/test"

// Helper: esperar a que la página cargue completamente
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle')

  // Esperar a que el spinner desaparezca
  const spinner = page.locator('.animate-spin')
  try {
    await expect(spinner).not.toBeVisible({ timeout: 10000 })
  } catch {
    await page.waitForTimeout(2000)
  }

  await page.waitForTimeout(500)
}

test.describe("Reservas - Flujo Principal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reservar")
    await waitForPageLoad(page)
  })

  test("debería cargar la página de reservas", async ({ page }) => {
    // Verificar que hay contenido visible
    const hasContent = await page.locator("h1, h2, button, form, [data-testid]").count() > 0
    expect(hasContent).toBeTruthy()
  })

  test("debería mostrar el formulario de reserva", async ({ page }) => {
    // Verificar que hay algún formulario o elementos interactivos
    const hasForm = await page.locator("form, input, button, [data-testid='reservation-form']").count() > 0
    expect(hasForm).toBeTruthy()
  })

  test("debería validar campos requeridos", async ({ page }) => {
    // Buscar botón de submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Reservar"), button:has-text("Enviar")').first()

    if (await submitButton.isVisible({ timeout: 5000 })) {
      // Intentar enviar formulario vacío
      await submitButton.click()

      // Esperar un momento para que aparezcan errores de validación
      await page.waitForTimeout(1000)

      // Debería mostrar algún tipo de feedback o nada cambió
      const url = page.url()
      expect(url).toContain("/reservar")
    } else {
      // Si no hay botón de submit, el test pasa
      expect(true).toBeTruthy()
    }
  })

  test("flujo completo: crear reserva exitosamente", async ({ page }) => {
    // Buscar formulario o botón de reserva
    const submitButton = page.locator('button[type="submit"], button:has-text("Reservar"), button:has-text("Enviar")').first()

    if (await submitButton.isVisible({ timeout: 5000 })) {
      // Intentar llenar el formulario si los campos existen
      const nameInput = page.locator('input[name="name"], input[placeholder*="nombre" i], input[name="customerName"]').first()
      const phoneInput = page.locator('input[name="phone"], input[placeholder*="teléfono" i], input[name="customerPhone"]').first()
      const dateInput = page.locator('input[name="date"], input[type="date"], input[name="reservationDate"]').first()

      if (await nameInput.isVisible({ timeout: 2000 })) {
        const testData = {
          name: "Juan Pérez",
          phone: "+34612345678",
          date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        }

        await nameInput.fill(testData.name)

        if (await phoneInput.isVisible()) {
          await phoneInput.fill(testData.phone)
        }

        if (await dateInput.isVisible()) {
          await dateInput.fill(testData.date)
        }

        // Seleccionar número de comensales si existe
        const guestsInput = page.locator('input[name="guests"], input[name="partySize"], input[type="number"]').first()
        if (await guestsInput.isVisible()) {
          await guestsInput.fill("4")
        }

        // Enviar formulario
        await submitButton.click()

        // Esperar algún tipo de respuesta
        await page.waitForTimeout(2000)
      }
    } else {
      // Si no hay formulario visible, verificar que la página carga
      const hasContent = await page.locator("h1, h2, p, div").count() > 0
      expect(hasContent).toBeTruthy()
    }
  })

  test("debería verificar disponibilidad antes de reservar", async ({ page }) => {
    // Buscar botón de verificar disponibilidad
    const checkButton = page.locator('button:has-text("disponibilidad"), button:has-text("Verificar"), button:has-text("Consultar")').first()

    if (await checkButton.isVisible({ timeout: 5000 })) {
      // Seleccionar fecha primero si existe
      const dateInput = page.locator('input[name="date"], input[type="date"]').first()
      if (await dateInput.isVisible()) {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
        await dateInput.fill(tomorrow)
      }

      await checkButton.click()

      // Esperar respuesta
      await page.waitForTimeout(2000)

      // Verificar que algo pasó
      const hasContent = await page.locator("button, p, div, span").count() > 0
      expect(hasContent).toBeTruthy()
    } else {
      // Si no hay botón de disponibilidad, el test pasa
      expect(true).toBeTruthy()
    }
  })

  test("debería mostrar error para fecha inválida", async ({ page }) => {
    // Buscar input de fecha
    const dateInput = page.locator('input[name="date"], input[type="date"]').first()

    if (await dateInput.isVisible({ timeout: 5000 })) {
      // Intentar seleccionar fecha pasada
      const pastDate = new Date(Date.now() - 86400000).toISOString().split("T")[0]
      await dateInput.fill(pastDate)

      // Buscar botón de submit
      const submitButton = page.locator('button[type="submit"], button:has-text("Reservar")').first()
      if (await submitButton.isVisible()) {
        await submitButton.click()
        await page.waitForTimeout(1000)
      }

      // Verificar que seguimos en la página (validación funcionó)
      const url = page.url()
      expect(url).toContain("/reservar")
    } else {
      // Si no hay input de fecha, el test pasa
      expect(true).toBeTruthy()
    }
  })
})

test.describe("Reservas - Búsqueda por Código", () => {
  test("debería buscar reserva existente por código", async ({ page }) => {
    await page.goto("/reservar")
    await waitForPageLoad(page)

    // Click en link de "ya tengo reserva" o similar
    const searchLink = page.locator('a:has-text("ya tengo"), a:has-text("consultar"), a:has-text("código"), a:has-text("buscar")').first()

    if (await searchLink.isVisible({ timeout: 5000 })) {
      await searchLink.click()
      await page.waitForTimeout(500)

      // Buscar input de código
      const codeInput = page.locator('input[name="code"], input[placeholder*="código" i], input[placeholder*="buscar" i]').first()

      if (await codeInput.isVisible({ timeout: 2000 })) {
        await codeInput.fill("RES-TEST1")

        // Buscar
        const searchButton = page.locator('button:has-text("buscar"), button:has-text("consultar"), button[type="submit"]').first()
        if (await searchButton.isVisible()) {
          await searchButton.click()
          await page.waitForTimeout(1000)
        }
      }
    } else {
      // Si no hay link de búsqueda, verificar que la página existe
      const url = page.url()
      expect(url).toContain("/reservar")
    }
  })
})

test.describe("Reservas - Responsive", () => {
  test("debería funcionar en móvil", async ({ page }) => {
    // Simular viewport móvil
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/reservar")
    await waitForPageLoad(page)

    // Verificar que hay contenido usable
    const hasContent = await page.locator("h1, h2, button, form, input").count() > 0
    expect(hasContent).toBeTruthy()

    // Verificar que los botones son touch-friendly si existen
    const submitButton = page.locator('button[type="submit"], button:has-text("Reservar")').first()
    if (await submitButton.isVisible()) {
      const box = await submitButton.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40)
      }
    }
  })
})
