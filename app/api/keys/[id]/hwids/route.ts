import { NextResponse, type NextRequest } from 'next/server'
import { keysDb, hwidsDb, logsDb } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

// DELETE /api/keys/[id]/hwids → remove todos os HWIDs vinculados à key
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const key = await keysDb.findById(id)
  if (!key) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const removed = await hwidsDb.removeAllByKey(id)
  await logsDb.create({
    key_id: id,
    event_type: 'hwid_reset',
    details: { key: key.key, hwids_removed: removed },
  })
  return NextResponse.json({ success: true, removed })
}
