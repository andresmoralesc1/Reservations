# Auditoría Estandarizada — Proyecto Anfitrión (Reservations)
# Versión: 1.0 — 5 de abril 2026

Ejecuta EXACTAMENTE estos comandos y calcula la nota con la rúbrica de abajo.
NO uses tu criterio personal para la nota. Usa SOLO los números que salen de los comandos.

---

## PASO 1: Ejecutar todos los comandos

Ejecuta estos 10 comandos y anota el resultado de cada uno:

```bash
# 1. BUILD
npm run build 2>&1 | tail -5
# Resultado esperado: "Compiled successfully" o errores

# 2. TYPESCRIPT
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
# Resultado: número de errores

# 3. TESTS
npm test 2>&1 | tail -5
# Resultado: X passed, Y failed

# 4. ANY EN PRODUCCIÓN (excluye tests y node_modules)
grep -rn "as any\| any[^a-zA-Z]" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__ | grep -v ".test." | grep -v ".spec." | wc -l
# Resultado: número de any en producción

# 5. ANY DOCUMENTADOS (con eslint-disable o comentario explicativo)
grep -B1 "as any\| any[^a-zA-Z]" src/ --include="*.ts" --include="*.tsx" -rn | grep -v node_modules | grep -v __tests__ | grep "eslint-disable\|Razón:\|Reason:\|TODO:" | wc -l
# Resultado: número de any documentados

# 6. CONSOLE.LOG EN PRODUCCIÓN (excluye tests)
grep -rn "console\.\(log\|warn\|error\)" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v __tests__ | grep -v ".test." | wc -l
# Resultado: número de console.log

# 7. DEPENDENCIAS - ejecutar depcheck
npx depcheck 2>&1 | grep -c "^\*"
# Resultado: número de deps unused (IGNORAR estas que son toolchain: pino-pretty, @vitest/coverage-v8, autoprefixer, postcss, typescript)

# 8. ARCHIVOS DE TEST
find . -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.tsx" | grep -v node_modules | wc -l
# Resultado: número de archivos de test

# 9. ÍNDICES DE BD EN DRIZZLE
grep -rn "index(" drizzle/ --include="*.ts" | wc -l
# Resultado: número de índices

# 10. SEGURIDAD - secretos hardcodeados
grep -rn "password\|secret\|api_key" src/ --include="*.ts" --include="*.tsx" -i | grep -v "type\|interface\|//\|test\|mock\|schema\|\.d\.ts\|process\.env\|variable\|config\|validate\|timingSafe" | wc -l
# Resultado: número de posibles secretos
```

---

## PASO 2: Llenar la tabla de resultados

Copia esta tabla y llena la columna "Resultado":

```
┌────┬──────────────────────────┬───────────┬──────────────────┐
│ #  │ Métrica                  │ Resultado │ Puntos (ver P3)  │
├────┼──────────────────────────┼───────────┼──────────────────┤
│ 1  │ Build exitoso            │ SÍ/NO    │                  │
│ 2  │ Errores TypeScript       │ ___      │                  │
│ 3  │ Tests pasando/total      │ ___/___  │                  │
│ 4  │ any en producción        │ ___      │                  │
│ 5  │ any documentados         │ ___      │                  │
│ 6  │ console.log en prod      │ ___      │                  │
│ 7  │ Deps innecesarias reales │ ___      │                  │
│ 8  │ Archivos de test         │ ___      │                  │
│ 9  │ Índices BD               │ ___      │                  │
│ 10 │ Secretos hardcodeados    │ ___      │                  │
└────┴──────────────────────────┴───────────┴──────────────────┘
```

---

## PASO 3: Calcular la nota (RÚBRICA FIJA)

Usa EXACTAMENTE esta fórmula. No inventes puntos ni ajustes subjetivos.

### 1. BUILD (máx 1.0 punto)
- Compila sin errores: 1.0
- Compila con warnings: 0.8
- No compila: 0.0

### 2. TYPESCRIPT (máx 1.5 puntos)
- 0 errores: 1.5
- 1-5 errores: 1.0
- 6-15 errores: 0.5
- 16+ errores: 0.0

### 3. TESTS (máx 2.0 puntos)
- 100% pasando + más de 10 archivos de test: 2.0
- 100% pasando + 5-10 archivos: 1.5
- 100% pasando + menos de 5 archivos: 1.0
- 95-99% pasando: 0.8
- Menos del 95% pasando: 0.3
- No hay tests: 0.0

