import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const CLI_SCRIPT = `# Hooked Auth - Cyber Game Loader CLI v2.4
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    $Host.UI.RawUI.WindowTitle = "HOOKED AUTH // VIP CLIENT LOADER"
} catch {}

Clear-Host
Write-Host ""
Write-Host " ┌────────────────────────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host " │    __  ______  ____  __ __ __________                              │" -ForegroundColor Magenta
Write-Host " │   / / / / __ \\/ __ \\/ //_// ____/ __ \\     H O O K E D   A U T H   │" -ForegroundColor White
Write-Host " │  / /_/ / / / / / / / ,<  / __/ / / / /     Game Client Loader      │" -ForegroundColor White
Write-Host " │ / __  / /_/ / /_/ / /| |/ /___/ /_/ /      Build 2026 [PRO VIP]    │" -ForegroundColor White
Write-Host " │/_/ /_/\\____/\\____/_/ |_/_____/_____/                               │" -ForegroundColor Magenta
Write-Host " └────────────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta
Write-Host "   [•] Servidor   : " -NoNewline -ForegroundColor DarkGray; Write-Host "ONLINE (mrcrlq-auth2.vercel.app)" -ForegroundColor Green
Write-Host "   [•] Seguranca  : " -NoNewline -ForegroundColor DarkGray; Write-Host "TLS 1.3 + SHA-256 Cloud Protection" -ForegroundColor Cyan
Write-Host ""

$serverUrl = "https://mrcrlq-auth2.vercel.app"

# 1. Caixa de Autenticacao
Write-Host " ┌───[ AUTENTICACAO ]─────────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host " │  Digite ou cole a sua Chave de Licenca (Key) abaixo:               │" -ForegroundColor DarkGray
Write-Host " └────────────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta
Write-Host ""
Write-Host " [>] " -NoNewline -ForegroundColor Magenta
$rawKey = Read-Host "Digite sua Key"
$key = $rawKey.Trim().Trim('"').Trim("'")

if ([string]::IsNullOrWhiteSpace($key)) {
    Write-Host ""
    Write-Host " ┌───[ ERRO ]─────────────────────────────────────────────────────────┐" -ForegroundColor Red
    Write-Host " │  [!] A chave de licenca nao pode estar em branco.                  │" -ForegroundColor Red
    Write-Host " └────────────────────────────────────────────────────────────────────┘" -ForegroundColor Red
    Write-Host ""
    Read-Host " Pressione ENTER para sair..."
    exit 1
}

Write-Host ""
Write-Host " [*] " -NoNewline -ForegroundColor Yellow
Write-Host "Conectando ao cluster seguro e validando chave..." -ForegroundColor DarkGray

$validateUrl = "$serverUrl/api/loader/validate?key=" + [uri]::EscapeDataString($key)
try {
    $resp = Invoke-RestMethod -Uri $validateUrl -Method Get -TimeoutSec 15
} catch {
    Write-Host ""
    Write-Host " ┌───[ ACESSO NEGADO ]────────────────────────────────────────────────┐" -ForegroundColor Red
    Write-Host " │  [X] Chave invalida, suspensa ou inexistente no banco de dados.    │" -ForegroundColor Red
    Write-Host " │  [!] Verifique se digitou a key correta ou consulte o suporte.     │" -ForegroundColor DarkGray
    Write-Host " └────────────────────────────────────────────────────────────────────┘" -ForegroundColor Red
    Write-Host ""
    Read-Host " Pressione ENTER para sair..."
    exit 1
}

if (-not $resp.success) {
    Write-Host ""
    Write-Host " ┌───[ ACESSO NEGADO ]────────────────────────────────────────────────┐" -ForegroundColor Red
    Write-Host " │  [X] $($resp.message)                                              │" -ForegroundColor Red
    Write-Host " └────────────────────────────────────────────────────────────────────┘" -ForegroundColor Red
    Write-Host ""
    Read-Host " Pressione ENTER para sair..."
    exit 1
}

# 2. Caixa de Sucesso / Licenca Valida
Write-Host ""
Write-Host " ┌───[ LICENCA AUTENTICADA ]──────────────────────────────────────────┐" -ForegroundColor Green
Write-Host " │                                                                    │" -ForegroundColor Green
Write-Host " │  [+] Cliente   : " -NoNewline -ForegroundColor Green; Write-Host ("{0,-48}" -f $resp.license.name) -NoNewline -ForegroundColor White; Write-Host "│" -ForegroundColor Green
Write-Host " │  [+] Status    : " -NoNewline -ForegroundColor Green; Write-Host ("{0,-48}" -f "ATIVO & LIBERADO") -NoNewline -ForegroundColor Green; Write-Host "│" -ForegroundColor Green
Write-Host " │  [+] Plano     : " -NoNewline -ForegroundColor Green; Write-Host ("{0,-48}" -f $resp.license.plano) -NoNewline -ForegroundColor Cyan; Write-Host "│" -ForegroundColor Green
Write-Host " │  [+] Expiracao : " -NoNewline -ForegroundColor Green; Write-Host ("{0,-48}" -f $resp.license.expiry) -NoNewline -ForegroundColor Yellow; Write-Host "│" -ForegroundColor Green
Write-Host " │                                                                    │" -ForegroundColor Green
Write-Host " └────────────────────────────────────────────────────────────────────┘" -ForegroundColor Green
Write-Host ""

# 3. Selecao do Jogo
$licenseGame = "$($resp.license.game)"
$isAllGames = $licenseGame.ToLower().Contains("todo") -or $licenseGame.ToLower().Contains("all")
$selectedGame = "Free Fire"

Write-Host " ┌───[ SELECIONE O JOGO ]─────────────────────────────────────────────┐" -ForegroundColor Magenta
Write-Host " │                                                                    │" -ForegroundColor Magenta
Write-Host " │  [1]  FREE FIRE   ->  Aimbot + ESP + Safe Memory Bypass            │" -ForegroundColor White
Write-Host " │  [2]  FIVEM       ->  External Overlay + Silent Aim + Wallhack     │" -ForegroundColor White
Write-Host " │  [3]  VALORANT    ->  Hypervisor Driver + Visuals ESP              │" -ForegroundColor White
Write-Host " │                                                                    │" -ForegroundColor Magenta
Write-Host " └────────────────────────────────────────────────────────────────────┘" -ForegroundColor Magenta
Write-Host ""
Write-Host " [?] " -NoNewline -ForegroundColor Magenta
$choice = Read-Host "Digite o numero da opcao desejada [1, 2 ou 3] (Padrao: 1)"

if ($choice -eq "2") {
    $selectedGame = "FiveM"
} elseif ($choice -eq "3") {
    $selectedGame = "Valorant"
} else {
    $selectedGame = "Free Fire"
}

Write-Host ""
Write-Host " [*] Jogo selecionado : " -NoNewline -ForegroundColor DarkGray
Write-Host "$selectedGame" -ForegroundColor Magenta
Write-Host " [*] Servidor Oficial : Baixando versao mais recente (.exe)..." -ForegroundColor Yellow

$downloadUrl = "$serverUrl/api/loader/download?key=" + [uri]::EscapeDataString($key) + "&game=" + [uri]::EscapeDataString($selectedGame)
$cleanName = $selectedGame.Replace(" ", "")
$destDir = [System.IO.Path]::Combine($env:USERPROFILE, "Downloads")
if (-not (Test-Path $destDir)) { $destDir = (Get-Location).Path }
$destFile = [System.IO.Path]::Combine($destDir, "$cleanName-Loader.exe")

try {
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $destFile -TimeoutSec 60
    
    if ((Test-Path $destFile) -and ((Get-Item $destFile).Length -gt 1000)) {
        $sizeMB = [math]::Round(((Get-Item $destFile).Length / 1MB), 2)
        Write-Host ""
        Write-Host " ┌───[ DOWNLOAD CONCLUIDO ]───────────────────────────────────────────┐" -ForegroundColor Green
        Write-Host " │                                                                    │" -ForegroundColor Green
        Write-Host " │  [+] Arquivo salvo com sucesso na sua maquina!                     │" -ForegroundColor Green
        Write-Host " │  [•] Caminho : " -NoNewline -ForegroundColor DarkGray; Write-Host ("{0,-50}" -f "$destFile ($sizeMB MB)") -NoNewline -ForegroundColor White; Write-Host "│" -ForegroundColor Green
        Write-Host " │                                                                    │" -ForegroundColor Green
        Write-Host " └────────────────────────────────────────────────────────────────────┘" -ForegroundColor Green
        Write-Host ""
        Write-Host " [*] Iniciando o executavel oficial automaticamente..." -ForegroundColor Cyan
        Start-Process -FilePath $destFile
        Write-Host " [+] Bom jogo!" -ForegroundColor Green
        Start-Sleep -Seconds 2
        exit 0
    } else {
        throw "O arquivo baixado retornou vazio ou danificado."
    }
} catch {
    Write-Host ""
    Write-Host " ┌───[ ERRO NO DOWNLOAD ]─────────────────────────────────────────────┐" -ForegroundColor Red
    Write-Host " │  [X] Falha ao transferir o executavel.                             │" -ForegroundColor Red
    Write-Host " │  [!] Verifique se sua licenca possui permissao para este jogo.     │" -ForegroundColor DarkGray
    Write-Host " └────────────────────────────────────────────────────────────────────┘" -ForegroundColor Red
    Write-Host ""
    Read-Host " Pressione ENTER para sair..."
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
