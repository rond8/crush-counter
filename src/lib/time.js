/**
 * Safely parse a Postgres/PostgREST timestamptz string.
 *
 * Postgres returns fractional seconds with microsecond precision
 * (6 digits, e.g. "2026-07-11T03:51:00.123456+00:00"), but the JS
 * Date constructor only reliably supports millisecond precision
 * (3 digits) — extra digits are handled inconsistently across
 * browsers and can silently shift the parsed time by hours. Trim to
 * milliseconds before parsing to avoid that.
 */
export function parseTimestamp(value) {
  if (!value) return null
  const trimmed = value.replace(/(\.\d{3})\d+/, '$1')
  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Human-readable "x ago" string for a Postgres timestamptz value.
 */
export function timeAgo(dateString) {
  const date = parseTimestamp(dateString)
  if (!date) return ''

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 30) return 'just now'

  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [label, secs] of units) {
    const value = Math.floor(seconds / secs)
    if (value >= 1) return `${value} ${label}${value > 1 ? 's' : ''} ago`
  }
  return 'just now'
}
