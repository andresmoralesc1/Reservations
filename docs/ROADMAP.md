# 🚀 ROADMAP - Sistema de Reservas

> Última actualización: 2026-03-30
> Estado: Proyecto activo en desarrollo

---

## 📊 Estado Actual del Proyecto

### Stack Tecnológico
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **BD**: PostgreSQL 16, Drizzle ORM
- **Cache**: Redis 7
- **Auth**: Supabase Auth (configurado)
- **Testing**: Vitest, Testing Library
- **Voz**: Pipecat, Cartesia, OpenAI (integrado)

### Métricas Actuales
- **72 tests** unitarios pasando
- **0 errores** TypeScript (strict mode)
- **30+ componentes** Core reutilizables
- **6 páginas** Admin completadas
- **25+ endpoints** API

---

## ✅ BLOQUE 1: Fundamentos - COMPLETADO

### Tarea 1.1: Configuración y Environment ✅
- [x] Variables de entorno configuradas
- [x] Estructura de tipos compartida
- [x] Schema Drizzle completo
- [x] Cliente Redis configurado

### Tarea 1.2: Type Safety ✅
- [x] `strict: true` en tsconfig.json
- [x] Schemas Zod para validación
- [x] Type guards en voz/services
- [x] 0 errores TypeScript

### Tarea 1.3: Testing Setup ✅
- [x] Vitest configurado
- [x] Mocks de DB y Redis
- [x] Setup file para tests
- [x] Scripts de test configurados

**Archivos creados:**
```
src/__tests__/
├── mocks/
│   ├── db.ts              # Mock Drizzle
│   └── redis.ts           # Mock Redis
├── setup.ts               # Configuración global
└── unit/
    ├── hooks/
    │   └── useFilters.test.ts
    └── lib/voice/
        ├── phone-utils.test.ts    (17 tests)
        ├── voice-auth.test.ts     (11 tests)
        └── voice-service.test.ts  (18 tests)
```

---

## 🔨 BLOQUE 2: Refactorización - **80% COMPLETADO**

### Tarea 2.1: Refactorizar admin/page.tsx ✅ **COMPLETADO**

**Estado**: page.tsx reducido de 592 → 304 líneas

**Archivos creados:**
```
src/app/admin/
├── components/
│   ├── AdminStats.tsx         # KPIs y tarjetas
│   ├── AdminCharts.tsx        # Gráficos
│   ├── ReservationsList.tsx   # Lista principal
│   ├── FilterBar.tsx          # Filtros avanzados
│   ├── ActionBar.tsx          # Acciones masivas
│   └── PageHeader.tsx         # Header de página
└── hooks/
    ├── useAdminStats.ts       # Data fetching KPIs
    ├── useReservations.ts     # Reservations logic
    └── useFilters.ts          # Filter logic
```

### Tarea 2.2: Refactorizar legacy-service.ts ❌ **PENDIENTE**

**Estado**: 312 líneas en un solo archivo

**Propuesta de división:**
```
src/lib/services/legacy/
├── index.ts                    # Wrapper backward compatible
├── reservation-creator.ts     # Crear reservas
├── reservation-finder.ts      # Buscar reservas
├── reservation-canceler.ts    # Cancelar reservas
└── reservation-validator.ts   # Validaciones
```

### Tarea 2.3: Tests Unitarios - Lógica de Negocio ⚠️ **PARCIAL**

| Test | Estado | Nota |
|------|--------|------|
| availability.test.ts | ❌ PENDIENTE | services-availability.ts existe (14KB) |
| legacy-service.test.ts | ❌ PENDIENTE | legacy-service.ts existe (312 líneas) |
| types.test.ts | ❌ PENDIENTE | - |
| phone-utils.test.ts | ✅ 17 tests | |
| voice-auth.test.ts | ✅ 11 tests | |
| voice-service.test.ts | ✅ 18 tests | |

**Faltan:** Tests para `services-availability.ts` y `legacy-service.ts`

### Tarea 2.4: Tests de Integración ❌ **PENDIENTE**

```
src/__tests__/integration/
├── api/
│   ├── reservations.test.ts       # POST, GET, DELETE
│   ├── check-availability.test.ts # Verificar disponibilidad
│   └── admin/
│       ├── services.test.ts
│       └── reservations.test.ts
```

**Estado**: Directorio existe pero está vacío

---

## 💾 BLOQUE 3: Base de Datos - **20% COMPLETADO**

### Tarea 3.1: Schema Drizzle ✅ **COMPLETADO**

