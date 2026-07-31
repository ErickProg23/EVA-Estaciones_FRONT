export const parseLocalDateTime = (value) => {
  if (!value) return null
  if (value instanceof Date) return value
  const str = String(value).trim()
  if (!str) return null
  const normalized = str.includes('T') ? str : str.replace(' ', 'T')
  const d = new Date(normalized)
  return Number.isNaN(d.getTime()) ? null : d
}

export const getLastFridayOfMonth = (baseDate = new Date()) => {
  const y = baseDate.getFullYear()
  const m = baseDate.getMonth()
  const d = new Date(y, m + 1, 0)
  while (d.getDay() !== 5) d.setDate(d.getDate() - 1)
  return d
}

export const getEvaluationWindowForMonth = (baseDate = new Date()) => {
  const lastFriday = getLastFridayOfMonth(baseDate)
  const start = new Date(lastFriday)
  start.setHours(0, 0, 0, 0)
  const end = new Date(lastFriday)
  end.setHours(23, 59, 59, 999)
  return { lastFriday, start, end }
}

export const getEvaluationStatus = (now = new Date(), baseDate = now) => {
  const { lastFriday, start, end } = getEvaluationWindowForMonth(baseDate)
  if (now.getTime() < start.getTime()) return { status: 'pending', lastFriday, start, end }
  if (now.getTime() <= end.getTime()) return { status: 'active', lastFriday, start, end }
  return { status: 'expired', lastFriday, start, end }
}

export const formatDateEs = (d) => {
  if (!d) return ''
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export const formatBackendDateTimeLocal = (d) => {
  if (!d) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

