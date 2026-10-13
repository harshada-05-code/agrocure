# AgroCure Concurrent PowerShell Startup Script
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $RootDir

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Starting AgroCure Backend Ecosystem" -ForegroundColor Cyan
Write-Host " 1. NestJS Gateway Orchestrator: http://localhost:3000" -ForegroundColor Yellow
Write-Host " 2. FastAPI ML Engine:          http://localhost:8000" -ForegroundColor Yellow
Write-Host " 3. Frontend Target:            https://agrocure.vercel.app/" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Green

$PythonPath = Join-Path $RootDir "ml_service\.venv\Scripts\python.exe"
if (-not (Test-Path $PythonPath)) {
    $PythonPath = "python"
}

Write-Host "[1/2] Launching FastAPI ML Engine on Port 8000..." -ForegroundColor Cyan
$MlProcess = Start-Process -FilePath $PythonPath -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" -WorkingDirectory (Join-Path $RootDir "ml_service") -PassThru

Write-Host "[2/2] Launching NestJS Gateway Orchestrator on Port 3000..." -ForegroundColor Cyan
$OrchProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run start" -WorkingDirectory (Join-Path $RootDir "orchestrator") -PassThru

Write-Host "Both processes launched! Press Ctrl+C in this console or close the window to stop." -ForegroundColor Green

try {
    Wait-Process -Id $MlProcess.Id, $OrchProcess.Id
} finally {
    Write-Host "Stopping child processes..." -ForegroundColor Yellow
    Stop-Process -Id $MlProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $OrchProcess.Id -ErrorAction SilentlyContinue
}
