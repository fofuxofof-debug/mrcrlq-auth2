// Utilitário para comunicação com a API oficial do Discord via Bot Token
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || ''

export interface DiscordUser {
  id: string
  username: string
  discriminator: string
  globalName: string | null
  avatarUrl: string
  bannerColor: string | null
}

// Cache simples em memória para evitar rate limits do Discord
const userCache = new Map<string, { user: DiscordUser; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 10 // 10 minutos

export async function fetchDiscordUser(userId: string): Promise<DiscordUser | null> {
  const cleanId = userId.trim()
  if (!cleanId || !/^\d{16,21}$/.test(cleanId)) {
    return null
  }

  // Verifica cache
  const cached = userCache.get(cleanId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${cleanId}`, {
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        'User-Agent': 'HookedAuth/2.4',
      },
      next: { revalidate: 600 },
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    let avatarUrl = ''
    if (data.avatar) {
      avatarUrl = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=128`
    } else {
      try {
        const index = Number((BigInt(data.id) >> 22n) % 6n)
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${index}.png`
      } catch {
        avatarUrl = 'https://cdn.discordapp.com/embed/avatars/0.png'
      }
    }

    const user: DiscordUser = {
      id: data.id,
      username: data.username,
      discriminator: data.discriminator === '0' ? '' : data.discriminator,
      globalName: data.global_name || data.username,
      avatarUrl,
      bannerColor: data.banner_color || null,
    }

    userCache.set(cleanId, { user, timestamp: Date.now() })
    return user
  } catch (err) {
    console.error('Falha ao consultar usuário do Discord:', err)
    return null
  }
}
