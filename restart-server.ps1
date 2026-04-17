# Kill all Node processes and restart the server

Write-Host "🛑 Stopping all Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "✅ All Node processes stopped" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting Telegram Bot server..." -ForegroundColor Cyan
Write-Host ""

# Start the server
npm run server
