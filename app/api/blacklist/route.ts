import { NextResponse } from 'next/server'
import {
  getBannedKeys,
  banKeyAsync,
  unbanKeyAsync,
  loadBannedFromKv,
  BannedItem,
} from '@/lib/licenses'
import { fetchDiscordUser } from '@/lib/discord'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function GET() {
  try {
    const kvBanned = await loadBannedFromKv()
    const banned = kvBanned || getBannedKeys()
    return NextResponse.json(
      { success: true, count: banned.length, banned },
      { headers: corsHeaders() }
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Erro ao carregar blacklist.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const rawId = body?.id || body?.key || body?.discordId
    const reason = body?.reason?.trim() || 'Banido pelo Administrador'
    const actor = body?.actor?.trim() || 'Hookedadmin'

    if (!rawId || typeof rawId !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Chave ou ID do Discord não informado.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const cleanId = rawId.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
    let discordData: { username?: string; globalName?: string; avatarUrl?: string } | undefined

    if (/^\d{16,21}$/.test(cleanId)) {
      try {
        const discUser = await fetchDiscordUser(cleanId)
        if (discUser) {
          discordData = {
            username: discUser.username,
            globalName: discUser.globalName || discUser.username,
            avatarUrl: discUser.avatarUrl,
          }
        }
      } catch {}
    }

    const bannedItem = await banKeyAsync(cleanId, reason, actor, discordData)
    return NextResponse.json(
      { success: true, item: bannedItem, message: `Key/ID ${cleanId} adicionado à blacklist.` },
      { status: 201, headers: corsHeaders() }
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Erro ao banir chave.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id') || searchParams.get('key')
    if (!id) {
      try {
        const body = await request.json()
        id = body?.id || body?.key
      } catch {}
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'ID ou Chave não informado para desbanir.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const cleanId = id.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
    const ok = await unbanKeyAsync(cleanId)

    return NextResponse.json(
      { success: ok, id: cleanId, message: `Key/ID ${cleanId} desbanido com sucesso.` },
      { headers: corsHeaders() }
    )
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erro ao desbanir chave.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
