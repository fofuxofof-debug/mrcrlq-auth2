import { NextResponse, type NextRequest } from 'next/server'
import { hwidsDb } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params
  const ok = await hwidsDb.remove(id)
  if (!ok) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json({ success: true })
}
