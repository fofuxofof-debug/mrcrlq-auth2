'use client'

import type { LicenseKey, HWID } from '@/lib/types'
import { getDaysRemaining, formatDate } from '@/lib/keys'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Copy, Loader2, Monitor, Cpu } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// A linha da tabela aceita keys enriquecidas com hwids vindos da API.
type KeyRow = LicenseKey & { hwids?: HWID[] }

function statusFor(key: LicenseKey) {
  const isExpired = new Date(key.expires_at) <= new Date()
  if (key.status === 'banned') return 'banned'
  if (key.status === 'paused') return 'paused'
  if (isExpired) return 'expired'
  return 'active'
}

const STATUS_BADGE = {
  active:  { label: 'Ativa',    className: 'border-green-300 bg-green-50 text-green-700' },
  expired: { label: 'Expirada', className: 'border-yellow-300 bg-yellow-50 text-yellow-700' },
  banned:  { label: 'Banida',   className: 'border-red-300 bg-red-50 text-red-700' },
  paused:  { label: 'Pausada',  className: 'border-blue-300 bg-blue-50 text-blue-700' },
} as const

function StatusBadge({ licenseKey }: { licenseKey: LicenseKey }) {
  const s = statusFor(licenseKey)
  const c = STATUS_BADGE[s]
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>
}

// Render do HWID: mostra os primeiros 12 chars + "..." e botao de copiar.
// Se ha mais de 1 HWID, mostra "+N" pra indicar.
function HwidCell({ hwids }: { hwids?: HWID[] }) {
  if (!hwids || hwids.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const first = hwids[0].hwid
  const shortened = first.length > 12 ? `${first.slice(0, 12)}…` : first
  const extra = hwids.length - 1

  const copy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(first)
    toast.success(`HWID copiado (${first.slice(0, 8)}…)`)
  }

  return (
    <div className="flex items-center gap-2">
      <code
        title={first}
        className="rounded bg-secondary px-2 py-1 font-mono text-[11px] text-foreground"
      >
        {shortened}
      </code>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={copy}
      >
        <Copy className="h-3 w-3" />
      </Button>
      {extra > 0 && (
        <span className="text-[11px] text-muted-foreground">+{extra}</span>
      )}
    </div>
  )
}

export function KeysTable({
  keys,
  isLoading,
}: {
  keys: KeyRow[]
  isLoading: boolean
  onMutate: () => void
}) {
  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('Key copiada!')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (keys.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma key encontrada</p>
      </div>
    )
  }

  return (
    <>
      {/* ========= MOBILE: cards ========= */}
      <div className="flex flex-col gap-3 md:hidden">
        {keys.map((key) => {
          const daysLeft = getDaysRemaining(key.expires_at)
          return (
            <div
              key={key.id}
              className="rounded-xl border border-border bg-card p-4 hover-lift"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <code className="block truncate rounded bg-secondary px-2 py-1 font-mono text-[11px] text-foreground">
                      {key.key.length > 22 ? `${key.key.slice(0, 22)}…` : key.key}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => copyKey(key.key)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {key.label && (
                    <p className="mt-2 text-sm text-foreground truncate">{key.label}</p>
                  )}
                </div>
                <StatusBadge licenseKey={key} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div className="flex flex-col">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Cpu className="h-3 w-3" /> HWID
                  </span>
                  <span className="text-foreground font-medium">
                    <HwidCell hwids={key.hwids} />
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Monitor className="h-3 w-3" /> Dispositivos
                  </span>
                  <span className="text-foreground font-medium">
                    {(key.hwids?.length ?? 0)}/{key.max_devices}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Validade</span>
                  <span
                    className={`font-medium ${
                      daysLeft <= 0
                        ? 'text-red-600'
                        : daysLeft <= 7
                          ? 'text-yellow-600'
                          : 'text-foreground'
                    }`}
                  >
                    {daysLeft <= 0 ? 'Expirada' : `${daysLeft} dias`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-[11px] text-muted-foreground">
                  {formatDate(key.expires_at)}
                </span>
                <Link href={`/dashboard/keys/${key.id}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs text-zinc-700 hover:text-zinc-900"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* ========= DESKTOP: table ========= */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Key</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Label</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">HWID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Dispositivos</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Expira</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((key) => {
                const daysLeft = getDaysRemaining(key.expires_at)
                const used = key.hwids?.length ?? 0
                return (
                  <tr key={key.id} className="transition-colors hover:bg-secondary/50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-secondary px-2 py-1 font-mono text-xs text-foreground">
                          {key.key.length > 22 ? `${key.key.slice(0, 22)}…` : key.key}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => copyKey(key.key)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">{key.label ?? '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3"><StatusBadge licenseKey={key} /></td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <HwidCell hwids={key.hwids} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{used}/{key.max_devices}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{formatDate(key.expires_at)}</span>
                        <span
                          className={`text-xs ${
                            daysLeft <= 0
                              ? 'text-red-600'
                              : daysLeft <= 7
                                ? 'text-yellow-600'
                                : 'text-muted-foreground'
                          }`}
                        >
                          {daysLeft <= 0 ? 'Expirada' : `${daysLeft} dias restantes`}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link href={`/dashboard/keys/${key.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
