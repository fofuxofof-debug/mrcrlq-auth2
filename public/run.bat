@echo off
chcp 65001 >nul
title HOOKED AUTH // VIP CLIENT LOADER
cls

echo.
echo  ┌────────────────────────────────────────────────────────────────────┐
echo  │    __  ______  ____  __ __ __________                              │
echo  │   / / / / __ \/ __ \/ //_// ____/ __ \     H O O K E D   A U T H   │
echo  │  / /_/ / / / / / / / ,<  / __/ / / / /     Game Client Loader      │
echo  │ / __  / /_/ / /_/ / /| |/ /___/ /_/ /      Build 2026 [PRO VIP]    │
echo  │/_/ /_/\____/\____/_/ |_/_____/_____/                               │
echo  └────────────────────────────────────────────────────────────────────┘
echo    [•] Servidor   : ONLINE (mrcrlq-auth2.vercel.app)
echo    [•] Seguranca  : TLS 1.3 + SHA-256 Cloud Protection
echo.
echo  ┌───[ AUTENTICACAO ]─────────────────────────────────────────────────┐
echo  │  Digite ou cole a sua Chave de Licenca (Key) abaixo:               │
echo  └────────────────────────────────────────────────────────────────────┘
echo.
set /p "KEY= [>] Digite sua Key: "

if "%KEY%"=="" (
    echo.
    echo  ┌───[ ERRO ]─────────────────────────────────────────────────────────┐
    echo  │  [!] A chave de licenca nao pode estar em branco.                  │
    echo  └────────────────────────────────────────────────────────────────────┘
    echo.
    pause
    exit /b 1
)

echo.
echo  [*] Conectando ao cluster seguro e validando chave...

set "SERVER_URL=https://mrcrlq-auth2.vercel.app"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference = 'SilentlyContinue'; " ^
  "$key = '%KEY%'.Trim().Trim('""').Trim(''''); " ^
  "$url = '%SERVER_URL%/api/loader/validate?key=' + [uri]::EscapeDataString($key); " ^
  "try { " ^
  "  $resp = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 15; " ^
  "  if (-not $resp.success) { exit 2 } " ^
  "  Write-Host ''; " ^
  "  Write-Host ' ┌───[ LICENCA AUTENTICADA ]──────────────────────────────────────────┐' -ForegroundColor Green; " ^
  "  Write-Host ' │                                                                    │' -ForegroundColor Green; " ^
  "  Write-Host ' │  [+] Cliente   : ' -NoNewline -ForegroundColor Green; Write-Host ('{0,-48}' -f $resp.license.name) -NoNewline -ForegroundColor White; Write-Host '│' -ForegroundColor Green; " ^
  "  Write-Host ' │  [+] Status    : ' -NoNewline -ForegroundColor Green; Write-Host ('{0,-48}' -f 'ATIVO & LIBERADO') -NoNewline -ForegroundColor Green; Write-Host '│' -ForegroundColor Green; " ^
  "  Write-Host ' │  [+] Plano     : ' -NoNewline -ForegroundColor Green; Write-Host ('{0,-48}' -f $resp.license.plano) -NoNewline -ForegroundColor Cyan; Write-Host '│' -ForegroundColor Green; " ^
  "  Write-Host ' │  [+] Expiracao : ' -NoNewline -ForegroundColor Green; Write-Host ('{0,-48}' -f $resp.license.expiry) -NoNewline -ForegroundColor Yellow; Write-Host '│' -ForegroundColor Green; " ^
  "  Write-Host ' │                                                                    │' -ForegroundColor Green; " ^
  "  Write-Host ' └────────────────────────────────────────────────────────────────────┘' -ForegroundColor Green; " ^
  "} catch { exit 1 }"

