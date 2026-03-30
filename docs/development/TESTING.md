# Guía de Testing

> Guía completa de testing para el Sistema de Reservas
> Framework: Vitest | Testing Library: React Testing Library

---

## 🧪 Ejecutar Tests

### Todos los tests

```bash
npm run test
```

### Modo watch (desarrollo)

```bash
npm run test -- --watch
```

### UI de Vitest

```bash
npm run test:ui
```

Abre [http://localhost:51204/__vitest__/](http://localhost:51204/__vitest__/)

### Coverage

```bash
npm run test:coverage
```

El reporte se genera en `coverage/index.html`.

---

## 📁 Estructura de Tests

```
src/__tests__/
├── setup.ts                 # Configuración global
├── mocks/                   # Mocks de BD y servicios
│   ├── db.ts
│   └── redis.ts
├── unit/                    # Tests unitarios
│   ├── lib/
│   │   ├── availability/
│   │   │   └── services-availability.test.ts
│   │   └── services/
│   │       └── legacy-service.test.ts
│   └── hooks/
└── integration/             # Tests de integración
    └── api/
        └── reservations.test.ts
```

---

## 📏️ Escribir Tests

### Test Unitario

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('MiComponente', () => {
  beforeEach(() => {
    // Setup antes de cada test
  })

  it('debería renderizar correctamente', () => {
    // Arrange
    const props = { title: 'Test' }

    // Act
    const result = miFuncion(props)

    // Assert
    expect(result).toBe('expected value')
  })
})
```

### Test de Integración API

```typescript
import { POST } from '@/app/api/reservations/route'
import { NextRequest } from 'next/server'

describe('POST /api/reservations', () => {
  it('debería crear reserva exitosamente', async () => {
    const request = new NextRequest('http://localhost:3000/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Test',
        numero: '612345678',
        fecha: '2026-04-15',
        hora: '14:00',
        invitados: 4,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.reservationCode).toBeDefined()
  })
})
```

### Test con Mocks

```typescript
import { describe, it, expect, vi } from 'vitest'
import { db } from '@/lib/db'

// Mock del módulo de BD
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      reservations: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}))

describe('con mock', () => {
  it('debería llamar a la BD', async () => {
    vi.mocked(db.query.reservations.findFirst).mockResolvedValue({
      id: 'test-id',
      name: 'Test',
    })

    const result = await db.query.reservations.findFirst()

    expect(db.query.reservations.findFirst).toHaveBeenCalled()
    expect(result).toEqual({ id: 'test-id', name: 'Test' })
  })
})
```

---

## 🎯 Convenciones

### Nomenclatura de archivos

```
nombre-del-componente.test.ts
nombre-del-servicio.test.ts
api/route-name.test.ts
```

### Descripciones de tests

```typescript
✅ BUEN:
it('debería retornar 404 si la reserva no existe')
it('debería validar teléfono español inválido')

❌ MAL:
it('test 1')
it('funciona')
```

### AAA Pattern

```typescript
it('calcula el total correctamente', () => {
  // Arrange (Preparar)
  const items = [{ price: 10 }, { price: 20 }]
  const expected = 30

  // Act (Actuar)
  const result = calculateTotal(items)

  // Assert (Afirmar)
  expect(result).toBe(expected)
})
```

---

## 📊 Coverage

### Objetivos

- `src/lib/`: ≥ 70%
- `src/app/api/`: ≥ 50%

### Ver coverage actual

```bash
npm run test:coverage
```

### Filtrar archivos en coverage

En `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov', 'json'],
  exclude: [
    'node_modules/',
    'src/types/',
    '**/*.d.ts',
    '**/*.config.*',
    'src/__tests__/**',
  ],
}
```

---

## 🔧 Mocks Disponibles

### Mock de Base de Datos

`src/__tests__/mocks/db.ts`

```typescript
import { mockDb, addMockCustomer, addMockReservation, addMockTable } from '@/__tests__/mocks/db'

// Usar en tests
vi.mock('@/lib/db', () => ({ db: mockDb }))
```

### Mock de Redis

`src/__tests__/mocks/redis.ts`

```typescript
import { mockRedis } from '@/__tests__/mocks/redis'

vi.mock('@/lib/redis', () => ({ redis: mockRedis }))
```

---

## 🐛 Debugging Tests

### Modo interactivo

```bash
npm run test -- --inspect-brk
```

Luego abre Chrome DevTools y conecta al debugger.

### Console.log en tests

```typescript
it('debug example', () => {
  const data = { foo: 'bar' }
  console.log('Data:', data) // Aparece en la terminal
  expect(data.foo).toBe('bar')
})
```

### Solo un test específico

```bash
npm run test -- -t "debería retornar 404"
```

### Solo un archivo

```bash
npm run test -- src/__tests__/unit/lib/availability/services-availability.test.ts
```

---

## 📝 Tests Pendientes

Antes de considerar el testing "completo", agregar:

- [ ] Tests para componentes React
- [ ] Tests para hooks personalizados
- [ ] Tests E2E con Playwright
- [ ] Tests de carga (performance)
- [ ] Tests de integración con servicios externos (WhatsApp, Twilio)

---

## 🔗 Recursos

- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
