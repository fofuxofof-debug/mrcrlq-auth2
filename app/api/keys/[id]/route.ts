import { NextResponse, type NextRequest } from 'next/server'
import { keysDb, hwidsDb, logsDb } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const key = await keysDb.findById(id)
  if (!key) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const [hwids, logs] = await Promise.all([
    hwidsDb.listByKey(id),
    logsDb.listByKey(id, 20),
  ])

  return NextResponse.json({
    data: {
      key,
      hwids,
      logs,
    },
  })
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  const cur = await keysDb.findById(id)
  if (!cur) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const patch: Record<string, unknown> = {}
  if (typeof body.label === 'string')        patch.label = body.label
  if (typeof body.discord_id === 'string')   patch.discord_id = body.discord_id
  if (typeof body.notes === 'string')        patch.notes = body.notes
  if (typeof body.max_devices === 'number')  patch.max_devices = body.max_devices
  if (typeof body.expires_at === 'string')   patch.expires_at = body.expires_at
  if (body.status === 'active' || body.status === 'banned' || body.status === 'expired' || body.status === 'paused')
    patch.status = body.status

  if (typeof body.expires_in_days === 'number') {
    patch.expires_at = new Date(Date.now() + body.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
  }

  const updated = await keysDb.update(id, patch)

  if (patch.status === 'banned') {
    await logsDb.create({ key_id: id, event_type: 'key_banned', details: { key: cur.key } })
  } else if (cur.status === 'banned' && patch.status === 'active') {
    await logsDb.create({ key_id: id, event_type: 'key_reactivated', details: { key: cur.key } })
  }

  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const cur = await keysDb.findById(id)
  if (!cur) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  await keysDb.remove(id)
  await logsDb.create({ event_type: 'key_deleted', details: { key: cur.key } })
  return NextResponse.json({ success: true })
}
