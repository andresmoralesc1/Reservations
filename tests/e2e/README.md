# Tests E2E con Playwright

Suite de pruebas End-to-End para el sistema de reservas.

## 📁 Estructura

```
tests/e2e/
├── reservations.spec.ts    # Tests del flujo de reservas (público)
├── admin.spec.ts            # Tests del panel de administración
├── auth.spec.ts             # Tests de autenticación (pendiente implementar)
├── helpers.ts               # Funciones reutilizables
└── fixtures.ts              # Fixtures personalizados de Playwright
```

## 🚀 Comandos

```bash
# Ejecutar todos los tests (headless)
npm run test:e2e

# Ejecutar con UI interactiva
npm run test:e2e:ui

# Ejecutar en modo debug (con inspector)
npm run test:e2e:debug

# Ejecutar con navegador visible
npm run test:e2e:headed

# Ver reporte HTML de la última ejecución
npm run test:e2e:report

# Ejecutar solo un archivo
npx playwright test reservations.spec.ts

# Ejecutar solo tests que coincidan con un patrón
npx playwright test --grep "reserva"

# Ejecutar en un solo navegador
npx playwright test --project=chromium
```

## 🌐 Navegadores

Los tests se ejecutan en:
- Chromium (Chrome)
- Firefox
- WebKit (Safari)
- Mobile Chrome (Android)
- Mobile Safari (iOS)

## 📊 Reportes

Después de ejecutar los tests:

```bash
# Ver reporte HTML
npm run test:e2e:report

# El reporte se genera en:
playwright-report/index.html
```

## ⚙️ Configuración

El archivo `playwright.config.ts` configura:

- **Base URL**: `http://localhost:3004` (puede cambiar con `BASE_URL` env var)
- **WebServer**: Inicia automáticamente `npm run dev`
- **Screenshots**: Se toman automáticamente cuando un test falla
- **Videos**: Se graban cuando un test falla
- **Traces**: Se capturan en el primer retry

## 🔧 Variables de Entorno

```bash
# URL base para los tests
BASE_URL=http://localhost:3004

# Credenciales para tests de auth (cuando se implemente)
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=admin123
```

## 📝 Escribiendo Tests

```typescript
import { test, expect } from "@playwright/test"
import { generateReservationData, fillReservationForm } from "./helpers"

test("mi nuevo test", async ({ page }) => {
  await page.goto("/reservar")

  const data = generateReservationData()
  await fillReservationForm(page, data)

  // ... assertions
  await expect(page.locator("h1")).toBeVisible()
})
```

## 🎯 Cobertura Actual

| Módulo | Tests | Estado |
|--------|-------|--------|
| Reservas (público) | 7 | ✅ Listo |
| Admin Dashboard | 17 | ✅ Listo |
| Autenticación | 7 | ⚠️ Pendiente implementación |

## 🐛 Debug

Para debuggear un test:

```bash
# Modo debug con breakpoint
npm run test:e2e:debug

# O agregar page.pause() en el código
test("con pause", async ({ page }) => {
  await page.goto("/")
  page.pause() // Se abre inspector
})
```

## 📱 Viewports

Tests responsive configurados:
- Desktop: 1920x1080
- Laptop: 1366x768
- Tablet: 768x1024
- Mobile: 375x667
- Mobile Large: 414x896
