/**
 * E2E Test Fixtures
 * Extensiones del Page object de Playwright
 */

import { test as base } from "@playwright/test"

type AdminFixtures = {
  adminPage: {
    gotoDashboard: () => Promise<void>
    selectDate: (date: string) => Promise<void>
    getReservationCount: () => Promise<number>
  }
}

export const test = base.extend<AdminFixtures>({
  adminPage: async ({ page }, use) => {
    const adminPage = {
      gotoDashboard: async () => {
        await page.goto("/admin")
        // TODO: Login si es necesario
      },

      selectDate: async (date: string) => {
        const dateInput = page.locator('input[type="date"]').first()
        await dateInput.fill(date)
      },

      getReservationCount: async () => {
        const rows = page.locator('table tbody tr, .reservation-item')
        return await rows.count()
      },
    }

    await use(adminPage)
  },
})

export { expect } from "@playwright/test"
