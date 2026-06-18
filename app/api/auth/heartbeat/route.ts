import { NextResponse, type NextRequest } from 'next/server'
import { keysDb, hwidsDb, logsDb } from '@/lib/db'
import { issueSessionToken, secondsUntil, verifySessionToken } from '@/lib/session-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Rate limiting separado pro heartbeat (mais permissivo que login).
const heartbeatRateMap = new Map<string, { count: number; lastReset: number }>()
const HB_RATE_LIMIT = 120
const HB_RATE_WINDOW = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = heartbeatRateMap.get(ip)
  if (!entry || now - entry.lastReset > HB_RATE_WINDOW) {
    heartbeatRateMap.set(ip, { count: 1, lastReset: now })
    return false
  }
  entry.count++
  return entry.count > HB_RATE_LIMIT
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'rate_limited' },
      { status: 429 }
    )
  }

  let body: { session_token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400 })
  }

  const { session_token } = body
  if (!session_token) {
    return NextResponse.json(
      { success: false, error: 'missing_token' },
      { status: 400 }
    )
  }

  // Valida assinatura HMAC do token
  const verified = verifySessionToken(session_token)
  if (!verified.ok) {
    return NextResponse.json(
      { success: false, error: `token_${verified.reason}` },
      { status: 401 }
    )
  }

  const { k: keyId, h: hwid } = verified.payload

  // Re-checa estado atual da key (pode ter sido banida/pausada/expirada durante a sessão)
  const keyData = await keysDb.findById(keyId)
  if (!keyData) {
    return NextResponse.json(
      { success: false, error: 'invalid_key' },
      { status: 401 }
    )
  }
  if (keyData.status === 'banned') {
    await logsDb.create({
      key_id: keyData.id,
      event_type: 'auth_fail',
      ip_address: ip,
      hwid,
      details: { reason: 'key_banned_during_session' },
    })
    return NextResponse.json(
      { success: false, error: 'key_banned' },
      { status: 403 }
    )
  }
  if (keyData.status === 'paused') {
    return NextResponse.json(
      { success: false, error: 'key_paused' },
      { status: 403 }
    )
  }
  if (new Date(keyData.expires_at) < new Date()) {
    return NextResponse.json(
      { success: false, error: 'key_expired' },
      { status: 403 }
    )
  }

  // Confirma que o HWID ainda está vinculado
  const hwidMatch = await hwidsDb.findByKeyAndHwid(keyData.id, hwid)
  if (!hwidMatch) {
    return NextResponse.json(
      { success: false, error: 'hwid_mismatch' },
      { status: 403 }
    )
  }

  // OK — emite token novo (rotaciona)
  return NextResponse.json({
    success: true,
    data: {
      valid: true,
      expires_at: keyData.expires_at,
      expires_in_seconds: secondsUntil(keyData.expires_at),
      session_token: issueSessionToken(keyData.id, hwid),
    },
  })
}
