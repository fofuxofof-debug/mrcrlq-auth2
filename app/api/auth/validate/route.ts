import { NextResponse, type NextRequest } from 'next/server'
import { keysDb, hwidsDb, logsDb } from '@/lib/db'
import { issueSessionToken, secondsUntil } from '@/lib/session-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const rateLimitMap = new Map<string, { count: number; lastReset: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW = 60_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.lastReset > RATE_WINDOW) {
    rateLimitMap.set(ip, { count: 1, lastReset: now })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: 'rate_limited', message: 'Muitas tentativas. Tente novamente em 1 minuto.' },
      { status: 429 }
    )
  }

  let body: { key?: string; hwid?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400 })
  }

  const { key, hwid } = body

  if (!key || !hwid) {
    return NextResponse.json(
      { success: false, error: 'missing_params', message: 'Parametros key e hwid sao obrigatorios.' },
      { status: 400 }
    )
  }

  const keyData = await keysDb.findByKey(key)
  if (!keyData) {
    await logsDb.create({
      event_type: 'auth_fail',
      ip_address: ip,
      hwid,
      details: { reason: 'key_not_found', key },
    })
    return NextResponse.json(
      { success: false, error: 'invalid_key', message: 'Key invalida ou nao encontrada.' },
      { status: 401 }
    )
  }

  if (keyData.status === 'banned') {
    await logsDb.create({
      key_id: keyData.id,
      event_type: 'auth_fail',
      ip_address: ip,
      hwid,
      details: { reason: 'key_banned' },
    })
    return NextResponse.json(
      { success: false, error: 'key_banned', message: 'Esta key foi banida.' },
      { status: 403 }
    )
  }

  if (keyData.status === 'paused') {
    await logsDb.create({
      key_id: keyData.id,
      event_type: 'auth_fail',
      ip_address: ip,
      hwid,
      details: { reason: 'key_paused' },
    })
    return NextResponse.json(
      { success: false, error: 'key_paused', message: 'Esta key está pausada.' },
      { status: 403 }
    )
  }

  if (new Date(keyData.expires_at) < new Date()) {
    await logsDb.create({
      key_id: keyData.id,
      event_type: 'auth_fail',
      ip_address: ip,
      hwid,
      details: { reason: 'key_expired' },
    })
    return NextResponse.json(
      { success: false, error: 'key_expired', message: 'Esta key expirou.' },
      { status: 403 }
    )
  }

  const existingHwids = await hwidsDb.listByKey(keyData.id)
  const hwidMatch = existingHwids.find((h) => h.hwid === hwid)

  if (!hwidMatch) {
    if (existingHwids.length >= keyData.max_devices) {
      await logsDb.create({
        key_id: keyData.id,
        event_type: 'device_limit',
        ip_address: ip,
        hwid,
        details: {
          reason: 'device_limit_exceeded',
          current: existingHwids.length,
          max: keyData.max_devices,
        },
      })
      return NextResponse.json(
        {
          success: false,
          error: 'device_limit',
          message: `Limite de dispositivos excedido (${existingHwids.length}/${keyData.max_devices}).`,
        },
        { status: 403 }
      )
    }
    await hwidsDb.create({ key_id: keyData.id, hwid, ip_address: ip })
  }

  await logsDb.create({
    key_id: keyData.id,
    event_type: 'auth_success',
    ip_address: ip,
    hwid,
    details: {},
  })

  const sessionToken = issueSessionToken(keyData.id, hwid)

  return NextResponse.json({
    success: true,
    message: 'Autenticado com sucesso.',
    data: {
      key: keyData.key,
      label: keyData.label,
      expires_at: keyData.expires_at,
      expires_in_seconds: secondsUntil(keyData.expires_at),
      discord_id: keyData.discord_id,
      max_devices: keyData.max_devices,
      devices_used: hwidMatch ? existingHwids.length : existingHwids.length + 1,
      session_token: sessionToken,
    },
  })
}
