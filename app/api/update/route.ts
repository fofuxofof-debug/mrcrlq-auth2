import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import os from 'os'
import { findLicenseAsync, isTestKey, isLicenseExpired, getSystemConfig } from '@/lib/licenses'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function normalizeGameKey(rawGame: string): string {
  const clean = (rawGame || '').toLowerCase().replace(/[\s\-_]/g, '')
  if (clean.includes('fivem')) return 'fivem'
  if (clean.includes('valorant')) return 'valorant'
  return 'freefire'
}

function findLoaderPath(gameKey: string): string | null {
  const candidates = [
    path.join(process.cwd(), 'public', 'loaders', `${gameKey}.exe`),
    path.join(process.cwd(), 'data', 'loaders', `${gameKey}.exe`),
    path.join(process.cwd(), 'mrcrlq-auth2-main', 'public', 'loaders', `${gameKey}.exe`),
    path.join(os.tmpdir(), 'hooked-auth-loaders', `${gameKey}.exe`),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const stat = fs.statSync(c)
        if (stat.size > 0) return c
      } catch {}
    }
  }
  return null
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = (searchParams.get('key') || '').trim()
  const rawGame = searchParams.get('game') || 'Free Fire'
  const gameKey = normalizeGameKey(rawGame)

  // Status check / build info
  const filePath = findLoaderPath(gameKey)
  let fileSize = 0
  let sha256 = ''
  let mtime = ''

  if (filePath) {
    try {
      const buf = fs.readFileSync(filePath)
      fileSize = buf.length
      sha256 = crypto.createHash('sha256').update(buf).digest('hex')
      const stat = fs.statSync(filePath)
      mtime = stat.mtime.toISOString()
    } catch {}
  }

  // If no key provided, return build metadata
  if (!key) {
    return NextResponse.json(
      {
        success: true,
        game: gameKey,
        fileAvailable: !!filePath,
        build: {
          version: '2.4.2-cloud',
          buildHash: sha256 ? sha256.substring(0, 16) : 'none',
          sha256,
          sizeBytes: fileSize,
          sizeFormatted: fileSize > 0 ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB',
          lastUpdated: mtime,
        },
      },
      { headers: corsHeaders() }
    )
  }

  // Validate key for memory streaming
  if (isTestKey(key)) {
    return NextResponse.json(
      { success: false, error: 'banned', message: 'Licença suspensa na blacklist.' },
      { status: 403, headers: corsHeaders() }
    )
  }

  const found = await findLicenseAsync(key)
  if (!found) {
    return NextResponse.json(
      { success: false, error: 'not_found', message: 'Chave não encontrada.' },
      { status: 404, headers: corsHeaders() }
    )
  }

  if (found.status === 'Suspended' || found.status === 'Expired' || isLicenseExpired(found.expiry)) {
    return NextResponse.json(
      { success: false, error: 'inactive', message: 'Licença inativa ou expirada.' },
      { status: 403, headers: corsHeaders() }
    )
  }

  return NextResponse.json(
    {
      success: true,
      message: 'Licença válida. Stream de memória liberado.',
      client: found.name,
      game: found.game || 'Free Fire',
      stream: {
        gameKey,
        ready: !!filePath,
        buildVersion: '2.4.2-cloud',
        buildHash: sha256 ? sha256.substring(0, 16) : 'none',
        sha256,
        sizeBytes: fileSize,
        sizeFormatted: fileSize > 0 ? (fileSize / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB',
        payloadUrl: `/api/loader/download?key=${encodeURIComponent(key)}&game=${encodeURIComponent(gameKey)}`,
      },
    },
    { headers: corsHeaders() }
  )
}
