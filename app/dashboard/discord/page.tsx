'use client'

import { useEffect, useState } from 'react'
import {
  MessageCircle, Webhook, Bell, Save, Send, Check,
  Bot, Eye, EyeOff, ShieldCheck, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'discord_settings'

interface DiscordSettings {
  webhook_url: string
  channel_id: string
  notify_new_key: boolean
  notify_validate_ok: boolean
  notify_validate_fail: boolean
  notify_ban: boolean
  notify_pause: boolean
  embed_color: string
}

const defaultSettings: DiscordSettings = {
  webhook_url: '',
  channel_id: '',
  notify_new_key: true,
  notify_validate_ok: false,
  notify_validate_fail: true,
  notify_ban: true,
  notify_pause: true,
  embed_color: '#0f0f0f',
}

interface BotStatus {
  has: boolean
  preview: string | null
  source: 'env' | 'runtime' | 'none'
}

export default function DiscordPage() {
  const [s, setS] = useState<DiscordSettings>(defaultSettings)
  const [saved, setSaved] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'err'>('idle')

  // Bot token state
  const [botStatus, setBotStatus] = useState<BotStatus>({ has: false, preview: null, source: 'none' })
  const [botInput, setBotInput] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [botSaving, setBotSaving] = useState(false)
  const [botMessage, setBotMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setS({ ...defaultSettings, ...JSON.parse(raw) })
    } catch {}
    refreshBotStatus()
  }, [])

  const refreshBotStatus = async () => {
    try {
      const r = await fetch('/api/discord/settings')
      const j = await r.json()
      if (j.ok) setBotStatus({ has: !!j.has, preview: j.preview, source: j.source })
    } catch {}
  }

  const update = <K extends keyof DiscordSettings>(k: K, v: DiscordSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }))

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const handleTest = async () => {
    if (!s.webhook_url) {
      setTestStatus('err')
      setTimeout(() => setTestStatus('idle'), 1800)
      return
    }
    setTesting(true)
    setTestStatus('idle')
    try {
      const colorHex = parseInt((s.embed_color || '#0f0f0f').replace('#', ''), 16)
      await fetch(s.webhook_url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: 'Havoc Auth',
          embeds: [{
            title: 'Webhook conectado',
            description: 'Notificações da Havoc estão configuradas.',
            color: isNaN(colorHex) ? 0x0f0f0f : colorHex,
            timestamp: new Date().toISOString(),
          }],
        }),
      })
      setTestStatus('ok')
    } catch {
      setTestStatus('err')
    } finally {
      setTesting(false)
      setTimeout(() => setTestStatus('idle'), 2200)
    }
  }

  const flashBot = (type: 'ok' | 'err', text: string) => {
    setBotMessage({ type, text })
    setTimeout(() => setBotMessage(null), 2800)
  }

  const handleSaveBot = async () => {
    setBotSaving(true)
    try {
      const r = await fetch('/api/discord/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: botInput }),
      })
      const j = await r.json()
      if (j.ok) {
        if (j.cleared) {
          flashBot('ok', 'Token removido (usando env var como fallback).')
        } else {
          flashBot('ok', `Conectado como ${j.bot.username} (id: ${j.bot.id}).`)
        }
        setBotInput('')
        refreshBotStatus()
      } else {
        flashBot('err', j.error || 'Falha ao validar token.')
      }
    } catch {
      flashBot('err', 'Erro de rede.')
    } finally {
      setBotSaving(false)
    }
  }

  const handleTestBot = async () => {
    setBotSaving(true)
    try {
      const r = await fetch('/api/discord/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: botInput }),
      })
      const j = await r.json()
      if (j.ok) flashBot('ok', `Token válido — bot: ${j.bot.username} (${j.bot.id}).`)
      else flashBot('err', j.error || 'Token inválido.')
    } catch {
      flashBot('err', 'Erro de rede.')
    } finally {
      setBotSaving(false)
    }
  }

  const toggles: { k: keyof DiscordSettings; label: string; desc: string }[] = [
    { k: 'notify_new_key',      label: 'Nova key criada',     desc: 'Avisa quando uma key é gerada no painel.' },
    { k: 'notify_validate_ok',  label: 'Validação OK',         desc: 'Notifica quando uma key é validada com sucesso.' },
    { k: 'notify_validate_fail',label: 'Validação falhou',     desc: 'Avisa em tentativas inválidas / HWID divergente.' },
    { k: 'notify_ban',          label: 'Key banida',           desc: 'Alerta quando uma key recebe ban.' },
    { k: 'notify_pause',        label: 'Pausa / despausa',     desc: 'Notifica mudanças de status (paused / active).' },
  ]

  return (
    <div className="page-in flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Discord</h1>
        <p className="text-sm text-muted-foreground">
          Bot, webhook e notificações automáticas no servidor.
        </p>
      </div>

      {/* ===== Bot Token ===== */}
      <div
        className="card-in rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        style={{ backgroundColor: 'rgb(255,255,255)' }}
      >
        <div
          className="flex items-center gap-2 border-b border-zinc-200/80 px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-700"
          style={{ backgroundColor: 'rgb(248,248,248)' }}
        >
          <Bot className="h-3.5 w-3.5" />
          Bot Token
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-4">
          {/* Status atual */}
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-[rgb(250,250,250)] px-4 py-3">
            {botStatus.has ? (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">Token ativo</p>
                  <p className="text-xs text-zinc-500">
                    Origem: <span className="font-mono">{botStatus.source === 'env' ? '.env' : 'runtime'}</span>
                    <span className="mx-1.5">·</span>
                    <span className="font-mono">{botStatus.preview}</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900">Sem token configurado</p>
                  <p className="text-xs text-zinc-500">
                    Defina <span className="font-mono">DISCORD_BOT_TOKEN</span> no <span className="font-mono">.env.local</span> ou cole abaixo.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Input pra setar/atualizar runtime */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Cole novo token (override em runtime)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-lg border border-zinc-200 bg-[rgb(248,248,248)] px-3 py-2.5">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={botInput}
                  placeholder="MTUx..."
                  onChange={(e) => setBotInput(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-zinc-900 outline-none font-mono placeholder:text-zinc-400"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="text-zinc-400 hover:text-zinc-700"
                  aria-label={showToken ? 'Esconder' : 'Mostrar'}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              ⚠️ Pra produção use a env var <span className="font-mono">DISCORD_BOT_TOKEN</span>. O override em runtime é resetado no próximo deploy.
            </p>
          </div>

          {/* Mensagem flash */}
          {botMessage && (
            <div
              className={`text-xs px-3 py-2 rounded-lg border ${
                botMessage.type === 'ok'
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-red-200 bg-red-50 text-red-600'
              }`}
            >
              {botMessage.text}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleTestBot}
              disabled={botSaving}
              className="button-shine bg-white border border-zinc-200 text-zinc-700 hover:bg-[rgb(245,245,245)] hover:text-zinc-900 hover:border-zinc-400 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              Testar
            </Button>
            <Button
              onClick={handleSaveBot}
              disabled={botSaving || !botInput.trim()}
              className="button-shine bg-zinc-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.97] disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar token
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Webhook ===== */}
      <div
        className="card-in rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        style={{ backgroundColor: 'rgb(255,255,255)', animationDelay: '60ms' }}
      >
        <div
          className="flex items-center gap-2 border-b border-zinc-200/80 px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-700"
          style={{ backgroundColor: 'rgb(248,248,248)' }}
        >
          <Webhook className="h-3.5 w-3.5" />
          Webhook
        </div>

        <div className="p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Webhook URL
            </label>
            <input
              type="url"
              value={s.webhook_url}
              placeholder="https://discord.com/api/webhooks/..."
              onChange={(e) => update('webhook_url', e.target.value)}
              className="rounded-lg border border-zinc-200 bg-[rgb(248,248,248)] px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Channel ID (opcional)
              </label>
              <input
                type="text"
                value={s.channel_id}
                placeholder="123456789012345678"
                onChange={(e) => update('channel_id', e.target.value)}
                className="rounded-lg border border-zinc-200 bg-[rgb(248,248,248)] px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Cor do embed
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={s.embed_color}
                  onChange={(e) => update('embed_color', e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-white"
                />
                <input
                  type="text"
                  value={s.embed_color}
                  onChange={(e) => update('embed_color', e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 bg-[rgb(248,248,248)] px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              onClick={handleTest}
              disabled={testing || !s.webhook_url}
              className="button-shine bg-white border border-zinc-200 text-zinc-700 hover:bg-[rgb(245,245,245)] hover:text-zinc-900 hover:border-zinc-400 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {testing ? 'Enviando...' : testStatus === 'ok' ? 'Enviado!' : testStatus === 'err' ? 'Falhou' : 'Enviar teste'}
            </Button>
            <Button
              onClick={handleSave}
              className="button-shine bg-zinc-900 text-white hover:bg-black hover:scale-[1.02] active:scale-[0.97]"
            >
              {saved ? <Check className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saved ? 'Salvo' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Notificações toggles ===== */}
      <div
        className="card-in rounded-2xl border border-zinc-200/80 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        style={{ backgroundColor: 'rgb(255,255,255)', animationDelay: '120ms' }}
      >
        <div
          className="flex items-center gap-2 border-b border-zinc-200/80 px-5 py-3 text-xs font-bold uppercase tracking-widest text-zinc-700"
          style={{ backgroundColor: 'rgb(248,248,248)' }}
        >
          <Bell className="h-3.5 w-3.5" />
          Notificações
        </div>

        <div className="divide-y divide-zinc-200/80">
          {toggles.map((t, i) => {
            const enabled = !!s[t.k]
            return (
              <div
                key={t.k}
                className="row-in flex items-center justify-between gap-4 px-5 py-4"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900">{t.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.desc}</p>
                </div>
                <button
                  onClick={() => update(t.k, !enabled as any)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${
                    enabled ? 'bg-zinc-900' : 'bg-zinc-200'
                  }`}
                  aria-pressed={enabled}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        <MessageCircle className="inline h-3 w-3 mr-1" />
        Bot token é server-side. Webhook/notificações são client-side. Integração completa requer backend.
      </p>
    </div>
  )
}
