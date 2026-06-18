import { NextResponse, type NextRequest } from 'next/server'
import { fetchDiscordUser } from '@/lib/discord'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await fetchDiscordUser(id)
  if (!user) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, data: user })
}
