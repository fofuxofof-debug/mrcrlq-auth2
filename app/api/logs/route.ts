import { NextResponse, type NextRequest } from 'next/server'
import { logsDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit')) || 100
  return NextResponse.json({ data: await logsDb.list(limit) })
}
