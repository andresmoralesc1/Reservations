# Deployment - Servidor Propio (PM2)

## Requisitos previos

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Instalar dependencias del proyecto
npm install
```

## Build del proyecto

```bash
npm run build
```

## Configuración

1. Copiar `.env.example` a `.env` y configurar variables:
   ```bash
   cp .env.example .env
   ```

2. Editar `.env` con tus credenciales de base de datos, Redis, etc.

## Iniciar con PM2

```bash
# Iniciar todos los servicios
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs

# Guardar configuración (para reiniciar automáticamente)
pm2 save
pm2 startup  # Seguir instrucciones que muestra
```

## Comandos útiles PM2

```bash
# Reiniciar todos
pm2 restart all

# Reiniciar uno específico
pm2 restart reservations-api
pm2 restart analytics-aggregator

# Detener
pm2 stop all

# Eliminar
pm2 delete all

# Monitor
pm2 monit
```

## Cron Job de Analíticas

El cron job `analytics-aggregator` se ejecuta automáticamente todos los días a las 2:00 AM.

Para probar manualmente:
```bash
node scripts/analytics-cron.js
```

## Backfill de datos históricos

Para poblar `daily_analytics` con datos históricos:

```bash
# Con npx tsx (desarrollo)
npx tsx scripts/backfill-analytics.ts <restaurant_id> "2024-01-01" "2024-03-31"

# O convertir a JS para producción
node scripts/backfill-analytics.js <restaurant_id> "2024-01-01" "2024-03-31"
```

## Logs

Los logs se guardan en `./logs/`:
- `out.log` - Output general
- `err.log` - Errores
- `analytics-out.log` - Output del cron de analíticas
- `analytics-err.log` - Errores del cron de analíticas

## Actualizar el código

```bash
# Pull de cambios
git pull

# Instalar nuevas dependencias
npm install

# Rebuild
npm run build

# Reiniciar PM2
pm2 restart all

# O reload (sin downtime si usas cluster mode)
pm2 reload all
```
