#!/bin/bash
# Script de deploy a Vercel
# Ejecutar en tu terminal local

echo "🚀 Deployando a Vercel..."

# Opción 1: Si tienes Vercel CLI instalado
echo ""
echo "Método 1: Vercel CLI"
echo "npx vercel --prod"
echo ""

# Opción 2: Si tienes el token actualizado
echo "Método 2: Con token"
echo "export VERCEL_TOKEN='tu-token-aqui'"
echo "npx vercel --prod"
echo ""

# Ejecutar
npx vercel --prod
