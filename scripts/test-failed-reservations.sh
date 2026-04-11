#!/bin/bash

echo "=== Probando reserva fallida ==="
RESPONSE=$(curl -s -X POST https://microbts.online/api/voice-bridge \
  -H "Content-Type: application/json" \
  -H "X-Voice-Bridge-Key: 2e5b39c9ea5ccf8d6d1b59ea0b49ed25dfaa2876c7738bf1697252d87b0bd73b" \
  -d '{"action":"createReservation","params":{"customerName":"Test","customerPhone":"600000000","date":"2026-12-25","time":"23:00","partySize":50}}')
echo "Respuesta: $RESPONSE"

echo ""
echo "=== Verificando failed_reservations ==="
curl -s https://microbts.online/api/failed-reservations \
  -H "x-admin-api-key: admin-recovery-key-2026"
