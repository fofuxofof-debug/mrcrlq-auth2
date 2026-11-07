import { NextResponse } from 'next/server'
import {
  getAllLicenses,
  addLicenseAsync,
  updateLicenseStatusAsync,
  deleteLicenseAsync,
  loadFromKv,
  syncLicenses,
  getKvConfig,
  StoredLicense,
} from '@/lib/licenses'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function GET() {
  const kvLicenses = await loadFromKv()
  if (kvLicenses && kvLicenses.length > 0) {
    syncLicenses(kvLicenses)
  }
  const licenses = getAllLicenses()
  return NextResponse.json(
    { success: true, kvConfigured: getKvConfig().isConfigured, count: licenses.length, licenses },
    { headers: corsHeaders() }
  )
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StoredLicense
    if (!body.discordId || !body.key) {
      return NextResponse.json(
        { success: false, message: 'Dados da licença incompletos.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const saved = await addLicenseAsync(body)
    return NextResponse.json({ success: true, license: saved }, { status: 201, headers: corsHeaders() })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erro ao salvar licença.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { key, ...updates } = body
    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Chave não informada.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const updated = await updateLicenseStatusAsync(key, updates)
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Licença não encontrada.' },
        { status: 404, headers: corsHeaders() }
      )
    }

    return NextResponse.json({ success: true, license: updated }, { headers: corsHeaders() })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar licença.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (!key) {
      return NextResponse.json(
        { success: false, message: 'Chave não informada.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const ok = await deleteLicenseAsync(key)
    return NextResponse.json({ success: ok }, { headers: corsHeaders() })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erro ao deletar licença.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
