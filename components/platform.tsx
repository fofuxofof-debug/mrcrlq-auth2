'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity, AlertTriangle, ArrowRight, Ban, BarChart3, Bell, Camera, Check, CheckCircle2, ChevronDown, Clock, Code2,
  Copy, Download, ExternalLink, Eye, FileText, Filter, Gamepad2, Gauge, Globe, Hash, Image as ImageIcon,
  KeyRound, Laptop, LayoutDashboard, LayoutGrid, LifeBuoy, LockKeyhole, LogOut, Maximize2, Menu, Monitor, MoreHorizontal,
  PanelLeft,
  Plus, Power, PowerOff, RefreshCw, RotateCcw, Save, Search, Server, Settings2, Shield, ShieldAlert, ShieldCheck, Smartphone, Sparkles, Terminal,
  Trash2, UploadCloud, User, Users, X, Zap
} from 'lucide-react'

import {
  normalizeLicense,
  isLicenseExpired,
  getRemainingSeconds,
  formatRemainingTime,
  formatExpiryDate,
  calculateExpiryDate,
  isLifetime,
} from '@/lib/duration'
import { BannedTab } from '@/components/banned-tab'
import { LoaderTab } from '@/components/loader-tab'

export interface AuthAccount {
  username: string
  password: string
  displayName: string
  role: 'admin' | 'operator'
  roleLabel: string
}

export const ACCOUNTS: AuthAccount[] = [
  {
    username: 'Hookedadmin',
    password: 'hoketados22',
    displayName: 'Hookedadmin',
    role: 'admin',
    roleLabel: 'Acesso Total (Admin)',
  },
]

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(children, document.body)
}

export interface LicenseItem {
  key: string
  name: string
  discordId: string
  discordUsername?: string
  discordAvatar?: string
  game: string
  tempo: string
  plano?: string
  devices: string
  hwid?: string
  issued: string
  expiry: string
  status: 'Active' | 'Expired' | 'Suspended'
  owner: string
}

export interface NotificationItem {
  id: string
  title: string
  desc: string
  time: string
  type: 'success' | 'info' | 'warning' | 'security'
  read: boolean
}

const navItems = [
  ['Licenses', KeyRound],
  ['Loader', Download],
  ['Banidas & Discord', ShieldAlert],
  ['Logs', FileText],
  ['Settings', Settings2],
] as const

type NavItemLabel = typeof navItems[number][0]

const stats = [
  { label: 'Active licenses', value: '12,842', change: '+12.4%', icon: KeyRound, tone: 'blue' },
  { label: 'Total users', value: '8,491', change: '+8.2%', icon: Users, tone: 'pink' },
  { label: 'Auth requests', value: '248.6k', change: '+18.7%', icon: Activity, tone: 'pink' },
  { label: 'Success rate', value: '99.82%', change: '+0.4%', icon: ShieldCheck, tone: 'green' },
]

const activity = [
  ['License activated', 'Key ending in ···9A2F', '2 min ago', 'success'],
  ['New user registered', 'client.vip@hooked.io', '14 min ago', 'info'],
  ['Application updated', 'Desktop Client v2.4.0', '38 min ago', 'neutral'],
  ['Authentication failed', 'IP 185.24.19.42', '1 hr ago', 'warning'],
]

const BLOCKED_TEST_KEYS = new Set([
  '1443975682320502845',
  '933811331457482752',
])

function isTestKey(keyOrId?: string): boolean {
  if (!keyOrId) return false
  const clean = keyOrId.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
  return BLOCKED_TEST_KEYS.has(clean)
}

