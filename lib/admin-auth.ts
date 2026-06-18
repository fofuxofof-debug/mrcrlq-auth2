// =============================================================================
// Auth do PAINEL admin (não confundir com auth da API pra C++).
// Centraliza credenciais e valor do cookie de sessão.
// Lê tudo de env vars — NUNCA hardcode nada aqui.
// Compatível com runtime Node e Edge (middleware) — não usa node:crypto.
// =============================================================================

function readEnv(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : undefined
}

const ADMIN_USERNAME = readEnv('ADMIN_USERNAME')
const ADMIN_PASSWORD = readEnv('ADMIN_PASSWORD')
const AUTH_SECRET = readEnv('AUTH_SECRET') ?? 'dev_secret_unsafe_change_me'

export const SESSION_COOKIE_NAME = 'panel_session'

// O valor do cookie é derivado do AUTH_SECRET. Como o AUTH_SECRET é segredo
// (env var, fora do git), o valor do cookie também é. Quem só tem o source
// não consegue forjar uma sessão.
export const SESSION_COOKIE_VALUE = `panel:${AUTH_SECRET.slice(0, 48)}`

// Retorna true se o painel tem credenciais configuradas. Se faltar env var,
// nenhum login é aceito (fail-closed por segurança).
export function isPanelConfigured(): boolean {
  return !!(ADMIN_USERNAME && ADMIN_PASSWORD)
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  if (!isPanelConfigured()) return false
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD
}

export function isAuthenticated(cookieValue: string | undefined | null): boolean {
  if (!cookieValue) return false
  return cookieValue === SESSION_COOKIE_VALUE
}
