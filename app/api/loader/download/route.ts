import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {
  findLicenseAsync,
  isTestKey,
  isLicenseExpired,
  getSystemConfig,
} from '@/lib/licenses'
import { addAuthLog, extractClientIp, resolveLocation } from '@/lib/logs'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function normalizeGameKey(rawGame: string): string | null {
  const clean = rawGame.toLowerCase().replace(/[\s\-_]/g, '')
  if (clean.includes('fivem')) return 'fivem'
  if (clean.includes('valorant')) return 'valorant'
  if (clean.includes('freefire')) return 'freefire'
  return null
}

function getGameDisplayName(key: string): string {
  if (key === 'fivem') return 'FiveM'
  if (key === 'valorant') return 'Valorant'
  if (key === 'freefire') return 'Free Fire'
  return key
}

function findLoaderFile(gameKey: string): { filePath: string; size: number } | null {
  const candidates = [
    path.join(process.cwd(), 'public', 'loaders', `${gameKey}.exe`),
    path.join(process.cwd(), 'data', 'loaders', `${gameKey}.exe`),
    path.join(process.cwd(), 'mrcrlq-auth2-main', 'public', 'loaders', `${gameKey}.exe`),
    path.join(os.tmpdir(), 'hooked-auth-loaders', `${gameKey}.exe`),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const stat = fs.statSync(candidate)
        if (stat.size > 0) {
          return { filePath: candidate, size: stat.size }
        }
      } catch {}
    }
  }
  return null
}

export async function GET(request: Request) {
  return handleDownload(request)
}

export async function POST(request: Request) {
  return handleDownload(request)
}

