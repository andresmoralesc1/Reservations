# Setup de Desarrollo

> Guía de configuración del entorno de desarrollo
> Proyecto: Sistema de Reservas

---

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** 20+ - [Descargar](https://nodejs.org/)
- **pnpm** o **npm** - Gestor de paquetes
- **Git** - Control de versiones
- **VS Code** - Editor recomendado (con extensiones: ESLint, Prettier, Tailwind CSS IntelliSense)

---

## 🚀 Instalación Rápida

### 1. Clonar el repositorio

```bash
git clone https://github.com/andresmoralesc1/Reservations.git
cd Reservations
```

### 2. Instalar dependencias

```bash
npm install
# o
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/reservations

# Supabase (opcional)
NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Voice Bridge (opcional)
VOICE_BRIDGE_API_KEY=your-api-key

# Twilio (opcional, para WhatsApp)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
```

### 4. Iniciar la base de datos

#### Opción A: PostgreSQL local

```bash
# Asegúrate de tener PostgreSQL corriendo
# Crear la base de datos
createdb reservations

# Aplicar migraciones
npm run db:push
```

#### Opción B: Supabase (recomendado)

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a Settings → Database → Connection string
3. Copia la URL y pégala en `DATABASE_URL`

```bash
# Aplicar schema
npm run db:push
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3004](http://localhost:3004)

---

## 🛠️ Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo (puerto 3004) |
| `npm run build` | Build para producción |
| `npm run start` | Inicia servidor de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run test` | Ejecuta tests (Vitest) |
| `npm run test:ui` | UI de Vitest |
| `npm run test:coverage` | Reporte de cobertura |
| `npm run db:generate` | Genera migración Drizzle |
| `npm run db:push` | Aplica migraciones a la BD |
| `npm run db:studio` | Abre Drizzle Studio |

---

## 🗄️ Drizzle Studio

Para visualizar y editar la base de datos:

```bash
npm run db:studio
```

Abre [http://localhost:4983](http://localhost:4983) en tu navegador.

---

## 🧪 Testing

### Ejecutar todos los tests

```bash
npm run test
```

### UI de Tests

```bash
npm run test:ui
```

### Coverage

```bash
npm run test:coverage
```

El reporte se genera en `coverage/index.html`.

---

## 🐛 Troubleshooting

### Error: "Database connection failed"

Verifica que `DATABASE_URL` en `.env.local` sea correcta y que PostgreSQL esté corriendo.

### Error: "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 3004 already in use"

```bash
# Windows (PowerShell)
netstat -ano | findstr :3004
# Termina el proceso con el PID mostrado

# Linux/Mac
lsof -ti:3004 | xargs kill -9
```

### Error: "Migración falló"

```bash
# Regenerar migraciones
rm -rf drizzle/migrations
npm run db:generate
npm run db:push
```

---

## 📁 Estructura del Proyecto

```
Reservations/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes
│   │   ├── admin/           # Admin Panel
│   │   └── ...
│   ├── components/         # Componentes React
│   ├── lib/                # Lógica de negocio
│   │   ├── availability/    # Servicios de disponibilidad
│   │   ├── db/              # Cliente Drizzle
│   │   ├── services/        # Servicios de reservas
│   │   │   └── legacy/      # Módulos legacy
│   │   └── ...
│   ├── types/              # Tipos TypeScript
│   └── __tests__/          # Tests
├── docs/                   # Documentación
├── drizzle/               # Schema y migraciones
└── public/                # Archivos estáticos
```

---

## 🔗 Links Útiles

- [Next.js Docs](https://nextjs.org/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Supabase Docs](https://supabase.com/docs)
- [Vitest Docs](https://vitest.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
