import { NextResponse, type NextRequest } from 'next/server'
import {
  findLicenseAsync,
  updateLicenseStatusAsync,
  getSystemConfig,
  isLicenseExpired,
  getRemainingSeconds,
} from '@/lib/licenses'
import { verifySessionToken, issueSessionToken, secondsUntil } from '@/lib/session-token'
import { addAuthLog, extractClientIp, resolveLocation } from '@/lib/logs'

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
  const clientIp = extractClientIp(request)

  try {
    const system = getSystemConfig()
    if (!system.authEnabled) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
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
      return NextResponse.json(
        { success: false, valid: false, error: 'invalid_body' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const { session_token } = body
    if (!session_token) {
      return NextResponse.json(
        { success: false, valid: false, error: 'missing_token' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const verified = verifySessionToken(session_token)
    if (!verified.ok) {
      return NextResponse.json(
        { success: false, valid: false, error: `token_${verified.reason}` },
        { status: 401, headers: corsHeaders() }
      )
    }

    const { k: keyId, h: hwid } = verified.payload
    const found = await findLicenseAsync(keyId)

    if (!found) {
      return NextResponse.json(
        { success: false, valid: false, error: 'invalid_key' },
        { status: 401, headers: corsHeaders() }
      )
    }

    const location = await resolveLocation(clientIp, request)

    // Se o administrador baniu a chave enquanto o cliente estava jogando
    if (found.status === 'Suspended') {
      await addAuthLog({
        actor: found.name,
        key: found.key,
        game: found.game,
        client: 'Heartbeat / Executável',
        ip: clientIp,
        location,
        status: 'BANNED',
        statusCode: 403,
        reason: 'Sessão revogada: Licença banida pelo administrador (aplicativo encerrado)',
      })

      return NextResponse.json(
        { success: false, valid: false, error: 'key_banned', message: 'Licença banida.' },
        { status: 403, headers: corsHeaders() }
      )
    }

    // Se a chave expirou ou atingiu o tempo limite
    const expSeconds = secondsUntil(found.expiry)
    const isExpired = found.status === 'Expired' || isLicenseExpired(found.expiry) || (expSeconds <= 0 && found.expiry !== 'Vitalício')

    if (isExpired) {
      if (found.status !== 'Expired') {
        found.status = 'Expired'
        await updateLicenseStatusAsync(found.key, { status: 'Expired', tempo: 'Expirada' })
      }

      await addAuthLog({
        actor: found.name,
        key: found.key,
        game: found.game,
        client: 'Heartbeat / Executável',
        ip: clientIp,
        location,
        status: 'FAILED',
        statusCode: 403,
        reason: 'Sessão encerrada: O tempo da chave acabou (aplicativo encerrado automaticamente)',
      })

      // Retornar valid: false faz o HookedAuth.hpp / main.cpp chamar ExitProcess(0) e fechar o aplicativo na hora
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'key_expired',
          message: 'A sua chave de licença expirou.',
          expires_in_seconds: 0,
        },
        { status: 403, headers: corsHeaders() }
      )
    }

    // Valida se o HWID ainda confere
    const storedHwid = (found.hwid || '').trim().toLowerCase()
    if (storedHwid && storedHwid !== hwid.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, valid: false, error: 'hwid_mismatch' },
        { status: 403, headers: corsHeaders() }
      )
    }

    // Rotaciona o session token
    const newSessionToken = issueSessionToken(found.key, hwid)

    return NextResponse.json(
      {
        success: true,
        valid: true,
        expires_in_seconds: expSeconds,
        session_token: newSessionToken,
        data: {
          valid: true,
          expires_at: found.expiry,
          expires_in_seconds: expSeconds,
          session_token: newSessionToken,
        },
      },
      { headers: corsHeaders() }
    )
  } catch (error) {
    console.error('Heartbeat error:', error)
    return NextResponse.json(
      { success: false, valid: false, error: 'internal_error' },
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
