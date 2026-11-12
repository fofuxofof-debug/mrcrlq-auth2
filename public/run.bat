@echo off
chcp 65001 >nul
title Hooked Auth - Game Loader CLI
cls

echo ==================================================================
echo                     HOOKED AUTH - GAME LOADER                    
echo                SISTEMA DE AUTENTICAÇÃO E DOWNLOAD                 
echo ==================================================================
echo.

set "SERVER_URL=https://mrcrlq-auth2.vercel.app"

echo [*] Servidor de Autenticação: ONLINE
echo.
set /p "KEY=[>] Digite a sua Chave de Licença (Key): "

if "%KEY%"=="" (
    echo.
    echo [-] ERRO: A chave de licença não pode estar em branco.
    echo.
    pause
    exit /b 1
)

echo.
echo [*] Conectando ao servidor e validando licença...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference = 'SilentlyContinue'; " ^
  "$key = '%KEY%'.Trim().Trim('""').Trim(''''); " ^
  "$url = '%SERVER_URL%/api/loader/validate?key=' + [uri]::EscapeDataString($key); " ^
  "try { " ^
  "  $resp = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 15; " ^
  "  if (-not $resp.success) { exit 2 } " ^
  "  Write-Host '[+] LICENÇA AUTENTICADA COM SUCESSO!' -ForegroundColor Green; " ^
  "  Write-Host ' [•] Cliente  : ' -NoNewline; Write-Host $resp.license.name -ForegroundColor White; " ^
  "  Write-Host ' [•] Plano    : ' -NoNewline; Write-Host $resp.license.plano -ForegroundColor Cyan; " ^
  "  Write-Host ' [•] Validade : ' -NoNewline; Write-Host $resp.license.expiry -ForegroundColor Yellow; " ^
  "  Write-Host ' [•] Status   : ' -NoNewline; Write-Host 'ATIVO' -ForegroundColor Green; " ^
  "} catch { exit 1 }"

if errorlevel 2 (
    echo.
    echo [-] ACESSO NEGADO: Licença suspensa ou bloqueada.
    echo.
    pause
    exit /b 1
)
if errorlevel 1 (
    echo.
    echo [-] FALHA NA AUTENTICAÇÃO: Chave inválida, expirada ou inexistente.
    echo.
    pause
    exit /b 1
)

echo ------------------------------------------------------------------
echo.
echo [?] Selecione qual Loader deseja instalar e executar:
echo.
echo    [1] Free Fire
echo    [2] FiveM
echo    [3] Valorant
echo.
set /p "CHOICE=[>] Digite o número da opção desejada [1-3] (Padrão: 1): "

set "GAME=Free Fire"
if "%CHOICE%"=="2" set "GAME=FiveM"
if "%CHOICE%"=="3" set "GAME=Valorant"

echo.
echo [*] Jogo Selecionado: %GAME%
echo [*] Baixando executável oficial do servidor...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference = 'SilentlyContinue'; " ^
  "$key = '%KEY%'.Trim().Trim('""').Trim(''''); " ^
  "$game = '%GAME%'.Trim(); " ^
  "$url = '%SERVER_URL%/api/loader/download?key=' + [uri]::EscapeDataString($key) + '&game=' + [uri]::EscapeDataString($game); " ^
  "$dest = Join-Path $env:USERPROFILE 'Downloads' ($game.Replace(' ', '') + '-Loader.exe'); " ^
  "try { " ^
  "  Invoke-WebRequest -Uri $url -OutFile $dest -TimeoutSec 60; " ^
  "  if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 1000)) { " ^
  "    Write-Host '[+] DOWNLOAD CONCLUÍDO COM SUCESSO!' -ForegroundColor Green; " ^
  "    Write-Host (' [•] Arquivo salvo em: ' + $dest) -ForegroundColor White; " ^
  "    Write-Host '[*] Iniciando o executável automaticamente...' -ForegroundColor Cyan; " ^
  "    Start-Process -FilePath $dest; " ^
  "    exit 0; " ^
  "  } else { exit 3 } " ^
  "} catch { exit 4 }"

if errorlevel 1 (
    echo.
    echo [-] ERRO: Falha ao baixar o arquivo. Verifique se a sua chave tem acesso ao jogo.
    echo.
    pause
    exit /b 1
)

echo.
echo [+] Processo concluído com sucesso.
timeout /t 3 >nul
exit /b 0
