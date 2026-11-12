import fs from 'fs'
import path from 'path'
import os from 'os'
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

export interface BannedItem {
  id: string // Discord ID ou Key
  key?: string
  discordId?: string
  discordUsername?: string
  discordGlobalName?: string
  discordAvatar?: string
  reason: string
  bannedAt: string
  bannedBy: string
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
  var __HOOKED_BANNED__: BannedItem[] | undefined
  var __HOOKED_DELETED_KEYS__: Set<string> | undefined
}

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  authEnabled: true,
  maintenanceMessage: 'Serviço de autenticação temporariamente pausado pelo administrador.',
  updatedAt: new Date().toISOString(),
  updatedBy: 'Hookedadmin',
}

// Chaves de exemplo/teste antigas que NUNCA devem ser exibidas
export const OLD_EXAMPLE_IDS = new Set([
  '849201948201948201',
  '739102948192019283',
  '918273645102938475',
  '629104820194820192',
  '550192837461928475',
  '449102938471928374',
])

// Lista de chaves banidas permanentemente
export const BLOCKED_TEST_KEYS = new Set([
  '1443975682320502845', // Cliente mts banido
  '933811331457482752',  // Cliente mts banido
])

export const INITIAL_BANNED_ITEMS: BannedItem[] = [
  {
    id: '1443975682320502845',
    key: '1443975682320502845',
    discordId: '1443975682320502845',
    reason: 'Key banida permanentemente',
    bannedAt: '07/11/2026',
    bannedBy: 'Hookedadmin',
  },
  {
    id: '933811331457482752',
    key: '933811331457482752',
    discordId: '933811331457482752',
    reason: 'Key banida permanentemente',
    bannedAt: '07/11/2026',
    bannedBy: 'Hookedadmin',
  },
]

// HWIDs mockados de testes antigos que devem ser descartados se encontrados
export const MOCK_HWIDS = new Set([
  'HWID-03B148AB-78B22918',
  'HWID-6534CAD7-AADC5B26',
])

export function isMockHwid(hwid?: string): boolean {
  if (!hwid) return false
  const clean = hwid.replace(/["'\r\n\t]/g, '').trim()
  return MOCK_HWIDS.has(clean)
}

// Licenças base permanentes (apenas clientes reais, sem contas de teste)
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
    owner: 'Hookedadmin',
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
    owner: 'Hookedadmin',
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
    devices: '0 / 1 HWID',
    issued: 'Oct 28, 2026',
    expiry: 'Vitalício',
    status: 'Active',
    owner: 'Hookedadmin',
    hwid: '',
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
    owner: 'Hookedadmin',
    hwid: '',
  },
  {
    key: '272360594999607296',
    name: '76j3',
    discordId: '272360594999607296',
    discordUsername: '76j3',
    discordAvatar: 'https://cdn.discordapp.com/avatars/272360594999607296/2943ab115df3e1c6a55ee8b3a17c3c9d.png?size=128',
    game: 'Valorant',
    plano: '30 Dias (Mensal)',
    tempo: '27 Dias',
    devices: '0 / 1 HWID',
    issued: 'Oct 24, 2026',
    expiry: '2026-11-24T00:00:00.000Z',
    status: 'Active',
    owner: 'Hookedadmin',
    hwid: '',
  },
]

// =========================================================================
// Gerenciamento de Persistência Híbrida (Disco Local, /tmp e Vercel KV)
// =========================================================================
function safeWriteFile(filename: string, content: string) {
  try {
    const dir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, filename), content, 'utf-8')
  } catch {}

  // Fallback em /tmp para ambientes serverless da Vercel
  try {
    const tmpDir = path.join(os.tmpdir(), 'hooked-auth-data')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(path.join(tmpDir, filename), content, 'utf-8')
  } catch {}
}

