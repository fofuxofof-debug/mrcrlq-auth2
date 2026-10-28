import fs from 'fs'
import path from 'path'
import {
  normalizeLicense,
  isLicenseExpired,
  getRemainingSeconds,
  formatRemainingTime,
  calculateExpiryDate,
  isLifetime,
} from '@/lib/duration'

export {
  normalizeLicense,
  isLicenseExpired,
  getRemainingSeconds,
  formatRemainingTime,
  calculateExpiryDate,
  isLifetime,
}

// Repositório compartilhado de Licenças entre o Painel Web e a API de Autenticação
export interface StoredLicense {
  key: string
  name: string
  discordId: string
  discordUsername?: string
  discordAvatar?: string
  game: string
  tempo: string
  plano?: string
  devices: string
  hwid?: string
  issued: string
  expiry: string
  status: 'Active' | 'Expired' | 'Suspended'
  owner: string
}

export interface SystemConfig {
  authEnabled: boolean
  maintenanceMessage: string
  updatedAt: string
  updatedBy: string
}

declare global {
  var __HOOKED_LICENSES__: StoredLicense[] | undefined
  var __HOOKED_SYSTEM_CONFIG__: SystemConfig | undefined
  var __HOOKED_KV_LOADED__: boolean | undefined
}

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  authEnabled: true,
  maintenanceMessage: 'Serviço de autenticação temporariamente pausado pelo administrador.',
  updatedAt: new Date().toISOString(),
  updatedBy: 'mrcrlq',
}

// Lista de IDs de teste antigos que nunca devem ser recriados ou aceitos
export const BLOCKED_TEST_KEYS = new Set([
  '849201948201948201',
  '739102948192019283',
  '918273645102938475',
  '629104820194820192',
  '550192837461928475',
  '449102938471928374',
])

// HWIDs mockados de testes antigos que devem ser descartados se encontrados
export const MOCK_HWIDS = new Set([
  'HWID-03B148AB-78B22918',
  'HWID-6534CAD7-AADC5B26',
])

export function isTestKey(keyOrId?: string): boolean {
  if (!keyOrId) return false
  const clean = keyOrId.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
  return BLOCKED_TEST_KEYS.has(clean)
}

export function isMockHwid(hwid?: string): boolean {
  if (!hwid) return false
  const clean = hwid.replace(/["'\r\n\t]/g, '').trim()
  return MOCK_HWIDS.has(clean)
}

// Licenças base permanentes (apenas clientes reais, livres de HWIDs falsos para auto-vínculo no primeiro login)
const BASE_LICENSES: StoredLicense[] = [
  {
    key: '1506778729425408112',
    name: 'Puto Xitadinho',
    discordId: '1506778729425408112',
    discordUsername: 'sheikdenovo',
    discordAvatar: 'https://cdn.discordapp.com/avatars/1506778729425408112/bc9b563933974575d99ebb71a3bc8b68.png?size=128',
    game: 'Valorant',
    plano: '30 Dias (Mensal)',
    tempo: '30 Dias',
    devices: '0 / 1 HWID',
    issued: 'Oct 28, 2026',
    expiry: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: 'Active',
    owner: 'mrcrlq',
    hwid: '',
  },
  {
    key: '1118361148417396786',
    name: 'Lcpkrl',
    discordId: '1118361148417396786',
    discordUsername: 'lcpkr',
    discordAvatar: 'https://cdn.discordapp.com/avatars/1118361148417396786/2706f9a41a9de2169392b570dbaff0bd.png?size=128',
    game: 'Valorant',
    plano: '30 Dias (Mensal)',
    tempo: '27 Dias',
    devices: '0 / 1 HWID',
    issued: 'Oct 25, 2026',
    expiry: new Date(Date.now() + 27 * 86400000).toISOString(),
    status: 'Active',
    owner: 'mrcrlq',
    hwid: '',
  },
  {
    key: '1517054236041416800',
    name: '22cao',
    discordId: '1517054236041416800',
    discordUsername: 'rlqdosrlq',
    discordAvatar: 'https://cdn.discordapp.com/avatars/1517054236041416800/c909baec1582401e3c2d8c9beca07c3e.png?size=128',
    game: 'Free Fire',
    plano: 'Vitalício (Lifetime)',
    tempo: 'Vitalício',
    devices: '1 / 1 HWID (Vinculado)',
    issued: 'Oct 28, 2026',
    expiry: 'Vitalício',
    status: 'Active',
    owner: 'mrcrlq',
    hwid: 'HWID-TEST-DEBUG-12345',
  },
  {
    key: '1312495175376834647',
    name: 'Samuca Xitadinho',
    discordId: '1312495175376834647',
    discordUsername: 'samucadev1',
    discordAvatar: 'https://cdn.discordapp.com/avatars/1312495175376834647/018563b39806dc930d34536951455cc1.png?size=128',
    game: 'Free Fire',
    plano: 'Vitalício (Lifetime)',
    tempo: 'Vitalício',
    devices: '0 / 1 HWID',
    issued: 'Oct 28, 2026',
    expiry: 'Vitalício',
    status: 'Active',
    owner: 'mrcrlq',
    hwid: '',
  },
  {
    key: '272360594999607296',
    name: '76j3',
    discordId: '272360594999607296',
    discordUsername: '76j3',
    discordAvatar: 'https://cdn.discordapp.com/avatars/272360594999607296/2943ab115df3e1c6a55ee8b3a17c3c9d.png?size=128',
    game: 'Free Fire',
    plano: '30 Dias (Mensal)',
    tempo: '27 Dias',
    devices: '0 / 1 HWID',
    issued: 'Oct 24, 2026',
    expiry: '2026-11-24T00:00:00.000Z',
    status: 'Active',
    owner: 'sheik',
    hwid: '',
  },
]

// Carregador inicial a partir do arquivo data/licenses.json
function loadInitialLicenses(): StoredLicense[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'licenses.json')
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((l) => !isTestKey(l.key) && !isTestKey(l.discordId))
          .map((l) => {
            const normalized = normalizeLicense(l)
            if (isMockHwid(normalized.hwid)) {
              return { ...normalized, hwid: '', devices: '0 / 1 HWID' }
            }
            return normalized
          })
      }
    }
  } catch {}
  return BASE_LICENSES.map(normalizeLicense)
}

