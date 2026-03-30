# POST /api/reservations

Crea una nueva reserva en el sistema.

---

## 🔗 Endpoint

```
POST /api/reservations
```

---

## 📥 Request

### Headers

```http
Content-Type: application/json
```

### Body - Campos en Español (Legacy)

```json
{
  "nombre": "Carlos García",
  "numero": "+34 612 345 678",
  "fecha": "2026-04-15",
  "hora": "20:00",
  "invitados": 4,
  "idMesa": "I-1",
  "fuente": "WEB",
  "restaurante": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "observaciones": "Cumpleaños"
}
```

### Body - Campos en Inglés (Admin)

```json
{
  "customerName": "Carlos García",
  "customerPhone": "+34 612 345 678",
  "reservationDate": "2026-04-15",
  "reservationTime": "20:00",
  "partySize": 4,
  "specialRequests": "Cumpleaños",
  "source": "MANUAL",
  "restaurantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "confirmImmediately": true
}
```

---

## 📤 Response

### 201 Created

```json
{
  "reservation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "reservationCode": "RES-A1B2C",
    "customerName": "Carlos García",
    "customerPhone": "612345678",
    "reservationDate": "2026-04-15",
    "reservationTime": "20:00",
    "partySize": 4,
    "tableIds": ["table-1"],
    "status": "PENDIENTE",
    "source": "WEB"
  },
  "reservationCode": "RES-A1B2C"
}
```

---

## ✅ Validaciones

| Campo | Validación |
|-------|-------------|
| nombre | Mínimo 2 caracteres |
| numero | Teléfono español válido (9 dígitos, opcional +34) |
| fecha | Formato YYYY-MM-DD, debe ser hoy o futuro |
| hora | Formato HH:MM (00:00 - 23:59) |
| invitados | Entero entre 1 y 50 |
| fuente | WEB, WHATSAPP, VOICE, MANUAL, IVR |

---

## ❌ Errores

### 400 Bad Request - Campos faltantes

```json
{
  "error": "Datos inválidos"
}
```

### 400 Bad Request - Teléfono inválido

```json
{
  "error": "Datos inválidos",
  "details": [
    {
      "code": "invalid_string",
      "message": "Teléfono inválido",
      "path": ["numero"]
    }
  ]
}
```

### 400 Bad Request - Fecha pasada

```json
{
  "error": "La fecha debe ser hoy o en el futuro"
}
```

### 500 Internal Server Error

```json
{
  "error": "Error al crear reserva"
}
```

---

## 💡 Ejemplos

### cURL

```bash
curl -X POST https://api.example.com/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María López",
    "numero": "623456789",
    "fecha": "2026-05-01",
    "hora": "14:00",
    "invitados": 2
  }'
```

### JavaScript fetch

```javascript
const response = await fetch('/api/reservations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerName: 'María López',
    customerPhone: '623456789',
    reservationDate: '2026-05-01',
    reservationTime: '14:00',
    partySize: 2,
    source: 'WEB'
  })
})

const data = await response.json()
console.log(data.reservationCode) // "RES-A1B2C"
```

### Axios

```javascript
import axios from 'axios'

const { data } = await axios.post('/api/reservations', {
  nombre: 'María López',
  numero: '623456789',
  fecha: '2026-05-01',
  hora: '14:00',
  invitados: 2
})

console.log(data.reservationCode)
```