function safeReadFile(filename: string): string | null {
  try {
    const p = path.join(process.cwd(), 'data', filename)
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf-8')
  } catch {}

  try {
    const tmpP = path.join(os.tmpdir(), 'hooked-auth-data', filename)
    if (fs.existsSync(tmpP)) return fs.readFileSync(tmpP, 'utf-8')
  } catch {}

  return null
}

// Configuração do KV Upstash / Vercel KV
export function getKvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return { url, token, isConfigured: Boolean(url && token) }
}

// =========================================================================
// Chaves Deletadas Permanentemente (Impede ressuscitação)
// =========================================================================
function loadDeletedKeys(): Set<string> {
  if (globalThis.__HOOKED_DELETED_KEYS__) {
    return globalThis.__HOOKED_DELETED_KEYS__
  }
  const set = new Set<string>()
  const raw = safeReadFile('deleted_keys.json')
  if (raw) {
    try {
      const arr = JSON.parse(raw)
      if (Array.isArray(arr)) {
        arr.forEach((k) => set.add(String(k).trim().toLowerCase()))
      }
    } catch {}
  }
  globalThis.__HOOKED_DELETED_KEYS__ = set
  return set
}

function markKeyAsDeleted(key: string) {
  const clean = key.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  if (!clean) return
  const set = loadDeletedKeys()
  set.add(clean)
  safeWriteFile('deleted_keys.json', JSON.stringify(Array.from(set), null, 2))

  const { url, token, isConfigured } = getKvConfig()
  if (isConfigured) {
    fetch(`${url}/set/hooked_deleted_keys_v1`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(Array.from(set)),
    }).catch(() => {})
  }
}

export function isDeletedKey(keyOrId?: string): boolean {
  if (!keyOrId) return false
  const clean = keyOrId.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  return loadDeletedKeys().has(clean)
}

// =========================================================================
// Gerenciamento de Blacklist & Keys Banidas
// =========================================================================
function loadInitialBanned(): BannedItem[] {
  const raw = safeReadFile('banned.json')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter((b) => !OLD_EXAMPLE_IDS.has(b.id))
      }
    } catch {}
  }
  return [...INITIAL_BANNED_ITEMS]
}

export function getBannedKeys(): BannedItem[] {
  if (!globalThis.__HOOKED_BANNED__) {
    globalThis.__HOOKED_BANNED__ = loadInitialBanned()
  }
  return globalThis.__HOOKED_BANNED__.filter((b) => !OLD_EXAMPLE_IDS.has(b.id))
}