**Archivo**: `drizzle/schema.ts` (350+ líneas)

**Tablas implementadas:**
- [x] `restaurants` - Restaurantes
- [x] `tables` - Mesas (con layout visual)
- [x] `services` - Configuración de servicios
- [x] `customers` - Clientes (con no-show tracking)
- [x] `reservations` - Reservas
- [x] `reservation_history` - Auditoría
- [x] `reservation_sessions` - Sesiones IVR
- [x] `whatsapp_messages` - Mensajes WhatsApp
- [x] `table_blocks` - Bloqueos de mesas
- [x] `call_logs` - Logs de llamadas

**Índices existentes:**
- [x] `tables_table_code_idx`
- [x] `reservations_date_restaurant_idx`
- [x] `reservations_date_service_idx`
- [x] `reservations_status_idx`

### Tarea 3.2: Optimizar Queries ⚠️ **PARCIAL**

**Analizado:**
- [x] No se detectaron N+1 problems evidentes
- [ ] Falta análisis profundo de performance
- [ ] Falta implementar query caching

### Tarea 3.3: Constraints en BD ❌ **PENDIENTE**

**Constraints a añadir:**
```sql
-- CHECK constraints
ALTER TABLE reservations ADD CONSTRAINT party_size_check
  CHECK (party_size BETWEEN 1 AND 50);

ALTER TABLE tables ADD CONSTRAINT capacity_check
  CHECK (capacity BETWEEN 1 AND 20);
```

### Tarea 3.4: Soft Delete ❌ **PENDIENTE**

**Campos a añadir:**
- `reservations.deletedAt`
- `reservations.deletedBy`
- `tables.deletedAt`
- `services.deletedAt`

### Tarea 3.5: Docs de Schema ❌ **PENDIENTE**

**Crear:** `docs/database-schema.md`

---

## 🎨 BLOQUE 4: UI/UX - **70% COMPLETADO**

### Tarea 4.1: Componentes Reutilizables ✅ **COMPLETADO**

**Ubicación**: `src/components/`

**Componentes Core existentes (30+):**
- [x] `Avatar.tsx`
- [x] `Badge.tsx`
- [x] `Button.tsx`
- [x] `Card.tsx`
- [x] `Chip.tsx`
- [x] `ConfirmDialog.tsx`
- [x] `Container.tsx`
- [x] `Dropdown.tsx`
- [x] `EmptyState.tsx`
- [x] `ErrorBoundary.tsx`
- [x] `Input.tsx`
- [x] `LoadingSpinner.tsx`
- [x] `Modal.tsx`
- [x] `Pagination.tsx`
- [x] `Progress.tsx`
- [x] `ReservationTable.tsx`
- [x] `SearchBar.tsx`
- [x] `Select.tsx`
- [x] `StatusBadge.tsx`
- [x] `Tabs.tsx`
- [x] `Textarea.tsx`
- [x] `Timeline.tsx`
- [x] `Toast.tsx`
- [x] `KPICard.tsx`
- [x] `StatsCard.tsx`

### Tarea 4.2: Error Handling ✅ **COMPLETADO**

- [x] `ErrorBoundary.tsx` - React error boundary
- [x] `LoadingSpinner.tsx` - Loading states
- [x] `EmptyState.tsx` - Empty list states
- [x] `Toast.tsx` - Notificaciones de error/éxito

### Tarea 4.3: Performance ⚠️ **REVISAR**

- [ ] Bundle analyzer
- [ ] Dynamic imports (implementar)
- [ ] Memoización (revisar uso de useMemo/useCallback)
- [ ] Image optimization con next/image

### Tarea 4.4: Accessibility ⚠️ **REVISAR**

- [ ] Audit completo de aria-labels
- [ ] Keyboard navigation en admin
- [ ] Focus management en modales
- [ ] Color contrast verification

---

## 🧪 BLOQUE 5: Testing Avanzado - **30% COMPLETADO**

### Tarea 5.1: Tests Unitarios ⚠️ **PARCIAL**

**Cobertura actual:**
```
src/__tests__/
├── unit/                          62 tests
│   ├── hooks/useFilters.test.ts   16 tests ✅
│   └── lib/voice/                 46 tests ✅
└── integration/                   0 tests ❌
```

**Faltan tests para:**
- [ ] `services-availability.ts` (14KB de lógica)
- [ ] `legacy-service.ts` (312 líneas)
- [ ] API endpoints (reservations, admin, etc.)

### Tarea 5.2: Tests E2E ❌ **PENDIENTE**

