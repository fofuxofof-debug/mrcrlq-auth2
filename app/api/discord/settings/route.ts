import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getBotToken, setRuntimeBotToken, verifyBotToken } from '@/lib/discord'

const SESSION_COOKIE = 'panel_session'
const VALID_TOKEN = 'mrcrlq:authorized'

async function requireAdmin() {
  const c = await cookies()
  return c.get(SESSION_COOKIE)?.value === VALID_TOKEN
}

// Mascarar token pra exibir na UI (não expõe valor real)
function mask(t: string | null): { has: boolean; preview: string | null; source: 'env' | 'runtime' | 'none' } {
  const env = process.env.DISCORD_BOT_TOKEN
  if (!t) return { has: false, preview: null, source: 'none' }
  // se o token atual é diferente do env, é runtime
  const source: 'env' | 'runtime' = env && env.trim() === t ? 'env' : 'runtime'
  if (t.length < 12) return { has: true, preview: '****', source }
  return { has: true, preview: `${t.slice(0, 6)}...${t.slice(-4)}`, source }
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  const t = getBotToken()
  return NextResponse.json({ ok: true, ...mask(t) })
}

// PUT: salvar/atualizar token em runtime (sobrescreve o env var na sessão)
export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  let body: { token?: string }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 }) }

  const tk = (body.token ?? '').trim()
  if (!tk) {
    setRuntimeBotToken(null)
    return NextResponse.json({ ok: true, cleared: true })
  }

  // valida antes de salvar
  const v = await verifyBotToken(tk)
  if (!v.ok) {
    return NextResponse.json({ ok: false, error: v.error || 'invalid_token' }, { status: 400 })
  }
  setRuntimeBotToken(tk)
  return NextResponse.json({ ok: true, bot: v.bot })
}

// POST: testar token sem salvar
export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  let body: { token?: string }
  try { body = await request.json() } catch { return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 }) }

  const tk = (body.token ?? '').trim() || (getBotToken() ?? '')
  if (!tk) return NextResponse.json({ ok: false, error: 'empty_token' }, { status: 400 })
  const v = await verifyBotToken(tk)
  if (!v.ok) return NextResponse.json({ ok: false, error: v.error || 'invalid_token' })
  return NextResponse.json({ ok: true, bot: v.bot })
}
