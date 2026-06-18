import type { AuthLog } from '@/lib/types'
import { formatDate } from '@/lib/keys'
import { CheckCircle, XCircle, RotateCcw, Ban, Key, Clock, Monitor, AlertTriangle, Pause } from 'lucide-react'

const eventConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  auth_success:    { icon: CheckCircle,    color: 'text-green-600',  label: 'Auth OK' },
  auth_fail:       { icon: XCircle,        color: 'text-red-600',    label: 'Auth Falhou' },
  hwid_reset:      { icon: RotateCcw,      color: 'text-blue-600',   label: 'HWID Reset' },
  key_banned:      { icon: Ban,            color: 'text-red-600',    label: 'Key Banida' },
  key_paused:      { icon: Pause,          color: 'text-blue-600',   label: 'Key Pausada' },
  key_reactivated: { icon: CheckCircle,    color: 'text-green-600',  label: 'Key Reativada' },
  key_created:     { icon: Key,            color: 'text-zinc-900',   label: 'Key Criada' },
  key_deleted:     { icon: XCircle,        color: 'text-red-600',    label: 'Key Deletada' },
  key_expired:     { icon: Clock,          color: 'text-yellow-600', label: 'Key Expirada' },
  hwid_mismatch:   { icon: Monitor,        color: 'text-yellow-600', label: 'HWID Diferente' },
  device_limit:    { icon: AlertTriangle,  color: 'text-yellow-600', label: 'Limite Dispositivos' },
}

export function RecentActivity({ logs }: { logs: AuthLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Atividade Recente</h2>
      </div>
      <div className="divide-y divide-border">
        {logs.map((log) => {
          const config = eventConfig[log.event_type] ?? {
            icon: CheckCircle,
            color: 'text-zinc-500',
            label: log.event_type,
          }
          const Icon = config.icon
          return (
            <div key={log.id} className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary ${config.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{config.label}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {formatDate(log.created_at)}
                  </span>
                </div>
                <p className="truncate text-[11px] sm:text-xs text-muted-foreground">
                  {log.ip_address && `IP: ${log.ip_address}`}
                  {log.hwid && ` · HWID: ${log.hwid.slice(0, 12)}...`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
