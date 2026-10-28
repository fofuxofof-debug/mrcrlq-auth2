'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Activity, AlertTriangle, ArrowRight, Ban, BarChart3, Bell, Camera, Check, CheckCircle2, ChevronDown, Clock, Code2,
  Copy, Download, ExternalLink, Eye, FileText, Filter, Gamepad2, Gauge, Globe, Hash, Image as ImageIcon,
  KeyRound, Laptop, LayoutDashboard, LifeBuoy, LockKeyhole, LogOut, Maximize2, Menu, Monitor, MoreHorizontal,
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

export interface AuthAccount {
  username: string
  password: string
  displayName: string
  role: 'admin' | 'operator'
  roleLabel: string
}

export const ACCOUNTS: AuthAccount[] = [
  {
    username: 'mrcrlq',
    password: 'mauricio22cao@@f@',
    displayName: 'mrcrlq',
    role: 'admin',
    roleLabel: 'Acesso Total (Admin)',
  },
  {
    username: 'sheik',
    password: '4609',
    displayName: 'sheik',
    role: 'admin',
    roleLabel: 'Acesso Total (Admin)',
  },
  {
    username: 'Samuca',
    password: 'Samuca007',
    displayName: 'Samuca',
    role: 'admin',
    roleLabel: 'Acesso Total (Admin)',
  },
  {
    username: 'mts',
    password: 'flash171',
    displayName: 'mts',
    role: 'operator',
    roleLabel: 'Operador de Keys',
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
  ['Overview', LayoutDashboard],
  ['Licenses', KeyRound],
  ['Users', Users],
  ['Logs', FileText],
  ['Settings', Settings2],
] as const

type NavItemLabel = typeof navItems[number][0]

const stats = [
  { label: 'Active licenses', value: '12,842', change: '+12.4%', icon: KeyRound, tone: 'blue' },
  { label: 'Total users', value: '8,491', change: '+8.2%', icon: Users, tone: 'violet' },
  { label: 'Auth requests', value: '248.6k', change: '+18.7%', icon: Activity, tone: 'cyan' },
  { label: 'Success rate', value: '99.82%', change: '+0.4%', icon: ShieldCheck, tone: 'green' },
]

const activity = [
  ['License activated', 'Key ending in ···9A2F', '2 min ago', 'success'],
  ['New user registered', 'client.vip@hooked.io', '14 min ago', 'info'],
  ['Application updated', 'Desktop Client v2.4.0', '38 min ago', 'neutral'],
  ['Authentication failed', 'IP 185.24.19.42', '1 hr ago', 'warning'],
]

const BLOCKED_TEST_KEYS = new Set([
  '849201948201948201',
  '739102948192019283',
  '918273645102938475',
  '629104820194820192',
  '550192837461928475',
  '449102938471928374',
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
      if (savedTab) {
        setActive(savedTab as NavItemLabel)
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

  // Banco de dados em memória compartilhado, isolado por owner (mrcrlq, mts, Samuca)
  const [licenses, setLicenses] = useState<LicenseItem[]>([
    // Clientes de mrcrlq
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
      owner: 'mrcrlq',
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
      owner: 'mrcrlq',
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
      owner: 'mrcrlq',
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
      owner: 'mrcrlq',
      hwid: 'HWID-TEST-DEBUG-12345',
    },
    // Clientes de sheik / mrcrlq
    {
      key: '272360594999607296',
      name: '76j3',
      discordId: '272360594999607296',
      discordUsername: '76j3',
      discordAvatar: 'https://cdn.discordapp.com/avatars/272360594999607296/2943ab115df3e1c6a55ee8b3a17c3c9d.png?size=128',
      game: 'Free Fire',
      plano: '30 Dias (Mensal)',
      tempo: '27 Dias',
      devices: '0 / 1 HWID',
      issued: 'Oct 24, 2026',
      expiry: '2026-11-24T00:00:00.000Z',
      status: 'Active',
      owner: 'sheik',
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
        const cleanServer: LicenseItem[] = data.licenses
          .filter((s: LicenseItem) => !isTestKey(s.key) && !isTestKey(s.discordId))
          .map((s: LicenseItem) => {
            const norm = normalizeLicense(s)
            if (norm.hwid && MOCK_HWID_PREFIXES.includes(norm.hwid.trim())) {
              return { ...norm, hwid: '', devices: '0 / 1 HWID' }
            }
            return norm
          })

        setLicenses((prev) => {
          // Atualiza as licenças vindas do servidor preservando chaves locais recentes
          const serverKeys = new Set(cleanServer.map((s) => s.key.toLowerCase()))
          const localOnly = prev
            .filter((p) => !serverKeys.has(p.key.toLowerCase()))
            .map((p) => normalizeLicense(p))
          const updated = [...cleanServer, ...localOnly]
          try {
            localStorage.setItem('hooked_auth_licenses_backup', JSON.stringify(updated))
          } catch {}
          return updated
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
      const saved = localStorage.getItem('hooked_auth_licenses_backup')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          localBackup = parsed
            .filter((b) => !isTestKey(b.key) && !isTestKey(b.discordId))
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

    // Sincronização inicial imediata com o servidor
    syncWithServer()

    // Atualização em tempo real a cada 3.5 segundos: assim que o cliente loga no .exe, o site detecta e atualiza sozinho!
    const pollInterval = setInterval(() => {
      syncWithServer()
    }, 3500)

    // Atualização instantânea ao focar na janela do navegador (Alt+Tab do .exe para o site)
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
      return
    }

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
                    <div className="rounded-lg border border-red-500/30 bg-red-50 px-3 py-2 text-xs text-red-600">
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
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-pink-950/400 hover:bg-pink-600 px-4 py-2 text-xs font-semibold text-white btn-interactive hover-lift shadow-md shadow-pink-500/25"
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

  // Permissões: operador (mts) só tem acesso a Licenses
  const userNavItems =
    currentUser.role === 'operator'
      ? navItems.filter(([label]) => label === 'Licenses')
      : navItems

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col border-r border-border/60 bg-sidebar p-4 transition-transform lg:translate-x-0 ${
          mobileNav ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-2 pb-7 pt-2">
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
            className="rounded-md p-1 text-muted-foreground lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="px-2 pb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/60">
          {currentUser.role === 'operator' ? 'Painel Operador' : 'Workspace Admin'}
        </p>
        <nav className="flex flex-1 flex-col gap-0.5">
          {userNavItems.map(([label, Icon]) => (
            <button
              key={label}
              onClick={() => {
                handleTabChange(label)
                setMobileNav(false)
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-xs transition-all duration-200 btn-interactive ${
                active === label
                  ? 'bg-pink-950/400 text-white shadow-md shadow-pink-500/25 font-semibold translate-x-1'
                  : 'text-muted-foreground hover:bg-pink-950/40 hover:text-pink-200 hover:translate-x-1'
              }`}
            >
              <Icon className="size-4" />
              {label}
              {label === 'Logs' && (
                <span className="ml-auto rounded-full bg-pink-950/60 px-1.5 py-0.5 text-[9px] font-bold text-pink-400">
                  3
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Informações da conta logada & Botão de Sair */}
        <div className="mt-5 border-t border-border/60 pt-4">
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
              className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors btn-interactive"
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
          className="fixed inset-0 z-30 bg-black/60 lg:hidden animate-fade-in"
        />
      )}

      {/* Main Content Area */}
      <main className="lg:pl-[250px]">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/60 bg-background/85 px-5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNav(true)}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden btn-interactive"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-xs text-muted-foreground">Workspace /</p>
              <h1 className="text-sm font-semibold">{active}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabChange('Licenses')}
              className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground btn-interactive hover-lift shadow-sm hover:opacity-90"
            >
              <Plus className="mr-1 inline size-3.5" />
              Create
            </button>
          </div>
        </header>

        {/* Banner de Alerta quando a Autenticação estiver Pausada */}
        {!systemAuthEnabled && (
          <div className="border-b border-red-500/40 bg-red-500/15 px-4 py-2 text-center text-xs font-semibold text-red-200 flex items-center justify-center gap-2">
            <AlertTriangle className="size-4 text-red-400 shrink-0" />
            <span>
              <strong>ATENÇÃO:</strong> A autenticação do sistema está <u>PAUSADA</u> nas Configurações. Nenhum cliente conseguirá logar em arquivos .exe até ser reativada.
            </span>
            <button
              onClick={() => handleTabChange('Settings')}
              className="ml-2 rounded bg-red-500/30 hover:bg-red-500/50 px-2 py-0.5 text-[11px] text-white underline underline-offset-2 transition-colors"
            >
              Configurações
            </button>
          </div>
        )}

        {/* Dynamic Tab Body with Smooth Transition */}
        <div key={active} className="mx-auto max-w-[1440px] p-5 lg:p-8 animate-fade-in-up">
          {active === 'Overview' && currentUser.role === 'admin' && (
            <OverviewTab currentUser={currentUser} copiedKey={copiedKey} onCopy={handleCopy} />
          )}
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
          {active === 'Users' && currentUser.role === 'admin' && <UsersTab currentUser={currentUser} />}
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
 * 1. Overview Tab
 * ========================================================================================= */
function OverviewTab({
  currentUser,
  copiedKey,
  onCopy,
}: {
  currentUser: AuthAccount
  copiedKey: string | null
  onCopy: (k: string, id: string) => void
}) {
  const userActivity = [
    ['License activated', 'Key ending in ···9A2F', '2 min ago', 'success'],
    ['New user registered', `${currentUser.username.toLowerCase()}@hooked.io`, '14 min ago', 'info'],
    ['Application updated', 'Desktop Client v2.4.0', '38 min ago', 'neutral'],
    ['Authentication failed', 'IP 185.24.19.42', '1 hr ago', 'warning'],
  ]

  return (
    <>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-pink-500">Tuesday, October 11, 2026</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            Good morning, {currentUser.displayName}<span className="text-pink-500">.</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your applications.</p>
        </div>
        <button className="flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          All systems operational <ChevronDown className="size-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, change, icon: Icon, tone }) => (
          <div
            key={label}
            className="group rounded-xl border border-border/70 bg-card p-4 sm:p-5 card-hover shadow-sm cursor-default"
          >
            <div className="flex items-start justify-between">
              <span
                className={`grid size-8 sm:size-9 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${
                  tone === 'blue'
                    ? 'bg-pink-950/40 text-pink-400 border border-pink-500/25'
                    : tone === 'violet'
                    ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                    : tone === 'cyan'
                    ? 'bg-pink-950/60 text-pink-400 border border-pink-500/25'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                }`}
              >
                <Icon className="size-3.5 sm:size-4" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600">{change}</span>
            </div>
            <p className="mt-3 sm:mt-5 text-xl sm:text-2xl font-bold tracking-[-0.04em] transition-colors group-hover:text-primary">{value}</p>
            <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-border/70 bg-card p-5 card-hover shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold">Authentication activity</h3>
              <p className="mt-1 text-xs text-muted-foreground">Requests processed in the last 24 hours</p>
            </div>
            <button className="rounded-md border border-border px-2.5 py-1.5 text-[10px] text-muted-foreground btn-interactive hover:bg-accent hover:text-foreground">
              Last 24 hours <ChevronDown className="ml-1 inline size-3" />
            </button>
          </div>
          <div className="mt-6 flex h-[210px] items-end gap-1.5 border-b border-border/50 bg-[linear-gradient(to_bottom,transparent_49%,hsl(var(--border)/0.38)_50%,transparent_51%)] px-1 sm:gap-3">
            {[28, 42, 35, 52, 47, 64, 55, 68, 60, 76, 64, 78, 72, 87, 70, 82, 91, 77, 94, 83, 88, 74, 96, 90].map(
              (height, i) => (
                <div key={i} className="group relative flex flex-1 items-end h-full">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 group-hover:bg-pink-600 group-hover:brightness-110 ${
                      i > 20 ? 'bg-pink-950/400' : 'bg-pink-500/40'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
              )
            )}
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>Now</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold">Application health</h3>
              <p className="mt-1 text-xs text-muted-foreground">Current status by application</p>
            </div>
            <button className="text-xs text-pink-400 hover:text-pink-400 font-semibold">
              View all <ArrowRight className="ml-1 inline size-3" />
            </button>
          </div>
          <div className="mt-6 flex flex-col gap-4">
            {[
              ['Desktop Client', 'v2.4.0', '99.98%', 'bg-pink-950/400'],
              ['Web Dashboard', 'v1.8.2', '99.99%', 'bg-amber-500'],
              ['Mobile SDK', 'v3.1.0', '98.74%', 'bg-pink-400'],
            ].map(([name, version, uptime, color]) => (
              <div key={name} className="flex items-center gap-3">
                <span className={`size-2 rounded-full ${color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{name}</p>
                  <p className="text-[10px] text-muted-foreground">{version}</p>
                </div>
                <p className="text-xs font-semibold text-emerald-600">{uptime}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-lg border border-pink-500/30 bg-pink-950/40 p-3">
            <div className="flex items-center gap-2 text-xs text-pink-300 font-semibold">
              <Zap className="size-3.5 text-pink-400" />
              All systems are running smoothly
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">No incidents detected in the last 30 days.</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border/70 bg-card">
        <div className="flex flex-col justify-between gap-3 border-b border-border/60 p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-medium">Recent activity</h3>
            <p className="mt-1 text-xs text-muted-foreground">The latest events from your workspace</p>
          </div>
          <button className="w-fit text-xs text-pink-400 hover:text-pink-400 font-semibold">
            View audit log <ArrowRight className="ml-1 inline size-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Event</th>
                <th className="px-5 py-3 font-medium">Details</th>
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {userActivity.map(([event, detail, time, status]) => (
                <tr key={event} className="border-b border-border/40 last:border-0 hover:bg-pink-950/30">
                  <td className="px-5 py-4 font-semibold">{event}</td>
                  <td className="px-5 py-4 text-muted-foreground">{detail}</td>
                  <td className="px-5 py-4 text-muted-foreground">{time}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        status === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : status === 'warning'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : status === 'info'
                          ? 'bg-pink-950/40 text-pink-400 border border-pink-500/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {status === 'success'
                        ? 'Completed'
                        : status === 'warning'
                        ? 'Review'
                        : status === 'info'
                        ? 'New'
                        : 'Updated'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card p-5 card-hover shadow-sm">
          <div className="flex items-center gap-2">
            <Server className="size-4 text-pink-500" />
            <h3 className="text-sm font-semibold">Production API</h3>
            <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              Operational
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/60 p-3 border border-border/50">
            <code className="text-[11px] text-muted-foreground font-mono">vl_live_••••••••••••••9A2F</code>
            <button
              onClick={() => onCopy('vl_live_9a2f_secret_production_key', 'prod-api')}
              className="text-muted-foreground hover:text-foreground btn-interactive"
              aria-label="Copy API key"
            >
              {copiedKey === 'prod-api' ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-card p-5 card-hover shadow-sm">
          <div className="flex items-center gap-2">
            <Terminal className="size-4 text-pink-500" />
            <h3 className="text-sm font-semibold">Quick start</h3>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            Integrate Hooked Auth authentication into your application in minutes.
          </p>
        </div>
      </div>
    </>
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

    setLicenses((prev) => prev.map((l) => (l.key === updatedLic.key ? updatedLic : l)))
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [discordId, setDiscordId] = useState('')
  const [name, setName] = useState('')
  const [tempo, setTempo] = useState('30 Dias (Mensal)')
  const [customTempo, setCustomTempo] = useState('')
  const [game, setGame] = useState('Free Fire')
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
    setLicenses((prev) =>
      prev.map((lic) => (lic.key === key ? { ...lic, hwid: '', devices: '0 / 1 HWID (Resetado)' } : lic))
    )
    setSelectedDetailsLicense((prev) =>
      prev && prev.key === key ? { ...prev, hwid: '', devices: '0 / 1 HWID (Resetado)' } : prev
    )
    showToast(`HWID da key ${key} resetado com sucesso!`)
    fetch('/api/licenses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, hwid: '', devices: '0 / 1 HWID (Resetado)' }),
    })
      .then(() => {
        onRefresh?.()
      })
      .catch(() => {})
    onAddNotification?.(
      'HWID Resetado',
      `Key ${key} teve o dispositivo HWID liberado com sucesso.`,
      'info'
    )
  }

  const handleBanKey = (key: string) => {
    let isNowBanned = false
    setLicenses((prev) =>
      prev.map((lic) => {
        if (lic.key === key) {
          isNowBanned = lic.status !== 'Suspended'
          return { ...lic, status: isNowBanned ? 'Suspended' : 'Active' }
        }
        return lic
      })
    )
    setSelectedDetailsLicense((prev) =>
      prev && prev.key === key ? { ...prev, status: prev.status === 'Suspended' ? 'Active' : 'Suspended' } : prev
    )
    showToast(isNowBanned ? `Key ${key} banida com sucesso!` : `Key ${key} desbanida com sucesso!`)
    fetch('/api/licenses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, status: isNowBanned ? 'Suspended' : 'Active' }),
    }).catch(() => {})
    onAddNotification?.(
      isNowBanned ? 'Key Suspensa / Banida' : 'Key Reativada',
      `A chave ${key} agora está com status ${isNowBanned ? 'Suspensa' : 'Ativa'}.`,
      isNowBanned ? 'warning' : 'success'
    )
  }

  const handleDeleteKey = (key: string) => {
    setLicenses((prev) => prev.filter((lic) => lic.key !== key))
    setSelectedDetailsLicense(null)
    showToast(`Key ${key} deletada permanentemente.`)
    fetch(`/api/licenses?key=${encodeURIComponent(key)}`, {
      method: 'DELETE',
    }).catch(() => {})
    onAddNotification?.(
      'Key Removida',
      `A chave ${key} foi deletada do sistema.`,
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
    setGame('Free Fire')
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

  // Filtragem estrita pelos clientes do usuário atual logado (mrcrlq, mts, Samuca)
  const userLicenses = licenses.filter(
    (l) => l.owner.toLowerCase() === currentUser.username.toLowerCase()
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
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(licenses, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    const dateStr = new Date().toISOString().split('T')[0]
    downloadAnchor.setAttribute('download', `hooked_auth_licenses_backup_${dateStr}.json`)
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
        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Exportar Backup */}
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
            title="Baixar cópia de segurança de todas as chaves em formato JSON"
          >
            <Download className="size-3.5 text-pink-500" />
            <span>Exportar Backup</span>
          </button>

          {/* Botão Importar Backup */}
          <label className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer">
            <UploadCloud className="size-3.5 text-emerald-400" />
            <span>Restaurar (.json)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm btn-interactive hover-lift hover:opacity-95"
          >
            <Plus className="size-4" /> Issue New License
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { label: 'Active Licenses', value: activeCount.toLocaleString() },
          { label: 'Total Issued', value: userLicenses.length.toLocaleString() },
          { label: 'Expired Licenses', value: expiredCount.toLocaleString() },
          { label: 'Suspended / Revoked', value: suspendedCount.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 card-hover">
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{label}</p>
            <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 overflow-x-auto w-full sm:w-auto">
          {(['All', 'Active', 'Expired', 'Suspended'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 sm:flex-initial rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-medium btn-interactive transition-all duration-200 whitespace-nowrap ${
                filter === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por Discord ID, nome, key ou jogo..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/70 bg-card">
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
                            <Check className="size-3.5 text-emerald-600" />
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
                          lic.status === 'Expired' || isLicenseExpired(lic.expiry)
                            ? 'border-red-200/80 bg-red-50/70 text-red-800'
                            : isLifetime(lic.expiry) || isLifetime(lic.tempo)
                            ? 'border-purple-200/80 bg-purple-50/70 text-purple-800'
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
                            lic.status === 'Expired' || isLicenseExpired(lic.expiry)
                              ? 'text-red-500'
                              : isLifetime(lic.expiry) || isLifetime(lic.tempo)
                              ? 'text-purple-500'
                              : 'text-pink-500'
                          }`}
                        />
                        {formatRemainingTime(lic.expiry, lic.tempo)}
                      </span>
                    </td>

                    {/* 4. Hwid */}
                    <td className="px-5 py-4">
                      {lic.hwid && lic.hwid.trim() !== '' ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shadow-sm">
                            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <Laptop className="size-3 text-emerald-600" />
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
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          lic.status === 'Suspended'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : lic.status === 'Expired' || isLicenseExpired(lic.expiry)
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
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
          <Check className="size-4 text-emerald-600 shrink-0" />
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
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                  <div className="mx-auto grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <Check className="size-5" />
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-emerald-900">Licença Gerada com Sucesso!</h4>
                  <p className="text-[11px] text-emerald-700">A key já está ativa e pronta para uso do cliente.</p>

                  <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card p-3 shadow-sm">
                    <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-foreground">
                      <Hash className="size-3.5 text-pink-500" />
                      {generatedKey.discordId}
                    </span>
                    <button
                      onClick={() => onCopy(generatedKey.discordId, 'modal-key')}
                      className="flex items-center gap-1 rounded bg-pink-950/400 hover:bg-pink-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
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
                    className="flex-1 rounded-lg bg-pink-950/400 hover:bg-pink-600 py-2 text-xs font-semibold text-white shadow-sm"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              /* Formulário de Criação */
              <form onSubmit={handleCreateLicense} className="mt-5 space-y-4">
                {formError && (
                  <div className="rounded-lg border border-red-500/30 bg-red-50 px-3 py-2 text-xs text-red-600">
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
                        <Check className="size-3 text-emerald-600" /> Verificado
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
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Free Fire">Free Fire</option>
                    <option value="Valorant">Valorant</option>
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
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-pink-950/400 hover:bg-pink-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-pink-500/25"
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
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : selectedDetailsLicense.status === 'Expired' || isLicenseExpired(selectedDetailsLicense.expiry)
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        selectedDetailsLicense.status === 'Suspended'
                          ? 'bg-red-500'
                          : selectedDetailsLicense.status === 'Expired' || isLicenseExpired(selectedDetailsLicense.expiry)
                          ? 'bg-amber-500'
                          : 'bg-emerald-500 animate-pulse'
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
                    <p className="mt-1 font-semibold text-foreground truncate">
                      {selectedDetailsLicense.game}
                    </p>
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
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shadow-sm">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      1 / 1 Vinculado
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md border border-pink-500/30 bg-pink-950/40 px-2.5 py-1 text-[11px] font-bold text-pink-400">
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

              {/* Card 3: CARD PARA MUDAR O TEMPO DA KEY (Em destaque especial) */}
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
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-950/400 hover:bg-pink-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-pink-500/25 transition-all btn-interactive disabled:opacity-50"
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

              {/* Card 4: Ações Rápidas (Banir, Copiar, Deletar) */}
              <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBanKey(selectedDetailsLicense.key)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all btn-interactive ${
                      selectedDetailsLicense.status === 'Suspended'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
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
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-all btn-interactive"
                  >
                    <Copy className="size-3.5 text-muted-foreground" />
                    Copiar Key
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteKey(selectedDetailsLicense.key)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all btn-interactive"
                >
                  <Trash2 className="size-3.5 text-red-400" />
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
 * 3. Screen Tab (Prints / Screenshots - Acesso exclusivo: mrcrlq e Samuca)
 * ========================================================================================= */
export interface ScreenPrintItem {
  id: string
  title: string
  clientName: string
  discordId: string
  game: 'Free Fire' | 'Valorant' | 'FiveM'
  date: string
  status: 'Verificado' | 'Pendente' | 'Suspeito'
  imageUrl: string
  notes?: string
}

function ScreenTab({
  onAddNotification,
}: {
  onAddNotification?: (title: string, desc: string, type: 'success' | 'info' | 'warning' | 'security') => void
}) {
  const [filterGame, setFilterGame] = useState<'All' | 'Free Fire' | 'Valorant' | 'FiveM'>('All')
  const [search, setSearch] = useState('')
  const [selectedPrint, setSelectedPrint] = useState<ScreenPrintItem | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Form State para Novo Print
  const [newTitle, setNewTitle] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [newDiscordId, setNewDiscordId] = useState('')
  const [newGame, setNewGame] = useState<'Free Fire' | 'Valorant' | 'FiveM'>('Free Fire')
  const [newStatus, setNewStatus] = useState<'Verificado' | 'Pendente' | 'Suspeito'>('Verificado')
  const [newImage, setNewImage] = useState<string>('')
  const [newNotes, setNewNotes] = useState<string>('')
  const [formError, setFormError] = useState('')

  // SVGs simulados para pré-visualização de alta fidelidade
  const ffMockSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="100%" stop-color="%230f172a"/></linearGradient></defs><rect width="800" height="450" fill="url(%23g1)"/><rect x="25" y="25" width="750" height="400" rx="14" fill="%230b0f19" stroke="%2338bdf8" stroke-width="1.5" stroke-opacity="0.3"/><circle cx="50" cy="55" r="5" fill="%23ef4444"/><circle cx="68" cy="55" r="5" fill="%23eab308"/><circle cx="86" cy="55" r="5" fill="%2322c55e"/><text x="115" y="60" fill="%2394a3b8" font-family="monospace" font-size="12">HOOKED_AUTH_FF_INJECTOR_V4.2.exe</text><rect x="50" y="90" width="700" height="1" fill="%23334155"/><text x="60" y="140" fill="%23f97316" font-family="sans-serif" font-size="24" font-weight="bold">FREE FIRE · HWID VALIDATION</text><text x="60" y="175" fill="%2338bdf8" font-family="monospace" font-size="14">CLIENT: 22cao (mrcrlq)</text><text x="60" y="205" fill="%23cbd5e1" font-family="monospace" font-size="14">DISCORD ID: 1517054236041416800</text><text x="60" y="235" fill="%23cbd5e1" font-family="monospace" font-size="14">HWID: SHA256-6096A426-22B82276</text><text x="60" y="265" fill="%23cbd5e1" font-family="monospace" font-size="14">PLAN: Vitalício (Lifetime)</text><rect x="60" y="300" width="220" height="42" rx="8" fill="%23059669" fill-opacity="0.2" stroke="%2310b981"/><text x="80" y="327" fill="%2334d399" font-family="monospace" font-size="15" font-weight="bold">STATUS: AUTHORIZED</text><text x="60" y="380" fill="%2364748b" font-family="sans-serif" font-size="12">Hooked Auth Security Engine © 2026 · Anti-Ban Enabled</text></svg>`

  const valMockSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%232e1022"/><stop offset="100%" stop-color="%2309090b"/></linearGradient></defs><rect width="800" height="450" fill="url(%23g2)"/><rect x="25" y="25" width="750" height="400" rx="14" fill="%2309070a" stroke="%23fb7185" stroke-width="1.5" stroke-opacity="0.3"/><circle cx="50" cy="55" r="5" fill="%23ef4444"/><circle cx="68" cy="55" r="5" fill="%23eab308"/><circle cx="86" cy="55" r="5" fill="%2322c55e"/><text x="115" y="60" fill="%2394a3b8" font-family="monospace" font-size="12">VANGUARD_KERNEL_CLIENT_V2.0.exe</text><rect x="50" y="90" width="700" height="1" fill="%23334155"/><text x="60" y="140" fill="%23f43f5e" font-family="sans-serif" font-size="24" font-weight="bold">VALORANT · KERNEL DRIVER ACTIVE</text><text x="60" y="175" fill="%23fb7185" font-family="monospace" font-size="14">CLIENT: Puto Xitadinho</text><text x="60" y="205" fill="%23cbd5e1" font-family="monospace" font-size="14">DISCORD ID: 1506778729425408112</text><text x="60" y="235" fill="%23cbd5e1" font-family="monospace" font-size="14">HWID: SHA256-03B148AB-78B22918</text><text x="60" y="265" fill="%23cbd5e1" font-family="monospace" font-size="14">PLAN: 30 Dias (Mensal)</text><rect x="60" y="300" width="220" height="42" rx="8" fill="%23059669" fill-opacity="0.2" stroke="%2310b981"/><text x="80" y="327" fill="%2334d399" font-family="monospace" font-size="15" font-weight="bold">STATUS: INJECTED (OK)</text><text x="60" y="380" fill="%2364748b" font-family="sans-serif" font-size="12">Hooked Auth Kernel Subsystem · Zero Detection</text></svg>`

  const fivemMockSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23082f49"/><stop offset="100%" stop-color="%23020617"/></linearGradient></defs><rect width="800" height="450" fill="url(%23g3)"/><rect x="25" y="25" width="750" height="400" rx="14" fill="%23030712" stroke="%2306b6d4" stroke-width="1.5" stroke-opacity="0.3"/><circle cx="50" cy="55" r="5" fill="%23ef4444"/><circle cx="68" cy="55" r="5" fill="%23eab308"/><circle cx="86" cy="55" r="5" fill="%2322c55e"/><text x="115" y="60" fill="%2394a3b8" font-family="monospace" font-size="12">CITIZENFX_INTERNAL_LOADER.dll</text><rect x="50" y="90" width="700" height="1" fill="%23334155"/><text x="60" y="140" fill="%2306b6d4" font-family="sans-serif" font-size="24" font-weight="bold">FIVEM · SERVER CONNECTION SCREEN</text><text x="60" y="175" fill="%2338bdf8" font-family="monospace" font-size="14">CLIENT: Lcpkrl</text><text x="60" y="205" fill="%23cbd5e1" font-family="monospace" font-size="14">DISCORD ID: 1118361148417396786</text><text x="60" y="235" fill="%23cbd5e1" font-family="monospace" font-size="14">SERVER: Complexo RJ / Roleplay</text><text x="60" y="265" fill="%23cbd5e1" font-family="monospace" font-size="14">PLAN: 27 Dias</text><rect x="60" y="300" width="220" height="42" rx="8" fill="%23d97706" fill-opacity="0.2" stroke="%23f59e0b"/><text x="80" y="327" fill="%23fbbf24" font-family="monospace" font-size="15" font-weight="bold">STATUS: AUTORIZADO</text><text x="60" y="380" fill="%2364748b" font-family="sans-serif" font-size="12">Hooked Auth FiveM Hook · Memory Integrity Verified</text></svg>`

  const [prints, setPrints] = useState<ScreenPrintItem[]>([
    {
      id: 'p-1',
      title: 'Validação HWID In-Game',
      clientName: '22cao',
      discordId: '1517054236041416800',
      game: 'Free Fire',
      date: 'Hoje, 21:14',
      status: 'Verificado',
      imageUrl: ffMockSvg,
      notes: 'Cheat injetado com sucesso no emulador LDPlayer9.',
    },
    {
      id: 'p-2',
      title: 'Comprovante & Ativação de Chave',
      clientName: 'Puto Xitadinho',
      discordId: '1506778729425408112',
      game: 'Valorant',
      date: 'Hoje, 18:30',
      status: 'Verificado',
      imageUrl: valMockSvg,
      notes: 'Bypass validado em Windows 11.',
    },
    {
      id: 'p-3',
      title: 'Screen de Conexão Servidor',
      clientName: 'Lcpkrl',
      discordId: '1118361148417396786',
      game: 'Valorant',
      date: 'Hoje, 23:45',
      status: 'Verificado',
      imageUrl: fivemMockSvg,
      notes: 'Autenticado com sucesso.',
    },
  ])

  // Processar upload de arquivo de imagem do computador do usuário
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFormError('A imagem deve ter no máximo 10MB.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        setNewImage(reader.result as string)
        setFormError('')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddPrint = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) {
      setFormError('Por favor informe o título da captura.')
      return
    }
    if (!newDiscordId.trim()) {
      setFormError('Por favor informe o Discord ID do cliente.')
      return
    }
    if (!newImage) {
      setFormError('Por favor selecione ou envie uma imagem/print.')
      return
    }

    const created: ScreenPrintItem = {
      id: 'p-' + Date.now(),
      title: newTitle.trim(),
      clientName: newClientName.trim() || 'Cliente Hooked',
      discordId: newDiscordId.trim(),
      game: newGame,
      date: 'Hoje, ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: newStatus,
      imageUrl: newImage,
      notes: newNotes.trim() || undefined,
    }

    setPrints((prev) => [created, ...prev])
    setIsAddModalOpen(false)
    setNewTitle('')
    setNewClientName('')
    setNewDiscordId('')
    setNewImage('')
    setNewNotes('')
    setFormError('')

    showToast('Print adicionado com sucesso!')
    onAddNotification?.(
      'Novo Print Adicionado',
      `Captura de tela enviada para ${created.clientName} (${created.game}).`,
      'info'
    )
  }

  const handleDeletePrint = (id: string) => {
    setPrints((prev) => prev.filter((p) => p.id !== id))
    if (selectedPrint?.id === id) setSelectedPrint(null)
    showToast('Print removido com sucesso.')
  }

  const handleDownload = (print: ScreenPrintItem) => {
    const a = document.createElement('a')
    a.href = print.imageUrl
    a.download = `print-${print.game.toLowerCase().replace(/\s+/g, '-')}-${print.discordId}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    showToast('Download do print iniciado!')
  }

  const handleCopyDiscord = (discordId: string) => {
    navigator.clipboard.writeText(discordId)
    showToast('Discord ID copiado para a área de transferência!')
  }

  const filteredPrints = prints
    .filter((p) => (filterGame === 'All' ? true : p.game === filterGame))
    .filter((p) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        p.title.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.discordId.toLowerCase().includes(q) ||
        p.game.toLowerCase().includes(q)
      )
    })

  const ffCount = prints.filter((p) => p.game === 'Free Fire').length
  const valCount = prints.filter((p) => p.game === 'Valorant').length
  const fivemCount = prints.filter((p) => p.game === 'FiveM').length

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-pink-500">
            Painel Exclusivo Admin (mrcrlq & Samuca)
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl flex items-center gap-2.5">
            <Camera className="size-6 text-pink-500" />
            Screen
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Repositório e galeria de capturas de tela (prints), comprovantes de ativação e validações in-game dos clientes.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError('')
            setIsAddModalOpen(true)
          }}
          className="flex w-full sm:w-fit items-center justify-center gap-2 rounded-lg bg-pink-950/400 hover:bg-pink-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-pink-500/25 btn-interactive hover-lift"
        >
          <Plus className="size-4" /> Adicionar Print
        </button>
      </div>

      {/* Métricas / Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { label: 'Total de Prints', value: prints.length.toString(), icon: Camera, tone: 'blue' },
          { label: 'Free Fire Prints', value: ffCount.toString(), icon: Gamepad2, tone: 'amber' },
          { label: 'Valorant Prints', value: valCount.toString(), icon: Shield, tone: 'rose' },
          { label: 'FiveM Prints', value: fivemCount.toString(), icon: Monitor, tone: 'cyan' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="group rounded-xl border border-border/70 bg-card p-4 sm:p-5 card-hover shadow-sm cursor-default"
          >
            <div className="flex items-start justify-between">
              <span
                className={`grid size-8 sm:size-9 place-items-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${
                  tone === 'blue'
                    ? 'bg-pink-950/40 text-pink-400 border border-pink-500/25'
                    : tone === 'amber'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                    : tone === 'rose'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                    : 'bg-pink-950/60 text-pink-400 border border-pink-500/25'
                }`}
              >
                <Icon className="size-3.5 sm:size-4" />
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">Repositório</span>
            </div>
            <p className="mt-3 sm:mt-5 text-xl sm:text-2xl font-bold tracking-[-0.04em] transition-colors group-hover:text-primary">
              {value}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros por Jogo e Busca */}
      <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          {(['All', 'Free Fire', 'Valorant', 'FiveM'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterGame(tab)}
              className={`flex-1 sm:flex-initial rounded-md px-3 py-1.5 text-xs font-medium btn-interactive transition-all duration-200 whitespace-nowrap ${
                filterGame === tab
                  ? 'bg-pink-950/400 text-white shadow-sm font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'All' ? 'Todos os Jogos' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar print por Discord ID, cliente ou jogo..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Grid de Prints / Screenshots */}
      <div className="mt-6">
        {filteredPrints.length === 0 ? (
          <div className="rounded-xl border border-border/70 bg-card p-12 text-center">
            <Camera className="mx-auto size-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">Nenhum print encontrado</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Nenhuma captura de tela corresponde ao filtro selecionado. Clique em &quot;Adicionar Print&quot; para fazer upload.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-3.5" /> Enviar Novo Print
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrints.map((print) => (
              <div
                key={print.id}
                className="group relative rounded-xl border border-border/70 bg-card overflow-hidden card-hover shadow-sm flex flex-col"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer" onClick={() => setSelectedPrint(print)}>
                  {/* Imagem do Print */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={print.imageUrl}
                    alt={print.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Overlay ao passar o mouse */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPrint(print)
                      }}
                      className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
                      title="Visualizar em Tela Cheia"
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDownload(print)
                      }}
                      className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
                      title="Baixar Print"
                    >
                      <Download className="size-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyDiscord(print.discordId)
                      }}
                      className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
                      title="Copiar Discord ID"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>

                  {/* Badges superiores na imagem */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md ${
                        print.game === 'Free Fire'
                          ? 'bg-amber-500/80 text-white'
                          : print.game === 'Valorant'
                          ? 'bg-rose-500/80 text-white'
                          : 'bg-pink-950/400/80 text-white'
                      }`}
                    >
                      {print.game}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-md ${
                        print.status === 'Verificado'
                          ? 'bg-emerald-500/85 text-white'
                          : print.status === 'Pendente'
                          ? 'bg-amber-500/85 text-white'
                          : 'bg-red-500/85 text-white'
                      }`}
                    >
                      {print.status}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-foreground truncate group-hover:text-pink-400 transition-colors">
                      {print.title}
                    </h4>
                    <p className="mt-1 text-[11px] text-muted-foreground flex items-center justify-between">
                      <span className="truncate">{print.clientName}</span>
                      <span className="text-[10px] font-mono shrink-0 text-muted-foreground/80">{print.date}</span>
                    </p>

                    <div className="mt-2.5 flex items-center justify-between rounded-lg bg-background/80 px-2.5 py-1.5 border border-border/50">
                      <span className="flex items-center gap-1 font-mono text-[11px] text-foreground truncate">
                        <Hash className="size-3 text-pink-500 shrink-0" />
                        {print.discordId}
                      </span>
                      <button
                        onClick={() => handleCopyDiscord(print.discordId)}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                        title="Copiar Discord ID"
                      >
                        <Copy className="size-3" />
                      </button>
                    </div>

                    {print.notes && (
                      <p className="mt-2 text-[10px] text-muted-foreground/80 line-clamp-2 italic">
                        &quot;{print.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPrint(print)}
                      className="text-[11px] text-pink-400 hover:text-pink-500 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Maximize2 className="size-3" /> Ver Detalhes
                    </button>
                    <button
                      onClick={() => handleDeletePrint(print.id)}
                      className="text-muted-foreground hover:text-red-400 p-1 rounded transition-colors"
                      title="Excluir Print"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Modal de Visualização em Tela Cheia */}
      {selectedPrint && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in overflow-y-auto"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={() => setSelectedPrint(null)}
          >
            <div
              className="relative w-full max-w-4xl my-auto max-h-[92vh] overflow-y-auto rounded-2xl border border-pink-500/20 bg-card p-5 sm:p-6 shadow-2xl shadow-pink-950/20 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-pink-950/40 text-pink-400 border border-pink-500/30">
                  <Camera className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    {selectedPrint.title}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        selectedPrint.game === 'Free Fire'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : selectedPrint.game === 'Valorant'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-pink-950/40 text-pink-400 border border-pink-500/30'
                      }`}
                    >
                      {selectedPrint.game}
                    </span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Cliente: {selectedPrint.clientName} · {selectedPrint.date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrint(null)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Imagem em Destaque */}
            <div className="mt-4 rounded-xl border border-border bg-slate-950 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPrint.imageUrl}
                alt={selectedPrint.title}
                className="w-full max-h-[55vh] object-contain rounded-lg"
              />
            </div>

            {/* Metadados e Ações */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-muted/50 p-3 rounded-xl border border-border/60">
              <div>
                <span className="text-muted-foreground text-[11px] block">Discord ID:</span>
                <span className="font-mono font-medium text-foreground">{selectedPrint.discordId}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Status:</span>
                <span className="font-semibold text-emerald-600">{selectedPrint.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px] block">Data de Captura:</span>
                <span className="font-medium text-foreground">{selectedPrint.date}</span>
              </div>
              {selectedPrint.notes && (
                <div className="sm:col-span-3 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Notas: </span>
                  {selectedPrint.notes}
                </div>
              )}
            </div>

            {/* Botões do Rodapé */}
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-col-reverse sm:flex-row justify-between gap-2">
              <button
                onClick={() => handleDeletePrint(selectedPrint.id)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="size-3.5" /> Excluir Print
              </button>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => handleCopyDiscord(selectedPrint.discordId)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-border px-3.5 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Copy className="size-3.5" /> Copiar Discord ID
                </button>
                <button
                  onClick={() => handleDownload(selectedPrint)}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-pink-950/400 hover:bg-pink-600 px-4 py-2 text-xs font-semibold text-white transition-colors shadow-md shadow-pink-500/25"
                >
                  <Download className="size-3.5" /> Baixar Imagem
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* Modal: Adicionar Novo Print */}
      {isAddModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md animate-fade-in overflow-y-auto"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            onClick={() => setIsAddModalOpen(false)}
          >
            <div
              className="relative w-full max-w-lg my-auto max-h-[92vh] overflow-y-auto rounded-2xl border border-pink-500/20 bg-card p-5 sm:p-6 shadow-2xl shadow-pink-950/20 animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-pink-950/40 text-pink-400 border border-pink-500/30">
                  <Camera className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Novo Print / Captura de Tela</h3>
                  <p className="text-[11px] text-muted-foreground">Adicione um print de tela para validação de cliente</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddPrint} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-500/30 bg-red-50 px-3 py-2 text-xs text-red-600">
                  {formError}
                </div>
              )}

              {/* Título */}
              <div>
                <label className="text-xs font-medium text-foreground">Título do Print</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Validação In-Game Free Fire ou Comprovante Pix"
                  required
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Grid: Nome e Discord ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Nome do Cliente</label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Discord ID</label>
                  <input
                    type="text"
                    value={newDiscordId}
                    onChange={(e) => setNewDiscordId(e.target.value)}
                    placeholder="Ex: 1506778729425408112"
                    required
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              {/* Grid: Game e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Jogo / Software</label>
                  <select
                    value={newGame}
                    onChange={(e) => setNewGame(e.target.value as 'Free Fire' | 'Valorant' | 'FiveM')}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Free Fire">Free Fire</option>
                    <option value="Valorant">Valorant</option>
                    <option value="FiveM">FiveM</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Status da Validação</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'Verificado' | 'Pendente' | 'Suspeito')}
                    className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Verificado">Verificado</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Suspeito">Suspeito</option>
                  </select>
                </div>
              </div>

              {/* Upload de Imagem */}
              <div>
                <label className="text-xs font-medium text-foreground">Imagem da Captura (Print)</label>
                <div className="mt-1.5 rounded-xl border border-dashed border-border/80 bg-background/50 p-4 text-center hover:bg-accent/20 transition-colors">
                  {newImage ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newImage}
                        alt="Preview"
                        className="max-h-44 mx-auto rounded-lg object-contain border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => setNewImage('')}
                        className="mt-2 text-[11px] text-red-400 hover:text-red-300 font-medium transition-colors"
                      >
                        Trocar Imagem
                      </button>
                    </div>
                  ) : (
                    <div>
                      <UploadCloud className="mx-auto size-8 text-muted-foreground mb-1.5" />
                      <p className="text-xs font-medium text-foreground">
                        Clique para selecionar ou arraste o print aqui
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        PNG, JPG, JPEG ou WEBP (até 10MB)
                      </p>
                      <label className="mt-3 inline-block cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
                        Selecionar Arquivo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFile}
                          className="hidden"
                        />
                      </label>

                      {/* Opção de Usar Mock/Preset Rápido */}
                      <div className="mt-4 pt-3 border-t border-border/40">
                        <p className="text-[10px] text-muted-foreground mb-1.5">Ou use uma captura pré-definida de teste:</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setNewImage(ffMockSvg)
                              setNewGame('Free Fire')
                              if (!newTitle) setNewTitle('Validação In-Game Free Fire')
                            }}
                            className="rounded bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            Preset Free Fire
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewImage(valMockSvg)
                              setNewGame('Valorant')
                              if (!newTitle) setNewTitle('Comprovante Vanguard Valorant')
                            }}
                            className="rounded bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            Preset Valorant
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setNewImage(fivemMockSvg)
                              setNewGame('FiveM')
                              if (!newTitle) setNewTitle('Handshake FiveM Roleplay')
                            }}
                            className="rounded bg-accent px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
                          >
                            Preset FiveM
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Notas Opcionais */}
              <div>
                <label className="text-xs font-medium text-foreground">Notas / Observações (Opcional)</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Validação efetuada via AnyDesk; HWID conferido no painel."
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Botões */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 shadow-sm"
                >
                  <Plus className="size-3.5" /> Salvar Print
                </button>
              </div>
            </form>
          </div>
        </div>
      </ModalPortal>
    )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-2 rounded-xl border border-border bg-card/95 px-4 py-3 text-xs shadow-2xl shadow-black/60 backdrop-blur-md animate-fade-in-up">
          <Check className="size-4 text-emerald-400 shrink-0" />
          <span className="font-medium text-foreground">{toastMsg}</span>
        </div>
      )}
    </div>
  )
}

/* =========================================================================================
 * 4. Users Tab
 * ========================================================================================= */
function UsersTab({ currentUser }: { currentUser: AuthAccount }) {
  const users = [
    {
      name: currentUser.displayName,
      email: `${currentUser.username.toLowerCase()}@hooked.io`,
      role: 'Workspace Owner',
      mfa: 'Passkey / WebAuthn',
      licenses: '3 assigned',
      lastAuth: 'Just now',
      status: 'Active',
      initials: currentUser.displayName.slice(0, 2).toUpperCase(),
    },
    {
      name: 'Beatriz Mendes',
      email: 'bmendes@techcorp.com',
      role: 'Lead Developer',
      mfa: 'TOTP Authenticator',
      licenses: '1 assigned',
      lastAuth: '14 min ago',
      status: 'Active',
      initials: 'BM',
    },
    {
      name: 'Carlos Ruiz',
      email: 'cruiz@nexus.org',
      role: 'End User',
      mfa: 'Disabled',
      licenses: '1 assigned',
      lastAuth: '2 hours ago',
      status: 'Active',
      initials: 'CR',
    },
    {
      name: 'Danielle Dupont',
      email: 'danielle@design.fr',
      role: 'Member',
      mfa: 'TOTP Authenticator',
      licenses: '2 assigned',
      lastAuth: 'Yesterday',
      status: 'Active',
      initials: 'DD',
    },
    {
      name: 'Lucas Ferreira',
      email: 'lucas@cloud.io',
      role: 'Security Admin',
      mfa: 'FIDO2 Security Key',
      licenses: '1 assigned',
      lastAuth: '3 hours ago',
      status: 'Active',
      initials: 'LF',
    },
    {
      name: 'Eduardo Silva',
      email: 'eduardo@dev.io',
      role: 'Developer',
      mfa: 'TOTP Authenticator',
      licenses: '0 assigned',
      lastAuth: '5 days ago',
      status: 'Suspended',
      initials: 'ES',
    },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-pink-400 font-semibold">Identity Directory</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Users</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage authenticated users, team roles, credential health, and MFA enforcement.
          </p>
        </div>
        <button className="flex w-fit items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground btn-interactive hover-lift hover:opacity-90">
          <Plus className="size-3.5" /> Invite User
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { label: 'Total Users', value: '8,491' },
          { label: 'Active Today', value: '2,140' },
          { label: 'MFA Enforced Rate', value: '94.2%' },
          { label: 'Suspended Accounts', value: '12' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 card-hover">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3.5 font-medium">User Profile</th>
                <th className="px-5 py-3.5 font-medium">Role</th>
                <th className="px-5 py-3.5 font-medium">2FA / Security</th>
                <th className="px-5 py-3.5 font-medium">Licenses</th>
                <th className="px-5 py-3.5 font-medium">Last Authentication</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-full bg-gradient-to-tr from-pink-500/20 to-rose-500/20 text-xs font-semibold text-pink-400">
                        {user.initials}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{user.role}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] ${
                        user.mfa === 'Disabled' ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      <Shield className="size-3" />
                      {user.mfa}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{user.licenses}</td>
                  <td className="px-5 py-4 text-muted-foreground">{user.lastAuth}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        user.status === 'Active'
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : 'bg-red-400/10 text-red-300'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================================
 * 5. Sessions Tab
 * ========================================================================================= */
function SessionsTab() {
  const sessions = [
    {
      device: 'MacBook Pro 16" (Current Device)',
      os: 'Chrome 129 · macOS Sequoia',
      ip: '189.28.41.10',
      location: 'São Paulo, Brazil',
      app: 'Web Dashboard',
      started: '12 min ago',
      current: true,
      icon: Laptop,
    },
    {
      device: 'Windows Desktop Workstation',
      os: 'Hooked Auth Desktop Client v2.4.0 · Windows 11',
      ip: '189.28.41.10',
      location: 'São Paulo, Brazil',
      app: 'Desktop Client',
      started: '2 hours ago',
      current: false,
      icon: Monitor,
    },
    {
      device: 'iPhone 15 Pro',
      os: 'Hooked Auth Mobile v3.1 · iOS 18.1',
      ip: '177.105.22.9',
      location: 'Rio de Janeiro, Brazil',
      app: 'Mobile SDK',
      started: '1 day ago',
      current: false,
      icon: Smartphone,
    },
    {
      device: 'Linux Build Runner',
      os: 'CLI Tool v1.0.4 · Ubuntu 24.04 LTS',
      ip: '52.91.44.120',
      location: 'Ashburn, VA, United States',
      app: 'CLI Developer Tool',
      started: '3 days ago',
      current: false,
      icon: Terminal,
    },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-pink-400 font-semibold">Token Observability</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Sessions</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Monitor real-time active sessions, authorized devices, and perform instant security revocations.
          </p>
        </div>
        <button className="flex w-fit items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-300 btn-interactive hover:bg-red-500/20">
          <Trash2 className="size-3.5" /> Revoke All Other Sessions
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { label: 'Active Sessions', value: '3,412' },
          { label: 'Concurrent Devices', value: '2,890' },
          { label: 'Suspicious Anomaly Flags', value: '0' },
          { label: 'Average Session TTL', value: '4.2 hrs' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 card-hover">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {sessions.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.device}
              className="flex flex-col justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center card-hover"
            >
              <div className="flex items-center gap-4">
                <span className="grid size-10 place-items-center rounded-lg bg-pink-950/40 text-pink-400 border border-pink-500/25">
                  <Icon className="size-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-medium text-foreground">{s.device}</h4>
                    {s.current && (
                      <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 border border-emerald-500/20">
                        Current Session
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {s.os} · {s.ip} ({s.location})
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Application: {s.app} · Started {s.started}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!s.current && (
                  <button className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground btn-interactive hover:border-red-500/40 hover:text-red-300">
                    Revoke Token
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* =========================================================================================
 * 6. Analytics Tab
 * ========================================================================================= */
function AnalyticsTab() {
  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-pink-400 font-semibold">Telemetry & Performance</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Analytics</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Deep dive into authentication requests, latency percentiles, error rates, and geo-traffic.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1 text-xs">
          <button className="rounded px-2.5 py-1 text-muted-foreground hover:text-foreground btn-interactive">24h</button>
          <button className="rounded bg-primary px-2.5 py-1 font-medium text-primary-foreground btn-interactive">7 Days</button>
          <button className="rounded px-2.5 py-1 text-muted-foreground hover:text-foreground btn-interactive">30 Days</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[
          { label: 'Total Requests', value: '1.84M', change: '+14.2%' },
          { label: 'P95 Response Latency', value: '38ms', change: '-6ms' },
          { label: 'Token Introspection', value: '940k', change: '+22.1%' },
          { label: 'Success Rate SLA', value: '99.82%', change: '+0.4%' },
        ].map(({ label, value, change }) => (
          <div key={label} className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 card-hover">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className="text-emerald-600 font-semibold">{change}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Method Breakdown */}
        <div className="rounded-xl border border-border/70 bg-card p-5 card-hover">
          <h3 className="text-sm font-medium">Authentication Methods</h3>
          <p className="text-xs text-muted-foreground">Distribution across cryptographic schemes</p>
          <div className="mt-6 flex flex-col gap-3">
            {[
              { name: 'WebAuthn / Passkeys', share: 42, color: 'bg-pink-950/400' },
              { name: 'OAuth2 / OpenID Connect', share: 34, color: 'bg-pink-400' },
              { name: 'API Secret Keys', share: 18, color: 'bg-amber-500' },
              { name: 'Password + TOTP', share: 6, color: 'bg-emerald-500' },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs">
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">{item.share}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-muted/60">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Traffic */}
        <div className="rounded-xl border border-border/70 bg-card p-5 card-hover">
          <h3 className="text-sm font-medium">Geographic Traffic</h3>
          <p className="text-xs text-muted-foreground">Top origin countries by validation volume</p>
          <div className="mt-6 flex flex-col gap-3">
            {[
              { country: 'Brazil', requests: '810k requests', share: '44%' },
              { country: 'United States', requests: '515k requests', share: '28%' },
              { country: 'Germany', requests: '276k requests', share: '15%' },
              { country: 'Japan', requests: '147k requests', share: '8%' },
              { country: 'Others', requests: '92k requests', share: '5%' },
            ].map((geo) => (
              <div key={geo.country} className="flex items-center justify-between border-b border-border/40 pb-2.5 last:border-0 text-xs">
                <span className="font-medium text-foreground">{geo.country}</span>
                <span className="text-muted-foreground">{geo.requests}</span>
                <span className="font-semibold text-pink-400">{geo.share}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================================================================================
 * 7. Logs Tab
 * ========================================================================================= */
function LogsTab({ currentUser }: { currentUser: AuthAccount }) {
  const logs = [
    {
      time: '20:48:12',
      event: 'auth.token.issued',
      actor: `${currentUser.username.toLowerCase()}@hooked.io`,
      ip: '189.28.41.10',
      client: 'Web Dashboard',
      level: 'SUCCESS',
      status: '200 OK',
    },
    {
      time: '20:45:01',
      event: 'license.verified',
      actor: 'Sarah Jenkins',
      ip: '192.168.1.15',
      client: 'Desktop Client',
      level: 'INFO',
      status: '200 OK',
    },
    {
      time: '20:38:22',
      event: 'auth.failed_attempt',
      actor: 'Unknown',
      ip: '185.24.19.42',
      client: 'API Gateway',
      level: 'WARN',
      status: '401 Unauthorized',
    },
    {
      time: '20:30:10',
      event: 'webhook.dispatched',
      actor: 'System Worker',
      ip: '10.0.4.1',
      client: 'Webhook Engine',
      level: 'INFO',
      status: '200 OK',
    },
    {
      time: '20:15:44',
      event: 'rate_limit.exceeded',
      actor: 'client_anon_92',
      ip: '45.130.82.1',
      client: 'API Endpoint',
      level: 'ERROR',
      status: '429 Too Many Requests',
    },
    {
      time: '20:02:19',
      event: 'user.mfa_verified',
      actor: 'Beatriz Mendes',
      ip: '179.184.20.5',
      client: 'Web Dashboard',
      level: 'SUCCESS',
      status: '200 OK',
    },
    {
      time: '19:55:00',
      event: 'license.created',
      actor: `${currentUser.username.toLowerCase()}@hooked.io`,
      ip: '189.28.41.10',
      client: 'Dashboard Admin',
      level: 'INFO',
      status: '201 Created',
    },
  ]

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-pink-400 font-semibold">Audit Trail</p>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Logs</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Immutable stream of security events, authentication attempts, and authorization anomalies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span className="size-2 animate-pulse rounded-full bg-emerald-500" /> Live Stream
          </span>
          <button className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            Export JSON
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">Level</th>
                <th className="px-5 py-3 font-medium">Event Code</th>
                <th className="px-5 py-3 font-medium">Subject / Actor</th>
                <th className="px-5 py-3 font-medium">IP Address</th>
                <th className="px-5 py-3 font-medium">Application</th>
                <th className="px-5 py-3 text-right font-medium">HTTP Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="border-b border-border/40 font-mono text-[11px] last:border-0 hover:bg-accent/30">
                  <td className="px-5 py-3.5 text-muted-foreground">{log.time}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        log.level === 'SUCCESS'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : log.level === 'INFO'
                          ? 'bg-pink-950/400/15 text-pink-400'
                          : log.level === 'WARN'
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-red-500/15 text-red-600'
                      }`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-sans font-semibold text-foreground">{log.event}</td>
                  <td className="px-5 py-3.5 font-sans text-muted-foreground">{log.actor}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{log.ip}</td>
                  <td className="px-5 py-3.5 font-sans text-muted-foreground">{log.client}</td>
                  <td className="px-5 py-3.5 text-right font-medium text-foreground">{log.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
  const [updatedBy, setUpdatedBy] = useState('mrcrlq')
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
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-border/80 bg-card/95 px-4 py-3 text-xs font-semibold text-foreground shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2.5">
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
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

              <div className="mt-5 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAuth(false)}
                  disabled={isLoading}
                  className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 transition-all"
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
              ? 'border-emerald-500/30 bg-gradient-to-b from-emerald-50/60 to-card shadow-md shadow-emerald-500/5'
              : 'border-red-500/40 bg-gradient-to-b from-red-50/70 to-card shadow-xl shadow-red-500/10 ring-1 ring-red-500/30'
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-xl transition-all ${
                  authEnabled
                    ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20'
                    : 'bg-red-500/15 text-red-600 border border-red-500/20 animate-pulse'
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
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-600 border border-red-500/30 animate-pulse'
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full ${
                        authEnabled ? 'bg-emerald-500' : 'bg-red-500 animate-ping'
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
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <PowerOff className="size-4" />
                  Parar / Pausar Auth
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleAuth(true)}
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] ring-2 ring-emerald-500/30"
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
                Última alteração por: <strong className="text-foreground">{updatedBy || 'mrcrlq'}</strong>
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
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Ativo (1 PC)
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <p className="text-xs font-medium">Validação de Conta do Discord (Discord ID)</p>
                <p className="text-[11px] text-muted-foreground">Chaves vinculadas exclusivamente ao ID oficial do usuário.</p>
              </div>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                Ativo
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Anti-Bypass & Detecção de Spoofing</p>
                <p className="text-[11px] text-muted-foreground">Assinatura digital e timestamp criptográfico em cada requisição.</p>
              </div>
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
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
            className="rounded-lg bg-pink-950/400 px-4 py-2 text-xs font-semibold text-white btn-interactive hover-lift shadow-md shadow-pink-500/25 hover:bg-pink-600 transition-colors"
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
