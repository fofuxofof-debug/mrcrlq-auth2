import { NextResponse } from 'next/server'
import { fetchDiscordUser } from '@/lib/discord'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Parâmetro id do Discord não informado.' },
      { status: 400, headers: corsHeaders() }
    )
  }

  const user = await fetchDiscordUser(id)
  if (!user) {
    return NextResponse.json(
      { success: false, message: 'Usuário não encontrado no Discord.' },
      { status: 404, headers: corsHeaders() }
    )
  }

  return NextResponse.json({ success: true, user }, { headers: corsHeaders() })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = body.id || body.discordId

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, message: 'ID do Discord inválido ou não informado.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const user = await fetchDiscordUser(id)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado no Discord.' },
        { status: 404, headers: corsHeaders() }
      )
    }

    return NextResponse.json({ success: true, user }, { headers: corsHeaders() })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erro ao processar requisição.' },
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
