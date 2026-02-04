@echo off
title Sistema de Reservaciones
color 0B

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║                                                           ║
echo  ║        SISTEMA DE RESERVAS DE RESTAURANTE                 ║
echo  ║                                                           ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.
echo  Selecciona una opcion:
echo.
echo    [1] Configuracion inicial (primera vez)
echo    [2] Iniciar servidor
echo    [3] Detener servicios
echo    [4] Reiniciar base de datos
echo    [5] Abrir en navegador
echo    [6] Ver logs de Docker
echo    [0] Salir
echo.
set /p opcion="  Tu opcion: "

if "%opcion%"=="1" call scripts\setup.bat
if "%opcion%"=="2" call scripts\start.bat
if "%opcion%"=="3" call scripts\stop.bat
if "%opcion%"=="4" call scripts\reset-db.bat
if "%opcion%"=="5" start http://localhost:3000
if "%opcion%"=="6" docker-compose logs -f
if "%opcion%"=="0" exit

pause
