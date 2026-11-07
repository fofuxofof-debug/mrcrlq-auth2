@echo off
title Deploy Vercel - Hooked Auth
cd /d "%~dp0"

if exist "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd" (
    set "PATH=C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd;%PATH%"
)
if exist "%LOCALAPPDATA%\Programs\Git\cmd" (
    set "PATH=%LOCALAPPDATA%\Programs\Git\cmd;%PATH%"
)
if exist "C:\Program Files\Git\cmd" (
    set "PATH=C:\Program Files\Git\cmd;%PATH%"
)

echo =======================================================
echo          HOOKED AUTH - DEPLOY PARA VERCEL
echo =======================================================
echo.

where git >nul 2>nul
if errorlevel 1 (
    echo [ERRO] O Git nao foi encontrado no sistema.
    echo Instale o Git em: https://git-scm.com/
    echo.
    pause
    exit /b 1
)

echo [*] Git detectado com sucesso.
echo.

if not exist ".git" (
    echo [*] Inicializando repositorio Git...
    git init
)

git config user.name >nul 2>nul
if errorlevel 1 (
    git config user.name "Hookedadmin"
)
git config user.email >nul 2>nul
if errorlevel 1 (
    git config user.email "admin@hooked.io"
)

git branch -M main

echo [*] Conectando ao repositorio remoto...
git remote remove origin 2>nul
git remote add origin https://github.com/fofuxofof-debug/mrcrlq-auth2.git

echo [*] Adicionando arquivos do projeto...
git add -A

echo [*] Criando commit...
git commit -m "Deploy Vercel: Atualizacoes Hookedadmin" 2>nul

echo.
echo [*] Enviando arquivos para a branch main no GitHub...
echo (Se pedir autenticacao, autorize no navegador)
echo.
git push -u origin main --force

if errorlevel 1 (
    echo.
    echo =======================================================
    echo  [AVISO] Falha ao enviar para o GitHub.
    echo  Verifique sua conexao ou login no GitHub.
    echo =======================================================
    echo.
) else (
    echo.
    echo =======================================================
    echo  [SUCESSO] Projeto enviado com sucesso para o GitHub!
    echo  URL: https://github.com/fofuxofof-debug/mrcrlq-auth2
    echo =======================================================
    echo.
    echo [*] Se o projeto estiver conectado na Vercel:
    echo     O deploy na Vercel e disparado automaticamente.
    echo.
)

echo Deseja tambem rodar o deploy direto via Vercel CLI (vercel --prod)?
set /p RUN_VERCEL=[S/N] (Padrao: N): 
if /i "%RUN_VERCEL%"=="S" (
    echo.
    echo [*] Executando Vercel CLI...
    call npx --yes vercel --prod
)

echo.
echo Concluido. Pressione qualquer tecla para sair.
pause
