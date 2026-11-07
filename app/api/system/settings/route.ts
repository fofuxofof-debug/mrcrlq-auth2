import { NextResponse } from 'next/server'
import { getSystemConfig, updateSystemConfig } from '@/lib/licenses'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

export async function GET() {
  try {
    const config = getSystemConfig()
    return NextResponse.json(config, {
      status: 200,
      headers: corsHeaders(),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro ao carregar configurações do sistema.' },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { authEnabled, maintenanceMessage, updatedBy } = body

    const updates: Record<string, any> = {}
    if (typeof authEnabled === 'boolean') updates.authEnabled = authEnabled
    if (typeof maintenanceMessage === 'string') updates.maintenanceMessage = maintenanceMessage
    if (typeof updatedBy === 'string') updates.updatedBy = updatedBy

    const updated = updateSystemConfig(updates)

    return NextResponse.json(
      {
        success: true,
        message: updated.authEnabled
          ? 'Serviço de autenticação ativado com sucesso.'
          : 'Serviço de autenticação pausado com sucesso.',
        config: updated,
      },
      { status: 200, headers: corsHeaders() }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar configurações.' },
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
