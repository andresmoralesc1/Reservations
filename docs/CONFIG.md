# Configuración del Sistema

## Variables de Entorno

El sistema usa un archivo de configuración centralizado en `src/lib/config/env.ts`.

### Variables Requeridas en Producción

```bash
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/database

# Restaurante (OBLIGATORIO en producción)
RESTAURANT_ID=uuid-del-restaurante
```

### Variables Opcionales

```bash
# Configuración del sistema
NODE_ENV=development|production
MAX_PARTY_SIZE=50
MIN_PARTY_SIZE=1
DEFAULT_RESERVATION_DURATION=120

# Supabase (opcional, para autenticación futura)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# APIs externas
PEXELS_API_KEY=your_pexels_api_key
TELNYX_API_KEY=your_telnyx_key
VOICE_BRIDGE_API_KEY=your_api_key

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Uso en el Código

### Server-side (API routes, lib)

```typescript
import { config } from '@/lib/config/env'

// Usar configuración
const restaurantId = config.restaurantId
const isDev = config.isDevelopment
const maxPartySize = config.maxPartySize
```

### Client-side (Componentes React)

Para componentes cliente, las variables deben estar prefijadas con `NEXT_PUBLIC_`:

```typescript
// ✅ Correcto - Disponible en cliente
const appUrl = process.env.NEXT_PUBLIC_APP_URL

// ❌ Error - No disponible en cliente
const dbUrl = process.env.DATABASE_URL
```

## Validación

El sistema valida automáticamente las variables críticas al inicio:

- ✅ Si `RESTAURANT_ID` falta en producción → Error y detiene la app
- ✅ Si `DATABASE_URL` falta en producción → Error y detiene la app
- ✅ Log de configuración en development

## Generar un Nuevo Restaurant ID

```bash
# Linux/Mac
uuidgen

# Windows PowerShell
[guid]::NewGuid()

# Online
# Visita: https://www.uuidgenerator.net/
```

## Cambiar el Restaurant por Defecto

```bash
# .env.local
RESTAURANT_ID=nuevo-uuid-aqui

# Reiniciar el servidor
npm run dev
```

Todos los archivos usarán automáticamente el nuevo ID.
