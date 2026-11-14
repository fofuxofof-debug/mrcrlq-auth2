import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { findLicenseAsync, isTestKey, isLicenseExpired, getSystemConfig } from '@/lib/licenses'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

interface SavedConfig {
  id: string
  name: string
  key: string
  game: string
  data: Record<string, any> | string
  updatedAt: string
  isActive?: boolean
}

const CONFIGS_FILE = path.join(process.cwd(), 'data', 'configs.json')

function readConfigs(): Record<string, SavedConfig[]> {
  try {
    if (!fs.existsSync(CONFIGS_FILE)) return {}
    return JSON.parse(fs.readFileSync(CONFIGS_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function writeConfigs(data: Record<string, SavedConfig[]>) {
  try {
    const dir = path.dirname(CONFIGS_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CONFIGS_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch {}
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = (searchParams.get('key') || searchParams.get('id') || searchParams.get('hwid') || '').trim()
  const configName = (searchParams.get('name') || '').trim()
  const action = (searchParams.get('action') || 'load').toLowerCase()

  if (!key) {
    return NextResponse.json({ success: false, error: 'missing_key' }, { status: 400, headers: corsHeaders() })
  }

  const allConfigs = readConfigs()
  const userConfigs = allConfigs[key] || []

  if (action === 'list') {
    return NextResponse.json(
      {
        success: true,
        configs: userConfigs.map((c) => ({
          id: c.id,
          name: c.name,
          game: c.game,
          updatedAt: c.updatedAt,
          isActive: !!c.isActive,
        })),
      },
      { headers: corsHeaders() }
    )
  }

  // Action: load
  let target = userConfigs.find((c) => c.isActive)
  if (configName) {
    target = userConfigs.find((c) => c.name.toLowerCase() === configName.toLowerCase()) || target
  }
  if (!target && userConfigs.length > 0) {
    target = userConfigs[0]
  }

  if (!target) {
    return NextResponse.json(
      {
        success: false,
        error: 'not_found',
        message: 'Nenhuma configuracao encontrada para esta chave.',
      },
      { status: 404, headers: corsHeaders() }
    )
  }

  return NextResponse.json(
    {
      success: true,
      name: target.name,
      game: target.game,
      config: typeof target.data === 'string' ? target.data : JSON.stringify(target.data),
      updatedAt: target.updatedAt,
    },
    { headers: corsHeaders() }
  )
}

export async function POST(request: Request) {
  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'invalid_json' }, { status: 400, headers: corsHeaders() })
  }

  const key = (body.key || body.hwid || body.licenseKey || '').trim()
  const action = (body.action || 'load').toLowerCase()
  const configName = (body.name || body.config_name || 'default').trim()
  const game = (body.game || 'Universal').trim()
  const payloadData = body.config !== undefined ? body.config : body.data

  if (!key) {
    return NextResponse.json({ success: false, error: 'missing_key' }, { status: 400, headers: corsHeaders() })
  }

  const allConfigs = readConfigs()
  let userConfigs = allConfigs[key] || []

  if (action === 'save') {
    if (payloadData === undefined) {
      return NextResponse.json({ success: false, error: 'missing_data' }, { status: 400, headers: corsHeaders() })
    }

    const now = new Date().toISOString()
    const existingIndex = userConfigs.findIndex((c) => c.name.toLowerCase() === configName.toLowerCase())

    const configItem: SavedConfig = {
      id: existingIndex >= 0 ? userConfigs[existingIndex].id : `cfg_${Date.now()}`,
      name: configName,
      key,
      game,
      data: payloadData,
      updatedAt: now,
      isActive: true,
    }

    // Marca como ativa e desativa as outras
    userConfigs = userConfigs.map((c) => ({ ...c, isActive: false }))

    if (existingIndex >= 0) {
      userConfigs[existingIndex] = configItem
    } else {
      userConfigs.push(configItem)
    }

    allConfigs[key] = userConfigs
    writeConfigs(allConfigs)

    return NextResponse.json(
      {
        success: true,
        message: `Configuracao '${configName}' salva e definida como ativa.`,
        config: configItem,
      },
      { headers: corsHeaders() }
    )
  }

  if (action === 'select' || action === 'activate') {
    const found = userConfigs.find((c) => c.name.toLowerCase() === configName.toLowerCase())
    if (!found) {
      return NextResponse.json({ success: false, error: 'not_found' }, { status: 404, headers: corsHeaders() })
    }

    allConfigs[key] = userConfigs.map((c) => ({
      ...c,
      isActive: c.name.toLowerCase() === configName.toLowerCase(),
    }))
    writeConfigs(allConfigs)

    return NextResponse.json(
      {
        success: true,
        message: `Configuracao '${found.name}' ativada.`,
        config: found.data,
      },
      { headers: corsHeaders() }
    )
  }

  if (action === 'delete') {
    allConfigs[key] = userConfigs.filter((c) => c.name.toLowerCase() !== configName.toLowerCase())
    writeConfigs(allConfigs)
    return NextResponse.json({ success: true, message: 'Configuracao removida.' }, { headers: corsHeaders() })
  }

  if (action === 'list') {
    return NextResponse.json({ success: true, configs: userConfigs }, { headers: corsHeaders() })
  }

  // Fallback: action load
  let target = userConfigs.find((c) => c.isActive)
  if (configName && configName !== 'default') {
    target = userConfigs.find((c) => c.name.toLowerCase() === configName.toLowerCase()) || target
  }
  if (!target && userConfigs.length > 0) {
    target = userConfigs[0]
  }

  if (!target) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 404, headers: corsHeaders() })
  }

  return NextResponse.json(
    {
      success: true,
      name: target.name,
      game: target.game,
      config: typeof target.data === 'string' ? target.data : JSON.stringify(target.data),
    },
    { headers: corsHeaders() }
  )
}
