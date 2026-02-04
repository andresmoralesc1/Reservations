# Guía de Inicio Rápido

## Requisitos

- [x] Node.js (ya instalado - v24.13.0)
- [x] Docker Desktop (instalado)

## Instalación de Docker Desktop

1. Descarga desde: https://www.docker.com/products/docker-desktop/
2. Ejecuta el instalador
3. Reinicia si es necesario
4. Abre Docker Desktop y espera a que muestre "Docker is running"

## Inicio Rápido

### Opción 1: Scripts automáticos (Recomendado)

```
scripts\setup.bat      # Primera vez - configura todo
scripts\start.bat      # Inicia el servidor
scripts\stop.bat       # Detiene todo
scripts\reset-db.bat   # Reinicia la base de datos
```

### Opción 2: Comandos manuales

```bash
# 1. Iniciar base de datos
docker-compose up -d

# 2. Ejecutar migraciones
npm run db:push

# 3. Iniciar servidor
npm run dev
```

## URLs

- **Aplicación**: http://localhost:3000
- **Admin**: http://localhost:3000/admin

## Estructura de Archivos

```
Reservations/
├── scripts/              # Scripts de automatización
│   ├── setup.bat         # Configuración inicial
│   ├── start.bat         # Iniciar servidor
│   ├── stop.bat          # Detener servicios
│   └── reset-db.bat      # Reiniciar BD
├── src/                  # Código fuente
│   ├── app/              # Páginas y APIs
│   ├── components/       # Componentes React
│   └── lib/              # Utilidades
├── drizzle/              # Esquema de BD
├── docker-compose.yml    # Contenedores Docker
├── .env                  # Variables de entorno
└── package.json          # Dependencias
```

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run db:push` | Aplicar cambios a BD |
| `npm run db:studio` | Abrir Drizzle Studio (GUI de BD) |
| `docker-compose up -d` | Iniciar PostgreSQL/Redis |
| `docker-compose down` | Detener contenedores |
| `docker-compose logs -f` | Ver logs de contenedores |

## Configuración de Supabase (Opcional)

Para autenticación completa:

1. Crea cuenta en https://supabase.com
2. Crea un nuevo proyecto
3. Ve a Settings > API
4. Copia `URL` y `anon key` al archivo `.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Solución de Problemas

### Docker no inicia
- Asegúrate de que Docker Desktop esté corriendo
- En Windows, verifica que WSL2 esté habilitado

### Error de conexión a BD
```bash
docker-compose down
docker-compose up -d
# Espera 5 segundos
npm run db:push
```

### Puerto 3000 ocupado
```bash
# Buscar proceso
netstat -ano | findstr :3000
# Terminar proceso (reemplaza PID)
taskkill /PID <PID> /F
```
