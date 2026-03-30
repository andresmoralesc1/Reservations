# 📋 Plan de Trabajo - Sistema de Reservas

> Basado en el análisis del estado actual (2026-03-30)
> Progreso general: ~47% completado

---

## 🎯 Objetivo del Plan

Completar los Bloques 2, 3 y 7 en las próximas 2-3 semanas, priorizando:
1. **Testing** - Confianza en el código
2. **Refactorización** - Mantenibilidad
3. **Documentación** - Onboarding del equipo

---

## 🔥 FASE 1: Completar Testing (8-10 horas)

### Tarea 1.1: Tests para availability service (3h)

**Archivo a crear:** `src/__tests__/unit/lib/availability/services-availability.test.ts`

**Tests a implementar:**
```typescript
describe('services-availability', () => {
  // 1. getActiveServicesForDate()
  test('debería retornar servicios activos para una fecha')
  test('debería retornar vacío si no hay servicios configurados')
  test('debería filtrar por día de la semana correctamente')

  // 2. getAvailableTablesForSlot()
  test('debería encontrar mesas disponibles para un slot')
  test('debería excluir mesas bloqueadas')
  test('debería excluir mesas ya reservadas en ese slot')

  // 3. checkAvailabilityWithServices()
  test('debería retornar available=true cuando hay mesas')
  test('debería retornar available=false cuando no hay mesas')
  test('debería sugerir horarios alternativos')
  test('debería manejar correctamente partySize grande (unir mesas)')

  // 4. Edge cases
  test('debería manejar fecha en el pasado')
  test('debería manejar partySize mayor que capacidad máxima')
  test('debería manejar servicio no encontrado')
})
```

**Archivos a leer:**
- `src/lib/availability/services-availability.ts`
- `drizzle/schema.ts`

---

### Tarea 1.2: Tests para legacy service (3h)

**Archivo a crear:** `src/__tests__/unit/lib/services/legacy-service.test.ts`

**Tests a implementar:**
```typescript
describe('legacy-service', () => {
  // 1. createLegacyReservation()
  test('debería crear reserva con nuevos datos')
  test('debería crear cliente si no existe')
  test('debería asignar mesa automáticamente si no se especifica')
  test('debería generar código de reserva único')

  // 2. getLegacyReservation()
  test('debería obtener reserva por código')
  test('debería retornar null si código no existe')
  test('debería incluir relaciones (customer, restaurant)')

  // 3. cancelLegacyReservation()
  test('debería cancelar reserva con teléfono correcto')
  test('debería rechazar si teléfono no coincide')
  test('debería registrar en reservation_history')

  // 4. checkLegacyAvailability()
  test('debería verificar disponibilidad correctamente')
  test('debería retornar mesas sugeridas')

  // 5. Error cases
  test('debería manejar errores de BD')
  test('debería validar inputs inválidos')
})
```

---

### Tarea 1.3: Tests de integración API (2h)

**Archivos a crear:**
```
src/__tests__/integration/api/
├── reservations.test.ts
└── check-availability.test.ts
```

**Tests para reservations.test.ts:**
```typescript
describe('POST /api/reservations', () => {
  test('debería crear reserva exitosamente (201)')
  test('debería validar campos requeridos (400)')
  test('debería validar teléfono español inválido (400)')
  test('debería validar fecha pasada (400)')
  test('debería validar partySize fuera de rango (400)')
})

describe('GET /api/reservations/code/[code]', () => {
  test('debería retornar reserva si existe (200)')
  test('debería retornar 404 si código no existe')
})

describe('DELETE /api/reservations/[id]', () => {
  test('debería cancelar reserva (200)')
  test('debería retornar 404 si reserva no existe')
})
```

**Meta:** Alcanzar 70% coverage en `src/lib/` y 50% en `src/app/api/`

---

## 🔧 FASE 2: Refactorizar legacy-service (4-5 horas)

### Tarea 2.1: Dividir legacy-service en módulos