// =========================================================================
// Suporte a Nuvem (Upstash Redis / Vercel KV) para persistência 100% permanente
// =========================================================================
export function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return { url, token, isConfigured: Boolean(url && token) }
}

export async function loadFromKv(): Promise<StoredLicense[] | null> {
  const { url, token, isConfigured } = getKvConfig()
  if (!isConfigured) return null

  try {
    const res = await fetch(`${url}/get/hooked_licenses_v1`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    let raw = data?.result
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch {}
    }
    if (Array.isArray(raw)) {
      return raw
        .filter((l) => !isTestKey(l.key) && !isTestKey(l.discordId))
        .map((l) => {
          const normalized = normalizeLicense(l)
          if (isMockHwid(normalized.hwid)) {
            return { ...normalized, hwid: '', devices: '0 / 1 HWID' }
          }
          return normalized
        })
    }
  } catch (err) {
    console.error('Falha ao ler licenças do KV:', err)
  }
  return null
}

export async function persistToKv(licenses: StoredLicense[]) {
  const { url, token, isConfigured } = getKvConfig()
  if (!isConfigured) return

  try {
    await fetch(`${url}/set/hooked_licenses_v1`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(licenses),
    })
  } catch (err) {
    console.error('Falha ao persistir licenças no KV:', err)
  }
}

// Salva em disco local se o sistema de arquivos permitir (ignora erro se read-only na Vercel)
function persistToLocalDisk(licenses: StoredLicense[]) {
  try {
    const dirPath = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
    const filePath = path.join(dirPath, 'licenses.json')
    fs.writeFileSync(filePath, JSON.stringify(licenses, null, 2), 'utf-8')
  } catch {}
}

export async function persistAllAsync(licenses: StoredLicense[]) {
  persistToLocalDisk(licenses)
  await persistToKv(licenses)
}

export function persistAll(licenses: StoredLicense[]) {
  persistToLocalDisk(licenses)
  persistToKv(licenses).catch(() => {})
}

// Inicialização da lista na memória global (limpa qualquer chave teste ou HWID falso)
if (!globalThis.__HOOKED_LICENSES__) {
  globalThis.__HOOKED_LICENSES__ = loadInitialLicenses()
} else {
  globalThis.__HOOKED_LICENSES__ = globalThis.__HOOKED_LICENSES__
    .filter((l) => !isTestKey(l.key) && !isTestKey(l.discordId))
    .map((l) => {
      if (isMockHwid(l.hwid)) {
        return { ...l, hwid: '', devices: '0 / 1 HWID' }
      }
      return l
    })
}