if errorlevel 2 (
    echo.
    echo  ┌───[ ACESSO NEGADO ]────────────────────────────────────────────────┐
    echo  │  [X] Chave suspensa ou banida pelo administrador.                  │
    echo  └────────────────────────────────────────────────────────────────────┘
    echo.
    pause
    exit /b 1
)
if errorlevel 1 (
    echo.
    echo  ┌───[ ACESSO NEGADO ]────────────────────────────────────────────────┐
    echo  │  [X] Chave invalida, expirada ou inexistente.                      │
    echo  └────────────────────────────────────────────────────────────────────┘
    echo.
    pause
    exit /b 1
)

echo.
echo  ┌───[ SELECIONE O JOGO ]─────────────────────────────────────────────┐
echo  │                                                                    │
echo  │  [1]  FREE FIRE   -^>  Aimbot + ESP + Safe Memory Bypass            │
echo  │  [2]  FIVEM       -^>  External Overlay + Silent Aim + Wallhack     │
echo  │  [3]  VALORANT    -^>  Hypervisor Driver + Visuals ESP              │
echo  │                                                                    │
echo  └────────────────────────────────────────────────────────────────────┘
echo.
set /p "CHOICE= [?] Digite o numero da opcao desejada [1, 2 ou 3] (Padrao: 1): "

set "GAME=Free Fire"
if "%CHOICE%"=="2" set "GAME=FiveM"
if "%CHOICE%"=="3" set "GAME=Valorant"

echo.
echo  [*] Jogo selecionado : %GAME%
echo  [*] Servidor Oficial : Baixando versao mais recente (.exe)...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference = 'SilentlyContinue'; " ^
  "$key = '%KEY%'.Trim().Trim('""').Trim(''''); " ^
  "$game = '%GAME%'.Trim(); " ^
  "$url = '%SERVER_URL%/api/loader/download?key=' + [uri]::EscapeDataString($key) + '&game=' + [uri]::EscapeDataString($game); " ^
  "$dest = Join-Path $env:USERPROFILE 'Downloads' ($game.Replace(' ', '') + '-Loader.exe'); " ^
  "try { " ^
  "  Invoke-WebRequest -Uri $url -OutFile $dest -TimeoutSec 60; " ^
  "  if ((Test-Path $dest) -and ((Get-Item $dest).Length -gt 1000)) { " ^
  "    $sizeMB = [math]::Round(((Get-Item $dest).Length / 1MB), 2); " ^
  "    Write-Host ''; " ^
  "    Write-Host ' ┌───[ DOWNLOAD CONCLUIDO ]───────────────────────────────────────────┐' -ForegroundColor Green; " ^
  "    Write-Host ' │                                                                    │' -ForegroundColor Green; " ^
  "    Write-Host ' │  [+] Arquivo salvo com sucesso na sua maquina!                     │' -ForegroundColor Green; " ^
  "    Write-Host ' │  [•] Caminho : ' -NoNewline -ForegroundColor DarkGray; Write-Host ('{0,-50}' -f ($dest + ' (' + $sizeMB + ' MB)')) -NoNewline -ForegroundColor White; Write-Host '│' -ForegroundColor Green; " ^
  "    Write-Host ' │                                                                    │' -ForegroundColor Green; " ^
  "    Write-Host ' └────────────────────────────────────────────────────────────────────┘' -ForegroundColor Green; " ^
  "    Write-Host ''; " ^
  "    Write-Host ' [★] Iniciando o executavel oficial automaticamente...' -ForegroundColor Cyan; " ^
  "    Start-Process -FilePath $dest; " ^
  "    Write-Host ' [+] Bom jogo!' -ForegroundColor Green; " ^
  "    exit 0; " ^
  "  } else { exit 3 } " ^
  "} catch { exit 4 }"

if errorlevel 1 (
    echo.
    echo  ┌───[ ERRO NO DOWNLOAD ]─────────────────────────────────────────────┐
    echo  │  [X] Falha ao transferir o executavel.                             │
    echo  │  [!] Verifique se sua licenca possui permissao para este jogo.     │
    echo  └────────────────────────────────────────────────────────────────────┘
    echo.
    pause
    exit /b 1
)

echo.
timeout /t 3 >nul
exit /b 0
