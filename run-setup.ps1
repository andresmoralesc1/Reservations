$env:PATH = "C:\Program Files\Docker\Docker\resources\bin;" + $env:PATH
Set-Location "C:\Users\Alejandro Martínez\OneDrive\Desktop\IA\IA para El Posit\Posit\Reservations"

Write-Host "=== Iniciando contenedores Docker ===" -ForegroundColor Cyan
docker compose up -d

Write-Host "`n=== Esperando que PostgreSQL esté listo ===" -ForegroundColor Cyan
Start-Sleep -Seconds 8

Write-Host "`n=== Ejecutando migraciones de base de datos ===" -ForegroundColor Cyan
npm run db:push

Write-Host "`n=== Iniciando servidor de desarrollo ===" -ForegroundColor Cyan
Write-Host "Abre http://localhost:3000 en tu navegador" -ForegroundColor Green
npm run dev