export async function loadBannedFromKv(): Promise<BannedItem[] | null> {
  const { url, token, isConfigured } = getKvConfig()
  if (!isConfigured) return null
  try {
    const res = await fetch(`${url}/get/hooked_banned_v2`, {
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
    if (Array.isArray(raw)) return raw.filter((b: BannedItem) => !OLD_EXAMPLE_IDS.has(b.id))
  } catch {}
  return null
}

export async function persistBannedAsync(banned: BannedItem[]) {
  globalThis.__HOOKED_BANNED__ = banned
  safeWriteFile('banned.json', JSON.stringify(banned, null, 2))

  // Sincroniza conjunto BLOCKED_TEST_KEYS
  banned.forEach((b) => {
    if (b.id) BLOCKED_TEST_KEYS.add(b.id.trim())
    if (b.key) BLOCKED_TEST_KEYS.add(b.key.trim())
    if (b.discordId) BLOCKED_TEST_KEYS.add(b.discordId.trim())
  })

  const { url, token, isConfigured } = getKvConfig()
  if (isConfigured) {
    try {
      await fetch(`${url}/set/hooked_banned_v2`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(banned),
      })
    } catch {}
  }
}

export async function banKeyAsync(
  id: string,
  reason: string = 'Banido pelo Administrador',
  actor: string = 'Hookedadmin',
  discordData?: { username?: string; globalName?: string; avatarUrl?: string }
): Promise<BannedItem> {
  const cleanId = id.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim()
  const list = getBannedKeys()
  const existingIdx = list.findIndex(
    (b) => b.id.toLowerCase() === cleanId.toLowerCase() || b.key?.toLowerCase() === cleanId.toLowerCase()
  )

  const item: BannedItem = {
    id: cleanId,
    key: cleanId,
    discordId: /^\d{16,21}$/.test(cleanId) ? cleanId : undefined,
    discordUsername: discordData?.username,
    discordGlobalName: discordData?.globalName,
    discordAvatar: discordData?.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
    reason,
    bannedAt: new Date().toLocaleDateString('pt-BR'),
    bannedBy: actor,
  }

  let updatedList: BannedItem[]
  if (existingIdx !== -1) {
    updatedList = [...list]
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...item }
  } else {
    updatedList = [item, ...list]
  }

  BLOCKED_TEST_KEYS.add(cleanId)
  await persistBannedAsync(updatedList)

  // Atualiza também na lista de licenças marcando como Suspended se existir
  if (globalThis.__HOOKED_LICENSES__) {
    const lIdx = globalThis.__HOOKED_LICENSES__.findIndex((l) => {
      const lKey = (l.key || '').toLowerCase().trim()
      const lDisc = (l.discordId || '').toLowerCase().trim()
      const c = cleanId.toLowerCase()
      return lKey === c || lDisc === c
    })
    if (lIdx !== -1) {
      globalThis.__HOOKED_LICENSES__[lIdx].status = 'Suspended'
      await persistAllAsync(globalThis.__HOOKED_LICENSES__)
    }
  }

  return item
}

export async function unbanKeyAsync(id: string): Promise<boolean> {
  const cleanId = id.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  const list = getBannedKeys()
  const filtered = list.filter(
    (b) =>
      b.id.toLowerCase() !== cleanId &&
      (b.key?.toLowerCase() || '') !== cleanId &&
      (b.discordId?.toLowerCase() || '') !== cleanId
  )

  BLOCKED_TEST_KEYS.delete(cleanId)
  await persistBannedAsync(filtered)

  // Reativa na lista de licenças se existir
  if (globalThis.__HOOKED_LICENSES__) {
    const lIdx = globalThis.__HOOKED_LICENSES__.findIndex((l) => {
      const lKey = (l.key || '').toLowerCase().trim()
      const lDisc = (l.discordId || '').toLowerCase().trim()
      return lKey === cleanId || lDisc === cleanId
    })
    if (lIdx !== -1) {
      globalThis.__HOOKED_LICENSES__[lIdx].status = 'Active'
      await persistAllAsync(globalThis.__HOOKED_LICENSES__)
    }
  }

  return true
}

export function isTestKey(keyOrId?: string): boolean {
  if (!keyOrId) return false
  const clean = keyOrId.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  if (BLOCKED_TEST_KEYS.has(clean)) return true
  const banned = getBannedKeys()
  return banned.some(
    (b) =>
      b.id.toLowerCase() === clean ||
      (b.key && b.key.toLowerCase() === clean) ||
      (b.discordId && b.discordId.toLowerCase() === clean)
  )
}

// =========================================================================
// Inicializador de Licenças
// =========================================================================
function loadInitialLicenses(): StoredLicense[] {
  const deleted = loadDeletedKeys()
  const raw = safeReadFile('licenses.json')
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((l) => {
            const cleanKey = (l.key || '').trim().toLowerCase()
            const cleanDiscord = (l.discordId || '').trim().toLowerCase()
            return !isTestKey(cleanKey) && !isTestKey(cleanDiscord) && !deleted.has(cleanKey) && !deleted.has(cleanDiscord)
          })
          .map((l) => {
            const normalized = normalizeLicense(l)
            if (isMockHwid(normalized.hwid)) {
              return { ...normalized, hwid: '', devices: '0 / 1 HWID' }
            }
            return normalized
          })
      }
    } catch {}
  }

  return BASE_LICENSES.filter((l) => {
    const cleanKey = (l.key || '').trim().toLowerCase()
    const cleanDiscord = (l.discordId || '').trim().toLowerCase()
    return !isTestKey(cleanKey) && !isTestKey(cleanDiscord) && !deleted.has(cleanKey) && !deleted.has(cleanDiscord)
  }).map(normalizeLicense)
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
      const deleted = loadDeletedKeys()
      return raw
        .filter((l) => {
          const cleanKey = (l.key || '').trim().toLowerCase()
          const cleanDiscord = (l.discordId || '').trim().toLowerCase()
          return !isTestKey(cleanKey) && !isTestKey(cleanDiscord) && !deleted.has(cleanKey) && !deleted.has(cleanDiscord)
        })
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

