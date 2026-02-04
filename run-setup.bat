@echo off
chcp 65001 >nul
set PATH=C:\Program Files\Docker\Docker\resources\bin;%PATH%

cd /d "%~dp0"

echo === Iniciando contenedores Docker ===
docker compose up -d

echo.
echo === Esperando que PostgreSQL este listo ===
timeout /t 8 /nobreak >nul

echo.
echo === Ejecutando migraciones de base de datos ===
call npm run db:push

echo.
echo === Iniciando servidor de desarrollo ===
echo Abre http://localhost:3000 en tu navegador
call npm run dev
