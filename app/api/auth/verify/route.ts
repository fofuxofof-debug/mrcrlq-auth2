import { NextResponse } from 'next/server'
import { fetchDiscordUser } from '@/lib/discord'
import {
  findLicenseAsync,
  updateLicenseStatusAsync,
  getSystemConfig,
  isMockHwid,
  isLicenseExpired,
  getRemainingSeconds,
} from '@/lib/licenses'
import { issueSessionToken, secondsUntil } from '@/lib/session-token'

export async function POST(request: Request) {
  try {
    // 0. Kill Switch / Verificação de Parada do Sistema de Auth
    const system = getSystemConfig()
    if (!system.authEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'auth_paused',
          message:
            system.maintenanceMessage ||
            'Serviço de autenticação temporariamente pausado pelo administrador.',
          systemPaused: true,
        },
        { status: 503, headers: corsHeaders() }
      )
    }

    const body = await request.json()
    const rawKey = body.licenseKey || body.key
    const hwid = body.hwid
    const game = body.game

    if (!rawKey || typeof rawKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'invalid_key', message: 'Chave de licença não fornecida ou inválida.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const cleanKey = rawKey
      .replace(/^#\s*/, '')
      .replace(/["'\r\n\t]/g, '')
      .trim()
    const found = await findLicenseAsync(cleanKey)

    if (!found) {
      return NextResponse.json(
        { success: false, error: 'key_not_found', message: 'Licença inexistente no sistema Hooked Auth.' },
        { status: 404, headers: corsHeaders() }
      )
    }

    if (found.status === 'Suspended') {
      return NextResponse.json(
        { success: false, error: 'key_banned', message: 'Licença suspensa ou banida por violação.' },
        { status: 403, headers: corsHeaders() }
      )
    }

    if (found.status === 'Expired' || isLicenseExpired(found.expiry)) {
      if (found.status !== 'Expired') {
        found.status = 'Expired'
        await updateLicenseStatusAsync(found.key, { status: 'Expired', tempo: 'Expirada' })
      }
      return NextResponse.json(
        { success: false, error: 'key_expired', message: 'Licença expirada. Renove sua assinatura.' },
        { status: 403, headers: corsHeaders() }
      )
    }

    // Compatibilidade Universal de Softwares Hooked (Free Fire, Valorant, FiveM, ColorBot):
    // Todas as chaves válidas têm acesso garantido. Se o aplicativo cliente informar o jogo em uso (ex: 'Valorant'),
    // nós sincronizamos para manter o painel atualizado com o software em execução sem nunca barrar o cliente.
    const reqGame =
      game && typeof game === 'string' && game.trim() !== '' && game.toLowerCase() !== 'all'
        ? game.replace(/["'\r\n\t]/g, '').trim()
        : null

    if (reqGame) {
      const cleanLicenseGame = (found.game || '').trim().toLowerCase()
      if (cleanLicenseGame !== 'todos os jogos' && cleanLicenseGame !== 'all' && cleanLicenseGame !== reqGame.toLowerCase()) {
        found.game = reqGame
        await updateLicenseStatusAsync(found.key, { game: reqGame })
      }
    }

    // =========================================================================
    // Validação Estrita de HWID (Auto-vínculo no 1º login e proteção contra múltiplos PCs)
    // =========================================================================
    const cleanHwid = typeof hwid === 'string' ? hwid.replace(/["'\r\n\t]/g, '').trim() : ''

    if (!cleanHwid) {
      return NextResponse.json(
        {
          success: false,
          error: 'missing_hwid',
          message: 'HWID não detectado. Seu executável precisa enviar o HWID da máquina.',
        },
        { status: 400, headers: corsHeaders() }
      )
    }

    const storedHwid = (found.hwid || '').replace(/["'\r\n\t]/g, '').trim()
    const isUnbound = !storedHwid || isMockHwid(storedHwid)

    if (isUnbound) {
      // Primeiro login ou chave após Reset de HWID: vincula este computador à licença
      await updateLicenseStatusAsync(found.key, {
        hwid: cleanHwid,
        devices: '1 / 1 HWID (Vinculado)',
      })
      found.hwid = cleanHwid
      found.devices = '1 / 1 HWID (Vinculado)'
    } else {
      // Chave já vinculada a um computador: valida se é o MESMO computador
      if (storedHwid.toLowerCase() !== cleanHwid.toLowerCase()) {
        return NextResponse.json(
          {
            success: false,
            error: 'device_limit',
            message:
              'Limite de dispositivos excedido (1/1). HWID incompatível com esta licença. Peça um reset de HWID no suporte se tiver formatado o PC.',
          },
          { status: 403, headers: corsHeaders() }
        )
      }
    }

    // Enriquecer com perfil oficial do Discord caso seja um ID válido
    let discordUser = null
    const targetDiscordId = found.discordId || (cleanKey.length >= 16 ? cleanKey : null)
    if (targetDiscordId) {
      discordUser = await fetchDiscordUser(targetDiscordId)
    }

    const sessionToken = issueSessionToken(found.key, cleanHwid)
    const clientDisplayName = discordUser?.globalName || discordUser?.username || found.name
    const expSeconds = secondsUntil(found.expiry)
    const discordId = found.discordId || (cleanKey.length >= 16 ? cleanKey : '')

    // Sucesso - retorna formato híbrido 100% compatível com mrcrlq-auth2 e HookedAuth C++
    return NextResponse.json(
      {
        success: true,
        message: 'Autenticado com sucesso no Hooked Auth.',
        session_token: sessionToken,
        expires_at: found.expiry,
        expires_in_seconds: expSeconds,
        max_devices: 1,
        devices_used: 1,
        discord_id: discordId,
        label: found.name,
        name: clientDisplayName,
        discordUsername: discordUser?.username || null,
        discordAvatar: discordUser?.avatarUrl || null,
        key: found.key,
        game: found.game,
        plano: found.plano || 'Padrão',
        tempo: found.tempo,
        status: found.status,
        expiry: found.expiry,
        hwidBound: cleanHwid,
        data: {
          key: found.key,
          label: found.name,
          username: clientDisplayName,
          discord_username: discordUser?.username || null,
          expires_at: found.expiry,
          expires_in_seconds: expSeconds,
          discord_id: discordId,
          max_devices: 1,
          devices_used: 1,
          session_token: sessionToken,
        },
      },
      { status: 200, headers: corsHeaders() }
    )
  } catch (error) {
    console.error('DETAILED VERIFY ERROR:', error)
    return NextResponse.json(
      { success: false, message: 'Erro interno ao processar autenticação.' },
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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}