export async function persistAllAsync(licenses: StoredLicense[]) {
  safeWriteFile('licenses.json', JSON.stringify(licenses, null, 2))
  await persistToKv(licenses)
}

export function persistAll(licenses: StoredLicense[]) {
  safeWriteFile('licenses.json', JSON.stringify(licenses, null, 2))
  persistToKv(licenses).catch(() => {})
}

// Inicialização da lista na memória global
if (!globalThis.__HOOKED_LICENSES__) {
  globalThis.__HOOKED_LICENSES__ = loadInitialLicenses()
}

export function getAllLicenses(): StoredLicense[] {
  const deleted = loadDeletedKeys()
  const list = globalThis.__HOOKED_LICENSES__ || BASE_LICENSES
  return list
    .filter((l) => {
      const cleanKey = (l.key || '').trim().toLowerCase()
      const cleanDiscord = (l.discordId || '').trim().toLowerCase()
      return !isTestKey(cleanKey) && !isTestKey(cleanDiscord) && !deleted.has(cleanKey) && !deleted.has(cleanDiscord)
    })
    .map((l) => {
      const normalized = normalizeLicense(l)
      if (isMockHwid(normalized.hwid)) {
        return { ...normalized, hwid: '', devices: '0 / 1 HWID' }
      }
      return normalized
    })
}

