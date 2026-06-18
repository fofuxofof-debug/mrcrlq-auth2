import { NextResponse } from 'next/server'
import { buildStats } from '@/lib/db'

export async function GET() {
  return NextResponse.json({ data: await buildStats() })
}
