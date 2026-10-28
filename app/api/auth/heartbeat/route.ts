import { NextResponse, type NextRequest } from 'next/server'
import {
  findLicenseAsync,
  updateLicenseStatusAsync,
  getSystemConfig,
  isLicenseExpired,
  getRemainingSeconds,
} from '@/lib/licenses'
import { verifySessionToken, issueSessionToken } from '@/lib/session-token'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function POST(request: NextRequest) {
  try {
    const system = getSystemConfig()
    if (!system.authEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: 'auth_paused',
          message: system.maintenanceMessage || 'Serviço de autenticação temporariamente pausado pelo administrador.',
        },
        { status: 503, headers: corsHeaders() }
      )
    }

    let body: { session_token?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400, headers: corsHeaders() })
    }

    const { session_token } = body
    if (!session_token) {
      return NextResponse.json(
        { success: false, error: 'missing_token' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const verified = verifySessionToken(session_token)
    if (!verified.ok) {
      return NextResponse.json(
        { success: false, error: `token_${verified.reason}` },
        { status: 401, headers: corsHeaders() }
      )
    }

    const { k: keyId, h: hwid } = verified.payload
    const found = await findLicenseAsync(keyId)
    if (!found) {
      return NextResponse.json(
        { success: false, error: 'invalid_key' },
        { status: 401, headers: corsHeaders() }
      )
    }

    if (found.status === 'Suspended') {
      return NextResponse.json(
        { success: false, error: 'key_banned' },
        { status: 403, headers: corsHeaders() }
      )
    }

    if (found.status === 'Expired' || isLicenseExpired(found.expiry)) {
      if (found.status !== 'Expired') {
        found.status = 'Expired'
        await updateLicenseStatusAsync(found.key, { status: 'Expired', tempo: 'Expirada' })
      }
      return NextResponse.json(
        { success: false, error: 'key_expired', message: 'A sua chave de licença expirou.' },
        { status: 403, headers: corsHeaders() }
      )
    }

    // Valida se o HWID ainda bate
    const storedHwid = (found.hwid || '').trim().toLowerCase()
    if (storedHwid && storedHwid !== hwid.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'hwid_mismatch' },
        { status: 403, headers: corsHeaders() }
      )
    }

    // Rotaciona o session token
    const newSessionToken = issueSessionToken(found.key, hwid)

    return NextResponse.json(
      {
        success: true,
        data: {
          valid: true,
          expires_at: found.expiry,
          session_token: newSessionToken,
        },
      },
      { headers: corsHeaders() }
    )
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json(
      { success: false, error: 'internal_error' },
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
