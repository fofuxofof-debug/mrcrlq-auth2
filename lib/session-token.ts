// =============================================================================
// Session token HMAC-SHA256 stateless usado pelo cliente C++.
// Formato: base64(payload).base64(hmac_sha256(payload, secret))
// payload = JSON: { k: keyId, h: hwid, e: epochExpiresMs, i: issuedAtMs }
// =============================================================================

import { createHmac, timingSafeEqual } from 'crypto'

// Secret server-side. Em produção, define via env. Fallback só pra dev.
const SECRET =
  process.env.AUTH_SECRET ??
  'mrclrlq_dev_secret_change_me_in_production_or_set_AUTH_SECRET_env'

const SESSION_TTL_MS = 5 * 60 * 1000 // 5 minutos. Cliente faz heartbeat a cada ~60s.

interface TokenPayload {
  k: string  // key_id
  h: string  // hwid
  e: number  // expires_at (epoch ms) — quando o token deixa de ser válido
  i: number  // issued_at (epoch ms)
}

function b64urlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return Buffer.from(padded + pad, 'base64')
}

export function issueSessionToken(keyId: string, hwid: string): string {
  const now = Date.now()
  const payload: TokenPayload = {
    k: keyId,
    h: hwid,
    e: now + SESSION_TTL_MS,
    i: now,
  }
  const payloadB64 = b64urlEncode(JSON.stringify(payload))
  const sig = createHmac('sha256', SECRET).update(payloadB64).digest()
  const sigB64 = b64urlEncode(sig)
  return `${payloadB64}.${sigB64}`
}

export interface VerifiedToken {
  ok: true
  payload: TokenPayload
}
export interface InvalidToken {
  ok: false
  reason: 'malformed' | 'bad_signature' | 'expired'
}

export function verifySessionToken(token: string): VerifiedToken | InvalidToken {
  if (!token || typeof token !== 'string' || token.indexOf('.') < 0) {
    return { ok: false, reason: 'malformed' }
  }
  const [payloadB64, sigB64] = token.split('.')
  if (!payloadB64 || !sigB64) return { ok: false, reason: 'malformed' }

  let expectedSig: Buffer
  try {
    expectedSig = createHmac('sha256', SECRET).update(payloadB64).digest()
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  let providedSig: Buffer
  try {
    providedSig = b64urlDecode(sigB64)
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (
    expectedSig.length !== providedSig.length ||
    !timingSafeEqual(expectedSig, providedSig)
  ) {
    return { ok: false, reason: 'bad_signature' }
  }

  let payload: TokenPayload
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString('utf-8'))
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (typeof payload.e !== 'number' || payload.e < Date.now()) {
    return { ok: false, reason: 'expired' }
  }

  return { ok: true, payload }
}

// Helper: tempo restante até expirar a key (em segundos)
export function secondsUntil(isoDate: string): number {
  return Math.max(0, Math.floor((new Date(isoDate).getTime() - Date.now()) / 1000))
}
