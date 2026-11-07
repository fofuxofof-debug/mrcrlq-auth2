@echo off
chcp 65001 >nul
title Plataforma SaaS - Localhost
cd /d "%~dp0"

echo ========================================================
echo        Iniciando Plataforma SaaS em Localhost
echo ========================================================
echo.

:: 1. Verificar se o Node.js esta instalado
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERRO] O Node.js não foi encontrado no sistema!
    echo Por favor, instale o Node.js baixando em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Identificar o gerenciador de pacotes (pnpm ou fallback para npx pnpm / npm)
set "PKG_CMD="
where pnpm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set "PKG_CMD=pnpm"
) else (
    set "PKG_CMD=npx --yes pnpm"
)

:: 3. Verificar e instalar dependencias se a pasta node_modules nao existir
if not exist "node_modules\" (
    echo [INFO] Dependências não encontradas. Instalando pacotes...
    echo.
    call %PKG_CMD% install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [AVISO] Falha ao instalar via pnpm. Tentando com npm...
        call npm install
        set "PKG_CMD=npm"
    )
    echo.
)

:: 4. Abrir o navegador automaticamente
echo [INFO] Abrindo navegador...
start "" cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:3000"

:: 5. Iniciar o servidor local (Next.js) com reinício automático contínuo
echo [INFO] Iniciando o servidor Next.js...
echo [INFO] Pressione Ctrl + C ou feche esta janela para encerrar o servidor.
echo.

:start_server
call %PKG_CMD% run dev
echo.
echo [INFO] Reiniciando servidor Next.js automaticamente...
ping 127.0.0.1 -n 2 >nul
goto start_server
