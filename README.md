<div align="center">

# 🍽️ Anfitrión - Plataforma de Reservas

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.6-black?logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Plataforma SaaS de gestión de reservas para restaurantes y establecimientos de hostelería**

[Qué hace](#-qué-hace) · [Cómo usarla](#-cómo-usarla) · [Características](#-características) · [Quick Start](#-quick-start) · [API](#-api)

</div>

---

## 📋 Sobre el Proyecto

**Anfitrión** es una plataforma SaaS moderna de gestión de reservas diseñada para restaurantes y establecimientos de hostelería. Transforma la operación tradicional mediante automatización inteligente, permitiendo a los clientes reservar a través de múltiples canales:

- 🌐 **Web Interface** - Formulario intuitivo de reservas
- 📞 **IVR 24/7** - Sistema de respuesta de voz interactivo
- 💬 **WhatsApp** - Confirmaciones y recordatorios automáticos
- 📊 **Admin Dashboard** - Panel de gestión completo

Anfitrión es un producto multi-tenant que puede ser implementado en cualquier restaurante, incluyendo clientes como **El Posit**.

---

## 🎯 Qué Hace

Anfitrión resuelve un problema común en los restaurantes: **gestionar reservas eficientemente sin depender solo del teléfono**.

### El Problema

Los restaurantes tradicionales enfrentan desafíos diarios:
- 📞 Líneas telefónicas saturadas durante horas pico
- 📝 Reservas perdidas o mal anotadas en papel
- ⏰ Clientes que no se presentan (no-shows) sin aviso
- 📊 Falta de datos para tomar decisiones informadas
- 👥 Personal ocupado tomando reservas en lugar de atender

### La Solución

**Anfitrión automatiza todo el ciclo de vida de una reserva:**

```mermaid
graph LR
    A[Cliente] --> B{Elige Canal}
    B -->|Web| C[Formulario Online]
    B -->|Teléfono| D[IVR Automatizado]
    C --> E[Verifica Disponibilidad]
    D --> E
    E --> F[Asigna Mesa]
    F --> G[Genera Código RES-XXXXX]
    G --> H[WhatsApp Confirmación]
    H --> I[Dashboard Admin]
    I --> J{Aprobación}
    J -->|Auto| K[Confirmada]
    J -->|Manual| L[Personal Revisa]
    K --> M[Recordatorio 24h antes]
    L --> K
```

### Flujo Completo de una Reserva

| Etapa | Qué sucede | Automatización |
|-------|------------|----------------|
| **1. Solicitud** | Cliente reserva por web, teléfono o WhatsApp | 100% |
| **2. Disponibilidad** | Sistema busca mesas disponibles | 100% |
| **3. Asignación** | Mesa asignada según capacidad | 100% |
| **4. Confirmación** | WhatsApp con código RES-XXXXX | 100% |
| **5. Aprobación** | Admin confirma o rechaza | Configurable |
| **6. Recordatorio** | WhatsApp 24h antes | 100% |
| **7. Check-in** | Marcar como completada | Manual |
| **8. No-show** | Registro automático si no se presenta | Automático |

---

## 📱 Cómo Usarla

### Para Clientes

Los clientes tienen **3 formas** de hacer una reserva:

#### 1️⃣ Reserva por Web

```
1. Entrar a [dominio-del-restaurante]/reservar
2. Seleccionar fecha y hora
3. Indicar número de personas
4. Ingresar nombre y teléfono
5. Recibir código RES-XXXXX por WhatsApp
```

**Visualmente:**
```
┌─────────────────────────────────────┐
│   🍽️ RESERVA TU MESA                │
├─────────────────────────────────────┤
│                                      │
│  📅 Fecha: [15 Feb 2025 ▼]          │
│  ⏰ Hora:  [08:00 PM ▼]             │
│  👥 Personas: [4 ▼]                 │
│                                      │
│  📝 Nombre: ___________________     │
│  📱 Teléfono: +57 300 _________     │
│                                      │
│           [ RESERVAR ]               │
│                                      │
└─────────────────────────────────────┘
```

#### 2️⃣ Reserva por Teléfono (IVR)

```
1. Llamar al número del restaurante
2. Escuchar: "Bienvenido al sistema de reservas..."
3. Seguir instrucciones de voz
4. Confirmar fecha, hora y personas
5. Recibir código por WhatsApp
```

**Diálogo del IVR:**
```
📞 Sistema: "Bienvenido. Para reservar, dime el día."
👤 Cliente: "Para este sábado a las 8pm"
📞 Sistema: "Sábado 15 de febrero a las 8pm. ¿Cuántas personas?"
👤 Cliente: "Cuatro personas"
📞 Sistema: "Perfecto. ¿Tu nombre y teléfono?"
👤 Cliente: "Carlos, 3001234567"
📞 Sistema: "Tu reserva es RES-A1B2C. Te envío confirmación."
```

#### 3️⃣ Código de Reserva

Cada reserva tiene un código único que permite:
- ✅ Verificar estado de la reserva
- ✅ Modificar o cancelar
- ✅ Hacer check-in al llegar

```
Tu código: RES-A1B2C
Estado: ✅ Confirmada
```

---

### Para Administradores

El dashboard está en `/admin` y requiere autenticación.

#### 📊 Vista Principal del Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 DASHBOARD ANFITRIÓN                             [Admin]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📈 ESTADÍSTICAS DE HOY                                          │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │  Total   │Pendientes│Confirmada│ Completadas│               │
│  │   45     │    8     │   32     │    5      │                 │
│  └──────────┴──────────┴──────────┴──────────┘                 │
│                                                                  │
│  📊 RESERVAS POR HORA                                           │
│    15 │                                                         │
│    10 │    ████                                                 │
│     5 │ ████    ████    ████                                   │
│     0 └────────────────────────────                            │
│        6PM   7PM   8PM   9PM                                   │
│                                                                  │
│  📋 COLA DE PENDIENTES                   [Ver Todas ▼]         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🔴 RES-A1B2C │ Carlos │ 4 personas │ Hoy 8PM  │[Aprobar]│   │
│  │ 🔴 RES-B2C3D │ María  │ 2 personas │ Hoy 9PM  │[Aprobar]│   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### ⚙️ Funciones del Admin

| Función | Cómo se usa |
|---------|-------------|
| **Ver reservas** | Lista en tiempo real con filtros por fecha, estado, cliente |
| **Aprobar/Rechazar** | Click en botones individuales o selección masiva |
| **Modificar** | Editar fecha, hora, número de personas o mesa asignada |
| **Cancelar** | Cancelar reserva con razón opcional |
| **Exportar** | Botón "Exportar CSV" para análisis en Excel |
| **Ver historial** | Click en reserva → ver timeline de cambios |
| **Gestionar mesas** | Agregar, editar o eliminar mesas del restaurante |

#### 📋 Vista Detalle de Reserva

```
┌───────────────────────────────────────────────────┐
│  📋 RESERVA RES-A1B2C                    [× Cerrar]│
├───────────────────────────────────────────────────┤
│                                                   │
│  Cliente: Carlos Pérez                           │
│  Teléfono: +57 300 123 4567                      │
│  Email: carlos@email.com                         │
│                                                   │
│  📅 15 Feb 2025  ⏰ 8:00 PM  👥 4 personas        │
│  🪑 Mesa 4 (Interior, 6 personas)                │
│                                                   │
│  Estado: ✅ Confirmada                           │
│  Código: RES-A1B2C                              │
│                                                   │
│  📊 HISTORIAL                                     │
│  15 Feb 7:30 PM - Creada (Pendiente)             │
│  15 Feb 7:35 PM - Confirmada por Admin           │
│                                                   │
│  [Modificar]  [Cancelar]  [WhatsApp]            │
│                                                   │
└───────────────────────────────────────────────────┘
```

#### 📤 Exportar Datos

Para análisis avanzados:

```bash
# Opción 1: Desde el dashboard
Click en "Exportar CSV" → Descarga archivo

# Opción 2: API
curl "https://[dominio]/api/admin/reservations?export=true" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o reservas.csv
```

---

## ✨ Características

### 🎯 Multi-Canal
| Canal | Descripción |
|-------|-------------|
| **Web** | Landing page optimizada con formulario de reservas en tiempo real |
| **IVR** | Sistema de voz que guía al cliente paso a paso para reservar por teléfono |
| **WhatsApp** | Notificaciones automáticas de confirmación y recordatorios |

### 📈 Dashboard Administrativo

- **Estadísticas en tiempo real** - KPIs principales y métricas clave
- **Gráficos horarios** - Visualización de reservas por hora
- **Distribución de estados** - Reservas pendientes, confirmadas y completadas
- **Acciones masivas** - Aprobar/rechazar múltiples reservas a la vez
- **Exportación CSV** - Análisis de datos en herramientas externas
- **Búsqueda y filtros** - Encontrar reservas rápidamente

### 🧠 Inteligente

- **Algoritmo de disponibilidad** - Asignación automática de mesas
- **Códigos únicos** - Formato RES-XXXXX para cada reserva
- **Gestión de sesiones** - Control de expiración de IVR
- **Historial de clientes** - Seguimiento de no-shows
- **Auditoría completa** - Registro de todos los cambios

### 🔧 Infraestructura

- **Structured Logging** - Pino con niveles (debug, info, warn, error)
- **Rate Limiting** - Sliding window con Redis para APIs sensibles
- **Cache Inteligente** - TTLs configurados por tipo de dato
- **Health Check** - Endpoint `/api/health` para monitoreo
- **Soft Delete** - Datos recuperables con auditoría

---

## 🚀 Quick Start

### Prerrequisitos

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/andresmoralesc1/Reservations.git
cd Reservations

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Iniciar servicios con Docker
docker-compose up -d

# 5. Crear base de datos
docker exec -it postgres-1 psql -U postgres -c "CREATE DATABASE reservations_db;"

# 6. Ejecutar migraciones
npm run db:generate
npm run db:push

# 7. Iniciar desarrollo
npm run dev
```

Abre [http://localhost:3005](http://localhost:3005) en tu navegador.

### Linux / macOS

```bash
# Primera vez
chmod +x scripts/*.sh
./scripts/setup.sh

# Iniciar
./scripts/start.sh

# Detener
./scripts/stop.sh
```

### Windows

```batch
# Ejecutar INICIAR.bat y seguir las instrucciones del menú
# O ejecutar directamente:
run-setup.bat    # Configuración inicial + inicio
```

---

## 🏗️ Arquitectura

### Tech Stack

<div align="center">

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
├─────────────────────────────────────────────────────────────┤
│  Next.js 15.1.6  │  React 19  │  TypeScript  │  Tailwind CSS   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│                         API LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  App Router  │  API Routes  │  Server Actions  │  Zod      │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│                        SERVICES                              │
├─────────────────────────────────────────────────────────────┤
│  Drizzle ORM  │  Supabase Auth  │  Redis  │  date-fns      │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│                         DATA LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 16  │  Redis Cache  │  WhatsApp API  │  IVR    │
└─────────────────────────────────────────────────────────────┘
```

</div>

### Estructura del Proyecto

```
reservations/
├── 📂 drizzle/              # Schema y migraciones de BD
│   ├── schema/             # Schema modular por dominio
│   │   ├── restaurants.ts
│   │   ├── customers.ts
│   │   ├── services.ts
│   │   ├── tables.ts
│   │   ├── reservations.ts
│   │   ├── voice.ts
│   │   └── analytics.ts
│   └── migrations/
├── 📂 src/
│   ├── 📂 app/              # Next.js App Router
│   │   ├── api/             # API Routes
│   │   │   ├── reservations/   # CRUD de reservas
│   │   │   ├── admin/          # API Admin
│   │   │   ├── health/         # Health check endpoint
│   │   │   └── voice-bridge/   # Voice bot API
│   │   ├── admin/           # Dashboard Admin
│   │   └── reservar/        # Página de reservas
│   ├── 📂 components/       # Componentes React
│   │   ├── admin/          # Componentes admin
│   │   └── Core/           # UI reutilizables
│   ├── 📂 lib/              # Utilidades y servicios
│   │   ├── db.ts           # Cliente Drizzle
│   │   ├── redis.ts        # Cliente Redis
│   │   ├── cache.ts        # Cache con TTLs
│   │   ├── rate-limit.ts   # Rate limiting
│   │   ├── logger.ts       # Pino structured logging
│   │   ├── services/       # Lógica de negocio (única carpeta)
│   │   ├── availability/   # Algoritmo disponibilidad
│   │   └── voice/          # Voice bot services
│   └── 📂 hooks/           # Custom React hooks
├── 📄 docker-compose.yml
├── 📄 drizzle.config.ts
└── 📄 package.json
```

---

## 🔌 API Reference

### Reservas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reservations` | Listar reservas con filtros |
| POST | `/api/reservations` | Crear nueva reserva |
| GET | `/api/reservations/[id]` | Obtener reserva por ID |
| PUT | `/api/reservations/[id]` | Actualizar reserva |
| DELETE | `/api/reservations/[id]` | Cancelar reserva |
| GET | `/api/reservations/code/[code]` | Buscar por código RES-XXXXX |

### IVR (Voice System)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/ivr` | Iniciar/procesar sesión IVR |
| DELETE | `/api/ivr?sessionId=xxx` | Finalizar sesión |

### Admin

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/reservations` | Listar con filtros avanzados |
| GET | `/api/admin/reservations/pending` | Cola de pendientes |
| POST | `/api/admin/reservations/[id]` | Aprobar/rechazar |
| GET | `/api/admin/stats` | Estadísticas del dashboard |

### Health Check

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/health` | Estado del sistema (DB, Redis, Voice) |

**Respuesta ejemplo:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-03T20:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "voice": "configured"
  },
  "version": "1.0.0"
}
```

---

## 🎨 Design System

El proyecto utiliza un sistema de diseño personalizado:

```css
/* Colores de Marca */
--cream: #F5F5F0      /* Fondo principal */
--accent: #C41E3A     /* Color primario configurable por restaurante */
--black: #1A1A1A      /* Texto */
--white: #FFFFFF      /* Contraste */

/* Tipografía */
Display: Oswald (títulos, botones)
Serif: Playfair Display (descripciones)
Sans: Inter (UI, formularios)
```

---

## 📦 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run db:generate` | Generar cliente Drizzle |
| `npm run db:push` | Aplicar migraciones |
| `npm run db:studio` | Abrir Drizzle Studio |

---

## 🔧 Variables de Entorno

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/reservations_db

# Redis
REDIS_URL=redis://localhost:6379

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# WhatsApp
WHATSAPP_API_URL=your_whatsapp_url
WHATSAPP_API_KEY=your_api_key

# IVR
IVR_PHONE_NUMBER=+573001234567
```

---

## 🗄️ Modelo de Datos

### Tablas Principales

| Tabla | Índices | Descripción |
|-------|---------|-------------|
| `restaurants` | - | Ubicaciones del restaurante |
| `tables` | 2 | Mesas con capacidad y ubicación |
| `table_blocks` | 2 | Bloqueos de mesas por fecha/hora |
| `customers` | - | Clientes con historial de no-shows |
| `services` | 4 | Servicios (turnos: comida/cena) |
| `reservations` | 9 | Reservas con estados y códigos |
| `reservations_archive` | 4 | Archivo histórico |
| `reservation_history` | - | Auditoría de cambios |
| `reservation_sessions` | 2 | Sesiones de conversación IVR |
| `whatsapp_messages` | - | Registro de mensajes |
| `call_logs` | 3 | Logs de llamadas del voice bot |
| `daily_analytics` | 2 | Analíticas pre-calculadas |

**Total: 26 índices optimizados para consultas frecuentes**

---

## 📊 Estado del Proyecto

| Módulo | Estado |
|---|---|
| Dashboard Admin (6 secciones) | ✅ Completo |
| Voice Bot IA (Pipecat + Cartesia + OpenAI) | ✅ Desplegado |
| Base de datos PostgreSQL (Supabase) | ✅ Conectada |
| Autenticación Admin | ✅ Funcional |
| Tests (Vitest + Playwright) | ✅ 276/276 pasando |
| Integración Telnyx telefónica | 🔄 En desarrollo |
| Integración WhatsApp (Telnyx) | 🔄 En desarrollo |
| Endpoint check-availability | ✅ Operativo |

### Calidad del Código

| Métrica | Valor |
|---------|-------|
| Tests unitarios | 276 tests ✅ |
| Tests E2E | Playwright configurado |
| Coverage | Vitest v8 |
| TypeScript | Estricto |
| Linting | ESLint + Next.js |

---

## 🤝 Contributing

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 📞 Contacto

**Anfitrión** - Plataforma de Reservas para Hostelería

[Website](https://anfitrion.co) · [Support](mailto:soporte@anfitrion.co)

---

<div align="center">

Hecho con ❤️ para restaurantes modernos

</div>
