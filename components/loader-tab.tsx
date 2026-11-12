'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Download,
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Gamepad2,
  Shield,
  Flame,
  Terminal,
  ExternalLink,
  PackageCheck,
  HardDriveDownload,
} from 'lucide-react'

interface LoaderMeta {
  game: string
  filename: string
  size: number
  sizeFormatted: string
  uploadedAt: string
  uploadedBy: string
  exists: boolean
}

interface LoaderTabProps {
  currentUser: { username: string; role: string }
  onAddNotification?: (title: string, desc: string, type: 'success' | 'info' | 'warning' | 'error') => void
}

const GAME_CONFIGS = [
  {
    key: 'fivem',
    name: 'FiveM',
    tag: 'GTA V / FiveM',
    icon: Gamepad2,
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    border: 'border-orange-500/30',
    hoverBorder: 'hover:border-orange-500/50',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    accentColor: 'text-orange-400',
    buttonBg: 'bg-orange-600 hover:bg-orange-500',
    ringColor: 'focus:ring-orange-500',
  },
  {
    key: 'valorant',
    name: 'Valorant',
    tag: 'Riot Games / Valorant',
    icon: Shield,
    gradient: 'from-rose-500/20 via-pink-500/10 to-transparent',
    border: 'border-rose-500/30',
    hoverBorder: 'hover:border-rose-500/50',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    accentColor: 'text-rose-400',
    buttonBg: 'bg-rose-600 hover:bg-rose-500',
    ringColor: 'focus:ring-rose-500',
  },
  {
    key: 'freefire',
    name: 'Free Fire',
    tag: 'Garena / Mobile & Emu',
    icon: Flame,
    gradient: 'from-amber-600/20 via-yellow-500/10 to-transparent',
    border: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-500/50',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    accentColor: 'text-amber-400',
    buttonBg: 'bg-amber-600 hover:bg-amber-500',
    ringColor: 'focus:ring-amber-500',
  },
]

