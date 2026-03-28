#!/bin/bash
echo "🍽️ El Posit - Setup Inicial"
echo "=========================="
echo ""
echo "1. Instalando dependencias..."
npm install
echo ""
echo "2. Configurando variables de entorno..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   ✅ .env creado desde .env.example"
  echo "   ⚠️  Edita .env con tus credenciales reales"
else
  echo "   ✅ .env ya existe"
fi
echo ""
echo "3. Iniciando servicios Docker..."
docker-compose up -d
echo ""
echo "4. Esperando a que PostgreSQL arranque..."
sleep 5
echo ""
echo "5. Aplicando migraciones de BD..."
npm run db:push
echo ""
echo "✅ Setup completado. Ejecuta: npm run dev"
