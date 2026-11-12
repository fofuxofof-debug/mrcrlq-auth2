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

function findLoaderFile(gameKey: string): boolean {
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
        if (stat.size > 0) return true
      } catch {}
    }
  }
  return false
}

export async function GET(request: Request) {
  return handleValidate(request)
}

export async function POST(request: Request) {
  return handleValidate(request)
}

async function handleValidate(request: Request) {
  let rawKey = ''
  if (request.method === 'GET') {
    const { searchParams } = new URL(request.url)
    rawKey = searchParams.get('key') || searchParams.get('id') || ''
  } else {
    try {
      const body = await request.json()
      rawKey = body.key || body.id || ''
    } catch {
      const { searchParams } = new URL(request.url)
      rawKey = searchParams.get('key') || searchParams.get('id') || ''
    }
  }

  const cleanKey = rawKey.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()

  if (!cleanKey) {
    return NextResponse.json(
      { success: false, error: 'missing_key', message: 'Por favor, digite sua chave de licença (Key).' },
      { status: 400, headers: corsHeaders() }
    )
  }

  const system = getSystemConfig()
  if (!system.authEnabled) {
    return NextResponse.json(
      {
        success: false,
        error: 'auth_paused',
        message: system.maintenanceMessage || 'Serviço temporariamente pausado.',
      },
      { status: 503, headers: corsHeaders() }
    )
  }

  if (isTestKey(cleanKey)) {
    return NextResponse.json(
      { success: false, error: 'key_banned', message: 'Esta licença foi suspensa ou banida permanentemente.' },
      { status: 403, headers: corsHeaders() }
    )
  }

  const found = await findLicenseAsync(cleanKey)
  if (!found) {
    return NextResponse.json(
      { success: false, error: 'key_not_found', message: 'Chave de licença não encontrada no sistema.' },
      { status: 404, headers: corsHeaders() }
    )
  }

  if (found.status === 'Suspended') {
    return NextResponse.json(
      { success: false, error: 'key_banned', message: 'Licença suspensa pelo administrador.' },
      { status: 403, headers: corsHeaders() }
    )
  }

  if (found.status === 'Expired' || isLicenseExpired(found.expiry)) {
    return NextResponse.json(
      { success: false, error: 'key_expired', message: 'Sua licença expirou. Renove sua assinatura para baixar o loader.' },
      { status: 403, headers: corsHeaders() }
    )
  }

  const licenseGame = found.game || 'Free Fire'
  const gameKey = normalizeGameKey(licenseGame) || 'freefire'
  const fileAvailable = findLoaderFile(gameKey)

  return NextResponse.json(
    {
      success: true,
      license: {
        key: found.key,
        name: found.name,
        game: licenseGame,
        plano: found.plano || found.tempo,
        tempo: found.tempo,
        expiry: found.expiry,
        status: found.status,
      },
      game: licenseGame,
      fileAvailable,
      downloadUrl: `/api/loader/download?key=${encodeURIComponent(found.key)}&game=${encodeURIComponent(licenseGame)}`,
    },
    { headers: corsHeaders() }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}
