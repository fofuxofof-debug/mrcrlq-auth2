import { NextResponse } from 'next/server'
import { syncLicenses, getAllLicenses, persistAllAsync, StoredLicense } from '@/lib/licenses'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const incoming: StoredLicense[] = Array.isArray(body?.licenses)
      ? body.licenses
      : Array.isArray(body)
      ? body
      : []

    if (incoming.length === 0) {
      return NextResponse.json(
        { success: true, count: getAllLicenses().length, licenses: getAllLicenses() },
        { status: 200, headers: corsHeaders() }
      )
    }

    const merged = syncLicenses(incoming)
    await persistAllAsync(merged)

    return NextResponse.json(
      {
        success: true,
        message: `${incoming.length} licenças sincronizadas e persistidas com sucesso.`,
        count: merged.length,
        licenses: merged,
      },
      { status: 200, headers: corsHeaders() }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro ao sincronizar licenças.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { success: true, count: getAllLicenses().length, licenses: getAllLicenses() },
    { status: 200, headers: corsHeaders() }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
