'use client'

import useSWR from 'swr'
import { RecentActivity } from '@/components/recent-activity'
import { Loader2 } from 'lucide-react'
import type { AuthLog } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function LogsPage() {
  const { data: resp, isLoading, error } = useSWR<{ data: AuthLog[] }>(
    '/api/logs?limit=100',
    fetcher,
    { refreshInterval: 5000 }
  )
  const logs = resp?.data

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Logs</h1>
        <p className="text-sm text-muted-foreground">
          Historico de autenticacoes e eventos do sistema
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Erro ao carregar logs.
        </div>
      )}

      {logs && <RecentActivity logs={logs} />}
    </div>
  )
}
