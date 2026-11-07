import { NextResponse } from 'next/server'
import { fetchDiscordUser } from '@/lib/discord'
import {
  findLicenseAsync,
  updateLicenseStatusAsync,
  getSystemConfig,
  isMockHwid,
  isLicenseExpired,
  isTestKey,
} from '@/lib/licenses'
import { issueSessionToken, secondsUntil } from '@/lib/session-token'
import { addAuthLog, extractClientIp, resolveLocation } from '@/lib/logs'

export async function POST(request: Request) {
  const clientIp = extractClientIp(request)
  const location = await resolveLocation(clientIp, request)

  try {
    const body = await request.json().catch(() => ({}))
    const rawKey = body?.licenseKey || body?.key
    const hwid = body?.hwid
    const game = body?.game

    const cleanKey =
      typeof rawKey === 'string'
        ? rawKey.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
        : ''

    const reqGame =
      game && typeof game === 'string' && game.trim() !== '' && game.toLowerCase() !== 'all'
        ? game.replace(/["'\r\n\t]/g, '').trim()
        : null

    // 0. Kill Switch / Verificação de Parada do Sistema de Auth
    const system = getSystemConfig()
    if (!system.authEnabled) {
      await addAuthLog({
        actor: cleanKey || 'Desconhecido',
        key: cleanKey || undefined,
        game: reqGame || 'Geral',
        client: 'App / Cliente',
        ip: clientIp,
        location,
        status: 'WARN',
        statusCode: 503,
        reason: 'Auth rejeitada: Sistema temporariamente pausado pelo admin',
      })

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

    if (!cleanKey) {
      await addAuthLog({
        actor: 'Não informado',
        game: reqGame || 'Geral',
        client: 'App / Cliente',
        ip: clientIp,
        location,
        status: 'FAILED',
        statusCode: 400,
        reason: 'Falha: Chave de licença não fornecida',
      })

      return NextResponse.json(
        { success: false, error: 'invalid_key', message: 'Chave de licença não fornecida ou inválida.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    if (isTestKey(cleanKey)) {
      await addAuthLog({
        actor: `Key #${cleanKey.slice(0, 8)}···`,
        key: cleanKey,
        game: reqGame || 'Geral',
        client: 'App / Cliente',
        ip: clientIp,
        location,
        status: 'BANNED',
        statusCode: 403,
        reason: 'Acesso bloqueado: Licença banida permanentemente na blacklist',
      })

      return NextResponse.json(
        {
          success: false,
          error: 'key_banned',
          message: 'Esta licença foi banida permanentemente por violação das diretrizes.',
        },
        { status: 403, headers: corsHeaders() }
      )
    }

    const found = await findLicenseAsync(cleanKey)

    if (!found) {
      await addAuthLog({
        actor: `Key #${cleanKey.slice(0, 8)}···`,
        key: cleanKey,
        game: reqGame || 'Geral',
        client: 'App / Cliente',
        ip: clientIp,
        location,
        status: 'FAILED',
        statusCode: 404,
        reason: 'Falha: Chave inexistente no sistema',
      })

      return NextResponse.json(
        { success: false, error: 'key_not_found', message: 'Licença inexistente no sistema Hooked Auth.' },
        { status: 404, headers: corsHeaders() }
      )
    }

    const appLabel = reqGame || found.game || 'App / Cliente'

    if (found.status === 'Suspended') {
      await addAuthLog({
        actor: found.name,
        key: found.key,
        game: found.game,
        client: appLabel,
        ip: clientIp,
        location,
        status: 'BANNED',
        statusCode: 403,
        reason: 'Acesso bloqueado: Licença banida / suspensa',
      })

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

      await addAuthLog({
        actor: found.name,
        key: found.key,
        game: found.game,
        client: appLabel,
        ip: clientIp,
        location,
        status: 'FAILED',
        statusCode: 403,
        reason: 'Acesso recusado: Licença expirada',
      })

      return NextResponse.json(
        { success: false, error: 'key_expired', message: 'Licença expirada. Renove sua assinatura.' },
        { status: 403, headers: corsHeaders() }
      )
    }

    // Compatibilidade Universal de Jogos
    if (reqGame) {
      const cleanLicenseGame = (found.game || '').trim().toLowerCase()
      if (
        cleanLicenseGame !== 'todos os jogos' &&
        cleanLicenseGame !== 'all' &&
        cleanLicenseGame !== reqGame.toLowerCase()
      ) {
        found.game = reqGame
        await updateLicenseStatusAsync(found.key, { game: reqGame })
      }
    }

    // Validação Estrita de HWID
    const cleanHwid = typeof hwid === 'string' ? hwid.replace(/["'\r\n\t]/g, '').trim() : ''

    if (!cleanHwid) {
      await addAuthLog({
        actor: found.name,
        key: found.key,
        game: found.game,
        client: appLabel,
        ip: clientIp,
        location,
        status: 'FAILED',
        statusCode: 400,
        reason: 'Falha: HWID não enviado pelo executável',
      })

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
      await updateLicenseStatusAsync(found.key, {
        hwid: cleanHwid,
        devices: '1 / 1 HWID (Vinculado)',
      })
      found.hwid = cleanHwid
      found.devices = '1 / 1 HWID (Vinculado)'
    } else {
      if (storedHwid.toLowerCase() !== cleanHwid.toLowerCase()) {
        await addAuthLog({
          actor: found.name,
          key: found.key,
          game: found.game,
          client: appLabel,
          ip: clientIp,
          location,
          status: 'FAILED',
          statusCode: 403,
          reason: 'Bloqueado: HWID incompatível (computador diferente)',
        })

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

    // Discord Profile
    let discordUser = null
    const targetDiscordId = found.discordId || (cleanKey.length >= 16 ? cleanKey : null)
    if (targetDiscordId) {
      discordUser = await fetchDiscordUser(targetDiscordId)
    }

    const sessionToken = issueSessionToken(found.key, cleanHwid)
    const clientDisplayName = discordUser?.globalName || discordUser?.username || found.name
    const expSeconds = secondsUntil(found.expiry)
    const discordId = found.discordId || (cleanKey.length >= 16 ? cleanKey : '')

    // SUCESSO! Log em tempo real
    await addAuthLog({
      actor: clientDisplayName,
      key: found.key,
      game: found.game,
      client: appLabel,
      ip: clientIp,
      location,
      status: 'SUCCESS',
      statusCode: 200,
      reason: isUnbound
        ? 'Login autorizado (Primeiro login - HWID vinculado)'
        : 'Login autorizado (HWID validado)',
    })

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
