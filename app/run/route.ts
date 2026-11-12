import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CLI_SCRIPT = `# Hooked Auth - Game Loader CLI
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    $Host.UI.RawUI.WindowTitle = "Hooked Auth - Game Loader CLI"
} catch {}

Clear-Host
Write-Host "==================================================================" -ForegroundColor Magenta
Write-Host "                    HOOKED AUTH - GAME LOADER                    " -ForegroundColor White
Write-Host "               SISTEMA DE AUTENTICACAO E DOWNLOAD                 " -ForegroundColor DarkGray
Write-Host "==================================================================" -ForegroundColor Magenta
Write-Host ""

$serverUrl = "https://mrcrlq-auth2.vercel.app"

# 1. Solicitacao da Chave de Licenca
Write-Host "[*] Servidor de Autenticacao: ONLINE" -ForegroundColor Green
Write-Host ""
$rawKey = Read-Host "[>] Digite a sua Chave de Licenca (Key)"
$key = $rawKey.Trim().Trim('"').Trim("'")

if ([string]::IsNullOrWhiteSpace($key)) {
    Write-Host ""
    Write-Host "[-] ERRO: A chave de licenca nao pode estar em branco." -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para fechar..."
    exit 1
}

Write-Host ""
Write-Host "[*] Conectando ao servidor e validando licenca..." -ForegroundColor Yellow

$validateUrl = "$serverUrl/api/loader/validate?key=" + [uri]::EscapeDataString($key)
try {
    $resp = Invoke-RestMethod -Uri $validateUrl -Method Get -TimeoutSec 15
} catch {
    Write-Host ""
    Write-Host "[-] FALHA NA AUTENTICACAO: Chave invalida, expirada ou inexistente." -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para fechar..."
    exit 1
}

if (-not $resp.success) {
    Write-Host ""
    Write-Host "[-] ACESSO NEGADO: $($resp.message)" -ForegroundColor Red
    Write-Host ""
    Read-Host "Pressione ENTER para fechar..."
    exit 1
}

Write-Host ""
Write-Host "[+] LICENCA AUTENTICADA COM SUCESSO!" -ForegroundColor Green
Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host " [•] Cliente  : " -NoNewline; Write-Host "$($resp.license.name)" -ForegroundColor White
Write-Host " [•] Plano    : " -NoNewline; Write-Host "$($resp.license.plano)" -ForegroundColor Cyan
Write-Host " [•] Validade : " -NoNewline; Write-Host "$($resp.license.expiry)" -ForegroundColor Yellow
Write-Host " [•] Status   : " -NoNewline; Write-Host "ATIVO" -ForegroundColor Green
Write-Host "------------------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# 2. Selecao de Jogo para Instalar
$licenseGame = "$($resp.license.game)"
$isAllGames = $licenseGame.ToLower().Contains("todo") -or $licenseGame.ToLower().Contains("all")

$selectedGame = "Free Fire"

if ($isAllGames) {
    Write-Host "[?] Selecione qual Loader deseja instalar:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   [1] Free Fire" -ForegroundColor Cyan
    Write-Host "   [2] FiveM" -ForegroundColor Cyan
    Write-Host "   [3] Valorant" -ForegroundColor Cyan
    Write-Host ""
    $choice = Read-Host "[>] Digite o numero da opcao [1-3] (Padrao: 1)"
    if ($choice -eq "2") {
        $selectedGame = "FiveM"
    } elseif ($choice -eq "3") {
        $selectedGame = "Valorant"
    } else {
        $selectedGame = "Free Fire"
    }
} else {
    Write-Host "[?] Jogo vinculado a sua licenca: " -NoNewline; Write-Host "$licenseGame" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   [1] Instalar $licenseGame agora" -ForegroundColor White
    Write-Host "   [2] Selecionar outro jogo (FiveM / Valorant / Free Fire)" -ForegroundColor DarkGray
    Write-Host ""
    $choice = Read-Host "[>] Digite o numero [1-2] (Padrao: 1)"
    if ($choice -eq "2") {
        Write-Host ""
        Write-Host "   [1] Free Fire" -ForegroundColor Cyan
        Write-Host "   [2] FiveM" -ForegroundColor Cyan
        Write-Host "   [3] Valorant" -ForegroundColor Cyan
        Write-Host ""
        $c2 = Read-Host "[>] Digite o numero da opcao desejada [1-3]"
        if ($c2 -eq "2") { $selectedGame = "FiveM" }
        elseif ($c2 -eq "3") { $selectedGame = "Valorant" }
        else { $selectedGame = "Free Fire" }
    } else {
        $selectedGame = $licenseGame
    }
}

Write-Host ""
Write-Host "[*] Jogo Selecionado: $selectedGame" -ForegroundColor Green
Write-Host "[*] Baixando executavel oficial do servidor..." -ForegroundColor Yellow

$downloadUrl = "$serverUrl/api/loader/download?key=" + [uri]::EscapeDataString($key) + "&game=" + [uri]::EscapeDataString($selectedGame)

$cleanName = $selectedGame.Replace(" ", "")
$destDir = "$env:USERPROFILE\\Downloads"
if (-not (Test-Path $destDir)) { $destDir = (Get-Location).Path }
$destFile = Join-Path $destDir "$cleanName-Loader.exe"

try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $destFile -TimeoutSec 60
    
    if ((Test-Path $destFile) -and ((Get-Item $destFile).Length -gt 1000)) {
        $sizeMB = [math]::Round(((Get-Item $destFile).Length / 1MB), 2)
        Write-Host ""
        Write-Host "[+] DOWNLOAD CONCLUIDO COM SUCESSO!" -ForegroundColor Green
        Write-Host " [•] Arquivo salvo em: $destFile ($sizeMB MB)" -ForegroundColor White
        Write-Host ""
        Write-Host "[*] Iniciando o executavel automaticamente..." -ForegroundColor Cyan
        Start-Process -FilePath $destFile
        Start-Sleep -Seconds 2
        exit 0
    } else {
        throw "Arquivo baixado esta vazio ou corrompido."
    }
} catch {
    Write-Host ""
    Write-Host "[-] ERRO AO BAIXAR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Verifique se a sua chave tem permissao para este jogo e tente novamente." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione ENTER para fechar..."
    exit 1
}
`

export async function GET() {
  return new NextResponse(CLI_SCRIPT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
