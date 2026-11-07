export interface LicenseDurationInfo {
  isLifetime: boolean
  remainingSeconds: number
  remainingDays: number
  isExpired: boolean
  formattedRemaining: string
  expiryIso: string
}

/**
 * Converte qualquer texto de duração em milissegundos.
 * Se for vitalício / lifetime, retorna null.
 * Suporta:
 *  - "1 Dia (24h)" -> 86.400.000
 *  - "3 Dias (Fim de Semana)" -> 259.200.000
 *  - "7 Dias (Semanal)" -> 604.800.000
 *  - "15 Dias (Quinzenal)" -> 1.296.000.000
 *  - "27 Dias" -> 2.332.800.000
 *  - "30 Dias (Mensal)" -> 2.592.000.000
 *  - "60 Dias (Bimestral)" -> 5.184.000.000
 *  - "90 Dias (Trimestral)" -> 7.776.000.000
 *  - "180 Dias (Semestral)" -> 15.552.000.000
 *  - "365 Dias (Anual)" -> 31.536.000.000
 *  - "Vitalício (Lifetime)" -> null
 *  - Customizados: "45 Dias", "12 Horas", "2 Semanas", "6 Meses", "45", etc.
 */
export function parseDurationMs(durationStr?: string): number | null {
  if (!durationStr || typeof durationStr !== 'string') return 30 * 86400000
  const clean = durationStr.trim().toLowerCase()

  if (
    clean.includes('vital') ||
    clean.includes('life') ||
    clean === 'infinito' ||
    clean === 'perpetual'
  ) {
    return null
  }

  // Verifica dias
  const matchDays = clean.match(/(\d+)\s*dias?/i) || clean.match(/(\d+)\s*d\b/i)
  if (matchDays) {
    const d = parseInt(matchDays[1], 10)
    if (!isNaN(d) && d > 0) return d * 24 * 60 * 60 * 1000
  }

  // Verifica semanas
  const matchWeeks = clean.match(/(\d+)\s*semanas?/i) || clean.match(/(\d+)\s*sem\b/i)
  if (matchWeeks) {
    const w = parseInt(matchWeeks[1], 10)
    if (!isNaN(w) && w > 0) return w * 7 * 24 * 60 * 60 * 1000
  }

  // Verifica meses
  const matchMonths = clean.match(/(\d+)\s*m[eê]s(?:es)?/i)
  if (matchMonths) {
    const m = parseInt(matchMonths[1], 10)
    if (!isNaN(m) && m > 0) return m * 30 * 24 * 60 * 60 * 1000
  }

  // Verifica anos
  const matchYears = clean.match(/(\d+)\s*anos?/i)
  if (matchYears) {
    const y = parseInt(matchYears[1], 10)
    if (!isNaN(y) && y > 0) return y * 365 * 24 * 60 * 60 * 1000
  }

  // Verifica horas
  const matchHours = clean.match(/(\d+)\s*horas?/i) || clean.match(/(\d+)\s*h\b/i)
  if (matchHours) {
    const h = parseInt(matchHours[1], 10)
    if (!isNaN(h) && h > 0) return h * 60 * 60 * 1000
  }

  // Se o usuário digitou apenas um número (ex: "45")
  const matchNum = clean.match(/^\s*(\d+)\s*$/)
  if (matchNum) {
    const n = parseInt(matchNum[1], 10)
    if (!isNaN(n) && n > 0) return n * 24 * 60 * 60 * 1000
  }

  return 30 * 24 * 60 * 60 * 1000
}

export function isLifetime(text?: string): boolean {
  if (!text || typeof text !== 'string') return false
  const lower = text.trim().toLowerCase()
  return (
    lower.includes('vital') ||
    lower.includes('life') ||
    lower === 'infinito' ||
    lower === 'perpetual'
  )
}

/**
 * Calcula a data de expiração ISO a partir da duração.
 * Se for vitalício, retorna 'Vitalício'.
 */
export function calculateExpiryDate(
  durationStr?: string,
  fromDate?: Date | number | string
): string {
  if (isLifetime(durationStr)) return 'Vitalício'
  const ms = parseDurationMs(durationStr)
  if (ms === null) return 'Vitalício'

  let baseTime = Date.now()
  if (fromDate) {
    const parsed = new Date(fromDate).getTime()
    if (!isNaN(parsed)) baseTime = parsed
  }

  return new Date(baseTime + ms).toISOString()
}

/**
 * Calcula os segundos restantes até a data de expiração.
 */
