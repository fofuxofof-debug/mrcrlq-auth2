// =============================================================================
// DB com fallback automático:
//   - Se KV_REST_API_URL estiver definido (Vercel KV ou Upstash Redis) → usa KV
//   - Senão → usa memória local (HMR-safe via globalThis)
// API agora é async (todas as funções retornam Promise).
// =============================================================================

import { randomUUID } from 'crypto'
import type { LicenseKey, HWID, AuthLog } from './types'

const useKv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

// Lazy import do @vercel/kv (só carrega quando precisa)
type KvClient = typeof import('@vercel/kv').kv
let _kv: KvClient | null = null
async function kv(): Promise<KvClient> {
  if (_kv) return _kv
  const m = await import('@vercel/kv')
  _kv = m.kv
  return _kv
}

// ---------- Memória local (dev sem KV) ----------
interface MemDB {
  keys: Map<string, LicenseKey>
  hwids: Map<string, HWID>
  logs: AuthLog[]
  seeded: boolean
}
const globalAny = globalThis as unknown as { __havocMem?: MemDB }
const mem: MemDB =
  globalAny.__havocMem ?? { keys: new Map(), hwids: new Map(), logs: [], seeded: false }
if (process.env.NODE_ENV !== 'production') globalAny.__havocMem = mem

