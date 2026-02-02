# Sistema de Reservas de Restaurante

Sistema completo de gestión de reservas con IVR de voz y confirmaciones por WhatsApp.

## Tech Stack

- **Framework**: Next.js 16 con TypeScript
- **Base de datos**: PostgreSQL con Drizzle ORM
- **Autenticación**: Supabase Auth
- **Cache**: Redis
- **Estilos**: Tailwind CSS

## Estructura del Proyecto

```
reservations/
├── drizzle/
│   ├── schema.ts           # Esquema de base de datos
│   └── migrations/         # Migraciones
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── reservations/    # API CRUD de reservas
│   │   │   ├── ivr/             # API para sistema IVR
│   │   │   └── admin/           # API admin
│   │   ├── admin/               # Dashboard de administración
│   │   └── page.tsx             # Landing page
│   ├── components/              # Componentes React
│   ├── lib/                     # Utilidades
│   │   ├── db.ts                # Cliente Drizzle
│   │   ├── redis.ts             # Cliente Redis
│   │   └── utils.ts             # Funciones helper
│   └── services/                # Lógica de negocio
│       └── availability.ts      # Algoritmo de disponibilidad
├── Dockerfile
├── drizzle.config.ts
└── package.json
```

## Instalación

1. Instalar dependencias:
```bash
cd /home/telchar/reservations
npm install
```

2. Crear base de datos:
```bash
docker exec -it telchar-postgres-1 psql -U neuralflow -c "CREATE DATABASE reservations_db;"
```

3. Generar y correr migraciones:
```bash
npm run db:generate
npm run db:push
```

## APIs

### Reservas

- `GET /api/reservations` - Listar reservas
- `POST /api/reservations` - Crear reserva
- `GET /api/reservations/[id]` - Obtener reserva
- `PUT /api/reservations/[id]` - Actualizar reserva
- `DELETE /api/reservations/[id]` - Cancelar reserva
- `GET /api/reservations/code/[code]` - Buscar por código

### IVR

- `POST /api/ivr` - Iniciar/procesar sesión IVR
- `DELETE /api/ivr?sessionId=xxx` - Finalizar sesión

### Admin

- `GET /api/admin/reservations` - Listar con filtros
- `GET /api/admin/reservations/pending` - Cola de pendientes
- `POST /api/admin/reservations/[id]` - Aprobar/rechazar

## Variables de Entorno

Ver `.env.example` para todas las variables requeridas.
