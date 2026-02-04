@echo off
echo ========================================
echo   INICIANDO - Sistema de Reservaciones
echo ========================================
echo.

REM Verificar si Docker está corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta corriendo.
    echo Abre Docker Desktop e intenta de nuevo.
    pause
    exit /b 1
)

REM Iniciar contenedores si no están corriendo
docker-compose ps | findstr "reservations-postgres" >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Iniciando base de datos...
    docker-compose up -d
    timeout /t 3 /nobreak >nul
)

echo [OK] Base de datos corriendo
echo.
echo [INFO] Iniciando servidor de desarrollo...
echo [INFO] Abre http://localhost:3000 en tu navegador
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

npm run dev