**Estructura objetivo:**
```
src/lib/services/legacy/
├── index.ts                    # Export principal, backward compatible
├── creators.ts                 # createLegacyReservation
├── finders.ts                  # getLegacyReservation, listLegacyReservations
├── cancelers.ts                # cancelLegacyReservation
├── checkers.ts                 # checkLegacyAvailability
├── validators.ts               # Validaciones
└── types.ts                    # Tipos internos del módulo
```

**Contenido de cada módulo:**

**`creators.ts`** (~100 líneas)
```typescript
export async function createLegacyReservation(params: {
  nombre: string
  numero: string
  fecha: string
  hora: string
  invitados: number
  // ...
}): Promise<Result>
```

**`finders.ts`** (~80 líneas)
```typescript
export async function getLegacyReservation(code: string)
export async function listLegacyReservations(filters: Filters)
```

**`cancelers.ts`** (~60 líneas)
```typescript
export async function cancelLegacyReservation(code: string, phone: string)
```

**`checkers.ts`** (~100 líneas)
```typescript
export async function checkLegacyAvailability(params)
```

**`validators.ts`** (~80 líneas)
```typescript
export function validateReservationData(data)
export function validatePhoneNumber(phone)
export function validatePartySize(size)
```

**`index.ts`** (backward compatibility)
```typescript
// Re-exportar todo para backward compatibility
export * from './creators'
export * from './finders'
export * from './cancelers'
export * from './checkers'
export * from './validators'
export * from './types'
```

---

## 💾 FASE 3: Base de Datos (3-4 horas)

### Tarea 3.1: Soft Delete (2h)

**1. Crear migración Drizzle:**
```bash
npm run db:generate
```

**Archivo:** `drizzle/0003_soft_delete.sql`
```sql
-- Reservations
ALTER TABLE reservations ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE reservations ADD COLUMN deleted_by UUID;

-- Tables
ALTER TABLE tables ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE tables ADD COLUMN deleted_by UUID;

-- Services
ALTER TABLE services ADD COLUMN deleted_at TIMESTAMP;

-- Índices
CREATE INDEX reservations_deleted_at ON reservations(deleted_at);
CREATE INDEX tables_deleted_at ON tables(deleted_at);
```

**2. Actualizar queries en legacy-service.ts:**
```typescript
// Por defecto, excluir deleted
.where(isNull(reservations.deletedAt))
```

---

### Tarea 3.2: CHECK Constraints (1h)

**Archivo:** `drizzle/0004_constraints.sql`
```sql
-- Validar party size
ALTER TABLE reservations ADD CONSTRAINT reservations_party_size_check
  CHECK (party_size >= 1 AND party_size <= 50);

-- Validar capacity de mesas
ALTER TABLE tables ADD CONSTRAINT tables_capacity_check
  CHECK (capacity >= 1 AND capacity <= 20);

-- Validar duración de servicio
ALTER TABLE services ADD CONSTRAINT services_duration_check
  CHECK (default_duration_minutes >= 30 AND default_duration_minutes <= 240);

-- Validar hora
ALTER TABLE reservations ADD CONSTRAINT reservations_time_check
  CHECK (reservation_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$');
```

---

### Tarea 3.3: Docs de Schema (1h)

**Crear:** `docs/database-schema.md`

**Contenido:**
- Diagrama de entidades (texto o mermaid)
- Descripción de cada tabla
- Relaciones entre tablas
- Índices y su propósito
- Constraints y validaciones
- Ejemplos de queries comunes

---

## 📚 FASE 4: Documentación (4-5 horas)

### Tarea 4.1: API Docs (3h)

**Estructura:**
```
docs/api/
├── README.md                   # Índice de la API
├── reservations/
│   ├── POST-create.md         # Crear reserva
│   ├── GET-list.md            # Listar reservas
│   ├── GET-by-code.md         # Buscar por código
│   ├── DELETE-cancel.md       # Cancelar reserva
│   └── POST-check-availability.md
├── admin/
│   ├── GET-dashboard-stats.md  # Estadísticas dashboard
│   ├── POST-approve.md        # Aprobar reserva
│   └── PUT-table.md           # Actualizar mesa
└── schemas/
    └── reservation.md         # Esquema de Reservation
```

