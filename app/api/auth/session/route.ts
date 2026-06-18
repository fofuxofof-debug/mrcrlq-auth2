import { NextResponse, type NextRequest } from 'next/server'
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_VALUE,
  isPanelConfigured,
  isAuthenticated,
  verifyAdminCredentials,
} from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/auth/session  → login
export async function POST(request: NextRequest) {
  if (!isPanelConfigured()) {
    return NextResponse.json(
      { success: false, error: 'panel_not_configured', message: 'Painel sem credenciais configuradas. Defina ADMIN_USERNAME e ADMIN_PASSWORD nas env vars.' },
      { status: 500 }
    )
  }

  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400 })
  }

  const username = body.username?.trim() ?? ''
  const password = body.password ?? ''

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json(
      { success: false, error: 'invalid_credentials', message: 'Usuário ou senha incorretos.' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  })
  return response
}

// DELETE /api/auth/session  → logout
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}

// GET /api/auth/session  → status
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  return NextResponse.json({ authenticated: isAuthenticated(cookie) })
}