export function getRemainingSeconds(expiryDateOrText?: string): number {
  if (!expiryDateOrText) return 0
  if (isLifetime(expiryDateOrText)) return 315360000 // 10 anos para vitalício

  const parsed = new Date(expiryDateOrText).getTime()
  if (!isNaN(parsed)) {
    return Math.max(0, Math.floor((parsed - Date.now()) / 1000))
  }

  // Fallback se não for data válida (ex: "30 Dias")
  const ms = parseDurationMs(expiryDateOrText)
  if (ms === null) return 315360000
  return Math.max(0, Math.floor(ms / 1000))
}

/**
 * Retorna se a licença está expirada.
 */
export function isLicenseExpired(expiryDateOrText?: string): boolean {
  if (!expiryDateOrText) return true
  if (isLifetime(expiryDateOrText)) return false
  return getRemainingSeconds(expiryDateOrText) <= 0
}

/**
 * Formata o tempo restante de forma amigável para exibição:
 * - Se vitalício: "Vitalício"
 * - Se expirado: "Expirada"
 * - Se mais de 1 dia: "X Dias" (ex: "30 Dias", "29 Dias", "28 Dias", etc.)
 * - Se menos de 24 horas: "X Horas" (ou "1 Dia")
 * - Se menos de 1 hora: "X Min"
 */
export function formatRemainingTime(
  expiryDateOrText?: string,
  fallbackTempo?: string
): string {
  if (!expiryDateOrText && !fallbackTempo) return 'Expirada'
  if (isLifetime(expiryDateOrText) || isLifetime(fallbackTempo)) {
    return 'Vitalício'
  }

  const seconds = getRemainingSeconds(expiryDateOrText || fallbackTempo)
  if (seconds <= 0) {
    return 'Expirada'
  }

  const days = Math.ceil(seconds / 86400)
  if (days > 1) {
    return `${days} Dias`
  }

  const hours = Math.floor(seconds / 3600)
  if (hours >= 1) {
    return `${hours} ${hours === 1 ? 'Hora' : 'Horas'}`
  }

  const minutes = Math.max(1, Math.floor(seconds / 60))
  return `${minutes} Min`
}

/**
 * Formata a data de expiração no padrão brasileiro (DD/MM/AAAA)
 */
export function formatExpiryDate(expiryDateOrText?: string): string {
  if (!expiryDateOrText || isLifetime(expiryDateOrText)) return 'Vitalício'
  const parsed = new Date(expiryDateOrText)
  if (isNaN(parsed.getTime())) return expiryDateOrText
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Normaliza uma licença garantindo que tempo, expiry e status estejam 100% corretos e atualizados
 */
export function normalizeLicense<
  T extends {
    tempo: string
    plano?: string
    expiry: string
    issued: string
    status: 'Active' | 'Expired' | 'Suspended'
  }
>(license: T): T {
  const isLife =
    isLifetime(license.tempo) || isLifetime(license.expiry) || isLifetime(license.plano)

  if (isLife) {
    return {
      ...license,
      plano: license.plano || license.tempo || 'Vitalício (Lifetime)',
      tempo: 'Vitalício',
      expiry: 'Vitalício',
      status: license.status === 'Suspended' ? 'Suspended' : 'Active',
    }
  }

  // Preserva o plano contratado originalmente
  const originalPlan = license.plano || license.tempo || '30 Dias (Mensal)'

  // Garante que expiry é uma data ISO válida
  let expiryDate = license.expiry
  const parsedExp = new Date(expiryDate).getTime()

  if (isNaN(parsedExp)) {
    // Se expiry não era uma data válida (ex: "30 Dias (Mensal)"), calcula a partir de issued ou Date.now()
    let baseTime = Date.now()
    if (license.issued && license.issued !== 'Hoje') {
      const parsedIssued = new Date(license.issued).getTime()
      if (!isNaN(parsedIssued)) baseTime = parsedIssued
    }
    expiryDate = calculateExpiryDate(license.expiry || license.tempo, baseTime)
  }

  const expired = isLicenseExpired(expiryDate)
  const remainingTimeStr = expired ? 'Expirada' : formatRemainingTime(expiryDate, originalPlan)

  let newStatus = license.status
  if (license.status !== 'Suspended') {
    newStatus = expired ? 'Expired' : 'Active'
  }

  return {
    ...license,
    plano: originalPlan,
    tempo: remainingTimeStr,
    expiry: expiryDate,
    status: newStatus,
  }
}
