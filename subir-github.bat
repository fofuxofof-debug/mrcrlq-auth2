@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Subir para o GitHub - Hooked Auth

echo =======================================================
echo          HOOKED AUTH - SUBIR PARA O GITHUB
echo =======================================================
echo.

:: 1. Verificar se o Git está instalado
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O Git nao foi encontrado no seu computador!
    echo Baixe e instale em: https://git-scm.com/
    pause
    exit /b 1
)

:: 2. Inicializar o repositorio se nao existir
if not exist ".git" (
    echo [*] Inicializando repositorio Git local...
    git init
) else (
    echo [*] Repositorio Git local ja inicializado.
)

:: Garantir configuracao basica de autor caso ainda nao exista
git config user.name >nul 2>nul
if %errorlevel% neq 0 (
    git config user.name "mrcrlq"
)
git config user.email >nul 2>nul
if %errorlevel% neq 0 (
    git config user.email "mrcrlq@hooked-auth.local"
)

:: 3. Configurar a branch main
git branch -M main

:: 4. Configurar ou atualizar a URL remota
echo [*] Configurando origem remota: https://github.com/fofuxofof-debug/mrcrlq-auth2.git
git remote remove origin 2>nul
git remote add origin https://github.com/fofuxofof-debug/mrcrlq-auth2.git

:: 5. Adicionar arquivos
echo [*] Adicionando arquivos do projeto...
git add .

:: 6. Commit
echo [*] Criando commit...
git commit -m "Deploy Hooked Auth SaaS"

:: 7. Enviar para o GitHub
echo.
echo [*] Enviando arquivos para a branch main no GitHub...
echo (Se for a primeira vez, pode abrir uma janela para autorizar seu login no GitHub)
echo.
git push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo =======================================================
    echo  [SUCESSO] Projeto enviado com sucesso para o GitHub!
    echo  URL: https://github.com/fofuxofof-debug/mrcrlq-auth2
    echo =======================================================
    echo.
    echo Agora na Vercel basta importar o repositorio 'mrcrlq-auth2'!
) else (
    echo.
    echo =======================================================
    echo  [AVISO] Ocorreu uma falha no envio.
    echo  Verifique suas credenciais ou permissoes do GitHub.
    echo =======================================================
)

echo.
pause
