// =============================================================================
// Helper Discord — busca usuário pela API REST usando o bot token (server-side).
// =============================================================================

const DISCORD_API = 'https://discord.com/api/v10'

// Cache em memória (60s) pra evitar bater na Discord em todo render
const cache = new Map<string, { at: number; data: DiscordUser | null }>()
const CACHE_TTL = 60_000

export interface DiscordUser {
  id: string
  username: string
  global_name: string | null
  discriminator: string
  avatar: string | null
  avatar_url: string | null
  banner: string | null
  accent_color: number | null
}

// Pega o token. Prioridade: storage em memória (setado via UI) → env var
let runtimeToken: string | null = null
export function setRuntimeBotToken(t: string | null) {
  runtimeToken = t && t.trim() ? t.trim() : null
}
export function getBotToken(): string | null {
  if (runtimeToken) return runtimeToken
  const env = process.env.DISCORD_BOT_TOKEN
  return env && env.trim() ? env.trim() : null
}

export async function fetchDiscordUser(userId: string): Promise<DiscordUser | null> {
  if (!userId || !/^\d{15,22}$/.test(userId)) return null

  const cached = cache.get(userId)
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data

  const token = getBotToken()
  if (!token) return null

  try {
    const r = await fetch(`${DISCORD_API}/users/${userId}`, {
      headers: { Authorization: `Bot ${token}` },
      cache: 'no-store',
    })
    if (!r.ok) {
      cache.set(userId, { at: Date.now(), data: null })
      return null
    }
    const j = (await r.json()) as DiscordUser
    j.avatar_url = j.avatar
      ? `https://cdn.discordapp.com/avatars/${j.id}/${j.avatar}.${j.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
      : null
    cache.set(userId, { at: Date.now(), data: j })
    return j
  } catch {
    return null
  }
}

// Verifica se o token é válido sem precisar de um user_id específico (chama @me)
export async function verifyBotToken(token: string): Promise<{ ok: boolean; bot?: { id: string; username: string }; error?: string }> {
  if (!token || !token.trim()) return { ok: false, error: 'empty_token' }
  try {
    const r = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bot ${token.trim()}` },
      cache: 'no-store',
    })
    if (!r.ok) {
      const j = await r.json().catch(() => ({}))
      return { ok: false, error: j?.message || `http_${r.status}` }
    }
    const j = (await r.json()) as { id: string; username: string }
    return { ok: true, bot: { id: j.id, username: j.username } }
  } catch (e) {
    return { ok: false, error: 'network_error' }
  }
}
