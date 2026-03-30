# Plan de Trabajo - Reservations

## Estado Actual
- **Testing**: ✅ 72 tests unitarios creados y pasando
- **Type Safety**: ✅ Strict mode habilitado, schemas Zod implementados, sin errores de TypeScript
- **IVR**: Voice bridge API implementada, falta integración con Telnyx

## Progreso

### Punto 3 - Testing ✅ COMPLETADO
- ✅ Configuración de mocks (DB y Redis)
- ✅ Tests unitarios de phone-utils (17 tests)
- ✅ Tests unitarios de voice-auth (11 tests)
- ✅ Tests unitarios de voice-service (18 tests)
- ✅ Tests unitarios de useFilters (16 tests)
- ✅ 72 tests pasando sin errores

### Punto 4 - Type Safety ✅ COMPLETADO
- ✅ Schemas Zod creados (`src/lib/schemas/reservation-schemas.ts`)
- ✅ Validación de teléfono español con regex
- ✅ Validación de fecha (YYYY-MM-DD) y hora (HH:MM)
- ✅ Schemas para todas las operaciones CRUD
- ✅ Schemas para Voice API
- ✅ Función `validateRequestBody` para uso en API routes
- ✅ Aplicado en `/api/reservations`
- ✅ Eliminados todos los tipos `any` en voice-service
- ✅ Type guards en lugar de `as unknown as`
- ✅ Strict mode habilitado en tsconfig.json
- ✅ **0 errores de TypeScript**

---

## Punto 2: Integración Telefónica con Telnyx

### Contexto Actual
- ✅ `voice-bridge` API implementada (`/api/voice-bridge`)
- ✅ Voice service con acciones: checkAvailability, createReservation, getReservation, cancelReservation, modifyReservation
- ✅ Call logger para registrar llamadas
- ❌ **Falta**: Webhook de Telnyx para recibir llamadas entrantes
- ❌ **Falta**: Integración real con Pipecat (bot de voz)

### Tareas

#### 2.1 Webhook Telnyx (Entrante)
- [ ] Crear `/api/telnyx/webhook` para recibir eventos de llamada
- [ ] Validar firma del webhook de Telnyx
- [ ] Manejar eventos: `call_initiated`, `call_ended`, `call_answered`
- [ ] Guardar logs en `call_logs` table

#### 2.2 Cliente Telnyx (Saliente)
- [ ] Crear `src/lib/telnyx/telnyx-client.ts`
- [ ] Métodos: `answerCall()`, `hangup()`, `transferToPipecat()`
- [ ] Configurar credenciales en `.env`

#### 2.3 Integración con Pipecat
- [ ] Crear endpoint WebSocket para conectar con Pipecat
- [ ] Stream de audio bidireccional
- [ ] Manejo de eventos: `start_speaking`, `stop_speaking`, `transcript`

#### 2.4 Testing de IVR
- [ ] Tests unitarios para webhook Telnyx
- [ ] Tests de integración mockeando Pipecat
- [ ] Test de llamadas end-to-end (mock)

---

## Punto 3: Testing con Vitest

### Estructura Objetivo

```
src/__tests__/
├── setup.ts                    # ✅ Ya existe
├── unit/
│   ├── lib/
│   │   ├── db.test.ts          # Cliente DB
│   │   ├── redis.test.ts       # Cliente Redis
│   │   └── utils.test.ts       # Utilidades
│   ├── services/
│   │   └── availability.test.ts
│   ├── lib/voice/
│   │   ├── phone-utils.test.ts
│   │   ├── voice-auth.test.ts
│   │   └── voice-service.test.ts
│   └── hooks/
│       └── useFilters.test.ts
├── integration/
│   ├── api/
│   │   ├── reservations.test.ts
│   │   └── voice-bridge.test.ts
│   └── admin/
│       └── dashboard.test.ts
└── mocks/
    ├── db.ts                   # Mock DB
    └── redis.ts                # Mock Redis
```

### Tareas

#### 3.1 Configuración
- [x] Crear `src/__tests__/mocks/db.ts` - Mock de Drizzle
- [x] Crear `src/__tests__/mocks/redis.ts` - Mock de ioredis
- [ ] Configurar variables de entorno para tests

#### 3.2 Tests Unitarios (Prioridad Alta)
- [x] `phone-utils.test.ts` - Validación y normalización de teléfonos (17 tests)
- [x] `voice-auth.test.ts` - Validación de API keys (11 tests)
- [x] `useFilters.test.ts` - Hook de filtros (16 tests)
- [x] `voice-service.test.ts` - Servicio de voz (18 tests)
- [ ] `availability.test.ts` - Algoritmo de disponibilidad

#### 3.3 Tests de Integración
- [ ] `reservations.test.ts` - CRUD de reservas
- [ ] `voice-bridge.test.ts` - Endpoint de voz
- [ ] `admin-stats.test.ts` - Estadísticas del dashboard

#### 3.4 Cobertura
- [ ] Configurar umbral mínimo: 70%
- [ ] Reporte de cobertura en HTML

---

## Punto 4: Type Safety ✅ COMPLETADO

### Lo implementado

#### 4.1 Validación de Inputs con Zod ✅
- [x] Crear schemas Zod para:
  - [x] `CreateReservationSchema` - Con validación de teléfono español
  - [x] `UpdateReservationSchema` - Campos opcionales
  - [x] `CheckAvailabilitySchema` - Fecha, hora, partySize
  - [x] `VoiceActionSchema` - Para bot de voz
  - [x] `CancelReservationSchema`, `GetReservationSchema`, `BulkActionSchema`
- [x] Función `validateRequestBody` para validación en API routes
- [x] Función `formatZodError` para respuestas de error consistentes
- [x] Aplicado en `/api/reservations`

#### 4.2 Type Safety en Server Actions ✅
- [x] Eliminados todos los `any` types en voice-service
- [x] Type guards en lugar de `as unknown as`
- [x] Validación de parámetros con schemas Zod antes de procesar

#### 4.3 Strict Mode ✅
- [x] `strict: true` ya estaba habilitado en tsconfig.json
- [x] Corregidos todos los errores resultantes:
  - Mocks de tests actualizados
  - Propiedades faltantes agregadas
  - Type guards corregidos

---

## Orden de Ejecución

1. **Punto 3 (Testing)** - Fundamento crítico
   - Configuración de mocks
   - Tests unitarios de utilidades
   - Tests de voz

2. **Punto 4 (Type Safety)** - Mejora la calidad
   - Schemas Zod
   - Strict mode

3. **Punto 2 (IVR)** - Dependencia externa
   - Webhook Telnyx
   - Integración Pipecat

---

## Scripts Útiles

```bash
# Ejecutar tests
npm run test

# Tests con UI
npm run test:ui

# Cobertura
npm run test:coverage

# Tests en modo watch
npm run test -- --watch
```
