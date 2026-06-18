import { NextResponse, type NextRequest } from 'next/server'
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_VALUE,
  USER_COOKIE_NAME,
  isPanelConfigured,
  isAuthenticated,
  verifyAdminCredentials,
} from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ONE_WEEK = 60 * 60 * 24 * 7

// POST /api/auth/session  → login
export async function POST(request: NextRequest) {
  if (!isPanelConfigured()) {
    return NextResponse.json(
      { success: false, error: 'panel_not_configured', message: 'Painel sem credenciais configuradas. Defina ADMIN_USERNAME/ADMIN_PASSWORD ou ADMIN_USERS nas env vars.' },
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

  const isProd = process.env.NODE_ENV === 'production'
  const response = NextResponse.json({ success: true })

  // Cookie de sessão (httpOnly — o JS do browser não lê)
  response.cookies.set(SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_WEEK,
  })

  // Cookie só com o nome do usuário, pra mostrar no header do painel.
  // Não é httpOnly: precisa estar disponível pro layout server-side ler também.
  response.cookies.set(USER_COOKIE_NAME, username, {
    httpOnly: true, // não precisa ser lido por JS, só por server components
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: ONE_WEEK,
  })

  return response
}

// DELETE /api/auth/session  → logout
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  for (const name of [SESSION_COOKIE_NAME, USER_COOKIE_NAME]) {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  }
  return response
}

// GET /api/auth/session  → status
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const user = request.cookies.get(USER_COOKIE_NAME)?.value ?? null
  return NextResponse.json({
    authenticated: isAuthenticated(cookie),
    user: isAuthenticated(cookie) ? user : null,
  })
}