export function LoaderTab({ currentUser, onAddNotification }: LoaderTabProps) {
  const [loaders, setLoaders] = useState<Record<string, LoaderMeta>>({})
  const [loading, setLoading] = useState(true)
  const [uploadingGame, setUploadingGame] = useState<string | null>(null)
  const [dragOverGame, setDragOverGame] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Referências para os inputs de arquivo de cada jogo
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedKey(id)
    showToast('Comando copiado!')
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Carrega informações dos loaders existentes
  const fetchLoaders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/loader/info', { cache: 'no-store' })
      const data = await res.json()
      if (data.success && data.loaders) {
        setLoaders(data.loaders)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoaders()
  }, [])

  // Processa upload de arquivo
  const handleUploadFile = async (gameKey: string, gameName: string, file: File) => {
    if (!file.name.toLowerCase().endsWith('.exe')) {
      showToast('Apenas arquivos executáveis (.exe) são permitidos!')
      return
    }

    setUploadingGame(gameKey)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('game', gameName)
      formData.append('uploader', currentUser.username)

      const res = await fetch('/api/loader/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        showToast(`Novo Loader de ${gameName} enviado com sucesso!`)
        onAddNotification?.(
          'Loader Atualizado',
          `Novo executável (.exe) de ${gameName} foi publicado pelo admin.`,
          'success'
        )
        fetchLoaders()
      } else {
        showToast(data.message || 'Erro ao enviar loader.')
      }
    } catch {
      showToast('Falha na comunicação ao enviar executável.')
    } finally {
      setUploadingGame(null)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent, gameKey: string) => {
    e.preventDefault()
    setDragOverGame(gameKey)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverGame(null)
  }

  const handleDrop = (e: React.DragEvent, gameKey: string, gameName: string) => {
    e.preventDefault()
    setDragOverGame(null)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleUploadFile(gameKey, gameName, file)
    }
  }

  const handleDownloadBatchScript = () => {
    const batContent = `@echo off
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
pause`

    const blob = new Blob([batContent], { type: 'application/bat' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'loader.bat'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Script loader.bat gerado e baixado com sucesso!')
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-pink-500/40 bg-zinc-950/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl shadow-pink-950/50 backdrop-blur-md animate-fade-in-up">
          <CheckCircle2 className="size-4 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Gerenciador de Loaders
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-400 border border-pink-500/30">
                  Proteção por Chave
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Faça o upload do .exe de cada jogo. O cliente só consegue fazer o download após validar a key ativa.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadBatchScript}
            className="flex items-center gap-1.5 rounded-lg border border-pink-500/40 bg-pink-950/30 px-3 py-2 text-xs font-semibold text-pink-300 hover:bg-pink-950/60 transition-all btn-interactive"
            title="Baixar arquivo loader.bat pronto para os clientes"
          >
            <Terminal className="size-3.5 text-pink-400" />
            <span>Baixar script cliente (loader.bat)</span>
          </button>

          <button
            onClick={fetchLoaders}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-all btn-interactive"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-pink-400' : 'text-muted-foreground'}`} />
            <span>{loading ? 'Atualizando...' : 'Recarregar'}</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards dos 3 Jogos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {GAME_CONFIGS.map((config) => {
          const Icon = config.icon
          const meta = loaders[config.key]
          const isUploading = uploadingGame === config.key
          const isDragOver = dragOverGame === config.key

          const curlExample = `curl -X POST https://mrcbypassauth.vercel.app/api/loader/download -H "Content-Type: application/json" -d "{\\"key\\":\\"SUA_KEY\\",\\"game\\":\\"${config.name}\\"}" -o ${config.name}-Loader.exe`

          return (
            <div
              key={config.key}
              className={`relative rounded-2xl border ${config.border} ${config.hoverBorder} bg-gradient-to-b ${config.gradient} bg-card p-5 shadow-lg transition-all flex flex-col justify-between`}
            >
              {/* Header do Card */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-zinc-900/80 border border-border/80">
                      <Icon className={`size-5 ${config.accentColor}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{config.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{config.tag}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.badge}`}>
                    {meta?.exists ? 'Online / Pronto' : 'Aguardando Upload'}
                  </span>
                </div>

                {/* Status do Arquivo Atual */}
                <div className="mt-4 p-3.5 rounded-xl border border-border/80 bg-zinc-950/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Arquivo atual:</span>
                    <span className="font-semibold text-foreground font-mono truncate max-w-[150px]">
                      {meta?.exists ? meta.filename : 'Nenhum .exe'}
                    </span>
                  </div>

                  {meta?.exists && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tamanho:</span>
                        <span className="font-mono text-zinc-300 font-semibold">{meta.sizeFormatted}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Atualizado em:</span>
                        <span className="text-zinc-400">{meta.uploadedAt}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Área de Drag & Drop para o Executável */}
                <div
                  onDragOver={(e) => handleDragOver(e, config.key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, config.key, config.name)}
                  onClick={() => fileInputRefs.current[config.key]?.click()}
                  className={`mt-4 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-pink-500 bg-pink-950/30 scale-[1.02]'
                      : 'border-border/80 hover:border-pink-500/50 hover:bg-zinc-900/50'
                  }`}
                >
                  <input
                    ref={(el) => {
                      fileInputRefs.current[config.key] = el
                    }}
                    type="file"
                    accept=".exe"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUploadFile(config.key, config.name, file)
                    }}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <RefreshCw className="size-6 animate-spin text-pink-400" />
                      <p className="text-xs font-semibold text-pink-300">Enviando executável...</p>
                      <p className="text-[10px] text-muted-foreground">Salvando e atualizando versão</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-1">
                      <FileCode className={`size-7 ${config.accentColor} mb-1`} />
                      <p className="text-xs font-bold text-foreground">
                        Arraste o novo .exe aqui
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        ou clique para selecionar do computador
                      </p>
                    </div>
                  )}
                </div>

                {/* Exemplo de Comando CLI para os Clientes */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Terminal className="size-3 text-pink-400" />
                      Comando de Download via CMD/CLI:
                    </label>
                    <button
                      onClick={() => handleCopy(curlExample, `curl-${config.key}`)}
                      className="text-[10px] text-pink-400 hover:text-pink-300 flex items-center gap-0.5 transition-colors"
                    >
                      {copiedKey === `curl-${config.key}` ? (
                        <>
                          <Check className="size-3 text-emerald-400" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" /> Copiar
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-lg border border-border/80 bg-zinc-950 p-2 text-[10px] font-mono text-zinc-300 break-all select-all">
                    curl -X POST https://mrcbypassauth.vercel.app/api/loader/download -d &quot;key=...&quot;
                  </div>
                </div>
              </div>

              {/* Botão de Enviar Manual */}
              <div className="mt-5 pt-3 border-t border-border/60">
                <button
                  onClick={() => fileInputRefs.current[config.key]?.click()}
                  disabled={isUploading}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl ${config.buttonBg} py-2.5 px-4 text-xs font-semibold text-white shadow-md transition-all btn-interactive disabled:opacity-50`}
                >
                  <UploadCloud className="size-4" />
                  <span>Subir Novo Executável (.exe)</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Card Informativo com Explicação do Fluxo */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          <Terminal className="size-4 text-pink-400" />
          <span>Como funciona a validação e o download pelo CMD ou Loader do Cliente:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="rounded-xl border border-border/60 bg-zinc-900/40 p-3.5 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-pink-500/20 text-pink-400 grid place-items-center text-[10px]">1</span>
              Upload do Executável
            </p>
            <p className="text-[11px]">
              O administrador arrasta o <strong>.exe</strong> compilado do jogo desejado para o card correspondente no painel.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-zinc-900/40 p-3.5 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-pink-500/20 text-pink-400 grid place-items-center text-[10px]">2</span>
              Cliente solicita no CMD
            </p>
            <p className="text-[11px]">
              O cliente executa <code className="text-pink-300 font-mono">loader.bat FiveM</code> (ou Valorant/Free Fire) e digita a sua Key.
            </p>
          </div>

          <div className="rounded-xl border border-border/60 bg-zinc-900/40 p-3.5 space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-pink-500/20 text-pink-400 grid place-items-center text-[10px]">3</span>
              Validação & Download
            </p>
            <p className="text-[11px]">
              A API verifica se a chave está ativa, não banida e autorizada para o jogo. Se válido, o download inicia imediatamente e executa o loader.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
