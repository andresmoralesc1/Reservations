#!/bin/bash
echo "🍽️ Iniciando El Posit..."
docker-compose up -d
echo "⏳ Esperando servicios..."
sleep 3
npm run dev
