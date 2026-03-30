# POST /api/reservations/check-availability

Verifica la disponibilidad de mesas para una fecha, hora y número de personas.

---

## 🔗 Endpoint

```
POST /api/reservations/check-availability
```

---

## 📥 Request

### Headers

```http
Content-Type: application/json
```

### Body

```json
{
  "date": "2026-04-15",
  "time": "20:00",
  "party_size": 4,
  "restaurant_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

También acepta campos camelCase:

```json
{
  "date": "2026-04-15",
  "time": "20:00",
  "partySize": 4,
  "restaurantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

---

## 📤 Response

### 200 OK - Disponible

```json
{
  "available": true,
  "availableTables": [
    {
      "id": "table-1",
      "tableNumber": "1",
      "tableCode": "I-1",
      "capacity": 4,
      "location": "interior",
      "isAccessible": false
    },
    {
      "id": "table-2",
      "tableNumber": "2",
      "tableCode": "I-2",
      "capacity": 4,
      "location": "interior",
      "isAccessible": false
    }
  ],
  "suggestedTables": ["table-1"],
  "service": {
    "id": "service-1",
    "name": "Cena Fin de Semana",
    "serviceType": "cena",
    "startTime": "20:00",
    "endTime": "23:00"
  }
}
```

### 200 OK - No disponible

```json
{
  "available": false,
  "availableTables": [],
  "suggestedTables": [],
  "message": "No hay servicio configurado para esta fecha y hora",
  "alternativeSlots": [
    { "time": "19:30", "available": true },
    { "time": "20:30", "available": true },
    { "time": "21:00", "available": false }
  ]
}
```

---

## ✅ Validaciones

| Campo | Validación |
|-------|-------------|
| date | Formato YYYY-MM-DD, debe ser hoy o futuro |
| time | Formato HH:MM |
| party_size | Entero entre 1 y 50 |
| restaurant_id | UUID válido (opcional, usa default si no se provee) |

---

## ❌ Errores

### 400 Bad Request - Fecha inválida

```json
{
  "error": "Datos inválidos",
  "details": [
    {
      "code": "invalid_string",
      "message": "Formato de fecha inválido (YYYY-MM-DD)",
      "path": ["date"]
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

### 400 Bad Request - Party size fuera de rango

```json
{
  "error": "Datos inválidos",
  "details": [
    {
      "code": "too_small",
      "message": "El tamaño del grupo debe estar entre 1 y 50",
      "path": ["party_size"]
    }
  ]
}
```

---

## 💡 Ejemplos

### cURL

```bash
curl -X POST https://api.example.com/api/reservations/check-availability \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-05-01",
    "time": "20:00",
    "party_size": 4
  }'
```

### JavaScript fetch

```javascript
const response = await fetch('/api/reservations/check-availability', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    date: '2026-05-01',
    time: '20:00',
    partySize: 4
  })
})

const result = await response.json()

if (result.available) {
  console.log(`Mesas disponibles: ${result.availableTables.length}`)
  console.log(`Mesas sugeridas: ${result.suggestedTables.join(', ')}`)
} else {
  console.log(`Mensaje: ${result.message}`)
  console.log(`Alternativas: ${result.alternativeSlots.map(s => s.time).join(', ')}`)
}
```

### React Hook Example

```typescript
import { useState } from 'react'

export function useAvailability() {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState(null)

  const checkAvailability = async (date: string, time: string, partySize: number) => {
    setChecking(true)
    try {
      const response = await fetch('/api/reservations/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, party_size: partySize })
      })
      const data = await response.json()
      setResult(data)
    } finally {
      setChecking(false)
    }
  }

  return { checkAvailability, checking, result }
}
```