async function handleDownload(request: Request) {
  const clientIp = extractClientIp(request)
  const location = await resolveLocation(clientIp, request)

  let rawKey = ''
  let rawGame = ''
  let hwid = ''

  if (request.method === 'GET') {
    const { searchParams } = new URL(request.url)
    rawKey = searchParams.get('key') || searchParams.get('licenseKey') || ''
    rawGame = searchParams.get('game') || searchParams.get('gameName') || ''
    hwid = searchParams.get('hwid') || ''
  } else {
    try {
      const body = await request.json()
      rawKey = body.key || body.licenseKey || ''
      rawGame = body.game || body.gameName || ''
      hwid = body.hwid || ''
    } catch {
      const { searchParams } = new URL(request.url)
      rawKey = searchParams.get('key') || searchParams.get('licenseKey') || ''
      rawGame = searchParams.get('game') || searchParams.get('gameName') || ''
    }
  }

  const cleanKey = rawKey.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
  let gameKey = rawGame ? normalizeGameKey(rawGame) : null

  if (!gameKey && rawGame && (rawGame.toLowerCase().includes('todo') || rawGame.toLowerCase().includes('all'))) {
    gameKey = 'freefire'
  }
  if (!gameKey && !rawGame) {
    gameKey = 'freefire'
  }

  if (!gameKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'invalid_game',
        message: 'Jogo não especificado. Use FiveM, Valorant ou Free Fire.',
      },
      { status: 400, headers: corsHeaders() }
    )
  }

  const gameName = getGameDisplayName(gameKey)

  // 1. Verifica Kill Switch do Sistema
  const system = getSystemConfig()
  if (!system.authEnabled) {
    await addAuthLog({
      actor: cleanKey || 'Desconhecido',
      key: cleanKey || undefined,
      game: gameName,
      client: 'Loader Download',
      ip: clientIp,
      location,
      status: 'WARN',
      statusCode: 503,
      reason: 'Download bloqueado: Sistema temporariamente pausado pelo admin',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'auth_paused',
        message: system.maintenanceMessage || 'Serviço de autenticação temporariamente pausado.',
      },
      { status: 503, headers: corsHeaders() }
    )
  }

  // 2. Chave não informada
  if (!cleanKey) {
    await addAuthLog({
      actor: 'Não informado',
      game: gameName,
      client: 'Loader Download',
      ip: clientIp,
      location,
      status: 'FAILED',
      statusCode: 400,
      reason: 'Falha: Nenhuma chave fornecida para download do loader',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'missing_key',
        message: 'Por favor, informe a sua chave de licença (key) para baixar o loader.',
      },
      { status: 400, headers: corsHeaders() }
    )
  }

  // 3. Chave Banida na Blacklist
  if (isTestKey(cleanKey)) {
    await addAuthLog({
      actor: `Key #${cleanKey.slice(0, 8)}···`,
      key: cleanKey,
      game: gameName,
      client: 'Loader Download',
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
        message: 'Esta licença foi suspensa ou banida permanentemente.',
      },
      { status: 403, headers: corsHeaders() }
    )
  }

  // 4. Busca da Licença
  const found = await findLicenseAsync(cleanKey)
  if (!found) {
    await addAuthLog({
      actor: `Key #${cleanKey.slice(0, 8)}···`,
      key: cleanKey,
      game: gameName,
      client: 'Loader Download',
      ip: clientIp,
      location,
      status: 'FAILED',
      statusCode: 404,
      reason: 'Falha: Chave inexistente no sistema ao tentar baixar loader',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'key_not_found',
        message: 'Chave de licença não encontrada.',
      },
      { status: 404, headers: corsHeaders() }
    )
  }

  // 5. Verifica se a Licença está suspensa
  if (found.status === 'Suspended') {
    await addAuthLog({
      actor: found.name,
      key: found.key,
      game: gameName,
      client: 'Loader Download',
      ip: clientIp,
      location,
      status: 'BANNED',
      statusCode: 403,
      reason: 'Acesso bloqueado: Licença suspensa pelo administrador',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'key_banned',
        message: 'Licença suspensa pelo administrador.',
      },
      { status: 403, headers: corsHeaders() }
    )
  }

  // 6. Verifica se a Licença está expirada
  if (found.status === 'Expired' || isLicenseExpired(found.expiry)) {
    await addAuthLog({
      actor: found.name,
      key: found.key,
      game: gameName,
      client: 'Loader Download',
      ip: clientIp,
      location,
      status: 'FAILED',
      statusCode: 403,
      reason: 'Acesso recusado: Licença expirada ao tentar baixar loader',
    })

    return NextResponse.json(
      {
        success: false,
        error: 'key_expired',
        message: 'Sua licença está expirada. Renove sua assinatura para baixar o loader.',
      },
      { status: 403, headers: corsHeaders() }
    )
  }

  // 7. Validação do Jogo da Chave
  const licenseGame = found.game || 'Todos os Jogos'
  const isAllGames = licenseGame.toLowerCase().includes('todos') || licenseGame.toLowerCase() === 'all'
  const isGameAllowed = isAllGames || normalizeGameKey(licenseGame) === gameKey

  if (!isGameAllowed) {
    await addAuthLog({
      actor: found.name,
      key: found.key,
      game: gameName,
      client: 'Loader Download',
      ip: clientIp,
      location,
      status: 'WARN',
      statusCode: 403,
      reason: `Jogo incorreto: Chave é para ${licenseGame}, mas tentou baixar ${gameName}`,
    })

    return NextResponse.json(
      {
        success: false,
        error: 'game_mismatch',
        message: `Sua chave é exclusiva para o jogo "${licenseGame}". Você não pode baixar o loader de "${gameName}".`,
      },
      { status: 403, headers: corsHeaders() }
    )
  }

  // 8. Busca o arquivo .exe gravado
  const fileInfo = findLoaderFile(gameKey)
  if (!fileInfo) {
    return NextResponse.json(
      {
        success: false,
        error: 'file_not_found',
        message: `O executável do loader de ${gameName} ainda não foi enviado pelo administrador no painel.`,
      },
      { status: 404, headers: corsHeaders() }
    )
  }

  // 9. Sucesso! Registra o Log de Download
  await addAuthLog({
    actor: found.name,
    key: found.key,
    game: gameName,
    client: 'Loader Download',
    ip: clientIp,
    location,
    status: 'SUCCESS',
    statusCode: 200,
    reason: `Download do loader de ${gameName} liberado e concluído com sucesso`,
  })

  // 10. Streaming do arquivo binário (.exe)
  const fileBuffer = fs.readFileSync(fileInfo.filePath)
  const downloadFilename = `${gameName}-Loader.exe`

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      'Content-Length': fileBuffer.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}
