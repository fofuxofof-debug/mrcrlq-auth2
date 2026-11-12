import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function normalizeGameKey(rawGame: string): string | null {
  const clean = rawGame.toLowerCase().replace(/[\s\-_]/g, '')
  if (clean.includes('fivem')) return 'fivem'
  if (clean.includes('valorant')) return 'valorant'
  if (clean.includes('freefire')) return 'freefire'
  return null
}

function getGameDisplayName(key: string): string {
  if (key === 'fivem') return 'FiveM'
  if (key === 'valorant') return 'Valorant'
  if (key === 'freefire') return 'Free Fire'
  return key
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const rawGame = formData.get('game') as string | null
    const uploadedBy = (formData.get('uploader') as string | null) || 'Hookedadmin'

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Nenhum arquivo enviado.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    if (!rawGame) {
      return NextResponse.json(
        { success: false, message: 'Jogo não informado (FiveM, Valorant ou Free Fire).' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const gameKey = normalizeGameKey(rawGame)
    if (!gameKey) {
      return NextResponse.json(
        { success: false, message: 'Jogo inválido. Use FiveM, Valorant ou Free Fire.' },
        { status: 400, headers: corsHeaders() }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Salva na pasta public/loaders
    const publicDir = path.join(process.cwd(), 'public', 'loaders')
    if (!fs.existsSync(publicDir)) {
      try {
        fs.mkdirSync(publicDir, { recursive: true })
      } catch {}
    }
    const publicPath = path.join(publicDir, `${gameKey}.exe`)
    try {
      fs.writeFileSync(publicPath, buffer)
    } catch {}

    // Fallback no /tmp para ambientes serverless
    const tmpDir = path.join(os.tmpdir(), 'hooked-auth-loaders')
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true })
      } catch {}
    }
    const tmpPath = path.join(tmpDir, `${gameKey}.exe`)
    try {
      fs.writeFileSync(tmpPath, buffer)
    } catch {}

    // Salva metadados em data/loaders.json
    const metaDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(metaDir)) {
      try {
        fs.mkdirSync(metaDir, { recursive: true })
      } catch {}
    }
    const metaPath = path.join(metaDir, 'loaders.json')
    let metadataMap: Record<string, any> = {}
    try {
      if (fs.existsSync(metaPath)) {
        metadataMap = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      }
    } catch {}

    const now = new Date()
    const uploadedAt = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    metadataMap[gameKey] = {
      game: getGameDisplayName(gameKey),
      filename: file.name || `${gameKey}.exe`,
      size: buffer.length,
      sizeFormatted: formatBytes(buffer.length),
      uploadedAt,
      uploadedBy,
    }

    try {
      fs.writeFileSync(metaPath, JSON.stringify(metadataMap, null, 2), 'utf-8')
    } catch {}

    return NextResponse.json(
      {
        success: true,
        message: `Loader de ${getGameDisplayName(gameKey)} enviado com sucesso!`,
        meta: metadataMap[gameKey],
      },
      { status: 200, headers: corsHeaders() }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Erro interno ao processar upload do loader: ' + (err?.message || '') },
      { status: 500, headers: corsHeaders() }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}
