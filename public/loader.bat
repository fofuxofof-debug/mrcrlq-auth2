@echo off
chcp 65001 >nul
title Hooked Auth - Game Loader
cls
echo ========================================================
echo             HOOKED AUTH - GAME LOADER
echo ========================================================
echo.

set "SERVER_URL=https://mrcbypassauth.vercel.app"
set "GAME=%~1"

if "%GAME%"=="" (
    echo [?] Selecione o jogo para iniciar o Loader:
    echo.
    echo   [1] FiveM
    echo   [2] Valorant
    echo   [3] Free Fire
    echo.
    set /p "CHOICE=Digite o numero [1-3]: "
    if "%CHOICE%"=="1" set "GAME=FiveM"
    if "%CHOICE%"=="2" set "GAME=Valorant"
    if "%CHOICE%"=="3" set "GAME=Free Fire"
)

if "%GAME%"=="" (
    echo [ERRO] Escolha invalida.
    pause
    exit /b 1
)

echo.
echo [*] Jogo Selecionado: %GAME%
echo.
set /p "KEY=[>] Digite a sua Chave de Licenca (Key): "

if "%KEY%"=="" (
    echo [ERRO] A chave nao pode estar em branco.
    pause
    exit /b 1
)

echo.
echo [*] Verificando licenca e autenticando...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference = 'SilentlyContinue'; " ^
  "$key = '%KEY%'.Trim(); " ^
  "$game = '%GAME%'.Trim(); " ^
  "$url = '%SERVER_URL%/api/loader/download?key=' + [uri]::EscapeDataString($key) + '&game=' + [uri]::EscapeDataString($game); " ^
  "$outFile = '%GAME%-Loader.exe'; " ^
  "try { " ^
  "  $resp = Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing -TimeoutSec 30; " ^
  "  Write-Host '[+] Licenca autenticada com sucesso!' -ForegroundColor Green; " ^
  "  Write-Host '[+] Loader baixado: ' $outFile -ForegroundColor Green; " ^
  "  Write-Host '[*] Iniciando o executavel...' -ForegroundColor Cyan; " ^
  "  Start-Process -FilePath $outFile; " ^
  "} catch { " ^
  "  Write-Host '[ERRO] Falha ao autenticar ou baixar o loader.' -ForegroundColor Red; " ^
  "  Write-Host 'Verifique se sua chave esta ativa, correta e se o loader foi enviado no painel.' -ForegroundColor Yellow; " ^
  "  if (Test-Path $outFile) { Remove-Item $outFile -Force -ErrorAction SilentlyContinue } " ^
  "  exit 1; " ^
  "}"

echo.
pause
