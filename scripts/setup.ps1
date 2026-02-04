# Setup Script para Sistema de Reservaciones (PowerShell)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP - Sistema de Reservaciones" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Docker
try {
    docker --version | Out-Null
    Write-Host "[OK] Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker no esta instalado." -ForegroundColor Red
    Write-Host ""
    Write-Host "Descarga Docker Desktop desde:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/"
    Write-Host ""
    Read-Host "Presiona Enter para salir"
    exit 1
}

# Verificar Node.js
try {
    node --version | Out-Null
    Write-Host "[OK] Node.js encontrado" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js no esta instalado." -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host ""

# Instalar dependencias
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Instalando dependencias..." -ForegroundColor Yellow
    npm install
}
Write-Host "[OK] Dependencias instaladas" -ForegroundColor Green

Write-Host ""

# Iniciar Docker
Write-Host "[INFO] Iniciando PostgreSQL y Redis..." -ForegroundColor Yellow
docker-compose up -d

Write-Host "[INFO] Esperando a que la base de datos este lista..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Migraciones
Write-Host "[INFO] Ejecutando migraciones..." -ForegroundColor Yellow
npm run db:push

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Ejecuta: npm run dev" -ForegroundColor Cyan
Write-Host "Luego abre: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Read-Host "Presiona Enter para continuar"
