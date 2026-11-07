import fs from 'fs'
import path from 'path'

export interface AuthLogEntry {
  id: string
  timestamp: string
  time: string
  date: string
  actor: string
  key?: string
  game: string
  client: string
  ip: string
  location: string
  countryCode?: string
  status: 'SUCCESS' | 'FAILED' | 'WARN' | 'BANNED'
  statusCode: number
  reason: string
}

declare global {
  var __HOOKED_LOGS__: AuthLogEntry[] | undefined
}

const geoCache = new Map<string, string>()

// Extrai IP real a partir dos headers da requisição
export function extractClientIp(request: Request): string {
  const headers = request.headers
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim()
    if (firstIp) return firstIp
  }
  const xRealIp = headers.get('x-real-ip')
  if (xRealIp) return xRealIp.trim()

  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  return '127.0.0.1'
}

// Resolve localização (cidade / país) via cabeçalhos Vercel ou IP-API
export async function resolveLocation(ip: string, request?: Request): Promise<string> {
  const cleanIp = (ip || '').replace(/["'\r\n\t]/g, '').trim()

  if (
    !cleanIp ||
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('172.16.')
  ) {
    return 'Localhost / Rede Local'
  }

  // 1. Tentar ler cabeçalhos nativos de Geo da Vercel (disponíveis em produção)
  if (request) {
    const vercelCity = request.headers.get('x-vercel-ip-city')
    const vercelCountry = request.headers.get('x-vercel-ip-country')
    const vercelRegion = request.headers.get('x-vercel-ip-country-region')

    if (vercelCity || vercelCountry) {
      try {
        const cityDecoded = vercelCity ? decodeURIComponent(vercelCity) : ''
        const parts = [cityDecoded, vercelRegion, vercelCountry].filter(Boolean)
        if (parts.length > 0) {
          return parts.join(', ')
        }
      } catch {}
    }
  }

  // 2. Cache em memória para evitar consultas repetidas
  if (geoCache.has(cleanIp)) {
    return geoCache.get(cleanIp)!
  }

  // 3. Consulta externa via ip-api com timeout rápido de 1.5s
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 1500)
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,city,regionName,country,countryCode`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      if (data && data.status === 'success') {
        const parts = [data.city, data.regionName, data.countryCode || data.country].filter(Boolean)
        const loc = parts.join(', ') || data.country || 'Desconhecido'
        geoCache.set(cleanIp, loc)
        return loc
      }
    }
  } catch {}

  const fallback = 'Internet / Global'
  geoCache.set(cleanIp, fallback)
  return fallback
}

function getLogFilePath(): string {
  return path.join(process.cwd(), 'data', 'auth_logs.json')
}

function loadInitialLogs(): AuthLogEntry[] {
  try {
    const filePath = getLogFilePath()
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch {}
  return []
}

function saveLogsToDisk(logs: AuthLogEntry[]) {
  try {
    const dirPath = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    fs.writeFileSync(getLogFilePath(), JSON.stringify(logs.slice(0, 300), null, 2), 'utf-8')
  } catch {}
}

export function getAuthLogs(): AuthLogEntry[] {
  if (!global.__HOOKED_LOGS__) {
    global.__HOOKED_LOGS__ = loadInitialLogs()
  }
  return global.__HOOKED_LOGS__
}

export async function addAuthLog(
  data: Omit<AuthLogEntry, 'id' | 'timestamp' | 'time' | 'date'> & {
    id?: string
    timestamp?: string
    time?: string
    date?: string
  }
): Promise<AuthLogEntry> {
  const now = new Date()
  const entry: AuthLogEntry = {
    id: data.id || 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp: data.timestamp || now.toISOString(),
    time:
      data.time ||
      now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: data.date || now.toLocaleDateString('pt-BR'),
    actor: data.actor || 'Anônimo',
    key: data.key || undefined,
    game: data.game || 'Geral',
    client: data.client || 'App / Cliente',
    ip: data.ip || '127.0.0.1',
    location: data.location || 'Localhost / Rede Local',
    countryCode: data.countryCode,
    status: data.status,
    statusCode: data.statusCode,
    reason: data.reason,
  }

  const logs = getAuthLogs()
  logs.unshift(entry)
  if (logs.length > 500) {
    logs.length = 500
  }

  saveLogsToDisk(logs)
  return entry
}

export function clearAuthLogs(): void {
  global.__HOOKED_LOGS__ = []
  saveLogsToDisk([])
}
