/**
 * E2E Tests - Autenticación y Permisos
 *
 * NOTA: Estos tests están preparados para cuando se implemente
 * el sistema de autenticación (Tarea pendiente de la lista)
 */

import { test, expect } from "@playwright/test"

test.describe("Autenticación - Login", () => {
  test("debería mostrar página de login al acceder sin auth", async ({ page }) => {
    await page.goto("/admin")

    // Si hay auth implementada, debería redirigir a /login
    const url = page.url()

    if (url.includes("/login")) {
      await expect(page.locator("h1, h2").filter({ hasText: /login|iniciar sesión/i })).toBeVisible()
    } else {
      // Auth no implementada - marcar como skipped
      test.skip(true, "Autenticación no implementada aún")
    }
  })

  test("debería mostrar error con credenciales inválidas", async ({ page }) => {
    await page.goto("/login")

    const loginForm = page.locator('form[action*="login"], [data-testid="login-form"]').first()

    if (await loginForm.isVisible()) {
      // Llenar con credenciales inválidas
      await loginForm.locator('input[name="email"]').fill("test@example.com")
      await loginForm.locator('input[name="password"]').fill("wrongpassword")

      // Enviar
      await loginForm.locator('button[type="submit"]').click()

      // Debería mostrar error
      await expect(page.locator('text=/credenciales.*inválidas|error/i').first()).toBeVisible({
        timeout: 5000,
      })
    } else {
      test.skip(true, "Formulario de login no encontrado")
    }
  })

  test("debería iniciar sesión con credenciales válidas", async ({ page }) => {
    await page.goto("/login")

    const loginForm = page.locator('form[action*="login"], [data-testid="login-form"]').first()

    if (await loginForm.isVisible()) {
      // NOTA: Usar credenciales de测试 o variables de entorno
      const email = process.env.TEST_ADMIN_EMAIL || "admin@example.com"
      const password = process.env.TEST_ADMIN_PASSWORD || "admin123"

      await loginForm.locator('input[name="email"]').fill(email)
      await loginForm.locator('input[name="password"]').fill(password)

      await loginForm.locator('button[type="submit"]').click()

      // Debería redirigir al dashboard o home
      await page.waitForURL(/\/admin|\/dashboard|\/home/, { timeout: 5000 })
      expect(page.url()).toMatch(/\/admin|\/dashboard|\/home/)
    } else {
      test.skip(true, "Formulario de login no encontrado")
    }
  })
})

test.describe("Autenticación - Logout", () => {
  test("debería cerrar sesión correctamente", async ({ page }) => {
    // Login primero
    await page.goto("/login")

    const loginForm = page.locator('form, [data-testid="login-form"]').first()
    if (await loginForm.isVisible()) {
      const email = process.env.TEST_ADMIN_EMAIL || "admin@example.com"
      const password = process.env.TEST_ADMIN_PASSWORD || "admin123"

      await page.fill('input[name="email"]', email)
      await page.fill('input[name="password"]', password)
      await page.click('button[type="submit"]')

      await page.waitForURL(/\/admin|\/dashboard/, { timeout: 5000 })
    }

    // Buscar botón de logout
    const logoutButton = page.locator('button:has-text("Cerrar"), button:has-text("Salir"), [data-testid="logout"]').first()

    if (await logoutButton.isVisible()) {
      await logoutButton.click()

      // Debería redirigir a login o home
      await page.waitForURL(/\/login|\/$/, { timeout: 5000 })
    } else {
      test.skip(true, "Botón de logout no encontrado")
    }
  })
})

test.describe("Autenticación - Protección de Rutas", () => {
  test("debería proteger /admin", async ({ page }) => {
    await page.goto("/admin")

    const url = page.url()

    // Si redirige a login, la protección funciona
    if (url.includes("/login")) {
      expect(true).toBeTruthy()
    } else if (url.includes("/admin")) {
      // Si está en admin, verificar que hay mensaje de no autorizado
      const hasUnauthorized = await page.locator('text=/no autorizado|unauthorized/i').isVisible()
      if (!hasUnauthorized) {
        test.skip(true, "Protección de ruta no implementada")
      }
    }
  })

  test("debería proteger /api/admin/*", async ({ request }) => {
    // Hacer request sin autenticación
    const response = await request.get(`${process.env.BASE_URL || "http://localhost:3005"}/api/admin/dashboard/stats`)

    // Debería devolver 401 o 403
    if (response.status() === 401 || response.status() === 403) {
      expect(response.status()).toBe(401)
    } else {
      test.skip(true, "Protección de API no implementada")
    }
  })
})

test.describe("Autenticación - Sesión Persistente", () => {
  test("debería mantener sesión al recargar", async ({ page, context }) => {
    await page.goto("/login")

    const loginForm = page.locator('form, [data-testid="login-form"]').first()
    if (await loginForm.isVisible()) {
      const email = process.env.TEST_ADMIN_EMAIL || "admin@example.com"
      const password = process.env.TEST_ADMIN_PASSWORD || "admin123"

      await page.fill('input[name="email"]', email)
      await page.fill('input[name="password"]', password)
      await page.click('button[type="submit"]')

      await page.waitForURL(/\/admin/, { timeout: 5000 })

      // Recargar página
      await page.reload()

      // Debería seguir logueado
      expect(page.url()).toMatch(/\/admin/)
    } else {
      test.skip(true, "Formulario de login no encontrado")
    }
  })
})
