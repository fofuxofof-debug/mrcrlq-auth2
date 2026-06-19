import { NextResponse, type NextRequest } from 'next/server'
import { keysDb, hwidsDb, logsDb, generateKey } from '@/lib/db'

export async function GET() {
  const keys = await keysDb.list()
  // Enriquece cada key com seus HWIDs vinculados (pra exibicao na tabela)
  const enriched = await Promise.all(
    keys.map(async (k) => ({
      ...k,
      hwids: await hwidsDb.listByKey(k.id),
    }))
  )
  return NextResponse.json({ data: enriched })
}

export async function POST(request: NextRequest) {
  let body: {
    label?: string | null
    max_devices?: number
    expires_in_days?: number
    discord_id?: string | null
    notes?: string | null
    quantity?: number
    custom_key?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const qty = Math.min(Math.max(Number(body.quantity) || 1, 1), 50)
  const days = Math.max(Number(body.expires_in_days) || 30, 1)
  const devices = Math.max(Number(body.max_devices) || 1, 1)
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

  // Se custom_key foi passado, valida unicidade e usa como key.
  const customKey = body.custom_key?.trim() || null

  if (customKey) {
    if (await keysDb.findByKey(customKey)) {
      return NextResponse.json(
        { error: 'duplicate_key', message: 'Já existe uma key com esse valor.' },
        { status: 409 }
      )
    }
    // Quando há custom_key, ignora quantity (cria só uma)
    const k = await keysDb.create({
      key: customKey,
      label: body.label || null,
      max_devices: devices,
      expires_at: expires,
      discord_id: body.discord_id || null,
      notes: body.notes || null,
    })
    await logsDb.create({
      key_id: k.id,
      event_type: 'key_created',
      details: { key: k.key, label: k.label, custom: true },
    })
    return NextResponse.json({ data: [k], count: 1 })
  }

  // Modo padrão: gera N keys aleatórias
  const created = []
  for (let i = 0; i < qty; i++) {
    const k = await keysDb.create({
      key: generateKey(),
      label: body.label || null,
      max_devices: devices,
      expires_at: expires,
      discord_id: body.discord_id || null,
      notes: body.notes || null,
    })
    await logsDb.create({
      key_id: k.id,
      event_type: 'key_created',
      details: { key: k.key, label: k.label },
    })
    created.push(k)
  }

  return NextResponse.json({ data: created, count: created.length })
}
