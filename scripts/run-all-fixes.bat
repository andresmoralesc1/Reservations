@echo off
echo ========================================
echo Fixing El Posit Restaurant Data
echo ========================================
echo.

echo [1/2] Fixing Timezone...
echo.
node scripts/fix-timezone.js
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Timezone fix failed!
    pause
    exit /b 1
)
echo.
echo ✅ Timezone fixed!
echo.

echo [2/2] Fixing Encoding...
echo.
node scripts/fix-encoding.js
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Encoding fix failed!
    pause
    exit /b 1
)
echo.
echo ✅ Encoding fixed!
echo.

echo ========================================
echo ✅ ALL FIXES COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Timezone: America/Bogota → Europe/Madrid
echo Encoding: Corrupted UTF-8 characters fixed
echo.
pause
