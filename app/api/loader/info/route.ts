import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

interface LoaderMeta {
  game: string
  filename: string
  size: number
  sizeFormatted: string
  uploadedAt: string
  uploadedBy: string
  exists: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function findLoaderFile(gameKey: string): { filePath: string; size: number; mtime: Date } | null {
  const candidates = [
    path.join(process.cwd(), 'public', 'loaders', `${gameKey}.exe`),
    path.join(process.cwd(), 'data', 'loaders', `${gameKey}.exe`),
    path.join(process.cwd(), 'mrcrlq-auth2-main', 'public', 'loaders', `${gameKey}.exe`),
    path.join(os.tmpdir(), 'hooked-auth-loaders', `${gameKey}.exe`),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const stat = fs.statSync(candidate)
        return { filePath: candidate, size: stat.size, mtime: stat.mtime }
      } catch {}
    }
  }
  return null
}

export async function GET() {
  const games = [
    { key: 'fivem', name: 'FiveM' },
    { key: 'valorant', name: 'Valorant' },
    { key: 'freefire', name: 'Free Fire' },
  ]

  let metadataMap: Record<string, any> = {}
  try {
    const metaPath = path.join(process.cwd(), 'data', 'loaders.json')
    if (fs.existsSync(metaPath)) {
      metadataMap = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    }
  } catch {}

  const result: Record<string, LoaderMeta> = {}

  for (const g of games) {
    const file = findLoaderFile(g.key)
    const savedMeta = metadataMap[g.key] || {}

    if (file) {
      result[g.key] = {
        game: g.name,
        filename: savedMeta.filename || `${g.name}.exe`,
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        uploadedAt: savedMeta.uploadedAt || file.mtime.toLocaleDateString('pt-BR') + ' ' + file.mtime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        uploadedBy: savedMeta.uploadedBy || 'Hookedadmin',
        exists: true,
      }
    } else {
      result[g.key] = {
        game: g.name,
        filename: `${g.name}.exe`,
        size: 0,
        sizeFormatted: '0 MB',
        uploadedAt: '',
        uploadedBy: '',
        exists: false,
      }
    }
  }

  return NextResponse.json({ success: true, loaders: result }, { headers: corsHeaders() })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}