// =============================================================================
// Keys
// =============================================================================
export const keysDb = {
  async list(): Promise<LicenseKey[]> {
    if (useKv) {
      const c = await kv()
      const all = (await c.hgetall<Record<string, LicenseKey>>('keys')) ?? {}
      return Object.values(all).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
    return Array.from(mem.keys.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  async findById(id: string): Promise<LicenseKey | undefined> {
    if (useKv) {
      const c = await kv()
      const v = await c.hget<LicenseKey>('keys', id)
      return v ?? undefined
    }
    return mem.keys.get(id)
  },

  async findByKey(keyValue: string): Promise<LicenseKey | undefined> {
    // Em volume baixo é OK varrer; pra escalar, criar índice secundário
    const all = await keysDb.list()
    return all.find((k) => k.key === keyValue)
  },

  async create(
    input: Partial<LicenseKey> & { key: string; expires_at: string }
  ): Promise<LicenseKey> {
    const now = new Date().toISOString()
    const item: LicenseKey = {
      id: randomUUID(),
      key: input.key,
      label: input.label ?? null,
      status: input.status ?? 'active',
      max_devices: input.max_devices ?? 1,
      expires_at: input.expires_at,
      discord_id: input.discord_id ?? null,
      notes: input.notes ?? null,
      created_at: now,
      updated_at: now,
      created_by: input.created_by ?? null,
    }
    if (useKv) {
      const c = await kv()
      await c.hset('keys', { [item.id]: item })
    } else {
      mem.keys.set(item.id, item)
    }
    return item
  },

  async update(id: string, patch: Partial<LicenseKey>): Promise<LicenseKey | undefined> {
    const cur = await keysDb.findById(id)
    if (!cur) return undefined
    const next: LicenseKey = {
      ...cur,
      ...patch,
      id: cur.id,
      updated_at: new Date().toISOString(),
    }
    if (useKv) {
      const c = await kv()
      await c.hset('keys', { [id]: next })
    } else {
      mem.keys.set(id, next)
    }
    return next
  },

  async remove(id: string): Promise<boolean> {
    // Cascade: remove hwids vinculados
    const hs = await hwidsDb.listByKey(id)
    if (hs.length) {
      if (useKv) {
        const c = await kv()
        await c.hdel('hwids', ...hs.map((h) => h.id))
      } else {
        for (const h of hs) mem.hwids.delete(h.id)
      }
    }
    if (useKv) {
      const c = await kv()
      const removed = await c.hdel('keys', id)
      return !!removed
    }
    return mem.keys.delete(id)
  },
}

// =============================================================================
// HWIDs
// =============================================================================
export const hwidsDb = {
  async listByKey(keyId: string): Promise<HWID[]> {
    if (useKv) {
      const c = await kv()
      const all = (await c.hgetall<Record<string, HWID>>('hwids')) ?? {}
      return Object.values(all)
        .filter((h) => h.key_id === keyId)
        .sort(
          (a, b) =>
            new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
        )
    }
    return Array.from(mem.hwids.values())
      .filter((h) => h.key_id === keyId)
      .sort(
        (a, b) =>
          new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime()
      )
  },

  async count(): Promise<number> {
    if (useKv) {
      const c = await kv()
      return (await c.hlen('hwids')) ?? 0
    }
    return mem.hwids.size
  },

  async findByKeyAndHwid(keyId: string, hwid: string): Promise<HWID | undefined> {
    const list = await hwidsDb.listByKey(keyId)
    return list.find((h) => h.hwid === hwid)
  },

  async create(input: { key_id: string; hwid: string; ip_address?: string | null }): Promise<HWID> {
    const item: HWID = {
      id: randomUUID(),
      key_id: input.key_id,
      hwid: input.hwid,
      device_label: null,
      ip_address: input.ip_address ?? null,
      registered_at: new Date().toISOString(),
    }
    if (useKv) {
      const c = await kv()
      await c.hset('hwids', { [item.id]: item })
    } else {
      mem.hwids.set(item.id, item)
    }
    return item
  },

  async remove(id: string): Promise<boolean> {
    if (useKv) {
      const c = await kv()
      const removed = await c.hdel('hwids', id)
      return !!removed
    }
    return mem.hwids.delete(id)
  },

  async removeAllByKey(keyId: string): Promise<number> {
    const list = await hwidsDb.listByKey(keyId)
    if (!list.length) return 0
    if (useKv) {
      const c = await kv()
      await c.hdel('hwids', ...list.map((h) => h.id))
      return list.length
    }
    let n = 0
    for (const h of list) if (mem.hwids.delete(h.id)) n++
    return n
  },
}

// =============================================================================
// Logs
// =============================================================================
export const logsDb = {
  async list(limit = 100): Promise<AuthLog[]> {
    if (useKv) {
      const c = await kv()
      const items = await c.lrange<AuthLog>('logs', 0, limit - 1)
      return items
    }
    return [...mem.logs]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, limit)
  },

  async listByKey(keyId: string, limit = 50): Promise<AuthLog[]> {
    const all = await logsDb.list(5000)
    return all.filter((l) => l.key_id === keyId).slice(0, limit)
  },

  async create(input: {
    key_id?: string | null
    event_type: string
    ip_address?: string | null
    hwid?: string | null
    details?: Record<string, unknown>
  }): Promise<AuthLog> {
    const item: AuthLog = {
      id: randomUUID(),
      key_id: input.key_id ?? null,
      event_type: input.event_type,
      ip_address: input.ip_address ?? null,
      hwid: input.hwid ?? null,
      details: input.details ?? {},
      created_at: new Date().toISOString(),
    }
    if (useKv) {
      const c = await kv()
      await c.lpush('logs', item)
      await c.ltrim('logs', 0, 4999)
    } else {
      mem.logs.unshift(item)
      if (mem.logs.length > 5000) mem.logs.length = 5000
    }
    return item
  },
}

// =============================================================================
// Stats
// =============================================================================
export async function buildStats() {
  const keys = await keysDb.list()
  const now = new Date()
  const recent = (await logsDb.list(100)).filter((l) => l.event_type === 'auth_success').length
  return {
    total_keys: keys.length,
    active_keys: keys.filter(
      (k) => k.status === 'active' && new Date(k.expires_at) > now
    ).length,
    expired_keys: keys.filter(
      (k) => k.status === 'expired' || (k.status === 'active' && new Date(k.expires_at) <= now)
    ).length,
    banned_keys: keys.filter((k) => k.status === 'banned').length,
    total_hwids: await hwidsDb.count(),
    recent_auths: recent,
  }
}

// =============================================================================
// Util
// =============================================================================
export function generateKey(prefix = 'SYNC'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const seg = () =>
    Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${prefix}-${seg()}-${seg()}-${seg()}-${seg()}`
}

// =============================================================================
// Seed inicial (só pra dev local sem KV — em produção, key inicial é manual)
// =============================================================================
async function seedIfNeeded() {
  if (useKv) return
  if (mem.seeded) return
  if (mem.keys.size > 0) {
    mem.seeded = true
    return
  }
  try {
    const demoKey = await keysDb.create({
      key: generateKey(),
      label: 'Demo Key',
      max_devices: 3,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    await logsDb.create({
      key_id: demoKey.id,
      event_type: 'key_created',
      details: { key: demoKey.key, label: demoKey.label, demo: true },
    })
    mem.seeded = true
  } catch {
    // ignora
  }
}
seedIfNeeded()