export function Platform() {
  const [currentUser, setCurrentUser] = useState<AuthAccount | null>(ACCOUNTS[0])
  const [dashboard, setDashboard] = useState(true)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [active, setActive] = useState<NavItemLabel>('Licenses')
  const [mobileNav, setMobileNav] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [systemAuthEnabled, setSystemAuthEnabled] = useState(true)

  // Persistência de Sessão e Aba Ativa no LocalStorage para não perder a tela no F5 (Recarregar)
  useEffect(() => {
    try {
      fetch('/api/system/settings')
        .then((r) => r.json())
        .then((d) => {
          if (d && typeof d.authEnabled === 'boolean') {
            setSystemAuthEnabled(d.authEnabled)
          }
        })
        .catch(() => {})

      const loggedOut = localStorage.getItem('hooked_auth_logged_out')
      if (loggedOut === 'true') {
        setCurrentUser(null)
        setDashboard(false)
        return
      }

      const savedUserStr = localStorage.getItem('hooked_auth_user')
      if (savedUserStr) {
        const parsed = JSON.parse(savedUserStr)
        const found = ACCOUNTS.find(
          (a) => a.username.toLowerCase() === parsed.username?.toLowerCase()
        )
        if (found) {
          setCurrentUser(found)
          setDashboard(true)
        }
      }

      const savedTab = localStorage.getItem('hooked_auth_active_tab')
      if (savedTab && savedTab !== 'Overview') {
        setActive(savedTab as NavItemLabel)
      } else {
        setActive('Licenses')
      }
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleTabChange = (label: NavItemLabel) => {
    setActive(label)
    try {
      localStorage.setItem('hooked_auth_active_tab', label)
    } catch {}
  }

  // Notificações do sino
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n-1',
      title: 'Sistema Hooked Auth Online',
      desc: 'Proteção de HWID e autenticação operacional.',
      time: 'Agora',
      type: 'success',
      read: false,
    },
    {
      id: 'n-2',
      title: 'Nova Ativação Free Fire',
      desc: '22cao vinculou máquina (1 / 1 HWID).',
      time: '6 min atrás',
      type: 'info',
      read: false,
    },
    {
      id: 'n-3',
      title: 'Tentativa Bloqueada',
      desc: 'Tentativa de reset em chave expirada foi barrada.',
      time: '24 min atrás',
      type: 'warning',
      read: false,
    },
    {
      id: 'n-4',
      title: 'Criptografia Argon2id Ativa',
      desc: 'Todos os hashes de integridade operando normalmente.',
      time: '1h atrás',
      type: 'security',
      read: true,
    },
  ])

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleClearNotifications = () => {
    setNotifications([])
  }

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleToggleNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    )
  }

  const addNotification = (
    title: string,
    desc: string,
    type: 'success' | 'info' | 'warning' | 'security'
  ) => {
    const newNotif: NotificationItem = {
      id: 'n-' + Date.now(),
      title,
      desc,
      time: 'Agora',
      type,
      read: false,
    }
    setNotifications((prev) => [newNotif, ...prev])
  }

  // Banco de dados em memória compartilhado, isolado por owner
  const [licenses, setLicenses] = useState<LicenseItem[]>([
    {
      key: '1506778729425408112',
      name: 'Puto Xitadinho',
      discordId: '1506778729425408112',
      discordUsername: 'sheikdenovo',
      discordAvatar: 'https://cdn.discordapp.com/avatars/1506778729425408112/bc9b563933974575d99ebb71a3bc8b68.png?size=128',
      game: 'Valorant',
      plano: '30 Dias (Mensal)',
      tempo: '30 Dias',
      devices: '0 / 1 HWID',
      issued: '28/10/2026',
      expiry: '2026-11-27T14:56:57.000Z',
      status: 'Active',
      owner: 'Hookedadmin',
      hwid: '',
    },
    {
      key: '1118361148417396786',
      name: 'Lcpkrl',
      discordId: '1118361148417396786',
      discordUsername: 'lcpkr',
      discordAvatar: 'https://cdn.discordapp.com/avatars/1118361148417396786/2706f9a41a9de2169392b570dbaff0bd.png?size=128',
      game: 'Valorant',
      plano: '30 Dias (Mensal)',
      tempo: '27 Dias',
      devices: '0 / 1 HWID',
      issued: '25/10/2026',
      expiry: '2026-11-24T14:56:57.000Z',
      status: 'Active',
      owner: 'Hookedadmin',
      hwid: '',
    },
    {
      key: '1312495175376834647',
      name: 'Samuca Xitadinho',
      discordId: '1312495175376834647',
      discordUsername: 'samucadev1',
      discordAvatar: 'https://cdn.discordapp.com/avatars/1312495175376834647/018563b39806dc930d34536951455cc1.png?size=128',
      game: 'Free Fire',
      plano: 'Vitalício (Lifetime)',
      tempo: 'Vitalício',
      devices: '0 / 1 HWID',
      issued: '28/10/2026',
      expiry: 'Vitalício',
      status: 'Active',
      owner: 'Hookedadmin',
      hwid: '',
    },
    {
      key: '1517054236041416800',
      name: '22cao',
      discordId: '1517054236041416800',
      discordUsername: 'rlqdosrlq',
      discordAvatar: 'https://cdn.discordapp.com/avatars/1517054236041416800/c909baec1582401e3c2d8c9beca07c3e.png?size=128',
      game: 'Free Fire',
      plano: 'Vitalício (Lifetime)',
      tempo: 'Vitalício',
      devices: '1 / 1 HWID (Vinculado)',
      issued: '28/10/2026',
      expiry: 'Vitalício',
      status: 'Active',
      owner: 'Hookedadmin',
      hwid: 'HWID-TEST-DEBUG-12345',
    },
    {
      key: '272360594999607296',
      name: '76j3',
      discordId: '272360594999607296',
      discordUsername: '76j3',
      discordAvatar: 'https://cdn.discordapp.com/avatars/272360594999607296/2943ab115df3e1c6a55ee8b3a17c3c9d.png?size=128',
      game: 'Valorant',
      plano: '30 Dias (Mensal)',
      tempo: '27 Dias',
      devices: '0 / 1 HWID',
      issued: 'Oct 24, 2026',
      expiry: '2026-11-24T00:00:00.000Z',
      status: 'Active',
      owner: 'Hookedadmin',
      hwid: '',
    },
  ])

  // Sincronizar licenças em tempo real com a API do servidor e manter backup no LocalStorage
  const [isRefreshingLicenses, setIsRefreshingLicenses] = useState(false)

  const syncWithServer = useCallback(async () => {
    try {
      setIsRefreshingLicenses(true)
      const res = await fetch('/api/licenses', { cache: 'no-store' })
      const data = await res.json()
      if (data.success && Array.isArray(data.licenses)) {
        let deletedKeysSet = new Set<string>()
        try {
          const savedDeleted = localStorage.getItem('hooked_auth_deleted_keys')
          if (savedDeleted) {
            const arr = JSON.parse(savedDeleted)
            if (Array.isArray(arr)) {
              arr.forEach((k: string) => deletedKeysSet.add(String(k).trim().toLowerCase()))
            }
          }
        } catch {}

        const cleanServer: LicenseItem[] = data.licenses
          .filter((s: LicenseItem) => {
            const k = (s.key || '').trim().toLowerCase()
            const d = (s.discordId || '').trim().toLowerCase()
            return !isTestKey(k) && !isTestKey(d) && !deletedKeysSet.has(k) && !deletedKeysSet.has(d)
          })
          .map((s: LicenseItem) => {
            const norm = normalizeLicense(s)
            if (norm.hwid && MOCK_HWID_PREFIXES.includes(norm.hwid.trim())) {
              return { ...norm, hwid: '', devices: '0 / 1 HWID' }
            }
            return norm
          })

        setLicenses((prev) => {
          const merged = cleanServer.map((serverLic) => {
            const serverK = (serverLic.key || '').trim().toLowerCase()
            const local = prev.find((p) => (p.key || '').trim().toLowerCase() === serverK)
            if (local) {
              if (local.hwid === '' && local.devices?.includes('Resetado')) {
                return { ...serverLic, hwid: '', devices: '0 / 1 HWID (Resetado)' }
              }
            }
            return serverLic
          })

          try {
            localStorage.setItem('hooked_auth_licenses_backup', JSON.stringify(merged))
          } catch {}
          return merged
        })
      }
    } catch {
    } finally {
      setIsRefreshingLicenses(false)
    }
  }, [])

  const MOCK_HWID_PREFIXES = ['HWID-03B148AB-78B22918', 'HWID-6534CAD7-AADC5B26']

  useEffect(() => {
    let localBackup: LicenseItem[] = []
    try {
      let deletedKeysSet = new Set<string>()
      const savedDeleted = localStorage.getItem('hooked_auth_deleted_keys')
      if (savedDeleted) {
        const arr = JSON.parse(savedDeleted)
        if (Array.isArray(arr)) {
          arr.forEach((k: string) => deletedKeysSet.add(String(k).trim().toLowerCase()))
        }
      }

      const saved = localStorage.getItem('hooked_auth_licenses_backup')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          localBackup = parsed
            .filter((b) => {
              const k = (b.key || '').trim().toLowerCase()
              const d = (b.discordId || '').trim().toLowerCase()
              return !isTestKey(k) && !isTestKey(d) && !deletedKeysSet.has(k) && !deletedKeysSet.has(d)
            })
            .map((b) => {
              const norm = normalizeLicense(b)
              const hasMockHwid = norm.hwid && MOCK_HWID_PREFIXES.includes(norm.hwid.trim())
              if (hasMockHwid) {
                return { ...norm, hwid: '', devices: '0 / 1 HWID' }
              }
              return norm
            })
          setLicenses(localBackup)
        }
      }
    } catch {}

    syncWithServer()

    const pollInterval = setInterval(() => {
      syncWithServer()
    }, 3500)

    const onWindowFocus = () => {
      syncWithServer()
    }
    window.addEventListener('focus', onWindowFocus)

    return () => {
      clearInterval(pollInterval)
      window.removeEventListener('focus', onWindowFocus)
    }
  }, [syncWithServer])

  // Salva no LocalStorage sempre que houver alteração
  useEffect(() => {
    if (licenses && licenses.length > 0) {
      try {
        localStorage.setItem('hooked_auth_licenses_backup', JSON.stringify(licenses))
      } catch {}
    }
  }, [licenses])

  const handleCopy = (key: string, id: string = 'default') => {
    navigator.clipboard?.writeText(key)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 1500)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    const found = ACCOUNTS.find(
      (acc) =>
        acc.username.toLowerCase() === loginUsername.trim().toLowerCase() &&
        acc.password === loginPassword.trim()
    )

    if (!found) {
      setLoginError('Usuário ou senha incorretos.')
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: loginUsername.trim() || 'Desconhecido',
          game: 'Painel Web',
          client: 'Painel de Controle',
          status: 'FAILED',
          statusCode: 401,
          reason: 'Tentativa de login no painel com credenciais incorretas',
        }),
      }).catch(() => {})
      return
    }

    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor: found.displayName,
        game: 'Painel Web',
        client: 'Painel de Controle',
        status: 'SUCCESS',
        statusCode: 200,
        reason: 'Login de administrador efetuado com sucesso',
      }),
    }).catch(() => {})

    setCurrentUser(found)
    const nextTab: NavItemLabel = 'Licenses'
    setActive(nextTab)
    setDashboard(true)
    setLoginModalOpen(false)
    setLoginPassword('')
    setLoginError('')

    try {
      localStorage.setItem('hooked_auth_user', JSON.stringify(found))
      localStorage.setItem('hooked_auth_active_tab', nextTab)
      localStorage.removeItem('hooked_auth_logged_out')
    } catch {}
  }

  // Se não estiver logado no dashboard, mostra Landing page + Modal de login
  if (!dashboard || !currentUser) {
    return (
      <>
        <Landing onOpenLogin={() => {
          setLoginError('')
          setLoginModalOpen(true)
        }} />

        {/* Modal de Painel de Controle / Login */}
        {loginModalOpen && (
          <ModalPortal>
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-fade-in overflow-y-auto"
              style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              onClick={() => setLoginModalOpen(false)}
            >
              <div
                className="relative w-full max-w-sm my-auto max-h-[92vh] overflow-y-auto rounded-2xl border border-pink-500/20 bg-card p-5 sm:p-6 shadow-2xl shadow-pink-950/20 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-pink-950/40 text-pink-400 border border-pink-500/30">
                      <LockKeyhole className="size-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Painel de Controle</h3>
                      <p className="text-[11px] text-muted-foreground">Autenticação Hooked Auth</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLoginModalOpen(false)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Fechar"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <form onSubmit={handleLogin} className="mt-5 space-y-4">
                  {loginError && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
                      {loginError}
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <User className="size-3.5 text-pink-500" />
                      Usuário
                    </label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Digite seu usuário"
                      required
                      autoFocus
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <KeyRound className="size-3.5 text-pink-500" />
                      Senha
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      required
                      className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-border/60">
                    <button
                      type="button"
                      onClick={() => setLoginModalOpen(false)}
                      className="w-full sm:w-auto rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground btn-interactive text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 px-4 py-2 text-xs font-semibold text-white btn-interactive hover-lift shadow-md shadow-pink-500/25"
                    >
                      Entrar no Dashboard <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </ModalPortal>
        )}
      </>
    )
  }

  // Permissões por cargo: operadores só têm acesso a Licenses
  const userNavItems =
    currentUser.role === 'operator'
      ? navItems.filter(([label]) => label === 'Licenses')
      : navItems

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[280px] max-w-[85vw] flex-col border-r border-border/60 bg-sidebar p-4 transition-transform duration-300 lg:translate-x-0 ${
          mobileNav ? 'translate-x-0 shadow-2xl shadow-black/80' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2 pb-6 pt-2">
          <button
            onClick={() => {
              handleTabChange('Licenses')
            }}
            className="flex items-center gap-2.5 text-left"
            aria-label="Ir para Licenses"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30">
              <LockKeyhole className="size-4" />
            </span>
            <span className="text-[15px] font-bold tracking-[-0.02em]">Hooked <span className="text-pink-500">Auth</span></span>
          </button>
          <button
            onClick={() => setMobileNav(false)}
            className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden transition-colors"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="px-2 pb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
          {currentUser.role === 'operator' ? 'Painel Operador' : 'Workspace Admin'}
        </p>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
          {userNavItems.map(([label, Icon]) => {
            const isActive = active === label
            return (
              <button
                key={label}
                onClick={() => {
                  handleTabChange(label)
                  setMobileNav(false)
                }}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs transition-all duration-200 btn-interactive ${
                  isActive
                    ? 'border border-pink-500/35 bg-gradient-to-r from-pink-950/60 via-pink-900/25 to-pink-950/10 text-white font-semibold shadow-[0_0_16px_rgba(236,72,153,0.14)] translate-x-1'
                    : 'border border-transparent text-zinc-400 hover:border-pink-500/20 hover:bg-zinc-900/60 hover:text-zinc-100 hover:translate-x-1'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-pink-500 shadow-[0_0_10px_#ec4899]" />
                )}
                <Icon
                  className={`size-4 transition-colors ${
                    isActive ? 'text-pink-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.5)]' : 'text-zinc-500 group-hover:text-pink-400'
                  }`}
                />
                <span className="tracking-wide">{label}</span>
                {label === 'Logs' && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold transition-colors ${
                      isActive
                        ? 'border border-pink-500/40 bg-pink-500/20 text-pink-300'
                        : 'border border-zinc-800 bg-zinc-900 text-zinc-400 group-hover:border-pink-500/30 group-hover:text-pink-300'
                    }`}
                  >
                    3
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Informações da conta logada & Botão de Sair */}
        <div className="mt-5 border-t border-border/60 pt-4 shrink-0">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5 transition-colors hover:bg-muted border border-border/40">
            <div className="grid size-8 place-items-center rounded-full bg-pink-950/60 text-xs font-bold text-pink-400 shadow-sm border border-pink-500/30">
              {currentUser.displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{currentUser.displayName}</p>
              <p className="truncate text-[10px] text-muted-foreground">{currentUser.roleLabel}</p>
            </div>
            <button
              onClick={() => {
                setDashboard(false)
                setCurrentUser(null)
                try {
                  localStorage.removeItem('hooked_auth_user')
                  localStorage.removeItem('hooked_auth_active_tab')
                  localStorage.setItem('hooked_auth_logged_out', 'true')
                } catch {}
              }}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-950/40 hover:text-rose-400 transition-colors btn-interactive"
              title="Sair da conta"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {mobileNav && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
          className="fixed inset-0 z-30 bg-black/75 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Main Content Area */}
      <main className="lg:pl-[280px]">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[64px] sm:h-[68px] items-center justify-between border-b-0 sm:border-b sm:border-border/40 bg-background px-4 sm:px-5 lg:px-8 shadow-sm">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setMobileNav(true)}
              className="size-9 grid place-items-center rounded-xl bg-pink-950/40 border border-pink-500/35 text-pink-400 hover:text-pink-300 hover:bg-pink-900/50 lg:hidden btn-interactive shadow-sm shadow-pink-500/15 transition-all active:scale-95"
              aria-label="Abrir menu"
            >
              <PanelLeft className="size-4.5 text-pink-400" />
            </button>
            <div>
              <p className="text-[10px] sm:text-xs text-pink-400 font-semibold tracking-wider uppercase">Workspace</p>
              <h1 className="text-xs sm:text-sm font-bold text-foreground">{active}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('Licenses')}
              className="flex items-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 px-3 py-1.5 sm:py-2 text-xs font-semibold text-white btn-interactive hover-lift shadow-sm shadow-pink-500/25 hover:opacity-90 transition-colors"
            >
              <Plus className="size-3.5" />
              <span>Create</span>
            </button>
          </div>
        </header>

        {/* Banner de Alerta quando a Autenticação estiver Pausada */}
        {!systemAuthEnabled && (
          <div className="border-b border-red-500/40 bg-red-500/15 px-3 py-2 text-center text-xs font-semibold text-red-200 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="size-4 text-red-400 shrink-0" />
              <span>
                <strong>ATENÇÃO:</strong> A autenticação do sistema está <u>PAUSADA</u>.
              </span>
            </div>
            <button
              onClick={() => handleTabChange('Settings')}
              className="rounded bg-red-500/30 hover:bg-red-500/50 px-2 py-0.5 text-[11px] text-white underline underline-offset-2 transition-colors"
            >
              Ir para Configurações
            </button>
          </div>
        )}

        {/* Dynamic Tab Body with Smooth Transition */}
        <div key={active} className="mx-auto max-w-[1440px] p-3 sm:p-5 lg:p-8 animate-fade-in-up">
          {active === 'Licenses' && (
            <LicensesTab
              currentUser={currentUser}
              copiedKey={copiedKey}
              onCopy={handleCopy}
              licenses={licenses}
              setLicenses={setLicenses}
              onAddNotification={addNotification}
              onRefresh={syncWithServer}
              isRefreshing={isRefreshingLicenses}
            />
          )}
          {active === 'Loader' && (
            <LoaderTab
              currentUser={currentUser}
              onAddNotification={addNotification}
            />
          )}
          {active === 'Banidas & Discord' && (
            <BannedTab
              currentUser={currentUser}
              onAddNotification={addNotification}
              onUnbanLicense={(unbannedId) => {
                const clean = unbannedId.trim().toLowerCase()
                setLicenses((prev) =>
                  prev.map((l) => {
                    if (l.key.trim().toLowerCase() === clean || l.discordId?.trim().toLowerCase() === clean) {
                      return { ...l, status: 'Active' }
                    }
                    return l
                  })
                )
                fetch('/api/licenses', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ key: unbannedId, status: 'Active' }),
                }).catch(() => {})
              }}
            />
          )}
          {active === 'Logs' && currentUser.role === 'admin' && <LogsTab currentUser={currentUser} />}
          {active === 'Settings' && currentUser.role === 'admin' && (
            <SettingsTab
              currentUser={currentUser}
              onAuthStatusChange={setSystemAuthEnabled}
              onAddNotification={addNotification}
            />
          )}
        </div>
      </main>
    </div>
  )
}

/* =========================================================================================
 * 2. Licenses Tab
 * ========================================================================================= */
function LicensesTab({
  currentUser,
  copiedKey,
  onCopy,
  licenses,
  setLicenses,
  onAddNotification,
  onRefresh,
  isRefreshing,
}: {
  currentUser: AuthAccount
  copiedKey: string | null
  onCopy: (k: string, id: string) => void
  licenses: LicenseItem[]
  setLicenses: React.Dispatch<React.SetStateAction<LicenseItem[]>>
  onAddNotification?: (
    title: string,
    desc: string,
    type: 'success' | 'info' | 'warning' | 'security'
  ) => void
  onRefresh?: () => void
  isRefreshing?: boolean
}) {
  const [filter, setFilter] = useState<'All' | 'Active' | 'Expired' | 'Suspended'>('All')
  const [search, setSearch] = useState('')

  // Modal de Detalhes da Licença (aberto pelos 3 pontinhos) e Toast
  const [selectedDetailsLicense, setSelectedDetailsLicense] = useState<LicenseItem | null>(null)
  const [editingTempo, setEditingTempo] = useState<string>('')
  const [editingCustomTempo, setEditingCustomTempo] = useState<string>('')
  const [isUpdatingTempo, setIsUpdatingTempo] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Alterar duração / tempo da key
  const handleUpdateTempo = async () => {
    if (!selectedDetailsLicense) return
    const finalTempo = editingTempo === 'Customizado' ? (editingCustomTempo.trim() || 'Custom') : editingTempo
    if (!finalTempo) return

    setIsUpdatingTempo(true)
    const isLife = isLifetime(finalTempo)
    const newExpiry = isLife ? 'Vitalício' : calculateExpiryDate(finalTempo)
    const newRemainingTempo = isLife ? 'Vitalício (Lifetime)' : formatRemainingTime(newExpiry, finalTempo)

    const updatedLic: LicenseItem = {
      ...selectedDetailsLicense,
      plano: finalTempo,
      tempo: newRemainingTempo,
      expiry: newExpiry,
      status: 'Active',
      issued: new Date().toLocaleDateString('pt-BR'),
    }

    setLicenses((prev) =>
      prev.map((l) => (l.key.toLowerCase().trim() === updatedLic.key.toLowerCase().trim() ? updatedLic : l))
    )
    setSelectedDetailsLicense(updatedLic)

    try {
      await fetch('/api/licenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: updatedLic.key,
          plano: updatedLic.plano,
          tempo: updatedLic.tempo,
          expiry: updatedLic.expiry,
          status: updatedLic.status,
          issued: updatedLic.issued,
        }),
      })
    } catch {}

    setIsUpdatingTempo(false)
    showToast(`Duração da key alterada para: ${finalTempo}`)
    onAddNotification?.(
      'Duração Alterada',
      `Key ${updatedLic.key} (${updatedLic.name}) teve o tempo alterado para ${finalTempo}.`,
      'info'
    )
  }

  const handleUpdateGame = async (key: string, newGame: string) => {
    const cleanKey = key.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
    setLicenses((prev) =>
      prev.map((l) => (l.key.toLowerCase().trim() === cleanKey.toLowerCase() ? { ...l, game: newGame } : l))
    )
    setSelectedDetailsLicense((prev) =>
      prev && prev.key.toLowerCase().trim() === cleanKey.toLowerCase() ? { ...prev, game: newGame } : prev
    )
    showToast(`Jogo alterado para ${newGame}!`)
    try {
      await fetch('/api/licenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: cleanKey, game: newGame }),
      })
    } catch {}
    onAddNotification?.(
      'Jogo Alterado',
      `Key ${cleanKey} agora está vinculada a ${newGame}.`,
      'info'
    )
  }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [discordId, setDiscordId] = useState('')
  const [name, setName] = useState('')
  const [tempo, setTempo] = useState('30 Dias (Mensal)')
  const [customTempo, setCustomTempo] = useState('')
  const [game, setGame] = useState('Todos os Jogos')
  const [generatedKey, setGeneratedKey] = useState<LicenseItem | null>(null)
  const [formError, setFormError] = useState('')
  const [discordProfile, setDiscordProfile] = useState<{
    id: string
    username: string
    globalName: string
    avatarUrl: string
  } | null>(null)
  const [isFetchingDiscord, setIsFetchingDiscord] = useState(false)

  const fetchDiscordProfile = async (id: string) => {
    const clean = id.trim()
    if (!clean || clean.length < 16 || !/^\d+$/.test(clean)) {
      setDiscordProfile(null)
      return
    }
    setIsFetchingDiscord(true)
    try {
      const res = await fetch(`/api/discord/user?id=${clean}`)
      const data = await res.json()
      if (data.success && data.user) {
        setDiscordProfile(data.user)
        setName((prev) => (!prev || prev.startsWith('Cliente ') ? data.user.globalName || data.user.username : prev))
      } else {
        setDiscordProfile(null)
      }
    } catch {
      setDiscordProfile(null)
    } finally {
      setIsFetchingDiscord(false)
    }
  }

  // Ações da Licença (Resetar HWID, Banir, Deletar)
  const handleResetKey = (key: string) => {
    const cleanKey = key.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
    setLicenses((prev) =>
      prev.map((lic) => (lic.key.toLowerCase().trim() === cleanKey.toLowerCase() ? { ...lic, hwid: '', devices: '0 / 1 HWID (Resetado)' } : lic))
    )
    setSelectedDetailsLicense((prev) =>
      prev && prev.key.toLowerCase().trim() === cleanKey.toLowerCase() ? { ...prev, hwid: '', devices: '0 / 1 HWID (Resetado)' } : prev
    )
    showToast(`HWID da key ${cleanKey} resetado com sucesso!`)
    fetch('/api/licenses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: cleanKey, hwid: '', devices: '0 / 1 HWID (Resetado)', hwidReset: true }),
    }).catch(() => {})

    onAddNotification?.(
      'HWID Resetado',
      `Key ${cleanKey} teve o dispositivo HWID liberado com sucesso.`,
      'info'
    )
  }

  const handleBanKey = (key: string) => {
    const cleanKey = key.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
    let isNowBanned = false
    setLicenses((prev) =>
      prev.map((lic) => {
        if (lic.key.toLowerCase().trim() === cleanKey.toLowerCase()) {
          isNowBanned = lic.status !== 'Suspended'
          return { ...lic, status: isNowBanned ? 'Suspended' : 'Active' }
        }
        return lic
      })
    )
    setSelectedDetailsLicense((prev) =>
      prev && prev.key.toLowerCase().trim() === cleanKey.toLowerCase() ? { ...prev, status: prev.status === 'Suspended' ? 'Active' : 'Suspended' } : prev
    )
    showToast(isNowBanned ? `Key ${cleanKey} banida com sucesso!` : `Key ${cleanKey} desbanida com sucesso!`)

    fetch('/api/licenses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: cleanKey, status: isNowBanned ? 'Suspended' : 'Active' }),
    }).catch(() => {})

    if (isNowBanned) {
      fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cleanKey,
          reason: 'Banida pelo administrador no painel de licenças',
          actor: currentUser.username,
        }),
      }).catch(() => {})
    } else {
      fetch(`/api/blacklist?id=${encodeURIComponent(cleanKey)}`, {
        method: 'DELETE',
      }).catch(() => {})
    }

    onAddNotification?.(
      isNowBanned ? 'Key Suspensa / Banida' : 'Key Reativada',
      `A chave ${cleanKey} agora está com status ${isNowBanned ? 'Suspensa' : 'Ativa'}.`,
      isNowBanned ? 'warning' : 'success'
    )
  }

  const handleDeleteKey = (key: string) => {
    const cleanKey = key.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
    try {
      const saved = localStorage.getItem('hooked_auth_deleted_keys')
      const deletedArr = saved ? JSON.parse(saved) : []
      if (!deletedArr.includes(cleanKey.toLowerCase())) {
        deletedArr.push(cleanKey.toLowerCase())
        localStorage.setItem('hooked_auth_deleted_keys', JSON.stringify(deletedArr))
      }
    } catch {}

    setLicenses((prev) =>
      prev.filter(
        (lic) =>
          lic.key.toLowerCase().trim() !== cleanKey.toLowerCase() &&
          lic.discordId?.toLowerCase().trim() !== cleanKey.toLowerCase()
      )
    )
    setSelectedDetailsLicense(null)
    showToast(`Key ${cleanKey} deletada permanentemente.`)

    fetch(`/api/licenses?key=${encodeURIComponent(cleanKey)}`, {
      method: 'DELETE',
    }).catch(() => {})

    onAddNotification?.(
      'Key Removida',
      `A chave ${cleanKey} foi deletada do sistema.`,
      'warning'
    )
  }

  const openCreateModal = () => {
    setDiscordId('')
    setName('')
    setDiscordProfile(null)
    setIsFetchingDiscord(false)
    setTempo('30 Dias (Mensal)')
    setCustomTempo('')
    setGame('Todos os Jogos')
    setGeneratedKey(null)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleCreateLicense = (e: React.FormEvent) => {
    e.preventDefault()

    if (!discordId.trim()) {
      setFormError('Por favor, informe o Discord ID.')
      return
    }

    if (!name.trim()) {
      setFormError('Por favor, informe o Name (Nome do cliente).')
      return
    }

    const selectedGame = game
    const selectedTempo = tempo === 'Customizado' ? (customTempo.trim() || 'Custom') : tempo

    // A chave é EXATAMENTE o que é digitado no Discord ID
    const newKey = discordId.trim()
    const isLife = isLifetime(selectedTempo)
    const expiryDate = isLife ? 'Vitalício' : calculateExpiryDate(selectedTempo)
    const displayTempo = isLife ? 'Vitalício (Lifetime)' : formatRemainingTime(expiryDate, selectedTempo)

    const newLic: LicenseItem = {
      key: newKey,
      name: name.trim(),
      discordId: newKey,
      discordUsername: discordProfile?.username,
      discordAvatar: discordProfile?.avatarUrl,
      game: selectedGame,
      plano: selectedTempo,
      tempo: displayTempo,
      devices: '0 / 1 HWID',
      issued: new Date().toLocaleDateString('pt-BR'),
      expiry: expiryDate,
      status: 'Active',
      owner: currentUser.username,
    }

    setLicenses((prev) => [newLic, ...prev])
    fetch('/api/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLic),
    }).catch(() => {})
    setGeneratedKey(newLic)
    setFormError('')
    onAddNotification?.(
      'Nova Key Criada',
      `Cliente ${newLic.name} (${newLic.game} - ${newLic.tempo}) emitida com sucesso.`,
      'success'
    )
  }

  // Cada administrador/operador gerencia estritamente apenas a sua respectiva carteira de clientes
  const userLicenses = licenses.filter(
    (l) => (l.owner || 'Hookedadmin').toLowerCase() === (currentUser?.username || '').toLowerCase()
  )

  const activeCount = userLicenses.filter((l) => l.status === 'Active' && !isLicenseExpired(l.expiry)).length
  const expiredCount = userLicenses.filter((l) => l.status === 'Expired' || isLicenseExpired(l.expiry)).length
  const suspendedCount = userLicenses.filter((l) => l.status === 'Suspended').length

  const filtered = userLicenses
    .filter((l) => {
      const isExp = l.status === 'Expired' || isLicenseExpired(l.expiry)
      if (filter === 'All') return true
      if (filter === 'Active') return l.status === 'Active' && !isExp
      if (filter === 'Expired') return isExp
      if (filter === 'Suspended') return l.status === 'Suspended'
      return true
    })
    .filter((l) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        l.key.toLowerCase().includes(q) ||
        l.name.toLowerCase().includes(q) ||
        l.discordId.toLowerCase().includes(q) ||
        l.game.toLowerCase().includes(q) ||
        l.tempo.toLowerCase().includes(q) ||
        (l.plano && l.plano.toLowerCase().includes(q))
      )
    })

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(userLicenses, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    const dateStr = new Date().toISOString().split('T')[0]
    downloadAnchor.setAttribute('download', `hooked_auth_${currentUser.username.toLowerCase()}_licenses_${dateStr}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    showToast('Backup exportado com sucesso!')
  }

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string
        const parsed = JSON.parse(content)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const res = await fetch('/api/licenses/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ licenses: parsed }),
          })
          const data = await res.json()
          if (data.success && Array.isArray(data.licenses)) {
            setLicenses(data.licenses)
            showToast(`✅ ${parsed.length} chaves restauradas com sucesso!`)
            onAddNotification?.(
              'Backup Restaurado',
              `${parsed.length} chaves foram importadas com sucesso.`,
              'success'
            )
          }
        } else {
          showToast('❌ Arquivo inválido. O arquivo precisa conter uma lista de licenças.')
        }
      } catch {
        showToast('❌ Erro ao ler o arquivo JSON de backup.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-pink-400 font-semibold">Gerenciador de Acessos</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Licenses</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Emita, vincule por Discord ID, defina jogos e controle a validade de cada chave gerada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={openCreateModal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 sm:py-2 text-xs font-semibold text-primary-foreground shadow-sm btn-interactive hover-lift hover:opacity-95"
          >
            <Plus className="size-4" /> Issue New License
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        {[
          { label: 'Active Licenses', value: activeCount.toLocaleString() },
          { label: 'Total Issued', value: userLicenses.length.toLocaleString() },
          { label: 'Expired Licenses', value: expiredCount.toLocaleString() },
          { label: 'Suspended / Revoked', value: suspendedCount.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border/70 bg-card p-3 sm:p-4 card-hover">
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{label}</p>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-zinc-950/70 p-1 overflow-x-auto w-full sm:w-auto shadow-inner">
          {(['All', 'Active', 'Expired', 'Suspended'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 sm:flex-initial rounded-lg px-3 py-1.5 text-xs font-semibold btn-interactive transition-all duration-200 whitespace-nowrap ${
                filter === tab
                  ? 'border border-pink-500/40 bg-gradient-to-r from-pink-600 to-pink-500 text-white shadow-md shadow-pink-500/25'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onRefresh?.()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-pink-950/40 hover:text-pink-400 transition-all btn-interactive shadow-sm shrink-0"
            title="Atualizar status dos clientes e HWIDs agora"
          >
            <RefreshCw className={`size-3.5 text-pink-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ID, nome ou jogo..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
       * 1. MOBILE VIEW (Cards otimizados para Celular - Sem rolagem lateral quebrada)
       * ========================================================================= */}
      <div className="sm:hidden flex flex-col gap-3 mt-4">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-card p-6 text-center text-xs text-muted-foreground">
            Nenhuma licença encontrada.
          </div>
        ) : (
          filtered.map((lic) => {
            const isExp = lic.status === 'Expired' || isLicenseExpired(lic.expiry)
            const isLife = isLifetime(lic.expiry) || isLifetime(lic.tempo)
            return (
              <div
                key={lic.key}
                className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-3 transition-colors hover:border-pink-500/30"
              >
                {/* Linha 1: Avatar, Nome, Jogo e Badge de Status + 3 Pontinhos */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {lic.discordAvatar ? (
                      <img
                        src={lic.discordAvatar}
                        alt={lic.name}
                        className="size-10 rounded-full border border-pink-500/30 object-cover shrink-0"
                      />
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-pink-950/60 text-xs font-bold text-pink-400 border border-pink-500/30">
                        {lic.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-foreground truncate flex items-center gap-1.5">
                        <span className="truncate">{lic.name}</span>
                        {lic.discordUsername && (
                          <span className="text-[11px] text-pink-400 font-mono font-normal truncate">
                            @{lic.discordUsername}
                          </span>
                        )}
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5 truncate">
                        <Gamepad2 className="size-3 text-pink-500 shrink-0" />
                        <span className="truncate">{lic.game}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        lic.status === 'Suspended'
                          ? 'border border-rose-500/40 bg-rose-950/60 text-rose-300'
                          : isExp
                          ? 'border border-zinc-700/60 bg-zinc-900/80 text-zinc-400'
                          : 'border border-pink-500/40 bg-pink-950/60 text-pink-300 shadow-sm shadow-pink-500/10'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          lic.status === 'Suspended'
                            ? 'bg-rose-500'
                            : isExp
                            ? 'bg-zinc-500'
                            : 'bg-pink-500 animate-pulse'
                        }`}
                      />
                      {lic.status === 'Suspended' ? 'Suspenso' : isExp ? 'Expirado' : 'Ativo'}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedDetailsLicense(lic)
                        setEditingTempo(lic.plano || lic.tempo)
                        setEditingCustomTempo('')
                      }}
                      className="size-8 grid place-items-center rounded-lg border border-border/80 bg-zinc-900/80 text-muted-foreground hover:border-pink-500/30 hover:text-pink-400 active:scale-95 transition-all"
                      aria-label="Abrir detalhes"
                      title="Ver detalhes da licença"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Linha 2: Discord ID (Key) com botão de Copiar */}
                <div className="flex items-center justify-between gap-2 rounded-xl bg-zinc-950/70 border border-border/60 p-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Hash className="size-3.5 text-pink-500 shrink-0" />
                    <span className="font-mono text-xs font-semibold text-foreground truncate select-all">
                      {lic.discordId}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onCopy(lic.discordId, lic.discordId)
                      showToast('Key (Discord ID) copiada!')
                    }}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-md bg-pink-950/60 border border-pink-500/30 text-[11px] font-semibold text-pink-300 hover:bg-pink-900/50 active:scale-95 transition-all"
                  >
                    {copiedKey === lic.discordId ? (
                      <>
                        <Check className="size-3 text-pink-400" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-pink-400" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Linha 3: Duração e Dispositivo (HWID) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Duração</span>
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                        lic.status === 'Suspended'
                          ? 'border-rose-500/30 bg-rose-950/40 text-rose-300'
                          : isExp
                          ? 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                          : isLife
                          ? 'border-pink-500/40 bg-pink-950/60 text-pink-200 shadow-sm shadow-pink-500/10'
                          : 'border-pink-500/30 bg-pink-950/40 text-pink-300'
                      }`}
                    >
                      <Clock
                        className={`size-3 shrink-0 ${
                          lic.status === 'Suspended'
                            ? 'text-rose-400'
                            : isExp
                            ? 'text-zinc-500'
                            : 'text-pink-400'
                        }`}
                      />
                      <span className="truncate">{formatRemainingTime(lic.expiry, lic.tempo)}</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Dispositivo (HWID)</span>
                    {lic.hwid && lic.hwid.trim() !== '' ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-pink-500/35 bg-pink-950/40 px-2 py-0.5 text-[11px] font-bold text-pink-300 shadow-sm shadow-pink-500/10">
                          <span className="size-1.5 rounded-full bg-pink-500 animate-pulse" />
                          <Laptop className="size-3 text-pink-400 shrink-0" />
                          1 / 1 Vinculado
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground truncate" title={lic.hwid}>
                          {lic.hwid.length > 14 ? `${lic.hwid.slice(0, 8)}···${lic.hwid.slice(-4)}` : lic.hwid}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        <Monitor className="size-3 text-muted-foreground shrink-0" />
                        0 / 1 Livre
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* =========================================================================
       * 2. DESKTOP VIEW (Tabela completa para Desktop e Tablets)
       * ========================================================================= */}
      <div className="hidden sm:block mt-4 rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="overflow-x-auto min-h-[360px] pb-24">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5 font-medium">Discord ID</th>
                <th className="px-5 py-3.5 font-medium">Nome</th>
                <th className="px-5 py-3.5 font-medium">Duração</th>
                <th className="px-5 py-3.5 font-medium">Hwid</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-muted-foreground">
                    Nenhuma licença encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((lic) => (
                  <tr key={lic.key} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                    {/* 1. Discord ID (Key) */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 font-mono font-semibold text-foreground text-xs">
                          <Hash className="size-3.5 text-pink-500" />
                          {lic.discordId}
                        </span>
                        <button
                          onClick={() => {
                            onCopy(lic.discordId, lic.discordId)
                            showToast('Key (Discord ID) copiada!')
                          }}
                          className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent transition-colors"
                          title="Copiar Key"
                        >
                          {copiedKey === lic.discordId ? (
                            <Check className="size-3.5 text-pink-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 2. Nome */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        {lic.discordAvatar ? (
                          <img
                            src={lic.discordAvatar}
                            alt={lic.name}
                            className="size-7 rounded-full border border-pink-500/30 object-cover shrink-0"
                          />
                        ) : (
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pink-950/60 text-[10px] font-bold text-pink-400 border border-pink-500/30">
                            {lic.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-foreground flex items-center gap-1.5">
                            {lic.name}
                            {lic.discordUsername && (
                              <span className="text-[10px] text-pink-400 font-mono font-medium">
                                @{lic.discordUsername}
                              </span>
                            )}
                          </p>
                          <p className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                            <Gamepad2 className="size-3 text-pink-500" /> {lic.game}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 3. Duração */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                          lic.status === 'Suspended'
                            ? 'border-rose-500/30 bg-rose-950/40 text-rose-300'
                            : lic.status === 'Expired' || isLicenseExpired(lic.expiry)
                            ? 'border-zinc-800 bg-zinc-900/60 text-zinc-400'
                            : isLifetime(lic.expiry) || isLifetime(lic.tempo)
                            ? 'border-pink-500/40 bg-pink-950/60 text-pink-200 shadow-sm shadow-pink-500/10'
                            : 'border-pink-500/30 bg-pink-950/40 text-pink-300'
                        }`}
                        title={
                          lic.expiry && !isLifetime(lic.expiry)
                            ? `Expira em: ${formatExpiryDate(lic.expiry)} (Plano: ${lic.plano || lic.tempo})`
                            : 'Acesso vitalício sem expiração'
                        }
                      >
                        <Clock
                          className={`size-3 ${
                            lic.status === 'Suspended'
                              ? 'text-rose-400'
                              : lic.status === 'Expired' || isLicenseExpired(lic.expiry)
                              ? 'text-zinc-500'
                              : 'text-pink-400'
                          }`}
                        />
                        {formatRemainingTime(lic.expiry, lic.tempo)}
                      </span>
                    </td>

                    {/* 4. Hwid */}
                    <td className="px-5 py-4">
                      {lic.hwid && lic.hwid.trim() !== '' ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-pink-500/35 bg-pink-950/40 px-2 py-0.5 text-[11px] font-bold text-pink-300 shadow-sm shadow-pink-500/10">
                            <span className="size-1.5 rounded-full bg-pink-500 animate-pulse" />
                            <Laptop className="size-3 text-pink-400" />
                            1 / 1 Vinculado
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground/80 tracking-tight" title={lic.hwid}>
                            {lic.hwid.length > 18 ? `${lic.hwid.slice(0, 10)}···${lic.hwid.slice(-6)}` : lic.hwid}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            <Monitor className="size-3 text-muted-foreground" />
                            0 / 1 Livre
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">Aguardando login</span>
                        </div>
                      )}
                    </td>

                    {/* 5. Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          lic.status === 'Suspended'
                            ? 'border border-rose-500/40 bg-rose-950/60 text-rose-300'
                            : lic.status === 'Expired' || isLicenseExpired(lic.expiry)
                            ? 'border border-zinc-700/60 bg-zinc-900/80 text-zinc-400'
                            : 'border border-pink-500/40 bg-pink-950/60 text-pink-300 shadow-sm shadow-pink-500/10'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            lic.status === 'Suspended'
                              ? 'bg-rose-500'
                              : lic.status === 'Expired' || isLicenseExpired(lic.expiry)
                              ? 'bg-zinc-500'
                              : 'bg-pink-500 animate-pulse'
                          }`}
                        />
                        {lic.status === 'Suspended'
                          ? 'Suspenso'
                          : lic.status === 'Expired' || isLicenseExpired(lic.expiry)
                          ? 'Expirado'
                          : 'Ativo'}
                      </span>
                    </td>

                    {/* 6. Actions (3 Pontinhos -> Abre Tela de Detalhes) */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedDetailsLicense(lic)
                          setEditingTempo(lic.plano || lic.tempo)
                          setEditingCustomTempo('')
                        }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-pink-950/40 hover:text-pink-400 transition-all hover:scale-110"
                        aria-label="Abrir detalhes e gerenciar licença"
                        title="Ver detalhes da licença e alterar tempo"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-2 rounded-xl border border-pink-500/30 bg-card px-4 py-3 text-xs shadow-xl shadow-zinc-900/10 backdrop-blur-md animate-fade-in-up">
          <Check className="size-4 text-pink-400 shrink-0" />
          <span className="font-semibold text-foreground">{toastMessage}</span>
        </div>
      )}

      {/* Modal: Issue New License */}
      {isModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-fade-in overflow-y-auto"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className="relative w-full max-w-md my-auto max-h-[92vh] overflow-y-auto rounded-2xl border border-pink-500/20 bg-card p-5 sm:p-6 shadow-2xl shadow-pink-950/20 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-pink-950/40 text-pink-400 border border-pink-500/30">
                  <KeyRound className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Issue New License</h3>
                  <p className="text-[11px] text-muted-foreground">Gerar chave de acesso para cliente</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Fechar modal"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Sucesso após criação */}
            {generatedKey ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-pink-500/30 bg-pink-950/30 p-4 text-center">
                  <div className="mx-auto grid size-10 place-items-center rounded-full bg-pink-950/60 text-pink-400 border border-pink-500/40">
                    <Check className="size-5 text-pink-400" />
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-pink-200">Licença Gerada com Sucesso!</h4>
                  <p className="text-[11px] text-pink-300/80">A key já está ativa e pronta para uso do cliente.</p>

                  <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
                      <Hash className="size-3.5 text-pink-500" />
                      {generatedKey.discordId}
                    </span>
                    <button
                      onClick={() => onCopy(generatedKey.discordId, 'modal-key')}
                      className="flex items-center gap-1 rounded bg-pink-600 hover:bg-pink-500 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
                    >
                      {copiedKey === 'modal-key' ? (
                        <>
                          <Check className="size-3 text-white" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" /> Copiar Key
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3.5 text-xs space-y-2 border border-border/50">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discord ID:</span>
                    <span className="font-mono font-medium text-foreground">{generatedKey.discordId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium text-foreground">{generatedKey.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duração / Validade:</span>
                    <span className="font-bold text-pink-400">
                      {formatRemainingTime(generatedKey.expiry, generatedKey.tempo)}
                      {generatedKey.expiry && !isLifetime(generatedKey.expiry) && (
                        <span className="text-[11px] text-muted-foreground ml-1">
                          (Expira: {formatExpiryDate(generatedKey.expiry)})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Game:</span>
                    <span className="font-medium text-foreground">{generatedKey.game}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setGeneratedKey(null)
                      setDiscordId('')
                      setName('')
                    }}
                    className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground hover:bg-accent"
                  >
                    Gerar Outra Key
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-lg bg-pink-600 hover:bg-pink-500 py-2 text-xs font-semibold text-white shadow-sm"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              /* Formulário de Criação */
              <form onSubmit={handleCreateLicense} className="mt-5 space-y-4">
                {formError && (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
                    {formError}
                  </div>
                )}

                {/* Discord ID */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                      <Hash className="size-3.5 text-pink-500" />
                      Discord ID (Key do Cliente)
                    </label>
                    {isFetchingDiscord && (
                      <span className="text-[10px] text-pink-400 animate-pulse flex items-center gap-1">
                        <RefreshCw className="size-2.5 animate-spin" /> Buscando Discord...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={discordId}
                    onChange={(e) => {
                      const val = e.target.value
                      setDiscordId(val)
                      fetchDiscordProfile(val)
                    }}
                    placeholder="Ex: 272360594999607296 (Discord ID do cliente)"
                    required
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  {discordProfile ? (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-pink-500/30 bg-pink-950/40 p-2.5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={discordProfile.avatarUrl}
                          alt={discordProfile.username}
                          className="size-8 rounded-full border border-pink-500/40 object-cover"
                        />
                        <div>
                          <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            {discordProfile.globalName}
                            <span className="text-[10px] text-pink-400 font-mono font-medium">@{discordProfile.username}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono">ID: {discordProfile.id}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded bg-pink-950/60 px-2 py-0.5 text-[10px] font-bold text-pink-400 border border-pink-500/30">
                        <Check className="size-3 text-pink-400" /> Verificado
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Digite ou cole o ID numérico do Discord do cliente para puxar foto e nome automaticamente.
                    </p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <User className="size-3.5 text-pink-500" />
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Lucas Silva"
                    required
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Tempo */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Clock className="size-3.5 text-pink-500" />
                    Tempo (Duração)
                  </label>
                  <select
                    value={tempo}
                    onChange={(e) => setTempo(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="1 Dia (24h)">1 Dia (24h - Teste)</option>
                    <option value="3 Dias (Fim de Semana)">3 Dias (Fim de Semana)</option>
                    <option value="7 Dias (Semanal)">7 Dias (Semanal)</option>
                    <option value="15 Dias (Quinzenal)">15 Dias (Quinzenal)</option>
                    <option value="30 Dias (Mensal)">30 Dias (Mensal)</option>
                    <option value="60 Dias (Bimestral)">60 Dias (Bimestral)</option>
                    <option value="90 Dias (Trimestral)">90 Dias (Trimestral)</option>
                    <option value="180 Dias (Semestral)">180 Dias (Semestral)</option>
                    <option value="365 Dias (Anual)">365 Dias (Anual)</option>
                    <option value="Vitalício (Lifetime)">Vitalício (Lifetime)</option>
                    <option value="Customizado">Customizado...</option>
                  </select>

                  {tempo === 'Customizado' && (
                    <input
                      type="text"
                      value={customTempo}
                      onChange={(e) => setCustomTempo(e.target.value)}
                      placeholder="Ex: 45 Dias ou 12 Horas"
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  )}
                </div>

                {/* Game */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Gamepad2 className="size-3.5 text-pink-500" />
                    Game (Jogo / Software)
                  </label>
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="Todos os Jogos">Todos os Jogos (Universal)</option>
                    <option value="Valorant">Valorant</option>
                    <option value="Free Fire">Free Fire</option>
                    <option value="FiveM">FiveM</option>
                  </select>
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-pink-500/25"
                  >
                    <Plus className="size-3.5" /> Criar Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </ModalPortal>
    )}

      {/* Modal Nova: Detalhes da Licença & Alteração de Tempo */}
      {selectedDetailsLicense && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-fade-in overflow-y-auto"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={() => setSelectedDetailsLicense(null)}
          >
            <div
              className="relative w-full max-w-xl my-auto max-h-[92vh] overflow-y-auto rounded-2xl border border-pink-500/20 bg-card p-5 sm:p-6 shadow-2xl shadow-pink-950/20 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-pink-950/40 text-pink-400 border border-pink-500/30">
                  <KeyRound className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Gerenciador de Licença</h3>
                  <p className="text-[11px] text-muted-foreground">Detalhes do cliente, HWID e tempo de validade</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailsLicense(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                aria-label="Fechar detalhes"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {/* Card 1: Perfil do Cliente & Informações Principais */}
              <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    {selectedDetailsLicense.discordAvatar ? (
                      <img
                        src={selectedDetailsLicense.discordAvatar}
                        alt={selectedDetailsLicense.name}
                        className="size-11 rounded-full border border-pink-500/30 object-cover shadow-sm"
                      />
                    ) : (
                      <span className="grid size-11 place-items-center rounded-full bg-pink-950/60 text-xs font-bold text-pink-400 border border-pink-500/30">
                        {selectedDetailsLicense.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                        {selectedDetailsLicense.name}
                        {selectedDetailsLicense.discordUsername && (
                          <span className="text-[11px] font-mono text-pink-400 font-medium">
                            @{selectedDetailsLicense.discordUsername}
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Criado por: <span className="text-foreground font-semibold">{selectedDetailsLicense.owner}</span> · Emitido: {selectedDetailsLicense.issued}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      selectedDetailsLicense.status === 'Suspended'
                        ? 'border border-rose-500/40 bg-rose-950/60 text-rose-300'
                        : selectedDetailsLicense.status === 'Expired' || isLicenseExpired(selectedDetailsLicense.expiry)
                        ? 'border border-zinc-700/60 bg-zinc-900/80 text-zinc-400'
                        : 'border border-pink-500/40 bg-pink-950/60 text-pink-300 shadow-sm shadow-pink-500/10'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        selectedDetailsLicense.status === 'Suspended'
                          ? 'bg-rose-500'
                          : selectedDetailsLicense.status === 'Expired' || isLicenseExpired(selectedDetailsLicense.expiry)
                          ? 'bg-zinc-500'
                          : 'bg-pink-500 animate-pulse'
                      }`}
                    />
                    {selectedDetailsLicense.status === 'Suspended'
                      ? 'Suspenso'
                      : selectedDetailsLicense.status === 'Expired' || isLicenseExpired(selectedDetailsLicense.expiry)
                      ? 'Expirado'
                      : 'Ativo'}
                  </span>
                </div>

                {/* Key (Discord ID) & Game info */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-card p-2.5 border border-border/40 shadow-sm">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Hash className="size-3 text-pink-500" /> Key / Discord ID
                    </span>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold text-foreground truncate">
                        {selectedDetailsLicense.discordId}
                      </span>
                      <button
                        onClick={() => {
                          onCopy(selectedDetailsLicense.discordId, 'modal-key')
                          showToast('Key copiada com sucesso!')
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        title="Copiar Key"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-card p-2.5 border border-border/40 shadow-sm">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Gamepad2 className="size-3 text-pink-500" /> Jogo / Software
                    </span>
                    <select
                      value={selectedDetailsLicense.game || 'Todos os Jogos'}
                      onChange={(e) => handleUpdateGame(selectedDetailsLicense.key, e.target.value)}
                      className="mt-1 w-full rounded-md border border-border/60 bg-background/80 px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                    >
                      <option value="Todos os Jogos">Todos os Jogos (Universal)</option>
                      <option value="Valorant">Valorant</option>
                      <option value="Free Fire">Free Fire</option>
                      <option value="FiveM">FiveM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: HWID & Bloqueio de 1 PC */}
              <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Monitor className="size-4 text-pink-500" />
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">Dispositivo Vinculado (1 PC)</h4>
                      <p className="text-[10px] text-muted-foreground">Trava de segurança de hardware (HWID SHA-256)</p>
                    </div>
                  </div>
                  {selectedDetailsLicense.hwid && selectedDetailsLicense.hwid.trim() !== '' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-pink-500/40 bg-pink-950/40 px-2.5 py-1 text-[11px] font-bold text-pink-300 shadow-sm shadow-pink-500/10">
                      <span className="size-1.5 rounded-full bg-pink-500 animate-pulse" />
                      1 / 1 Vinculado
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-[11px] font-bold text-zinc-400">
                      0 / 1 Livre
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-card p-2.5 border border-border/40 shadow-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-muted-foreground">Hash HWID Registrado:</p>
                    {selectedDetailsLicense.hwid && selectedDetailsLicense.hwid.trim() !== '' ? (
                      <p className="mt-0.5 break-all font-mono text-[11px] font-bold text-foreground bg-muted/30 p-1.5 rounded border border-border/60 select-all">
                        {selectedDetailsLicense.hwid}
                      </p>
                    ) : (
                      <p className="font-mono text-[11px] font-medium text-muted-foreground mt-0.5">
                        Nenhum PC vinculado ainda (aguardando primeiro login)
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleResetKey(selectedDetailsLicense.key)}
                    className="shrink-0 flex items-center justify-center gap-1.5 rounded-lg border border-pink-500/30 bg-pink-950/40 px-3 py-1.5 text-xs font-semibold text-pink-400 hover:bg-pink-950/60 transition-all btn-interactive"
                    title="Liberar HWID para o cliente logar em outro computador ou após formatar"
                  >
                    <RotateCcw className="size-3.5 text-pink-400" />
                    Resetar HWID
                  </button>
                </div>
              </div>

              {/* Card 3: CARD PARA MUDAR O TEMPO DA KEY */}
              <div className="rounded-xl border border-pink-500/30 bg-gradient-to-b from-pink-950/40 to-card p-4">
                <div className="flex items-center gap-2 pb-2">
                  <Clock className="size-4 text-pink-500" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Alterar Duração da Key</h4>
                    <p className="text-[10px] text-muted-foreground">
                      Duração / Tempo restante:{' '}
                      <strong className="text-pink-400 font-bold">
                        {formatRemainingTime(selectedDetailsLicense.expiry, selectedDetailsLicense.tempo)}
                      </strong>
                      {selectedDetailsLicense.expiry && !isLifetime(selectedDetailsLicense.expiry) && (
                        <span className="ml-1 text-muted-foreground font-mono">
                          (Expira: {formatExpiryDate(selectedDetailsLicense.expiry)})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Selecione o novo tempo:</label>
                    <select
                      value={editingTempo}
                      onChange={(e) => setEditingTempo(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-pink-500"
                    >
                      <option value="1 Dia (24h)">1 Dia (24h - Teste)</option>
                      <option value="3 Dias (Fim de Semana)">3 Dias (Fim de Semana)</option>
                      <option value="7 Dias (Semanal)">7 Dias (Semanal)</option>
                      <option value="15 Dias (Quinzenal)">15 Dias (Quinzenal)</option>
                      <option value="30 Dias (Mensal)">30 Dias (Mensal)</option>
                      <option value="60 Dias (Bimestral)">60 Dias (Bimestral)</option>
                      <option value="90 Dias (Trimestral)">90 Dias (Trimestral)</option>
                      <option value="180 Dias (Semestral)">180 Dias (Semestral)</option>
                      <option value="365 Dias (Anual)">365 Dias (Anual)</option>
                      <option value="Vitalício (Lifetime)">Vitalício (Lifetime)</option>
                      <option value="Customizado">Outro (Customizado)</option>
                    </select>
                  </div>

                  {editingTempo === 'Customizado' && (
                    <div>
                      <label className="text-[11px] font-medium text-muted-foreground">Digite a duração customizada:</label>
                      <input
                        type="text"
                        value={editingCustomTempo}
                        onChange={(e) => setEditingCustomTempo(e.target.value)}
                        placeholder="Ex: 45 Dias, 12 Horas, etc."
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleUpdateTempo}
                    disabled={isUpdatingTempo}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 hover:bg-pink-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-pink-500/25 transition-all btn-interactive disabled:opacity-50"
                  >
                    {isUpdatingTempo ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" />
                        Salvar Novo Tempo
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Card 4: Ações (Banir, Copiar, Deletar) */}
              <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={() => handleBanKey(selectedDetailsLicense.key)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-3.5 py-2.5 sm:py-2 text-xs font-semibold transition-all btn-interactive ${
                      selectedDetailsLicense.status === 'Suspended'
                        ? 'border-pink-500/40 bg-pink-950/40 text-pink-300 hover:bg-pink-950/60'
                        : 'border-rose-500/40 bg-rose-950/40 text-rose-300 hover:bg-rose-950/60'
                    }`}
                  >
                    <Ban className="size-3.5" />
                    {selectedDetailsLicense.status === 'Suspended' ? 'Desbanir Licença' : 'Banir Licença'}
                  </button>

                  <button
                    onClick={() => {
                      onCopy(selectedDetailsLicense.key, 'modal-key-bottom')
                      showToast('Chave copiada para a área de transferência!')
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2.5 sm:py-2 text-xs font-medium text-foreground hover:bg-accent transition-all btn-interactive"
                  >
                    <Copy className="size-3.5 text-muted-foreground" />
                    Copiar Key
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteKey(selectedDetailsLicense.key)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3.5 py-2.5 sm:py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/60 transition-all btn-interactive"
                >
                  <Trash2 className="size-3.5 text-rose-400" />
                  Deletar Key
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}
    </div>
  )
}

/* =========================================================================================
 * 5. Logs Tab - Telemetria em Tempo Real (Site e Aplicativos)
 * ========================================================================================= */
export interface RealTimeLogItem {
  id: string
  timestamp: string
  time: string
  date: string
  actor: string
  key?: string
  game: string
  client: string
  ip: string
  location: string
  countryCode?: string
  status: 'SUCCESS' | 'FAILED' | 'WARN' | 'BANNED'
  statusCode: number
  reason: string
}

function LogsTab({ currentUser }: { currentUser: AuthAccount }) {
  const [logs, setLogs] = useState<RealTimeLogItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'All' | 'SUCCESS' | 'FAILED' | 'BANNED'>('All')
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const fetchLogs = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true)
    try {
      const res = await fetch('/api/logs', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.logs)) {
          setLogs(data.logs)
        }
      }
    } catch {
    } finally {
      setIsLoading(false)
      if (showIndicator) setIsRefreshing(false)
    }
  }, [])

  // Polling em tempo real a cada 2.5 segundos
  useEffect(() => {
    fetchLogs()
    const timer = setInterval(() => {
      fetchLogs()
    }, 2500)
    return () => clearInterval(timer)
  }, [fetchLogs])

  const handleClearLogs = async () => {
    if (!confirm('Deseja realmente limpar todos os logs de autenticação?')) return
    try {
      await fetch('/api/logs', { method: 'DELETE' })
      setLogs([])
      showToast('Logs limpos com sucesso!')
    } catch {
      showToast('Falha ao limpar logs.')
    }
  }

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    const dateStr = new Date().toISOString().split('T')[0]
    downloadAnchor.setAttribute('download', `hooked_auth_logs_${dateStr}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    showToast('Logs exportados em JSON!')
  }

  // Estatísticas calculadas dinamicamente a partir dos eventos reais
  const totalCount = logs.length
  const successCount = logs.filter((l) => l.status === 'SUCCESS').length
  const failedCount = logs.filter((l) => l.status === 'FAILED' || l.status === 'BANNED').length
  const uniqueIps = new Set(logs.map((l) => l.ip)).size
  const successRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) + '%' : '100%'

  // Filtros de busca e status
  const filtered = logs
    .filter((l) => {
      if (filterStatus === 'All') return true
      if (filterStatus === 'SUCCESS') return l.status === 'SUCCESS'
      if (filterStatus === 'FAILED') return l.status === 'FAILED'
      if (filterStatus === 'BANNED') return l.status === 'BANNED'
      return true
    })
    .filter((l) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        l.ip.toLowerCase().includes(q) ||
        l.actor.toLowerCase().includes(q) ||
        (l.key && l.key.toLowerCase().includes(q)) ||
        l.game.toLowerCase().includes(q) ||
        l.client.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q)
      )
    })

  return (
    <div>
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-pink-500/30 bg-card px-4 py-3 text-xs shadow-xl shadow-zinc-900/10 backdrop-blur-md animate-fade-in-up">
          <Check className="size-4 text-pink-400 shrink-0" />
          <span className="font-semibold text-foreground">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-pink-500">
            Telemetria em Tempo Real
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl flex items-center gap-2.5">
            <FileText className="size-6 text-pink-500" />
            Logs de Autenticação
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe ao vivo todos os acessos do painel e dos softwares cliente (Free Fire, Valorant, FiveM, loaders C++), com IP, localização e motivo da autorização.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchLogs(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors btn-interactive"
            title="Atualizar lista agora"
          >
            <RefreshCw className={`size-3.5 text-pink-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/50 transition-colors disabled:opacity-40"
          >
            <Trash2 className="size-3.5 text-rose-400" />
            Limpar Logs
          </button>
        </div>
      </div>

      {/* Cards de Métricas em Tempo Real */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4 mb-6">
        <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs text-muted-foreground">Total de Conexões</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {totalCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs text-muted-foreground">Logins Autorizados</p>
          <div className="mt-1 sm:mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-pink-400">
              {successCount.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground font-mono">({successRate})</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs text-muted-foreground">Tentativas Barradas / Falhas</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-rose-400">
            {failedCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-3 sm:p-4">
          <p className="text-[11px] sm:text-xs text-muted-foreground">IPs Únicos Conectados</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            {uniqueIps.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-zinc-950/70 p-1 overflow-x-auto w-full sm:w-auto">
          {(['All', 'SUCCESS', 'FAILED', 'BANNED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === tab
                  ? 'bg-pink-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'All'
                ? 'Todos os Logs'
                : tab === 'SUCCESS'
                ? 'Autorizados (Sucesso)'
                : tab === 'FAILED'
                ? 'Falhas / Rejeitados'
                : 'Banidos / Suspensos'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por IP, Cliente, Jogo, Local..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Visualização de Logs */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto size-9 text-muted-foreground/40 mb-3" />
            <h4 className="text-sm font-semibold text-foreground">Nenhum evento registrado</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              Assim que os clientes ou softwares (Free Fire, Valorant, FiveM, C++ loader) realizarem tentativas de autenticação, elas aparecerão aqui em tempo real.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="sm:hidden divide-y divide-border/40">
              {filtered.map((log) => (
                <div key={log.id} className="p-4 space-y-2.5 hover:bg-accent/20 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'border border-pink-500/40 bg-pink-950/60 text-pink-300'
                          : log.status === 'BANNED'
                          ? 'border border-rose-500/40 bg-rose-950/60 text-rose-300'
                          : log.status === 'WARN'
                          ? 'border border-amber-500/40 bg-amber-950/60 text-amber-300'
                          : 'border border-rose-500/40 bg-rose-950/60 text-rose-300'
                      }`}
                    >
                      {log.status === 'SUCCESS' ? 'AUTORIZADO' : log.status === 'BANNED' ? 'BANIDO' : log.status === 'WARN' ? 'PAUSADO' : 'RECUSADO'} ({log.statusCode})
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">{log.time} - {log.date}</span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      {log.actor}
                      {log.key && (
                        <span className="font-mono text-[10px] text-pink-400 font-normal">
                          (Key: {log.key.length > 12 ? `${log.key.slice(0, 6)}···${log.key.slice(-4)}` : log.key})
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Gamepad2 className="size-3 text-pink-500" />
                      {log.game} &bull; <span className="font-medium text-foreground">{log.client}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/40">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Endereço IP</p>
                      <p className="font-mono text-[11px] font-medium text-foreground mt-0.5">{log.ip}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Localização</p>
                      <p className="text-[11px] font-medium text-foreground flex items-center gap-1 mt-0.5 truncate" title={log.location}>
                        <Globe className="size-3 text-pink-400 shrink-0" />
                        <span className="truncate">{log.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground border border-border/40">
                    <span className="font-medium text-foreground">Motivo: </span>
                    {log.reason}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Tabela Completa */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3.5 font-medium">Horário / Data</th>
                    <th className="px-5 py-3.5 font-medium">Status / Resposta</th>
                    <th className="px-5 py-3.5 font-medium">Cliente / Licença</th>
                    <th className="px-5 py-3.5 font-medium">Software / Jogo</th>
                    <th className="px-5 py-3.5 font-medium">Endereço IP</th>
                    <th className="px-5 py-3.5 font-medium">Localização</th>
                    <th className="px-5 py-3.5 font-medium">Detalhes do Evento</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-border/40 text-[11px] last:border-0 hover:bg-accent/30 transition-colors"
                    >
                      {/* 1. Timestamp */}
                      <td className="px-5 py-3.5 font-mono whitespace-nowrap">
                        <p className="font-semibold text-foreground">{log.time}</p>
                        <p className="text-[10px] text-muted-foreground">{log.date}</p>
                      </td>

                      {/* 2. Status Badge */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            log.status === 'SUCCESS'
                              ? 'border border-pink-500/40 bg-pink-950/60 text-pink-300'
                              : log.status === 'BANNED'
                              ? 'border border-rose-500/40 bg-rose-950/60 text-rose-300'
                              : log.status === 'WARN'
                              ? 'border border-amber-500/40 bg-amber-950/60 text-amber-300'
                              : 'border border-rose-500/40 bg-rose-950/60 text-rose-300'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              log.status === 'SUCCESS'
                                ? 'bg-pink-500 animate-pulse'
                                : log.status === 'WARN'
                                ? 'bg-amber-400'
                                : 'bg-rose-500'
                            }`}
                          />
                          {log.status === 'SUCCESS' ? 'AUTORIZADO' : log.status === 'BANNED' ? 'BANIDO' : log.status === 'WARN' ? 'PAUSADO' : 'RECUSADO'}
                          <span className="font-mono text-[9px] opacity-80">({log.statusCode})</span>
                        </span>
                      </td>

                      {/* 3. Cliente / Key */}
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                          {log.actor}
                        </p>
                        {log.key && (
                          <p className="font-mono text-[10px] text-pink-400/90 mt-0.5">
                            Key: {log.key.length > 14 ? `${log.key.slice(0, 8)}···${log.key.slice(-4)}` : log.key}
                          </p>
                        )}
                      </td>

                      {/* 4. Software / Game */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Gamepad2 className="size-3.5 text-pink-500" />
                          <span>{log.game}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{log.client}</p>
                      </td>

                      {/* 5. IP Address */}
                      <td className="px-5 py-3.5 font-mono text-muted-foreground whitespace-nowrap">
                        <span className="rounded bg-muted/40 px-1.5 py-0.5 border border-border/40 text-foreground">
                          {log.ip}
                        </span>
                      </td>

                      {/* 6. Localização */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-foreground font-medium">
                          <Globe className="size-3.5 text-pink-400 shrink-0" />
                          <span>{log.location}</span>
                        </div>
                      </td>

                      {/* 7. Detalhes / Motivo */}
                      <td className="px-5 py-3.5 text-muted-foreground max-w-xs truncate" title={log.reason}>
                        <span className="truncate block font-sans">{log.reason}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* =========================================================================================
 * 6. Settings Tab - Com Kill Switch para Parar / Pausar Autenticação
 * ========================================================================================= */
function SettingsTab({
  currentUser,
  onAuthStatusChange,
  onAddNotification,
}: {
  currentUser: AuthAccount
  onAuthStatusChange?: (enabled: boolean) => void
  onAddNotification?: (title: string, desc: string, type: 'success' | 'info' | 'warning' | 'security') => void
}) {
  const [authEnabled, setAuthEnabled] = useState(true)
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Serviço de autenticação temporariamente pausado pelo administrador.'
  )
  const [updatedBy, setUpdatedBy] = useState('Hookedadmin')
  const [updatedAt, setUpdatedAt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingMsg, setIsSavingMsg] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 4000)
  }

  // Carregar status do sistema da API
  useEffect(() => {
    fetch('/api/system/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data.authEnabled === 'boolean') {
          setAuthEnabled(data.authEnabled)
          onAuthStatusChange?.(data.authEnabled)
          if (data.maintenanceMessage) setMaintenanceMessage(data.maintenanceMessage)
          if (data.updatedBy) setUpdatedBy(data.updatedBy)
          if (data.updatedAt) setUpdatedAt(data.updatedAt)
        }
      })
      .catch(() => {})
  }, [onAuthStatusChange])

  // Ligar ou Desligar / Pausar a Autenticação
  const handleToggleAuth = async (newStatus: boolean) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authEnabled: newStatus,
          maintenanceMessage,
          updatedBy: currentUser.displayName,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setAuthEnabled(newStatus)
        onAuthStatusChange?.(newStatus)
        setUpdatedBy(currentUser.displayName)
        setUpdatedAt(new Date().toISOString())
        setConfirmModalOpen(false)

        if (newStatus) {
          showToast('✅ Autenticação REATIVADA! Clientes já podem logar normalmente.')
          onAddNotification?.(
            'Serviço Reativado',
            `O serviço de autenticação foi reativado por ${currentUser.displayName}.`,
            'success'
          )
        } else {
          showToast('⚠️ Autenticação PAUSADA! Logins em arquivos foram bloqueados.')
          onAddNotification?.(
            'Autenticação Pausada',
            `O serviço de autenticação foi pausado por ${currentUser.displayName}.`,
            'warning'
          )
        }
      } else {
        showToast('❌ Erro: ' + (data.message || 'Falha ao alterar status.'))
      }
    } catch {
      showToast('❌ Falha ao comunicar com o servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  // Salvar mensagem personalizada de manutenção
  const handleSaveMessage = async () => {
    setIsSavingMsg(true)
    try {
      const res = await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authEnabled,
          maintenanceMessage,
          updatedBy: currentUser.displayName,
        }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('✅ Mensagem de manutenção salva com sucesso!')
      } else {
        showToast('❌ Falha ao salvar mensagem.')
      }
    } catch {
      showToast('❌ Erro de conexão.')
    } finally {
      setIsSavingMsg(false)
    }
  }

  return (
    <div>
      {/* Toast Alert Flutuante */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-pink-500/30 bg-card/95 px-4 py-3 text-xs font-semibold text-foreground shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2.5">
          <CheckCircle2 className="size-4 text-pink-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Modal de Confirmação para Pausar Auth */}
      {confirmModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in overflow-y-auto"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={() => setConfirmModalOpen(false)}
          >
            <div
              className="relative w-full max-w-md my-auto max-h-[92vh] overflow-y-auto rounded-2xl border border-red-500/40 bg-card p-6 shadow-2xl shadow-red-950/60 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <span className="grid size-10 place-items-center rounded-xl bg-red-500/20">
                  <AlertTriangle className="size-5" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Confirmar Pausa da Autenticação?</h4>
                  <p className="text-[11px] text-muted-foreground">Kill Switch Global do Hooked Auth</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Ao pausar a autenticação, <strong className="text-red-300">nenhum cliente conseguirá logar nos seus arquivos C++</strong> (loaders, injetores, cheats). Todas as tentativas de login serão bloqueadas com o aviso de manutenção abaixo:
              </p>

              <div className="my-3 rounded-lg border border-border/80 bg-background/60 p-3 font-mono text-[11px] text-amber-300">
                "{maintenanceMessage}"
              </div>

              <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="w-full sm:w-auto text-center rounded-lg border border-border px-4 py-2.5 sm:py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAuth(false)}
                  disabled={isLoading}
                  className="w-full sm:w-auto justify-center rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <PowerOff className="size-3.5" />
                  {isLoading ? 'Pausando...' : 'Sim, Pausar Autenticação'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-pink-400 font-semibold">Preferences & Security</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Settings</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure o status operacional da autenticação, kill switch global e parâmetros de segurança.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* =========================================================================
         * CARD PRINCIPAL: KILL SWITCH / PARAR AUTENTICAÇÃO
         * ========================================================================= */}
        <div
          className={`rounded-2xl border p-6 transition-all duration-300 ${
            authEnabled
              ? 'border-pink-500/30 bg-gradient-to-b from-pink-950/25 to-card shadow-md shadow-pink-500/5'
              : 'border-rose-500/40 bg-gradient-to-b from-rose-950/30 to-card shadow-xl shadow-rose-950/20 ring-1 ring-rose-500/30'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-xl transition-all ${
                  authEnabled
                    ? 'bg-pink-950/50 text-pink-400 border border-pink-500/30'
                    : 'bg-rose-950/50 text-rose-400 border border-rose-500/30 animate-pulse'
                }`}
              >
                {authEnabled ? <ShieldCheck className="size-6" /> : <PowerOff className="size-6" />}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-base font-semibold text-foreground">
                    Status do Servidor de Autenticação
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      authEnabled
                        ? 'border border-pink-500/30 bg-pink-950/50 text-pink-300'
                        : 'border border-rose-500/30 bg-rose-950/50 text-rose-300 animate-pulse'
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${
                        authEnabled ? 'bg-pink-500 animate-pulse' : 'bg-rose-500 animate-ping'
                      }`}
                    />
                    {authEnabled ? 'Operacional (Online)' : 'Interrompido (Pausado)'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  {authEnabled
                    ? 'O sistema está AUTORIZANDO conexões normalmente. Clientes em arquivos .exe conseguem autenticar e usar os softwares.'
                    : 'A autenticação está INTERROMPIDA. Nenhum cliente em arquivo .exe consegue logar até ser reativada.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 pt-2 sm:pt-0">
              {authEnabled ? (
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(true)}
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PowerOff className="size-4" />
                  Parar / Pausar Auth
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleAuth(true)}
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-pink-600 hover:bg-pink-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-pink-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] ring-2 ring-pink-500/30"
                >
                  <Power className="size-4" />
                  {isLoading ? 'Reativando...' : 'Reativar Autenticação (Ficar Online)'}
                </button>
              )}
            </div>
          </div>

          {/* Mensagem exibida no executável C++ quando pausado */}
          <div className="mt-5 pt-4 border-t border-border/40">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <ShieldAlert className="size-3.5 text-pink-500" />
              Mensagem de Manutenção exibida no Loader / Arquivo:
            </label>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Essa mensagem exata será exibida no console do arquivo C++ do cliente caso ele tente fazer login enquanto a auth estiver parada.
            </p>

            <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Ex: Serviço em manutenção temporária. Tente mais tarde."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              />
              <button
                type="button"
                onClick={handleSaveMessage}
                disabled={isSavingMsg}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Save className="size-3.5" />
                {isSavingMsg ? 'Salvando...' : 'Salvar Mensagem'}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
              <span>
                Última alteração por: <strong className="text-foreground">{updatedBy || 'Hookedadmin'}</strong>
              </span>
              {updatedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  {new Date(updatedAt).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* General Profile */}
        <div className="rounded-xl border border-border/70 bg-card p-6">
          <h3 className="text-sm font-semibold">Workspace Profile</h3>
          <p className="mt-1 text-xs text-muted-foreground">Identificadores do sistema Hooked Auth e região de conexão.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-foreground">Workspace Name</label>
              <input
                type="text"
                defaultValue="Hooked Auth"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Workspace Slug</label>
              <input
                type="text"
                defaultValue="hooked-auth"
                disabled
                className="mt-1.5 w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Support Contact Email</label>
              <input
                type="email"
                defaultValue="support@hookedauth.io"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground">Primary Security Region</label>
              <select className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option>South America (São Paulo) · sa-east-1</option>
                <option>US East (N. Virginia) · us-east-1</option>
                <option>Europe (Frankfurt) · eu-central-1</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div className="rounded-xl border border-border/70 bg-card p-6">
          <h3 className="text-sm font-semibold">Políticas de Segurança e HWID</h3>
          <p className="mt-1 text-xs text-muted-foreground">Regras ativas de integridade e proteção de software.</p>

          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <p className="text-xs font-medium">Bloqueio Estrito de HWID (1 Computador por Licença)</p>
                <p className="text-[11px] text-muted-foreground">Vinculação automática do hash SHA-256 no primeiro login.</p>
              </div>
              <span className="rounded-full border border-pink-500/40 bg-pink-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-pink-300">
                Ativo (1 PC)
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <p className="text-xs font-medium">Validação de Conta do Discord (Discord ID)</p>
                <p className="text-[11px] text-muted-foreground">Chaves vinculadas exclusivamente ao ID oficial do usuário.</p>
              </div>
              <span className="rounded-full border border-pink-500/40 bg-pink-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-pink-300">
                Ativo
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Anti-Bypass & Detecção de Spoofing</p>
                <p className="text-[11px] text-muted-foreground">Assinatura digital e timestamp criptográfico em cada requisição.</p>
              </div>
              <span className="rounded-full border border-pink-500/40 bg-pink-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-pink-300">
                Ativo
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================================
 * Landing View
 * ========================================================================================= */
function Landing({ onOpenLogin }: { onOpenLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [quoteVisible, setQuoteVisible] = useState(false)
  const quoteRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setQuoteVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (quoteRef.current) {
      observer.observe(quoteRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Efeito Glow Laranja Ambiental (Sem linhas ou quadrados) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Glow Superior Central atrás do Título Hero */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] max-w-[95vw] h-[520px] rounded-full bg-gradient-to-b from-pink-500/25 via-fuchsia-500/20 to-transparent blur-[120px]" />

        {/* Glow Lateral Esquerdo */}
        <div className="absolute top-72 -left-36 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-pink-400/20 to-fuchsia-400/10 blur-[130px]" />

        {/* Glow Lateral Direito */}
        <div className="absolute top-96 -right-36 w-[480px] h-[480px] rounded-full bg-gradient-to-bl from-pink-500/20 to-rose-500/15 blur-[130px]" />

        {/* Glow Central Inferior atrás da Frase 'Não vendemos hype' */}
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 w-[750px] max-w-[90vw] h-[460px] rounded-full bg-gradient-to-tr from-pink-500/20 via-fuchsia-400/15 to-transparent blur-[130px]" />
      </div>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-border/80 bg-background/90 backdrop-blur-xl shadow-sm shadow-pink-500/10 py-3.5'
            : 'border-b border-border/40 bg-background/60 backdrop-blur-md py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
          <button className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-sm shadow-pink-500/30">
              <LockKeyhole className="size-4" />
            </span>
            <span className="text-[15px] font-bold tracking-[-0.02em]">
              Hooked <span className="text-pink-500">Auth</span>
            </span>
          </button>
          <button
            onClick={onOpenLogin}
            className="rounded-lg bg-pink-600 hover:bg-pink-500 px-4 py-2 text-xs font-semibold text-white btn-interactive hover-lift shadow-md shadow-pink-500/25 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="flex min-h-[75vh] sm:min-h-[80vh] flex-col items-center justify-center text-center animate-fade-in-up pb-12 pt-16 sm:pt-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold leading-[1.08] tracking-[-0.05em] text-foreground">
              Hooked is not just a store<br />
              <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent font-extrabold">
                but also a community
              </span>
            </h1>
            <p className="mt-4 sm:mt-7 max-w-xl text-center text-sm leading-6 text-muted-foreground sm:text-lg sm:leading-7">
              Hooked always at the top, creating products that make your gameplay professional
            </p>
          </div>
        </div>

        {/* Frase de Destaque no Centro - Revela com Animação ao Rolar */}
        <div
          ref={quoteRef}
          className={`flex min-h-[60vh] sm:min-h-[70vh] flex-col items-center justify-center text-center px-4 py-20 transition-all duration-1000 ease-out transform ${
            quoteVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-20 scale-95'
          }`}
        >
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold leading-[1.08] tracking-[-0.05em]">
            <span className="text-foreground">Não vendemos hype,</span><br />
            <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent font-extrabold">
              vendemos qualidade.
            </span>
          </h2>
        </div>
      </main>

      <footer className="relative border-t border-border/80 px-5 py-6 lg:px-8 bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-[11px] text-muted-foreground sm:flex-row sm:text-left text-center">
          <span>© 2026 Hooked Auth Systems</span>
          <span>Secure identity infrastructure for modern software.</span>
        </div>
      </footer>
    </div>
  )
}
