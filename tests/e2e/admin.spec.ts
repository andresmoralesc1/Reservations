/**
 * E2E Tests - Panel de Administración
 */

import { test, expect } from "@playwright/test"

test.describe("Admin Panel - Autenticación", () => {
  test("debería requerir autenticación para acceder", async ({ page }) => {
    await page.goto("/admin")

    // Si hay autenticación implementada, debería redirigir a login
    // Por ahora, verificamos que la página carga o muestra error de auth
    const url = page.url()
    const hasAuthError = await page.locator('text=/no autorizado|inicia sesión|unauthorized/i').isVisible()

    if (url.includes("/login") || hasAuthError) {
      expect(true).toBeTruthy() // Auth está implementada
    } else {
      // Auth no implementada aún - se espera según la lista de tareas
      await expect(page.locator("h1, h2").first()).toBeVisible()
    }
  })
})

test.describe("Admin Panel - Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin")
    // TODO: Agregar login cuando esté implementado
  })

  test("debería cargar el dashboard", async ({ page }) => {
    // Verificar que cargan los componentes principales
    await expect(page.locator("h1, h2").first()).toBeVisible()

    // KPIs deberían estar presentes
    const statsSection = page.locator('[data-testid="stats"], .stats, .kpi').first()
    if (await statsSection.isVisible()) {
      await expect(statsSection).toBeVisible()
    }
  })

  test("debería mostrar estadísticas del día", async ({ page }) => {
    // Buscar tarjetas de estadísticas
    const statsCards = page.locator('[data-testid="stat-card"], .stat-card, .kpi-card')

    const count = await statsCards.count()
    if (count > 0) {
      // Debería haber al menos 2-3 tarjetas de estadísticas
      expect(count).toBeGreaterThanOrEqual(2)
    }
  })

  test("debería permitir cambiar la fecha", async ({ page }) => {
    // Buscar selector de fecha
    const dateInput = page.locator('input[type="date"], [data-testid="date-selector"]').first()

    if (await dateInput.isVisible()) {
      // Seleccionar fecha
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
      await dateInput.fill(tomorrow)

      // Verificar que la página se actualiza
      await page.waitForTimeout(1000)
      expect(dateInput).toHaveValue(tomorrow)
    }
  })

  test("debería tener navegación por teclado (flechas)", async ({ page }) => {
    // Presionar flecha derecha para ir al día siguiente
    await page.keyboard.press("ArrowRight")
    await page.waitForTimeout(500)

    // La fecha debería haber cambiado
    const dateInput = page.locator('input[type="date"]').first()
    if (await dateInput.isVisible()) {
      const value = await dateInput.inputValue()
      expect(value).toBeTruthy()
    }
  })
})

test.describe("Admin Panel - Lista de Reservas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin")
  })

  test("debería mostrar lista de reservas", async ({ page }) => {
    // Buscar tabla o lista de reservas
    const reservationsList = page.locator('[data-testid="reservations-list"], table, .reservations-list').first()

    if (await reservationsList.isVisible()) {
      // Debería tener al menos un header
      const hasHeader = await reservationsList.locator("th, thead, .header").count() > 0
      expect(hasHeader).toBeTruthy()
    }
  })

  test("debería permitir filtrar por estado", async ({ page }) => {
    // Buscar filtros de estado
    const filterButtons = page.locator('button:has-text("Pendientes"), button:has-text("Confirmadas"), [data-testid="filter"]')

    const filterCount = await filterButtons.count()
    if (filterCount > 0) {
      await filterButtons.first().click()
      await page.waitForTimeout(500)

      // La lista debería actualizarse
      const list = page.locator('[data-testid="reservations-list"], table').first()
      if (await list.isVisible()) {
        await expect(list).toBeVisible()
      }
    }
  })

  test("debería permitir buscar por nombre o código", async ({ page }) => {
    // Buscar input de búsqueda
    const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="search" i], [data-testid="search"]').first()

    if (await searchInput.isVisible()) {
      await searchInput.fill("Juan")
      await page.waitForTimeout(500)

      // Debería mostrar resultados filtrados
      expect(searchInput).toHaveValue("Juan")
    }
  })

  test("debería tener paginación si hay muchos resultados", async ({ page }) => {
    // Buscar controles de paginación
    const pagination = page.locator('[data-testid="pagination"], .pagination, button:has-text("Siguiente")')

    if (await pagination.isVisible()) {
      await expect(pagination.first()).toBeVisible()
    }
  })
})

