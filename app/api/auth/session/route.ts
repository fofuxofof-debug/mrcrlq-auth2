import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'panel_session'
const VALID_TOKEN = 'mrcrlq:authorized'

// Credenciais locais (fixas)
const ADMIN_USERNAME = 'mrcrlq'
const ADMIN_PASSWORD = '1964f'

// POST /api/auth/session  → login
export async function POST(request: NextRequest) {
  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_body' }, { status: 400 })
  }

  const username = body.username?.trim() ?? ''
  const password = body.password ?? ''

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json(
      { success: false, error: 'invalid_credentials', message: 'Usuário ou senha incorretos.' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, VALID_TOKEN, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  })
  return response
}

// DELETE /api/auth/session  → logout
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}

// GET /api/auth/session  → status
export async function GET(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value
  return NextResponse.json({ authenticated: session === VALID_TOKEN })
}
