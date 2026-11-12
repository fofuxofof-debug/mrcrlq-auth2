'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  ShieldAlert,
  Ban,
  UserX,
  Check,
  Copy,
  Trash2,
  Search,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { BannedItem } from '@/lib/licenses'

interface BannedTabProps {
  currentUser: { username: string; role: string }
  onAddNotification?: (title: string, desc: string, type: 'success' | 'info' | 'warning' | 'error') => void
  onUnbanLicense?: (key: string) => void
}

export function BannedTab({ currentUser, onAddNotification, onUnbanLicense }: BannedTabProps) {
  const [bannedList, setBannedList] = useState<BannedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'discord' | 'keys'>('all')

  // Form states
  const [newId, setNewId] = useState('')
  const [newReason, setNewReason] = useState('Cliente banido pelo admin')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [discordPreview, setDiscordPreview] = useState<{
    id: string
    username: string
    globalName: string
    avatarUrl: string
  } | null>(null)
  const [isFetchingDiscord, setIsFetchingDiscord] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const OLD_EXAMPLE_IDS = new Set([
    '849201948201948201',
    '739102948192019283',
    '918273645102938475',
    '629104820194820192',
    '550192837461928475',
    '449102938471928374',
  ])

  // Carrega lista de banidos do servidor
  const loadBannedList = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/blacklist', { cache: 'no-store' })
      const data = await res.json()
      if (data.success && Array.isArray(data.banned)) {
        setBannedList(data.banned.filter((b: BannedItem) => !OLD_EXAMPLE_IDS.has(b.id)))
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBannedList()
    const interval = setInterval(loadBannedList, 10000)
    return () => clearInterval(interval)
  }, [])

  // Auto-fetch Discord preview when entering an ID
  useEffect(() => {
    const clean = newId.trim()
    if (clean.length >= 16 && clean.length <= 21 && /^\d+$/.test(clean)) {
      setIsFetchingDiscord(true)
      fetch(`/api/discord/user?id=${clean}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setDiscordPreview(data.user)
          } else {
            setDiscordPreview(null)
          }
        })
        .catch(() => setDiscordPreview(null))
        .finally(() => setIsFetchingDiscord(false))
    } else {
      setDiscordPreview(null)
      setIsFetchingDiscord(false)
    }
  }, [newId])

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text)
    setCopiedId(text)
    showToast(`Copiado: ${text}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleAddBanned = async (e: React.FormEvent) => {
    e.preventDefault()
    const clean = newId.trim()
    if (!clean) {
      showToast('Por favor, informe a Key ou ID do Discord.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clean,
          reason: newReason.trim() || 'Banido pelo Administrador',
          actor: currentUser.username,
        }),
      })
      const data = await res.json()
      if (data.success && data.item) {
        setBannedList((prev) => [data.item, ...prev.filter((b) => b.id !== clean)])
        setNewId('')
        setNewReason('Cliente banido pelo admin')
        setDiscordPreview(null)
        showToast(`Key/ID ${clean} adicionado à blacklist!`)
        onAddNotification?.(
          'Blacklist Atualizada',
          `A chave/ID ${clean} foi permanentemente banida.`,
          'warning'
        )
      } else {
        showToast(data.message || 'Erro ao adicionar à blacklist.')
      }
    } catch {
      showToast('Falha na comunicação com o servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnban = async (id: string) => {
    try {
      const res = await fetch(`/api/blacklist?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        setBannedList((prev) => prev.filter((b) => b.id !== id && b.key !== id && b.discordId !== id))
        showToast(`Chave/ID ${id} desbanido com sucesso!`)
        onUnbanLicense?.(id)
        onAddNotification?.(
          'Chave Desbanida',
          `O bloqueio para ${id} foi removido com sucesso.`,
          'success'
        )
      }
    } catch {
      showToast('Erro ao remover da blacklist.')
    }
  }

  const filteredList = useMemo(() => {
    return bannedList
      .filter((item) => {
        if (filter === 'discord') return Boolean(item.discordId || item.discordUsername)
        if (filter === 'keys') return !item.discordId
        return true
      })
      .filter((item) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
          item.id.toLowerCase().includes(q) ||
          (item.key && item.key.toLowerCase().includes(q)) ||
          (item.discordId && item.discordId.toLowerCase().includes(q)) ||
          (item.discordUsername && item.discordUsername.toLowerCase().includes(q)) ||
          (item.discordGlobalName && item.discordGlobalName.toLowerCase().includes(q)) ||
          (item.reason && item.reason.toLowerCase().includes(q))
        )
      })
  }, [bannedList, filter, search])

  const discordCount = bannedList.filter((b) => b.discordId || b.discordUsername).length

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-pink-500/40 bg-zinc-950/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl shadow-pink-950/50 backdrop-blur-md animate-fade-in-up">
          <Check className="size-4 text-pink-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Blacklist & Usuários Banidos
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                  {bannedList.length} Bloqueadas
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chaves banidas e IDs do Discord com bloqueio permanente no executável C++ e na API.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadBannedList}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-all btn-interactive"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-pink-400' : 'text-muted-foreground'}`} />
          <span>{loading ? 'Atualizando...' : 'Recarregar'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/15 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-rose-300 uppercase tracking-wider">Total de Chaves Banidas</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-foreground">{bannedList.length}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Bloqueio automático com ExitProcess(0)</p>
          </div>
          <div className="size-11 rounded-xl bg-rose-500/20 border border-rose-500/30 grid place-items-center text-rose-400">
            <Ban className="size-5" />
          </div>
        </div>

        <div className="rounded-xl border border-pink-500/30 bg-pink-950/15 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-pink-300 uppercase tracking-wider">Usuários do Discord</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-foreground">{discordCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">IDs de contas Discord bloqueadas</p>
          </div>
          <div className="size-11 rounded-xl bg-pink-500/20 border border-pink-500/30 grid place-items-center text-pink-400">
            <UserX className="size-5" />
          </div>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-emerald-300 uppercase tracking-wider">Status da Proteção</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p className="text-sm sm:text-base font-bold text-emerald-400">Ativa em Tempo Real</p>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Verificação C++ e Web 24/7</p>
          </div>
          <div className="size-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 grid place-items-center text-emerald-400">
            <ShieldCheck className="size-5" />
          </div>
        </div>
      </div>

      {/* Box de Adicionar à Blacklist */}
      <div className="rounded-2xl border border-rose-500/30 bg-card p-4 sm:p-5 shadow-lg shadow-rose-950/20">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <Plus className="size-4 text-rose-400" />
          <h3 className="text-sm font-semibold text-foreground">Banir Nova Chave ou ID do Discord</h3>
        </div>

        <form onSubmit={handleAddBanned} className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">
                Chave ou Discord ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="Ex: 1443975682320502845 ou KEY-XXXX"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Motivo do Bloqueio</label>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Ex: Cliente revogado, tentativa de crack, etc."
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Discord User Live Preview */}
          {isFetchingDiscord && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <RefreshCw className="size-3.5 animate-spin text-pink-400" />
              <span>Buscando perfil do Discord...</span>
            </div>
          )}

          {discordPreview && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-pink-500/30 bg-pink-950/20">
              <img
                src={discordPreview.avatarUrl}
                alt={discordPreview.username}
                className="size-10 rounded-full border border-pink-500/40 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">{discordPreview.globalName}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">@{discordPreview.username}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-semibold flex items-center gap-1">
                    <UserCheck className="size-3" /> Discord Validado
                  </span>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground truncate">ID: {discordPreview.id}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || !newId.trim()}
              className="flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-950/50 transition-all btn-interactive disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Bloqueando...</span>
                </>
              ) : (
                <>
                  <Ban className="size-3.5" />
                  <span>Adicionar à Blacklist</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista e Filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ID, Discord username, motivo..."
              className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === 'all' ? 'bg-pink-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todas ({bannedList.length})
            </button>
            <button
              onClick={() => setFilter('discord')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === 'discord' ? 'bg-pink-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Discord ({discordCount})
            </button>
            <button
              onClick={() => setFilter('keys')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === 'keys' ? 'bg-pink-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Apenas Keys ({bannedList.length - discordCount})
            </button>
          </div>
        </div>

        {/* Tabela de Banidos */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldAlert className="size-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold text-foreground">Nenhuma chave encontrada</p>
              <p className="text-xs text-muted-foreground mt-0.5">Nenhuma chave ou ID corresponde aos filtros atuais.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredList.map((item) => {
                const isDiscord = Boolean(item.discordId || item.discordUsername)
                return (
                  <div
                    key={item.id}
                    className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.discordAvatar ? (
                        <img
                          src={item.discordAvatar}
                          alt={item.discordUsername || item.id}
                          className="size-10 rounded-full border border-rose-500/40 object-cover shrink-0"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'
                          }}
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-rose-500/15 border border-rose-500/30 grid place-items-center text-rose-400 shrink-0">
                          <Ban className="size-4.5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground truncate">
                            {item.discordGlobalName ||
                              (item.discordUsername && item.discordUsername !== 'undefined'
                                ? `@${item.discordUsername}`
                                : `Chave / ID: ${item.id}`)}
                          </span>
                          {item.discordUsername && item.discordUsername !== 'undefined' && item.discordGlobalName && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              @{item.discordUsername}
                            </span>
                          )}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                            Banida
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-muted-foreground">
                          <span className="font-mono text-zinc-300 flex items-center gap-1">
                            ID: {item.id}
                            <button
                              onClick={() => handleCopy(item.id)}
                              className="text-muted-foreground hover:text-pink-400 transition-colors"
                              title="Copiar ID"
                            >
                              {copiedId === item.id ? (
                                <Check className="size-3 text-emerald-400" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </span>
                          <span className="text-rose-400/90 font-medium">Motivo: {item.reason}</span>
                          <span>Banido em: {item.bannedAt}</span>
                          <span>Por: {item.bannedBy || 'Hookedadmin'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                      <button
                        onClick={() => handleUnban(item.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/60 transition-all btn-interactive"
                        title="Desbanir e reativar chave"
                      >
                        <Check className="size-3.5" />
                        <span>Desbanir</span>
                      </button>

                      <button
                        onClick={() => handleUnban(item.id)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                        title="Remover Registro"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
