# API de Reservas

> Documentación de la API del Sistema de Reservas
> Versión: 1.0.0 | Última actualización: 2026-03-30

---

## 🔒 Autenticación

La API no requiere autenticación para endpoints públicos. Para endpoints de administración, se usa header `X-Voice-Bridge-Key`.

---

## 📚 Endpoints

### Reservas
- [POST /api/reservations](./reservations/POST-create.md) - Crear reserva
- [GET /api/reservations](./reservations/GET-list.md) - Listar reservas
- [GET /api/reservations/code/[code]](./reservations/GET-by-code.md) - Buscar por código
- [DELETE /api/reservations/[id]](./reservations/DELETE-cancel.md) - Cancelar reserva
- [POST /api/reservations/check-availability](./reservations/POST-check-availability.md) - Verificar disponibilidad

### Administración
- [GET /api/admin/dashboard/stats](../admin/dashboard-stats.md) - Estadísticas dashboard
- [POST /api/admin/services](../admin/services.md) - Crear servicio
- [PUT /api/admin/services/[id]](../admin/update-service.md) - Actualizar servicio

---

## 🎯 Formatos Comunes

### Fecha
```
YYYY-MM-DD  // Ejemplo: 2026-04-15
```

### Hora
```
HH:MM       // Ejemplo: 14:00 (formato 24h)
```

### Teléfono español
```
+34 6XX XXX XXX   // Con prefijo internacional
6XX XXX XXX       // Sin prefijo (9 dígitos)
```

### Código de reserva
```
RES-XXXXX        // Ejemplo: RES-A1B2C
```

---

## 📥 Respuestas Estándar

### 200 OK
```json
{
  "reservation": { ... },
  "message": "Mensaje descriptivo"
}
```

### 201 Created
```json
{
  "reservation": { ... },
  "reservationCode": "RES-A1B2C",
  "message": "Reserva creada exitosamente"
}
```

### 400 Bad Request
```json
{
  "error": "Datos inválidos",
  "details": [
    {
      "code": "invalid_string",
      "message": "Teléfono inválido",
      "path": ["customerPhone"]
    }
  ]
}
```

### 404 Not Found
```json
{
  "error": "Reserva no encontrada"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error al procesar la solicitud"
}
```

---

## 🔄 Campos Híbridos

La API acepta campos en **español** (legacy) e **inglés** (admin):

| Español | Inglés |
|---------|--------|
| nombre | customerName |
| numero | customerPhone |
| fecha | reservationDate |
| hora | reservationTime |
| invitados | partySize |
| idMesa | tableId |
| fuente | source |
| restaurante | restaurantId |
| observaciones | specialRequests |