**Formato de cada doc:**
```markdown
# POST /api/reservations

Crea una nueva reserva en el sistema.

## Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "customerName": "Carlos García",
  "customerPhone": "+34 612 345 678",
  "date": "2026-04-01",
  "time": "20:00",
  "partySize": 4
}
```

## Response
### 201 Created
```json
{
  "reservationCode": "RES-A1B2C",
  "status": "PENDIENTE",
  "message": "Reserva creada exitosamente"
}
```

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": { "customerPhone": ["Teléfono inválido"] }
}
```
```

---

### Tarea 4.2: Development Docs (2h)

**Crear:**

**`docs/development/SETUP.md`**
```markdown
# Setup de Desarrollo

## Prerrequisitos
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

## Instalación
1. Clonar repositorio
2. cp .env.example .env.local
3. npm install
4. docker-compose up -d
5. npm run db:push
6. npm run dev
```

**`docs/development/TESTING.md`**
```markdown
# Guía de Testing

## Ejecutar tests
npm run test              # Todos los tests
npm run test:ui          # UI de Vitest
npm run test:coverage    # Reporte de cobertura

## Escribir tests
- Unit tests en src/__tests__/unit/
- Integration tests en src/__tests__/integration/
- Usar mocks de DB y Redis
```

---

## 📋 Orden de Ejecución Recomendado

### Semana 1: Testing + Refactorización

| Día | Tarea | Horas |
|-----|-------|-------|
| 1 | Tests availability service | 3h |
| 2 | Tests legacy service | 3h |
| 3 | Tests integración API | 2h |
| 4 | Refactorizar legacy-service | 3h |
| 5 | Soft delete en BD | 2h |

### Semana 2: Base de Datos + Documentación

| Día | Tarea | Horas |
|-----|-------|-------|
| 1 | CHECK constraints | 1h |
| 2 | Docs de schema BD | 1h |
| 3 | API Docs (reservations) | 2h |
| 4 | API Docs (admin) | 2h |
| 5 | SETUP.md + TESTING.md | 2h |

---

## 🎯 Checklist de Completación

### FASE 1: Testing
- [ ] `services-availability.test.ts` creado con 8+ tests
- [ ] `legacy-service.test.ts` creado con 10+ tests
- [ ] `reservations.test.ts` (integración) creado
- [ ] `check-availability.test.ts` (integración) creado
- [ ] Coverage: 70% en src/lib/, 50% en src/app/api/

### FASE 2: Refactorización
- [ ] `src/lib/services/legacy/` creado con 6 módulos
- [ ] `legacy-service.ts` original eliminado o reducido a exports
- [ ] Todos los imports actualizados
- [ ] Tests pasan después de refactor

### FASE 3: Base de Datos
- [ ] Migración soft_delete ejecutada
- [ ] Migración constraints ejecutada
- [ ] `docs/database-schema.md` creado
- [ ] Queries actualizadas para excluir deleted

### FASE 4: Documentación
- [ ] `docs/api/` creado con 5+ endpoints documentados
- [ ] `docs/development/SETUP.md` creado
- [ ] `docs/development/TESTING.md` creado

---

## 🚀 Comandos Útiles

```bash
# Testing
npm run test                  # Ejecutar todos
npm run test -- --coverage   # Con cobertura
npm run test:ui              # Interfaz gráfica

# Base de Datos
npm run db:generate          # Generar migración
npm run db:push              # Aplicar cambios
npm run db:studio            # Abrir UI

# Desarrollo
npm run dev                  # Servidor dev
npm run build               # Build producción
```

---

## 📌 Archivos Clave para Empezar

| Archivo | Estado | Prioridad |
|---------|--------|----------|
| `src/lib/availability/services-availability.ts` | ✅ Existe (14KB) | Alta |
| `src/lib/services/legacy-service.ts` | ✅ Existe (312 líneas) | Alta |
| `src/__tests__/unit/` | ✅ Existen mocks | Alta |
| `drizzle/schema.ts` | ✅ Completo | Media |
| `docs/ROADMAP.md` | ✅ Actualizado | - |

---

**Última actualización:** 2026-03-30
**Estado actual:** 47% completado
**Meta:** Alcanzar 75% en 2 semanas