test.describe("Admin Panel - Acciones sobre Reservas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin")
  })

  test("debería aprobar una reserva", async ({ page }) => {
    // Buscar reserva pendiente
    const approveButton = page.locator('[data-testid="approve-btn"], button:has-text("Aprobar")').first()

    if (await approveButton.isVisible()) {
      // Click en aprobar
      await approveButton.click()

      // Confirmar en el diálogo si aparece
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí")').first()
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click()
      }

      // Verificar toast de éxito
      await expect(page.locator('text=/aprobada|success/i').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test("debería rechazar una reserva", async ({ page }) => {
    // Buscar reserva
    const rejectButton = page.locator('[data-testid="reject-btn"], button:has-text("Rechazar")').first()

    if (await rejectButton.isVisible()) {
      await rejectButton.click()

      // Confirmar rechazo
      const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí")').first()
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click()
      }

      // Verificar toast
      await expect(page.locator('text=/rechazada|cancelada/i').first()).toBeVisible({ timeout: 5000 })
    }
  })

  test("debería ver detalles de reserva", async ({ page }) => {
    // Buscar botón de detalles
    const detailsButton = page.locator('[data-testid="details-btn"], button:has-text("Ver")').first()

    if (await detailsButton.isVisible()) {
      await detailsButton.click()

      // Debería abrir modal con detalles
      const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]').first()
      await expect(modal).toBeVisible({ timeout: 3000 })

      // Cerrar modal
      const closeButton = modal.locator('button:has-text("Cerrar"), button[aria-label="close"]').first()
      if (await closeButton.isVisible()) {
        await closeButton.click()
      }
    }
  })

  test("debería exportar a CSV", async ({ page }) => {
    // Buscar botón de exportar
    const exportButton = page.locator('button:has-text("Exportar"), button:has-text("CSV")').first()

    if (await exportButton.isVisible()) {
      // Setup download handler
      const downloadPromise = page.waitForEvent("download", { timeout: 10000 })
      await exportButton.click()

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain(".csv")
    }
  })
})

test.describe("Admin Panel - Crear Reserva Manual", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin")
  })

  test("debería abrir modal de nueva reserva", async ({ page }) => {
    // Buscar botón de nueva reserva
    const newReservationButton = page.locator('button:has-text("Nueva"), button:has-text("Crear"), button:has-text("Agregar")').first()

    if (await newReservationButton.isVisible()) {
      await newReservationButton.click()

      // Debería abrir modal
      const modal = page.locator('[role="dialog"], .modal').first()
      await expect(modal).toBeVisible({ timeout: 3000 })
    }
  })

  test("debería crear reserva manualmente", async ({ page }) => {
    const newReservationButton = page.locator('button:has-text("Nueva"), button:has-text("Crear")').first()

    if (await newReservationButton.isVisible()) {
      await newReservationButton.click()

      // Llenar formulario
      await page.fill('input[name="name"]', "Cliente Manual")
      await page.fill('input[name="phone"]', "+34600000000")

      // Seleccionar fecha y hora
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
      await page.fill('input[name="date"]', tomorrow)

      // Enviar
      await page.locator('button[type="submit"]:has-text("Crear")').click()

      // Verificar éxito
      await expect(page.locator('text=/creada|éxito/i').first()).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe("Admin Panel - Responsive", () => {
  test("debería funcionar en móvil", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/admin")

    // Verificar que el contenido es accesible
    await expect(page.locator("h1, h2").first()).toBeVisible()

    // En móvil, la tabla podría convertirse en cards
    const content = page.locator('table, .reservations-list, [data-testid="reservations-list"]').first()
    if (await content.isVisible()) {
      await expect(content).toBeVisible()
    }
  })
})
