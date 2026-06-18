import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = 'panel_session'
const VALID_TOKEN = 'mrcrlq:authorized'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get(SESSION_COOKIE)?.value
  const isAuthed = session === VALID_TOKEN

  // Protege /dashboard
  if (pathname.startsWith('/dashboard') && !isAuthed) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Já logado tentando ir pra /login → vai pro dashboard
  if (pathname === '/login' && isAuthed) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Root: deixa a landing page publica
  if (pathname === '/') {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