export function getAllLicenses(): StoredLicense[] {
  const list = globalThis.__HOOKED_LICENSES__ || BASE_LICENSES
  return list
    .filter((l) => !isTestKey(l.key) && !isTestKey(l.discordId))
    .map((l) => {
      const normalized = normalizeLicense(l)
      if (isMockHwid(normalized.hwid)) {
        return { ...normalized, hwid: '', devices: '0 / 1 HWID' }
      }
      return normalized
    })
}

export function findLicense(keyOrDiscordId: string): StoredLicense | undefined {
  if (!keyOrDiscordId || isTestKey(keyOrDiscordId)) return undefined
  const clean = keyOrDiscordId.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  const found = getAllLicenses().find((l) => {
    const lKey = (l.key || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    const lDiscord = (l.discordId || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    return lKey === clean || lDiscord === clean
  })
  return found ? normalizeLicense(found) : undefined
}

// Busca segura assíncrona: se um container novo acabou de iniciar e não tem a key na memória, busca no KV da nuvem
export async function findLicenseAsync(keyOrDiscordId: string): Promise<StoredLicense | undefined> {
  const local = findLicense(keyOrDiscordId)
  if (local) return local

  const kvLicenses = await loadFromKv()
  if (kvLicenses && kvLicenses.length > 0) {
    syncLicenses(kvLicenses)
    return findLicense(keyOrDiscordId)
  }
  return undefined
}

export function addLicense(lic: StoredLicense): StoredLicense {
  if (isTestKey(lic.key) || isTestKey(lic.discordId)) {
    return lic
  }
  if (!globalThis.__HOOKED_LICENSES__) {
    globalThis.__HOOKED_LICENSES__ = loadInitialLicenses()
  }
  const normalized = normalizeLicense(lic)
  const cleanKey = (normalized.key || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  const cleanDiscord = (normalized.discordId || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  const idx = globalThis.__HOOKED_LICENSES__.findIndex((l) => {
    const lKey = (l.key || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    const lDiscord = (l.discordId || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    return lKey === cleanKey || lDiscord === cleanDiscord || lKey === cleanDiscord || lDiscord === cleanKey
  })
  if (idx !== -1) {
    globalThis.__HOOKED_LICENSES__[idx] = normalizeLicense({ ...globalThis.__HOOKED_LICENSES__[idx], ...normalized })
  } else {
    globalThis.__HOOKED_LICENSES__.unshift(normalized)
  }
  persistAll(globalThis.__HOOKED_LICENSES__)
  return normalized
}

export async function addLicenseAsync(lic: StoredLicense): Promise<StoredLicense> {
  const saved = addLicense(lic)
  if (globalThis.__HOOKED_LICENSES__) {
    await persistAllAsync(globalThis.__HOOKED_LICENSES__)
  }
  return saved
}

export function updateLicenseStatus(key: string, updates: Partial<StoredLicense>): StoredLicense | null {
  if (!globalThis.__HOOKED_LICENSES__) {
    globalThis.__HOOKED_LICENSES__ = loadInitialLicenses()
  }
  const clean = key.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  const idx = globalThis.__HOOKED_LICENSES__.findIndex((l) => {
    const lKey = (l.key || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    const lDiscord = (l.discordId || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    return lKey === clean || lDiscord === clean
  })
  if (idx === -1) return null
  const merged = normalizeLicense({ ...globalThis.__HOOKED_LICENSES__[idx], ...updates })
  globalThis.__HOOKED_LICENSES__[idx] = merged
  persistAll(globalThis.__HOOKED_LICENSES__)
  return globalThis.__HOOKED_LICENSES__[idx]
}

export async function updateLicenseStatusAsync(key: string, updates: Partial<StoredLicense>): Promise<StoredLicense | null> {
  let updated = updateLicenseStatus(key, updates)
  if (!updated) {
    const kvLicenses = await loadFromKv()
    if (kvLicenses && kvLicenses.length > 0) {
      syncLicenses(kvLicenses)
      updated = updateLicenseStatus(key, updates)
    }
  }

  if (updated && globalThis.__HOOKED_LICENSES__) {
    await persistAllAsync(globalThis.__HOOKED_LICENSES__)
  }
  return updated
}

export function deleteLicense(key: string): boolean {
  if (!globalThis.__HOOKED_LICENSES__) return false
  const initialLen = globalThis.__HOOKED_LICENSES__.length
  globalThis.__HOOKED_LICENSES__ = globalThis.__HOOKED_LICENSES__.filter(
    (l) => l.key.toLowerCase() !== key.toLowerCase()
  )
  const changed = globalThis.__HOOKED_LICENSES__.length < initialLen
  if (changed) {
    persistAll(globalThis.__HOOKED_LICENSES__)
  }
  return changed
}

export async function deleteLicenseAsync(key: string): Promise<boolean> {
  const ok = deleteLicense(key)
  if (ok && globalThis.__HOOKED_LICENSES__) {
    await persistAllAsync(globalThis.__HOOKED_LICENSES__)
  }
  return ok
}

// Sincronização inteligente (Auto-Healing):
// Mescla licenças vindas do cliente ou backup respeitando pedidos de Reset de HWID
export function syncLicenses(incoming: StoredLicense[]): StoredLicense[] {
  if (!globalThis.__HOOKED_LICENSES__) {
    globalThis.__HOOKED_LICENSES__ = loadInitialLicenses()
  }

  // Purga chaves testes de qualquer sincronização
  const sanitizedIncoming = incoming
    .filter((item) => !isTestKey(item.key) && !isTestKey(item.discordId))
    .map((item) => {
      const normalized = normalizeLicense(item)
      if (isMockHwid(normalized.hwid)) {
        return { ...normalized, hwid: '', devices: '0 / 1 HWID' }
      }
      return normalized
    })

  const current = [...globalThis.__HOOKED_LICENSES__]
    .filter((item) => !isTestKey(item.key) && !isTestKey(item.discordId))
    .map((item) => {
      const normalized = normalizeLicense(item)
      if (isMockHwid(normalized.hwid)) {
        return { ...normalized, hwid: '', devices: '0 / 1 HWID' }
      }
      return normalized
    })

  for (const item of sanitizedIncoming) {
    if (!item.key && !item.discordId) continue
    const targetKey = (item.key || item.discordId).toLowerCase()
    const idx = current.findIndex((c) => c.key.toLowerCase() === targetKey || c.discordId.toLowerCase() === targetKey)

    const isExplicitReset =
      item.devices?.includes('Resetado') ||
      (item as unknown as { hwidReset?: boolean }).hwidReset === true

    if (idx !== -1) {
      let targetHwid = current[idx].hwid || ''
      let targetDevices = current[idx].devices || '0 / 1 HWID'

      if (isExplicitReset) {
        // Reset manual solicitado explicitamente pelo admin
        targetHwid = ''
        targetDevices = '0 / 1 HWID (Resetado)'
      } else {
        // Se já está vinculado na memória/KV, NUNCA perde o HWID!
        if (item.hwid && item.hwid.trim() !== '' && !isMockHwid(item.hwid)) {
          targetHwid = item.hwid
          targetDevices = '1 / 1 HWID (Vinculado)'
        } else if (current[idx].hwid && current[idx].hwid.trim() !== '' && !isMockHwid(current[idx].hwid)) {
          targetHwid = current[idx].hwid
          targetDevices = '1 / 1 HWID (Vinculado)'
        } else {
          targetHwid = ''
          targetDevices = item.devices || '0 / 1 HWID'
        }
      }

      current[idx] = normalizeLicense({
        ...current[idx],
        ...item,
        hwid: targetHwid,
        devices: targetDevices,
      })
    } else {
      // Nova licença
      const isBound = item.hwid && item.hwid.trim() !== '' && !isMockHwid(item.hwid)
      current.unshift(
        normalizeLicense({
          ...item,
          hwid: isBound ? item.hwid : '',
          devices: isBound ? '1 / 1 HWID (Vinculado)' : (item.devices || '0 / 1 HWID'),
        })
      )
    }
  }

  globalThis.__HOOKED_LICENSES__ = current
  persistAll(current)
  return current
}

export function getSystemConfig(): SystemConfig {
  if (!globalThis.__HOOKED_SYSTEM_CONFIG__) {
    globalThis.__HOOKED_SYSTEM_CONFIG__ = { ...DEFAULT_SYSTEM_CONFIG }
  }
  return globalThis.__HOOKED_SYSTEM_CONFIG__
}

export function updateSystemConfig(updates: Partial<SystemConfig>): SystemConfig {
  if (!globalThis.__HOOKED_SYSTEM_CONFIG__) {
    globalThis.__HOOKED_SYSTEM_CONFIG__ = { ...DEFAULT_SYSTEM_CONFIG }
  }
  globalThis.__HOOKED_SYSTEM_CONFIG__ = {
    ...globalThis.__HOOKED_SYSTEM_CONFIG__,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  return globalThis.__HOOKED_SYSTEM_CONFIG__
}
