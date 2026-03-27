# 🗄️ Database Migration Scripts

## 🚀 Opción 1: Ejecutar directamente en Supabase (RECOMENDADO)

### Pasos:

1. **Entra a Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre SQL Editor**
   - En el menú lateral, haz click en "SQL Editor"
   - Haz click en "New query"

3. **Ejecuta el script de Timezone**
   - Copia el contenido de `scripts/fix-timezone.sql`
   - Pégalo en el SQL Editor
   - Haz click en "Run" ▶️
   - Verifica que el resultado muestre `timezone = 'Europe/Madrid'`

4. **Ejecuta el script de Encoding**
   - Crea un "New query"
   - Copia el contenido de `scripts/fix-encoding.sql`
   - Pégalo en el SQL Editor
   - Haz click en "Run" ▶️
   - Verifica que las descripciones muestren "sábados" (no "s�bados")

## 🌐 Opción 2: Ejecutar vía API (después del deploy)

Espera a que Vercel termine el deploy (~2-3 minutos), luego visita:

```
https://reservations-eta-indol.vercel.app/api/admin/migrations/run-all
```

Deberías ver un JSON como:
```json
{
  "success": true,
  "timezone": {
    "success": true,
    "message": "✅ Updated 1 restaurant(s) timezone to Europe/Madrid"
  },
  "encoding": {
    "success": true,
    "message": "✅ Fixed encoding in X service(s)"
  }
}
```

## ✅ Cómo verificar los cambios

### En Supabase Dashboard:

**1. Verificar Timezone:**
```sql
SELECT name, timezone, updated_at
FROM restaurants;
```
Debería mostrar: `Europe/Madrid`

**2. Verificar Encoding:**
```sql
SELECT name, description
FROM services;
```
Debería mostrar: "sábados" (no "s�bados")

### En la App:

Visita la página de Servicios del admin:
```
https://reservations-eta-indol.vercel.app/admin/services
```

Los servicios deberían mostrar correctamente:
- ✅ "Servicio de cena sábados y domingos"
- ❌ "Servicio de cena s_bados y domingos"

## 📝 Scripts Disponibles:

- `scripts/fix-timezone.sql` - Corrige timezone a Europe/Madrid
- `scripts/fix-encoding.sql` - Corrige caracteres UTF-8 corruptos
- `scripts/fix-timezone.js` - Script Node.js (requiere .env)
- `scripts/fix-encoding.js` - Script Node.js (requiere .env)
- `scripts/run-all-fixes.bat` - Ejecuta ambos scripts JS

## ⚠️ Notas:

- Los scripts SQL son los más confiables para ejecutar directamente
- Los scripts JS requieren configuración de .env local
- Las API routes funcionan después del deploy de Vercel
- Siempre haz backup antes de ejecutar migraciones

## 🔍 Troubleshooting:

**Si ves 404 en las API routes:**
- El deploy aún no se ha completado (espera 2-3 minutos)
- Verifica que las rutas estén en: `src/app/api/admin/migrations/`

**Si los scripts SQL no funcionan:**
- Verifica que tengas permisos de admin en Supabase
- Revisa la sintaxis SQL
- Verifica que la tabla `restaurants` y `services` existan

**Si los cambios no se reflejan en la app:**
- Limpia el caché del navegador
- Verifica que estés viendo la versión desplegada (no localhost)
- Revisa la consola del navegador por errores
