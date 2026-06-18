import { Key, CheckCircle, XCircle, Ban, Monitor, Activity } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'

const stats = [
  { key: 'total_keys'   as const, label: 'Total de Keys',  icon: Key,         color: 'text-zinc-900',     bgColor: 'bg-zinc-900/[0.08]' },
  { key: 'active_keys'  as const, label: 'Keys Ativas',    icon: CheckCircle, color: 'text-green-600',    bgColor: 'bg-green-50'        },
  { key: 'expired_keys' as const, label: 'Keys Expiradas', icon: XCircle,     color: 'text-yellow-600',   bgColor: 'bg-yellow-50'       },
  { key: 'banned_keys'  as const, label: 'Keys Banidas',   icon: Ban,         color: 'text-red-600',      bgColor: 'bg-red-50'          },
  { key: 'total_hwids'  as const, label: 'Dispositivos',   icon: Monitor,     color: 'text-zinc-900',     bgColor: 'bg-zinc-900/[0.08]' },
  { key: 'recent_auths' as const, label: 'Auths Recentes', icon: Activity,    color: 'text-green-600',    bgColor: 'bg-green-50'        },
]

export function StatsCards({ stats: data }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.key}
          className="rounded-xl border border-border bg-card p-3 sm:p-5 hover-lift shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0 ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-foreground tabular-nums leading-none mb-1">{data[stat.key]}</p>
              <p className="text-[11px] sm:text-sm text-muted-foreground truncate">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
