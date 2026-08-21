const SITE = 'https://raunakghosh.goatcounter.com'
const DAY_MS = 24 * 60 * 60 * 1000

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function fetchVisitorCount30d(): Promise<number> {
  const now = new Date()
  const start = new Date(now.getTime() - 30 * DAY_MS)
  // GoatCounter buckets hits by its own configured timezone, not UTC, so "today" there
  // can already be a day ahead of what toISOString() (always UTC) computes here — pad
  // the end date forward by a day so today's hits are never excluded by that skew.
  const end = new Date(now.getTime() + DAY_MS)
  // GoatCounter's CDN caches responses per exact URL for hours (Cache-Control: public),
  // which would otherwise pin today's count to whatever it was when first cached.
  const url = `${SITE}/counter/TOTAL.json?start=${toDateParam(start)}&end=${toDateParam(end)}&_=${now.getTime()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch visitor count')
  const data: { count: string } = await res.json()
  return parseInt(data.count.replace(/,/g, ''), 10)
}
