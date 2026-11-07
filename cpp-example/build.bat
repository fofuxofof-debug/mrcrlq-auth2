@echo off
cd /d "%~dp0"
title Compilar Exemplo C++ - Hooked Auth

echo ========================================================
echo         Compilar Cliente C++ - Hooked Auth
echo ========================================================
echo.

where cl >nul 2>nul
if %errorlevel% equ 0 goto :compile_msvc

if exist "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat" (
    echo [*] Inicializando ambiente MSVC (VS 18)...
    call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat" >nul 2>nul
    goto :compile_msvc
)
if exist "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" (
    echo [*] Inicializando ambiente MSVC (VS 2022)...
    call "C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat" >nul 2>nul
    goto :compile_msvc
)
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars64.bat" (
    echo [*] Inicializando ambiente MSVC (VS 2019)...
    call "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars64.bat" >nul 2>nul
    goto :compile_msvc
)

where g++ >nul 2>nul
if %errorlevel% equ 0 goto :compile_mingw

where clang++ >nul 2>nul
if %errorlevel% equ 0 goto :compile_clang

echo [!] Nenhum compilador C++ (MSVC / MinGW / Clang) foi detectado.
echo.
echo Abra o Developer Command Prompt do Visual Studio e execute build.bat.
pause
exit /b 1

:compile_msvc
echo [*] Compilador MSVC detectado!
echo [*] Compilando HookedClient.exe...
cl /EHsc /std:c++17 /O2 /W3 main.cpp /Fe:HookedClient.exe winhttp.lib iphlpapi.lib bcrypt.lib advapi32.lib
if %errorlevel% neq 0 (
    echo [X] Erro ao compilar com MSVC.
    pause
    exit /b 1
)
del *.obj 2>nul
echo.
echo ========================================================
echo  [OK] Compilacao concluida com sucesso!
echo ========================================================
echo [*] Iniciando HookedClient.exe...
echo.
HookedClient.exe
exit /b 0

:compile_mingw
echo [*] Compilador MinGW detectado!
echo [*] Compilando HookedClient.exe...
g++ -std=c++17 -O2 main.cpp -o HookedClient.exe -lwinhttp -liphlpapi -lbcrypt -ladvapi32
if %errorlevel% neq 0 (
    echo [X] Erro ao compilar com MinGW.
    pause
    exit /b 1
)
echo.
echo ========================================================
echo  [OK] Compilacao concluida com sucesso!
echo ========================================================
echo [*] Iniciando HookedClient.exe...
echo.
HookedClient.exe
exit /b 0

:compile_clang
echo [*] Compilador Clang detectado!
echo [*] Compilando HookedClient.exe...
clang++ -std=c++17 -O2 main.cpp -o HookedClient.exe -lwinhttp -liphlpapi -lbcrypt -ladvapi32
if %errorlevel% neq 0 (
    echo [X] Erro ao compilar com Clang.
    pause
    exit /b 1
)
echo.
echo ========================================================
echo  [OK] Compilacao concluida com sucesso!
echo ========================================================
echo [*] Iniciando HookedClient.exe...
echo.
HookedClient.exe
exit /b 0
