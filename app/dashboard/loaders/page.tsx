'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Download, Flame, Crosshair, Target, Cpu, ExternalLink, Check, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LicenseKey } from '@/lib/types'

interface LoaderVariant {
  id: string
  name: string
  description: string
  version: string
  size: string
}

interface LoaderProduct {
  game: string
  productId: string  // valor que vem do campo `product` da key (lowercase)
  tag: string
  icon: typeof Flame
  accent: string
  glow: string
  description: string
  variants: LoaderVariant[]
}

const products: LoaderProduct[] = [
  {
    game: 'FreeFire',
    productId: 'freefire',
    tag: 'BlueStacks · HD-Player',
    icon: Flame,
    accent: 'from-orange-500/25 via-orange-400/10 to-red-400/5',
    glow: 'rgba(249,115,22,0.20)',
    description: 'Loader principal com bypass anti-detecção e suporte a múltiplas versões do emulador.',
    variants: [
      { id: 'basic',   name: 'Basic',   description: 'Aimbot + ESP essencial. Compatível com qualquer config.', version: '4.2.1', size: '12.4 MB' },
      { id: 'private', name: 'Private', description: 'Anti-screenshare avançado. Build individual.',          version: '4.2.1', size: '14.8 MB' },
      { id: 'remote',  name: 'Remote',  description: 'Headless. Controle total via painel web.',              version: '1.8.0', size: '8.2 MB'  },
    ],
  },
  {
    game: 'Valorant',
    productId: 'valorant',
    tag: 'Aim Color',
    icon: Crosshair,
    accent: 'from-violet-500/25 via-fuchsia-400/10 to-violet-400/5',
    glow: 'rgba(139,92,246,0.20)',
    description: 'Aim color com trigger bot e aim assist otimizado para o anti-cheat da Riot.',
    variants: [
      { id: 'aimcolor', name: 'Aim Color', description: 'Pacote completo: aim, trigger e visuais.', version: '2.5.3', size: '6.8 MB' },
    ],
  },
  {
    game: 'CS2',
    productId: 'cs2',
    tag: 'Counter-Strike 2',
    icon: Target,
    accent: 'from-amber-500/25 via-yellow-400/10 to-amber-400/5',
    glow: 'rgba(245,158,11,0.20)',
    description: 'Loader externo para CS2 com aim, ESP, radar e configs customizáveis.',
    variants: [
      { id: 'cs2', name: 'CS2 Loader', description: 'Build externo. Compatível com VAC e premier.', version: '1.3.7', size: '9.1 MB' },
    ],
  },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function ProductCard({ p, idx, userCount }: { p: LoaderProduct; idx: number; userCount: number }) {
  const [selected, setSelected] = useState(p.variants[0].id)
  const [downloading, setDownloading] = useState(false)
  const [done, setDone] = useState(false)

  const variant = p.variants.find((v) => v.id === selected) ?? p.variants[0]
  const Icon = p.icon

  const handleDownload = () => {
    setDownloading(true)
    setDone(false)
    setTimeout(() => {
      setDownloading(false)
      setDone(true)
      setTimeout(() => setDone(false), 2200)
    }, 1400)
  }

  return (
    <div
      className="card-in hover-lift relative overflow-hidden rounded-2xl border border-zinc-200/80 group shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
      style={{ backgroundColor: 'rgb(255,255,255)', animationDelay: `${idx * 100}ms` }}
    >
      <div
        className={`pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-gradient-to-br ${p.accent} blur-3xl opacity-70 group-hover:opacity-100 transition-opacity duration-700`}
      />

      <div
        className="flex items-center gap-3 border-b border-zinc-200/80 px-5 py-3 relative"
        style={{ backgroundColor: 'rgb(248,248,248)' }}
      >
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/[0.06] ring-1 ring-zinc-900/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ boxShadow: `0 0 18px ${p.glow}` }}
        >
          <Icon className="h-4 w-4 text-zinc-900" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900">{p.game}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{p.tag}</p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm"
          title={`${userCount} usuário${userCount === 1 ? '' : 's'} criado${userCount === 1 ? '' : 's'} para ${p.game}`}
        >
          <Users className="h-3 w-3 text-zinc-500" />
          <span className="tabular-nums">{userCount}</span>
        </span>
      </div>

      <div className="relative p-5 sm:p-6 flex flex-col gap-4">
        <p className="text-sm text-zinc-600 leading-relaxed">{p.description}</p>

        {p.variants.length > 1 ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Versão
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {p.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelected(v.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all duration-300 ${
                    selected === v.id
                      ? 'bg-zinc-900 text-white border-transparent shadow-[0_4px_16px_rgba(0,0,0,0.18)] scale-[1.02]'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-[rgb(245,245,245)] hover:text-zinc-900 hover:border-zinc-400'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div
          key={variant.id}
          className="row-in rounded-lg border border-zinc-200/80 bg-[rgb(250,250,250)] p-3 sm:p-4"
        >
          <p className="text-sm font-semibold text-zinc-900">{variant.name}</p>
          <p className="text-xs text-zinc-600 mt-1 leading-relaxed">{variant.description}</p>
          <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              v
              <span
                className="text-zinc-700 tabular-nums"
                style={{ fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace" }}
              >
                {variant.version}
              </span>
            </span>
            <span className="text-zinc-300">·</span>
            <span
              className="text-zinc-700 tabular-nums"
              style={{ fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace" }}
            >
              {variant.size}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="button-shine flex-1 bg-zinc-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50"
          >
            {done ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Pronto
              </>
            ) : downloading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 mr-2 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Baixando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar Loader
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="button-shine border border-zinc-200 bg-white text-zinc-700 hover:bg-[rgb(245,245,245)] hover:text-zinc-900 hover:border-zinc-400"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Tutorial
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function LoadersPage() {
  // Busca todas as keys pra contar quantas tem por produto
  const { data: keysResp } = useSWR<{ data: LicenseKey[] }>('/api/keys', fetcher, {
    refreshInterval: 30_000, // atualiza a cada 30s
  })
  const keys = keysResp?.data ?? []

  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const k of keys) {
      const p = (k.product ?? '').toLowerCase()
      if (!p) continue
      map[p] = (map[p] ?? 0) + 1
    }
    return map
  }, [keys])

  return (
    <div className="page-in flex flex-col gap-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Loaders</h1>
        <p className="text-sm text-muted-foreground">
          Builds atualizados de cada produto. Selecione a versão e baixe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((p, i) => (
          <ProductCard key={p.game} p={p} idx={i} userCount={counts[p.productId] ?? 0} />
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        <Download className="inline h-3 w-3 mr-1" />
        Os loaders são preparados para a versão atual do anti-cheat. Mantenha sempre atualizado.
      </p>
    </div>
  )
}