```
tests/e2e/
├── reservations.spec.ts
├── admin-reservations.spec.ts
├── admin-tables.spec.ts
└── admin-services.spec.ts
```

**Requiere:** Configurar Playwright

### Tarea 5.3: Performance Testing ❌ **PENDIENTE**

**Metas:**
- [ ] Load testing: 100 concurrent users en /check-availability
- [ ] Load testing: 50 concurrent users en /admin/reservations
- [ ] p95 response time < 200ms

### Tarea 5.4: Test Coverage ❌ **MEJORAR**

**Objetivos:**
- [x] src/lib/voice/ → ~80% coverage
- [ ] src/lib/services/ → 70% coverage
- [ ] src/app/api/ → 50% coverage
- [ ] src/components/ → 30% coverage

---

## 📚 BLOQUE 6: Integración - **60% COMPLETADO**

### Tarea 6.1: Voice/IVR Integration ✅ **COMPLETADO**

**Ubicación**: `src/lib/voice/`

**Archivos:**
- [x] `phone-utils.ts` - Validación teléfonos españoles
- [x] `voice-auth.ts` - Autenticación voice bridge
- [x] `voice-service.ts` - Lógica de negocio voz
- [x] `voice-types.ts` - Tipos compartidos
- [x] `call-logger.ts` - Logging de llamadas

**API Endpoint:**
- [x] `/api/voice-bridge` - Puente con Pipecat

### Tarea 6.2: Telephony Integration ⚠️ **PARCIAL**

**Ubicación**: `src/lib/telephony/`

**Archivos:**
- [x] `call-handler.ts` - Manejo de llamadas
- [x] `signalwire-gateway.ts` - Gateway Signalwire
- [ ] Webhook Telnyx/Signalwire completo

**Falta:**
- [ ] Webhook handler completo
- [ ] Flow manager de llamadas

### Tarea 6.3: WhatsApp Integration ⚠️ **PARCIAL**

**Archivos:**
- [x] `/api/whatsapp` route
- [x] `services/whatsapp.ts`
- [ ] Flow manager de conversaciones

### Tarea 6.4: Availability Service ✅ **COMPLETADO**

**Ubicación**: `src/lib/availability/`

- [x] `services-availability.ts` - 14KB, lógica completa de disponibilidad
- [ ] Tests para availability service

---

## 📚 BLOQUE 7: Documentación - **10% COMPLETADO**

### Tarea 7.1: API Docs ❌ **PENDIENTE**

**Crear:**
```
docs/api/
├── reservations/
│   ├── create-reservation.md
│   ├── check-availability.md
│   └── cancel-reservation.md
├── admin/
│   ├── services.md
│   └── tables.md
└── schemas/
    └── database.md
```

### Tarea 7.2: Development Docs ⚠️ **PARCIAL**

**Existen:**
- [x] `docs/CONFIG.md` - Configuración del proyecto
- [x] `docs/PLAN_TRABAJO.md` - Este roadmap
- [ ] `docs/SETUP.md` - Guía de setup
- [ ] `docs/TESTING.md` - Guía de testing
- [ ] `docs/DEPLOYMENT.md` - Guía de deployment

### Tarea 7.3: Contributing Guide ❌ **PENDIENTE**

**Crear:**
- [ ] `CONTRIBUTING.md`
- [ ] `docs/development/`

---

## 🔐 BLOQUE 8: Autenticación - **PENDIENTE**

### Tarea 8.1: Supabase Auth ⚠️ **CONFIGURADO**

**Estado:**
- [x] Supabase client configurado
- [x] `AuthContext.tsx` existe
- [x] `middleware.ts` existe
- [ ] Protección de rutas admin
- [ ] Role-based access control
- [ ] Login UI

---

## 🎯 ROADMAP VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROGRESO GENERAL                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ████████████████████████░░░░░  Bloque 1: Fundamentos  100%    │
│  ████████████████████████░░░░░  Bloque 2: Refactorización  80%    │
│  ████████░░░░░░░░░░░░░░░░░░░░░░  Bloque 3: Base de Datos   20%    │
│  ████████████████████████░░░░░  Bloque 4: UI/UX          70%    │
│  ████████░░░░░░░░░░░░░░░░░░░░░░  Bloque 5: Testing        30%    │
│  ████████████████░░░░░░░░░░░░░░  Bloque 6: Integración    60%    │
│  ████░░░░░░░░░░░░░░░░░░░░░░░░░░  Bloque 7: Documentación  10%    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Bloque 8: Autenticación   0%    │
│                                                                  │
│  ████████████████████████████░░░  PROGRESO GENERAL       ~47%    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 TAREAS PRIORITARIAS

