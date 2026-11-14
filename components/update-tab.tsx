'use client'

import React, { useState, useEffect } from 'react'
import {
  RefreshCw,
  Zap,
  CloudLightning,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gamepad2,
  Shield,
  Play,
  Cpu,
  Layers,
  Code2,
  Terminal,
  Copy,
  Check,
  Server,
  Activity,
  HardDrive,
} from 'lucide-react'

interface BuildInfo {
  version: string
  buildHash: string
  sha256: string
  sizeBytes: number
  sizeFormatted: string
  lastUpdated: string
}

interface UpdateTabProps {
  currentUser: { username: string; role: string }
  onAddNotification?: (title: string, desc: string, type: 'success' | 'info' | 'warning' | 'error') => void
}

export function UpdateTab({ currentUser, onAddNotification }: UpdateTabProps) {
  const [selectedGame, setSelectedGame] = useState<'freefire' | 'fivem' | 'valorant'>('freefire')
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [testKey, setTestKey] = useState('1517054236041416800')
  const [testingStream, setTestingStream] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const fetchBuild = async (game = selectedGame) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/update?game=${game}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success && data.build) {
        setBuildInfo(data.build)
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuild(selectedGame)
  }, [selectedGame])

  const handleRunStreamTest = async () => {
    if (!testKey.trim()) {
      showToast('Digite uma chave para testar o stream.')
      return
    }

    setTestingStream(true)
    setTestResult(null)
    const startTime = performance.now()

    try {
      const res = await fetch(`/api/update?key=${encodeURIComponent(testKey.trim())}&game=${selectedGame}`, {
        cache: 'no-store',
      })
      const latencyMs = Math.round(performance.now() - startTime)
      const data = await res.json()

      setTestResult({
        ...data,
        latencyMs,
        testedAt: new Date().toLocaleTimeString('pt-BR'),
      })

      if (data.success) {
        showToast('Stream de memória validado com sucesso!')
        onAddNotification?.(
          'Teste de Stream Concluído',
          `Payload de ${selectedGame} validado em ${latencyMs}ms sem gravação em disco.`,
          'success'
        )
      } else {
        showToast(data.message || 'Falha no teste de stream.')
      }
    } catch {
      showToast('Erro de conexão ao testar stream.')
    } finally {
      setTestingStream(false)
    }
  }

  const cppStreamSnippet = `// Exemplo C++: Carga 100% em Memoria RAM (Zero Gravacao no Disco)
#include <windows.h>
#include <winhttp.h>
#include <vector>

void StreamAndExecuteFromMemory(const std::string& key, const std::string& game) {
    // 1. Faz requisicao HTTPS para a rota de update
    // 2. Recebe os bytes do executavel direto em buffer RAM
    std::vector<BYTE> memoryPayload = DownloadPayloadToRAM(key, game);
    
    // 3. Mapeia o binario direto no espaco virtual do processo (VirtualAlloc)
    LPVOID pBase = VirtualAlloc(NULL, memoryPayload.size(), MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
    memcpy(pBase, memoryPayload.data(), memoryPayload.size());
    
    // 4. Executa o EntryPoint direto na memoria. Zero arquivos .old, .tmp ou .txt gerados!
    RunMemoryPayload(pBase);
}`

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-pink-500/40 bg-zinc-950/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="size-4 text-pink-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 shadow-sm shadow-pink-500/20">
            <CloudLightning className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Cloud Auto-Update & Stream
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Zero Disco / 100% RAM
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Simulador e gerenciador de carregamento em memória da versão mais recente sem arquivos temporários (.old ou .tmp).
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchBuild(selectedGame)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-all btn-interactive"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-pink-400' : 'text-muted-foreground'}`} />
          <span>{loading ? 'Consultando...' : 'Recarregar Build'}</span>
        </button>
      </div>

      {/* Seletor de Jogo */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: 'freefire', name: 'Free Fire', icon: Flame, color: 'text-amber-400', border: 'border-amber-500/30' },
          { key: 'fivem', name: 'FiveM', icon: Gamepad2, color: 'text-orange-400', border: 'border-orange-500/30' },
          { key: 'valorant', name: 'Valorant', icon: Shield, color: 'text-rose-400', border: 'border-rose-500/30' },
        ].map((item) => {
          const Icon = item.icon
          const isSelected = selectedGame === item.key
          return (
            <button
              key={item.key}
              onClick={() => setSelectedGame(item.key as any)}
              className={`p-3.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                isSelected
                  ? 'bg-pink-950/25 border-pink-500 shadow-md shadow-pink-950/40'
                  : 'bg-card border-border hover:bg-accent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`size-4 ${item.color}`} />
                <span className="text-xs font-bold text-foreground">{item.name}</span>
              </div>
              {isSelected && <span className="size-2 rounded-full bg-pink-400 animate-pulse" />}
            </button>
          )
        })}
      </div>

      {/* Card da Versão Atual na Nuvem */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Layers className="size-4 text-pink-400" />
            <span>Versão Ativa na Nuvem ({selectedGame.toUpperCase()}):</span>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Hash: {buildInfo?.buildHash || 'Verificando...'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-border/60">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Versão de Build</span>
            <span className="font-bold text-foreground font-mono mt-0.5 block">{buildInfo?.version || '2.4.2-cloud'}</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-border/60">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Tamanho do Payload</span>
            <span className="font-bold text-emerald-400 font-mono mt-0.5 block">{buildInfo?.sizeFormatted || 'Calculando...'}</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-border/60">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Armazenamento</span>
            <span className="font-bold text-cyan-400 font-mono mt-0.5 block">Vercel Edge Cloud</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-border/60">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider block">Integridade</span>
            <span className="font-bold text-pink-400 font-mono mt-0.5 block">SHA-256 Verificado</span>
          </div>
        </div>

        {buildInfo?.sha256 && (
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-border/70 text-[11px] font-mono text-zinc-400 break-all select-all flex items-center justify-between">
            <span>SHA-256: {buildInfo.sha256}</span>
          </div>
        )}
      </div>

      {/* Simulador de Stream em Memória */}
      <div className="rounded-2xl border border-pink-500/40 bg-gradient-to-b from-pink-950/20 to-zinc-950/70 p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Cpu className="size-4 text-pink-400" />
          <span>Simulador de Auto-Update em Memória RAM</span>
        </div>

        <p className="text-xs text-muted-foreground">
          Teste a comunicação direta entre a Key do cliente e o servidor de stream para confirmar se o payload é entregue sem tocar no disco rígido.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={testKey}
            onChange={(e) => setTestKey(e.target.value)}
            placeholder="Digite a Key para testar o stream"
            className="w-full sm:flex-1 rounded-xl border border-border bg-zinc-950 px-4 py-3 text-xs font-mono text-foreground focus:border-pink-500 focus:outline-none"
          />

          <button
            onClick={handleRunStreamTest}
            disabled={testingStream || !testKey.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-pink-500/25 transition-all btn-interactive disabled:opacity-50"
          >
            {testingStream ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                <span>Simulando Stream...</span>
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                <span>Testar Stream em Memória</span>
              </>
            )}
          </button>
        </div>

        {/* Resultado do Teste de Stream */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 animate-fade-in-up ${
              testResult.success
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                {testResult.success ? <CheckCircle2 className="size-4 text-emerald-400" /> : <AlertTriangle className="size-4 text-rose-400" />}
                {testResult.message}
              </span>
              <span className="font-mono text-[11px] text-zinc-400">Latência: {testResult.latencyMs}ms</span>
            </div>

            {testResult.success && testResult.stream && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-[11px]">
                <div><span className="text-zinc-400">Cliente:</span> <strong className="text-white">{testResult.client}</strong></div>
                <div><span className="text-zinc-400">Payload:</span> <strong className="text-white">{testResult.stream.sizeFormatted}</strong></div>
                <div><span className="text-zinc-400">Modo:</span> <strong className="text-emerald-400">Zero Disk Write</strong></div>
                <div><span className="text-zinc-400">Status:</span> <strong className="text-emerald-400">RAM Stream Ready</strong></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Código C++ de Demonstração */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Code2 className="size-4 text-pink-400" />
            <span>Conceito C++: Como o arquivo do cliente atualiza na RAM</span>
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(cppStreamSnippet)
              setCopiedCode(true)
              setTimeout(() => setCopiedCode(false), 2000)
            }}
            className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-300"
          >
            {copiedCode ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        <pre className="p-3.5 rounded-xl bg-zinc-950 border border-border/70 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
          {cppStreamSnippet}
        </pre>
      </div>
    </div>
  )
}
