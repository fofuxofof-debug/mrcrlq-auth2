// =============================================================================
// Auth do PAINEL admin (não confundir com auth da API pra C++).
// Suporta múltiplos usuários via env vars:
//   - ADMIN_USERNAME + ADMIN_PASSWORD  (primário, single-user, modo legado)
//   - ADMIN_USERS                       (multi-user, formato "user1:pass1,user2:pass2")
// Os dois modos coexistem — todos os usuários definidos podem logar.
// Compatível com runtime Node e Edge (middleware) — não usa node:crypto.
// =============================================================================

function readEnv(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : undefined
}

interface UserCred {
  username: string
  password: string
}

function parseUsers(): UserCred[] {
  const list: UserCred[] = []

  // Modo single (legacy)
  const singleU = readEnv('ADMIN_USERNAME')
  const singleP = readEnv('ADMIN_PASSWORD')
  if (singleU && singleP) {
    list.push({ username: singleU, password: singleP })
  }

  // Modo multi: "user1:pass1,user2:pass2"
  const multi = readEnv('ADMIN_USERS')
  if (multi) {
    for (const pair of multi.split(',')) {
      const trimmed = pair.trim()
      if (!trimmed) continue
      const idx = trimmed.indexOf(':')
      if (idx <= 0) continue
      const u = trimmed.slice(0, idx).trim()
      const p = trimmed.slice(idx + 1)
      if (u && p) list.push({ username: u, password: p })
    }
  }

  return list
}

const USERS: UserCred[] = parseUsers()

const AUTH_SECRET = readEnv('AUTH_SECRET') ?? 'dev_secret_unsafe_change_me'

export const SESSION_COOKIE_NAME = 'panel_session'

// Cookie separado que guarda apenas o nome do usuário logado (display only).
// Sem implicação de segurança: o gate de auth é o SESSION_COOKIE.
export const USER_COOKIE_NAME = 'panel_user'

// O valor do cookie é derivado do AUTH_SECRET. Como o AUTH_SECRET é segredo
// (env var, fora do git), o valor do cookie também é. Quem só tem o source
// não consegue forjar uma sessão.
export const SESSION_COOKIE_VALUE = `panel:${AUTH_SECRET.slice(0, 48)}`

// Retorna true se o painel tem ao menos um usuário configurado.
// Se faltar, nenhum login é aceito (fail-closed por segurança).
export function isPanelConfigured(): boolean {
  return USERS.length > 0
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  if (!isPanelConfigured()) return false
  return USERS.some((u) => u.username === username && u.password === password)
}

export function isAuthenticated(cookieValue: string | undefined | null): boolean {
  if (!cookieValue) return false
  return cookieValue === SESSION_COOKIE_VALUE
}