export function findLicense(keyOrDiscordId: string): StoredLicense | undefined {
  if (!keyOrDiscordId || isTestKey(keyOrDiscordId) || isDeletedKey(keyOrDiscordId)) return undefined
  const clean = keyOrDiscordId.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  const found = getAllLicenses().find((l) => {
    const lKey = (l.key || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    const lDiscord = (l.discordId || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    return lKey === clean || lDiscord === clean
  })
  return found ? normalizeLicense(found) : undefined
}

export async function findLicenseAsync(keyOrDiscordId: string): Promise<StoredLicense | undefined> {
  const kvLicenses = await loadFromKv()
  if (kvLicenses && kvLicenses.length > 0) {
    syncLicenses(kvLicenses)
  }
  return findLicense(keyOrDiscordId)
}

export function addLicense(lic: StoredLicense): StoredLicense {
  if (isTestKey(lic.key) || isTestKey(lic.discordId)) {
    return lic
  }
  if (!globalThis.__HOOKED_LICENSES__) {
    globalThis.__HOOKED_LICENSES__ = loadInitialLicenses()
  }

  // Remove dos deletados se estiver sendo recriada propositalmente
  const cleanKey = (lic.key || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  const cleanDiscord = (lic.discordId || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  const deleted = loadDeletedKeys()
  deleted.delete(cleanKey)
  deleted.delete(cleanDiscord)
  safeWriteFile('deleted_keys.json', JSON.stringify(Array.from(deleted), null, 2))

  const normalized = normalizeLicense(lic)
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

  // Processa explicitamente reset de HWID se informado
  const isHwidReset =
    updates.hwid === '' ||
    updates.devices?.includes('Resetado') ||
    (updates as unknown as { hwidReset?: boolean }).hwidReset === true

  const merged = normalizeLicense({
    ...globalThis.__HOOKED_LICENSES__[idx],
    ...updates,
    hwid: isHwidReset ? '' : (updates.hwid !== undefined ? updates.hwid : globalThis.__HOOKED_LICENSES__[idx].hwid),
    devices: isHwidReset ? '0 / 1 HWID (Resetado)' : (updates.devices || globalThis.__HOOKED_LICENSES__[idx].devices),
  })

  globalThis.__HOOKED_LICENSES__[idx] = merged
  persistAll(globalThis.__HOOKED_LICENSES__)
  return globalThis.__HOOKED_LICENSES__[idx]
}

export async function updateLicenseStatusAsync(key: string, updates: Partial<StoredLicense>): Promise<StoredLicense | null> {
  const updated = updateLicenseStatus(key, updates)
  if (updated && globalThis.__HOOKED_LICENSES__) {
    await persistAllAsync(globalThis.__HOOKED_LICENSES__)
  }
  return updated
}

export function deleteLicense(key: string): boolean {
  if (!key) return false
  if (!globalThis.__HOOKED_LICENSES__) {
    globalThis.__HOOKED_LICENSES__ = loadInitialLicenses()
  }

  const clean = key.replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
  markKeyAsDeleted(clean)

  const initialLen = globalThis.__HOOKED_LICENSES__.length
  globalThis.__HOOKED_LICENSES__ = globalThis.__HOOKED_LICENSES__.filter((l) => {
    const lKey = (l.key || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    const lDiscord = (l.discordId || '').replace(/^#\s*/, '').replace(/["'\r\n\t]/g, '').trim().toLowerCase()
    if (lKey === clean || lDiscord === clean) {
      if (lKey) markKeyAsDeleted(lKey)
      if (lDiscord) markKeyAsDeleted(lDiscord)
      return false
    }
    return true
  })

  const changed = globalThis.__HOOKED_LICENSES__.length < initialLen
  persistAll(globalThis.__HOOKED_LICENSES__)
  return changed || true
}

export async function deleteLicenseAsync(key: string): Promise<boolean> {
  const ok = deleteLicense(key)
  if (globalThis.__HOOKED_LICENSES__) {
    await persistAllAsync(globalThis.__HOOKED_LICENSES__)
  }
  return ok
}

// Sincronização inteligente (Auto-Healing)
export function syncLicenses(incoming: StoredLicense[]): StoredLicense[] {
  if (!globalThis.__HOOKED_LICENSES__) {
    globalThis.__HOOKED_LICENSES__ = loadInitialLicenses()
  }

  const deleted = loadDeletedKeys()

  // Purga chaves testes e chaves deletadas
  const sanitizedIncoming = incoming
    .filter((item) => {
      const k = (item.key || '').trim().toLowerCase()
      const d = (item.discordId || '').trim().toLowerCase()
      return !isTestKey(k) && !isTestKey(d) && !deleted.has(k) && !deleted.has(d)
    })
    .map((item) => {
      const normalized = normalizeLicense(item)
      if (isMockHwid(normalized.hwid)) {
        return { ...normalized, hwid: '', devices: '0 / 1 HWID' }
      }
      return normalized
    })

  const current = [...globalThis.__HOOKED_LICENSES__]
    .filter((item) => {
      const k = (item.key || '').trim().toLowerCase()
      const d = (item.discordId || '').trim().toLowerCase()
      return !isTestKey(k) && !isTestKey(d) && !deleted.has(k) && !deleted.has(d)
    })
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
      item.hwid === '' ||
      item.devices?.includes('Resetado') ||
      (item as unknown as { hwidReset?: boolean }).hwidReset === true

    if (idx !== -1) {
      let targetHwid = current[idx].hwid || ''
      let targetDevices = current[idx].devices || '0 / 1 HWID'

      if (isExplicitReset) {
        targetHwid = ''
        targetDevices = '0 / 1 HWID (Resetado)'
      } else {
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
