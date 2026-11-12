'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Download,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gamepad2,
  Shield,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  HardDriveDownload,
  Clock,
  User,
  Sparkles,
  LockKeyhole,
  ExternalLink,
} from 'lucide-react'

interface LicenseValidationResult {
  key: string
  name: string
  game: string
  plano?: string
  tempo?: string
  expiry?: string
  status: 'Active' | 'Expired' | 'Suspended'
}

function DownloadPortalContent() {
  const searchParams = useSearchParams()
  const initialKey = searchParams.get('key') || searchParams.get('id') || ''

  const [keyInput, setKeyInput] = useState(initialKey)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [license, setLicense] = useState<LicenseValidationResult | null>(null)
  const [game, setGame] = useState<string>('Free Fire')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  // Validação automática se vier com query param ?key=
  useEffect(() => {
    if (initialKey && initialKey.trim().length > 3) {
      handleValidate(initialKey.trim())
    }
  }, [initialKey])

  const handleValidate = async (keyToTest?: string) => {
    const key = (keyToTest !== undefined ? keyToTest : keyInput).trim()
    if (!key) {
      setError('Por favor, digite a sua chave de licença (Key).')
      setLicense(null)
      return
    }

    setLoading(true)
    setError(null)
    setLicense(null)
    setDownloadUrl(null)

    try {
      const res = await fetch(`/api/loader/validate?key=${encodeURIComponent(key)}`, {
        cache: 'no-store',
      })
      const data = await res.json()

      if (data.success && data.license) {
        setLicense(data.license)
        setGame(data.game || data.license.game || 'Free Fire')
        setDownloadUrl(data.downloadUrl)
      } else {
        setError(data.message || 'Chave de licença não encontrada ou inválida.')
      }
    } catch {
      setError('Erro ao conectar ao servidor de validação. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  const handleTriggerDownload = () => {
    if (!downloadUrl) return
    setDownloading(true)
    // Dispara o download nativo do arquivo no navegador
    window.location.href = downloadUrl
    setTimeout(() => {
      setDownloading(false)
    }, 3000)
  }

  const handleTriggerDownloadForGame = (targetGame: string) => {
    if (!license?.key) return
    setDownloading(true)
    const url = `/api/loader/download?key=${encodeURIComponent(license.key)}&game=${encodeURIComponent(targetGame)}`
    window.location.href = url
    setTimeout(() => {
      setDownloading(false)
    }, 3000)
  }

  const isAllGames = game.toLowerCase().includes('todo') || game.toLowerCase().includes('all')

  const handleCopyKey = () => {
    if (license?.key) {
      navigator.clipboard?.writeText(license.key)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  const getGameIcon = (gameName: string) => {
    const lower = gameName.toLowerCase()
    if (lower.includes('fivem')) return Gamepad2
    if (lower.includes('valorant')) return Shield
    return Flame
  }

  const GameIcon = getGameIcon(game)

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground flex flex-col justify-between">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] max-w-[95vw] h-[500px] rounded-full bg-gradient-to-b from-pink-500/20 via-rose-500/10 to-transparent blur-[140px]" />
        <div className="absolute top-96 -left-36 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-pink-500/15 to-transparent blur-[130px]" />
        <div className="absolute top-96 -right-36 w-[450px] h-[450px] rounded-full bg-gradient-to-bl from-rose-500/15 to-transparent blur-[130px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl py-3.5">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30 group-hover:scale-105 transition-transform">
              <LockKeyhole className="size-4" />
            </span>
            <span className="text-[15px] font-bold tracking-tight">
              Hooked <span className="text-pink-500">Auth</span>
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-lg border border-border/60 hover:bg-zinc-900"
          >
            <ArrowLeft className="size-3.5" />
            <span>Voltar ao Início</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative mx-auto max-w-2xl w-full px-4 sm:px-6 py-12 flex-1 flex flex-col justify-center">
        {/* Title */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
            <Sparkles className="size-3.5" />
            Área do Cliente • Download Direto
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Baixar seu <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Loader</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Digite a sua chave de licença (Key) abaixo para validar seu acesso e iniciar o download do executável oficial (.exe).
          </p>
        </div>

        {/* Input Card */}
        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-xl p-6 shadow-2xl space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-pink-400" />
                Sua Chave de Licença (Key):
              </span>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard?.readText()
                    if (text) setKeyInput(text.trim())
                  } catch {}
                }}
                className="text-[11px] text-pink-400 hover:text-pink-300 font-normal transition-colors"
              >
                Colar da Área de Transferência
              </button>
            </label>

            <div className="relative">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleValidate()
                }}
                placeholder="Ex: 1517054236041416800"
                className="w-full rounded-xl border border-border bg-zinc-950/80 px-4 py-3.5 text-sm font-mono text-foreground placeholder:text-zinc-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 transition-all"
              />
            </div>
          </div>

          <button
            onClick={() => handleValidate()}
            disabled={loading || !keyInput.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-pink-500/25 transition-all btn-interactive disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                <span>Validando Licença...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>Verificar e Liberar Download</span>
              </>
            )}
          </button>

          {/* Feedback de Erro */}
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs text-rose-300 flex items-start gap-3 animate-fade-in-up">
              <AlertTriangle className="size-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Não foi possível liberar o download:</p>
                <p className="mt-0.5 text-rose-300/90">{error}</p>
              </div>
            </div>
          )}

          {/* Card de Resultado / Licença Aprovada */}
          {license && (
            <div className="rounded-xl border border-pink-500/30 bg-gradient-to-b from-pink-950/20 to-zinc-950/60 p-5 space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
                    <GameIcon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      {game}
                    </h3>
                    <p className="text-xs text-muted-foreground">Loader Oficial Hooked</p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="size-3" />
                  Licença Ativa
                </span>
              </div>

              {/* Detalhes da Licença */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-border/60">
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <User className="size-3 text-pink-400" /> Cliente
                  </span>
                  <p className="font-semibold text-foreground mt-0.5 truncate">{license.name}</p>
                </div>

                <div className="rounded-lg bg-zinc-900/60 p-2.5 border border-border/60">
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <Clock className="size-3 text-pink-400" /> Plano / Duração
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {license.plano || license.tempo || 'Válido'}
                  </p>
                </div>
              </div>

              {/* Botão de Download */}
              {isAllGames ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-300">
                    Sua licença tem acesso liberado. Escolha o Loader para baixar:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleTriggerDownloadForGame('Free Fire')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 py-3 px-3 text-xs font-bold text-white shadow-lg shadow-amber-950/40 transition-all btn-interactive"
                    >
                      <Flame className="size-4" />
                      <span>Free Fire (.exe)</span>
                    </button>
                    <button
                      onClick={() => handleTriggerDownloadForGame('FiveM')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 py-3 px-3 text-xs font-bold text-white shadow-lg shadow-orange-950/40 transition-all btn-interactive"
                    >
                      <Gamepad2 className="size-4" />
                      <span>FiveM (.exe)</span>
                    </button>
                    <button
                      onClick={() => handleTriggerDownloadForGame('Valorant')}
                      className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 py-3 px-3 text-xs font-bold text-white shadow-lg shadow-rose-950/40 transition-all btn-interactive"
                    >
                      <Shield className="size-4" />
                      <span>Valorant (.exe)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleTriggerDownload}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 px-4 text-sm font-bold text-white shadow-xl shadow-emerald-950/40 transition-all btn-interactive"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      <span>Iniciando Download...</span>
                    </>
                  ) : (
                    <>
                      <Download className="size-4 animate-bounce" />
                      <span>Baixar Loader ({game}-Loader.exe)</span>
                    </>
                  )}
                </button>
              )}

              <p className="text-center text-[11px] text-muted-foreground">
                Arquivo executável direto (.exe). Após o término, execute o arquivo para começar a jogar.
              </p>
            </div>
          )}
        </div>

        {/* Informações Úteis */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl border border-border/60 bg-card/60">
            <h4 className="text-xs font-bold text-foreground">100% no Navegador</h4>
            <p className="text-[11px] text-muted-foreground mt-1">
              Sem arquivos .bat, sem comandos no CMD. Baixe direto pelo Chrome, Edge ou Firefox.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border/60 bg-card/60">
            <h4 className="text-xs font-bold text-foreground">Sempre Atualizado</h4>
            <p className="text-[11px] text-muted-foreground mt-1">
              O site sempre entrega a versão mais recente compilada pelo administrador.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-border/60 bg-card/60">
            <h4 className="text-xs font-bold text-foreground">Proteção de Licença</h4>
            <p className="text-[11px] text-muted-foreground mt-1">
              Apenas chaves ativas e legítimas conseguem transferir o binário do jogo.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 px-5 py-6 bg-card">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground text-center sm:text-left">
          <span>© 2026 Hooked Auth Systems</span>
          <span>Download oficial protegido por chave de licença.</span>
        </div>
      </footer>
    </div>
  )
}

export default function DownloadPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-xs text-muted-foreground">
          Carregando portal de download...
        </div>
      }
    >
      <DownloadPortalContent />
    </Suspense>
  )
}
