@echo off
echo ========================================
echo   RESET BASE DE DATOS
echo ========================================
echo.
echo [ADVERTENCIA] Esto eliminara todos los datos!
echo.
set /p confirm="Escriba 'SI' para confirmar: "
if /i not "%confirm%"=="SI" (
    echo Operacion cancelada.
    pause
    exit /b 0
)

echo.
echo [INFO] Eliminando contenedores y volumenes...
docker-compose down -v

echo [INFO] Recreando base de datos...
docker-compose up -d

timeout /t 5 /nobreak >nul

echo [INFO] Ejecutando migraciones...
call npm run db:push

echo.
echo [OK] Base de datos reiniciada
echo.
pause
