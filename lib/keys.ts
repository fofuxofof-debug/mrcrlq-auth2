import { randomBytes } from 'crypto'

export function generateKey(prefix = 'SYNC'): string {
  const segments = Array.from({ length: 4 }, () =>
    randomBytes(3).toString('hex').toUpperCase().slice(0, 5)
  )
  return `${prefix}-${segments.join('-')}`
}

export function getKeyStatus(key: {
  status: string
  expires_at: string
}): 'active' | 'expired' | 'banned' {
  if (key.status === 'banned') return 'banned'
  if (new Date(key.expires_at) < new Date()) return 'expired'
  return key.status as 'active' | 'expired' | 'banned'
}

export function getDaysRemaining(expiresAt: string): number {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