### 4. TYPE SAFETY — any en producción (máx 1.0 punto)
- 0 any: 1.0
- 1-5 any (todos documentados): 0.8
- 1-5 any (algunos sin documentar): 0.6
- 6-10 any (documentados): 0.5
- 6-10 any (sin documentar): 0.3
- 11+ any: 0.1

### 5. LOGGING (máx 0.5 puntos)
- Usa logger estructurado (pino/winston) Y menos de 20 console.log: 0.5
- Usa logger estructurado PERO más de 20 console.log: 0.3
- Solo console.log, no hay logger: 0.1

### 6. DEPENDENCIAS (máx 0.5 puntos)
- 0 deps innecesarias reales: 0.5
- 1-3 deps innecesarias: 0.3
- 4+ deps innecesarias: 0.1
NOTA: pino-pretty, @vitest/coverage-v8, autoprefixer, postcss, typescript son TOOLCHAIN.
NO contarlas como innecesarias aunque depcheck las reporte.

### 7. BASE DE DATOS (máx 1.0 punto)
- 20+ índices definidos: 1.0
- 10-19 índices: 0.7
- 5-9 índices: 0.4
- Menos de 5: 0.1

### 8. SEGURIDAD (máx 1.5 puntos)
- 0 secretos hardcodeados: 0.5
- AUTH_ENABLED por variable de entorno (no hardcoded false): 0.5
  Para verificar: grep -n "AUTH_ENABLED" src/middleware.ts
  Si dice process.env.AUTH_ENABLED: 0.5
  Si dice = false o está comentado: 0.0
- VOICE_BRIDGE_API_KEY con timing-safe: 0.5
  Para verificar: grep -n "timingSafeEqual" src/lib/voice/voice-auth.ts
  Si existe: 0.5
  Si no existe: 0.0

### 9. OBSERVABILIDAD (máx 1.0 punto)
- Logger centralizado existe (src/lib/logger.ts): 0.3
- Health endpoint existe (GET /api/health): 0.4
- Logs en servicios principales: 0.3
  Para verificar: grep -l "logger" src/lib/services/*.ts | wc -l
  Si 3+: 0.3 | Si 1-2: 0.15 | Si 0: 0.0

---

## PASO 4: Sumar y reportar

```
NOTA FINAL = Build + TypeScript + Tests + TypeSafety + Logging + Deps + BD + Seguridad + Observabilidad

Máximo posible: 10.0

┌───────────────────┬────────┬────────┐
│     Categoría     │ Máximo │ Puntos │
├───────────────────┼────────┼────────┤
│ Build             │ 1.0    │        │
│ TypeScript        │ 1.5    │        │
│ Tests             │ 2.0    │        │
│ Type Safety (any) │ 1.0    │        │
│ Logging           │ 0.5    │        │
│ Dependencias      │ 0.5    │        │
│ Base de Datos     │ 1.0    │        │
│ Seguridad         │ 1.5    │        │
│ Observabilidad    │ 1.0    │        │
├───────────────────┼────────┼────────┤
│ TOTAL             │ 10.0   │        │
└───────────────────┴────────┴────────┘
```

---

## PASO 5: Comparar con auditorías anteriores

Si existen auditorías anteriores en el proyecto, compara los números (no las notas subjetivas).
Indica qué métricas mejoraron, cuáles empeoraron, y cuáles siguen igual.

Solo reporta DATOS, no opiniones.

---

## PASO 6: Top 3 acciones para subir nota

Basándote en las categorías con MENOR puntuación, lista las 3 acciones
que más subirían la nota. Incluye:
- Qué categoría afecta
- Cuántos puntos sumaría
- Tiempo estimado

---

## DECISIONES FIJAS (NO CAMBIAR ENTRE AUDITORÍAS)

Estas decisiones ya se tomaron y NO deben volver a evaluarse:

1. pino-pretty → MANTENER (se usa en logger.ts para dev)
2. @vitest/coverage-v8 → MANTENER (se usa para reportes de cobertura)
3. autoprefixer → MANTENER (requerido por Tailwind/PostCSS)
4. postcss → MANTENER (requerido por Tailwind)
5. typescript → MANTENER (toolchain esencial)
6. as any en tests → ACEPTABLE (no cuenta para nota de producción)
7. as any documentado con eslint-disable + comentario → ACEPTABLE
8. Los 26 índices en Drizzle + 53 en DB → CORRECTO, no duplicados problemáticos

NO marques estas como problemas. Ya fueron analizadas y decididas.
