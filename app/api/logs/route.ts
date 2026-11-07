import { NextResponse } from 'next/server'
import {
  getAuthLogs,
  addAuthLog,
  clearAuthLogs,
  extractClientIp,
  resolveLocation,
} from '@/lib/logs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function GET() {
  const logs = getAuthLogs()
  return NextResponse.json(
    {
      success: true,
      count: logs.length,
      logs,
    },
    { headers: corsHeaders() }
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const ip = body.ip || extractClientIp(request)
    const location = body.location || (await resolveLocation(ip, request))

    const newLog = await addAuthLog({
      actor: body.actor || 'Anônimo',
      key: body.key,
      game: body.game || 'Painel Web',
      client: body.client || 'Web Dashboard',
      ip,
      location,
      status: body.status || 'INFO',
      statusCode: Number(body.statusCode) || 200,
      reason: body.reason || 'Operação registrada',
    })

    return NextResponse.json(
      { success: true, log: newLog },
      { status: 201, headers: corsHeaders() }
    )
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Erro ao gravar log.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function DELETE() {
  clearAuthLogs()
  return NextResponse.json(
    { success: true, message: 'Logs limpos com sucesso.' },
    { headers: corsHeaders() }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  })
}