### 🔥 Alta Prioridad (Próximos 2-3 días)

1. **Tests de lógica de negocio** (4h)
   - Crear `availability.test.ts`
   - Crear `legacy-service.test.ts`
   - Meta: 70% coverage en src/lib/

2. **Refactorizar legacy-service.ts** (3h)
   - Dividir en módulos
   - Mantener backward compatibility

3. **Tests de integración API** (3h)
   - reservations.test.ts
   - check-availability.test.ts

### 🟡 Media Prioridad (Próxima semana)

4. **Soft Delete en BD** (2h)
   - Añadir campos deletedAt
   - Actualizar queries

5. **Constraints en BD** (1h)
   - CHECK constraints
   - Validaciones

6. **Documentación API** (4h)
   - Endpoints principales
   - Ejemplos de uso

### 🟢 Baja Prioridad (Futuro)

7. **Tests E2E con Playwright** (8h)
8. **Performance Testing** (3h)
9. **Accessibility Audit** (2h)
10. **Autenticación completa** (8h)

---

## 📁 ESTRUCTURA DEL PROYECTO

```
Reservations/
├── drizzle/
│   └── schema.ts                 # ✅ Schema completo
├── docs/
│   ├── CONFIG.md                 # ✅ Configuración
│   └── PLAN_TRABAJO.md          # ✅ Este archivo
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── components/      # ✅ 6 componentes
│   │   │   ├── hooks/           # ✅ 3 hooks
│   │   │   ├── analytics/       # ✅ Página
│   │   │   ├── availability/    # ✅ Página
│   │   │   ├── floor-plan/      # ✅ Página
│   │   │   ├── services/        # ✅ Página
│   │   │   ├── tables/          # ✅ Página
│   │   │   └── page.tsx         # ✅ Dashboard (304 líneas)
│   │   ├── api/
│   │   │   ├── admin/           # ✅ 20+ endpoints
│   │   │   ├── reservations/    # ✅ CRUD + availability
│   │   │   ├── voice-bridge/    # ✅ Voice API
│   │   │   └── whatsapp/        # ⚠️  Parcial
│   │   └── reservar/           # ✅ Página pública
│   ├── components/
│   │   ├── Core/                # ✅ 30+ componentes reutilizables
│   │   └── admin/               # ✅ 20+ componentes admin
│   ├── __tests__/
│   │   ├── mocks/              # ✅ DB, Redis
│   │   └── unit/               # ✅ 62 tests
│   ├── contexts/                # ✅ AuthContext
│   ├── hooks/                   # ✅ useVoiceBot, usePolling, etc.
│   ├── lib/
│   │   ├── availability/        # ✅ services-availability.ts
│   │   ├── schemas/             # ✅ Zod schemas
│   │   ├── services/
│   │   │   └── legacy-service.ts # ⚠️ 312 líneas, sin dividir
│   │   ├── telephony/          # ✅ call-handler, signalwire
│   │   ├── voice/              # ✅ voice-service completo
│   │   └── ...
│   ├── middleware/              # ✅ Debug protection
│   └── types/                   # ✅ reservation, service, table
└── vitest.config.ts             # ✅ Configurado
```

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

### Opción A: Completar Bloque 2 (Refactorización)
```bash
# Continuar con lo faltante del Bloque 2
1. Tests para availability y legacy-service
2. Refactorizar legacy-service en módulos
3. Tests de integración API
```

### Opción B: Completar Bloque 3 (Base de Datos)
```bash
# Mejoras en la base de datos
1. Soft delete
2. Constraints CHECK
3. Docs de schema
```

### Opción C: Completar Bloque 7 (Documentación)
```bash
# Documentación para el equipo
1. API docs
2. SETUP.md
3. TESTING.md
```

---

## 📌 BOOKMARKS

**Archivos clave:**
- `src/app/admin/page.tsx` - Dashboard principal
- `src/lib/services/legacy-service.ts` - Refactorizar pendiente
- `src/lib/availability/services-availability.ts` - Sin tests aún
- `vitest.config.ts` - Testing configurado

**Comandos útiles:**
```bash
npm run test              # Ejecutar tests
npm run test:coverage    # Ver cobertura
npm run build            # Build de producción
npm run db:studio         # Abrir Drizzle Studio
```

---

**Último commit:** 2620193 - "feat: Testing + Type Safety implementation"
**Fecha:** 2026-03-30
**Estado:** Proyecto activo, ~47% completado
