@echo off
echo ========================================
echo   SETUP - Sistema de Reservaciones
echo ========================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado.
    echo.
    echo Descarga Docker Desktop desde:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo [OK] Docker encontrado
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

REM Instalar dependencias si no existen
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    call npm install
    echo.
)

echo [OK] Dependencias instaladas
echo.

REM Iniciar contenedores Docker
echo [INFO] Iniciando PostgreSQL y Redis...
docker-compose up -d

REM Esperar a que PostgreSQL esté listo
echo [INFO] Esperando a que la base de datos este lista...
timeout /t 5 /nobreak >nul

REM Ejecutar migraciones
echo [INFO] Ejecutando migraciones de base de datos...
call npm run db:push

echo.
echo ========================================
echo   SETUP COMPLETADO
echo ========================================
echo.
echo Ejecuta 'npm run dev' o 'scripts\start.bat' para iniciar
echo.
pause
