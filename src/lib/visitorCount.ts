const SITE = 'https://raunakghosh.goatcounter.com'
const DAY_MS = 24 * 60 * 60 * 1000

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export async function fetchVisitorCount30d(): Promise<number> {
  const end = new Date()
  const start = new Date(end.getTime() - 30 * DAY_MS)
  const url = `${SITE}/counter/TOTAL.json?start=${toDateParam(start)}&end=${toDateParam(end)}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch visitor count')
  const data: { count: string } = await res.json()
  return parseInt(data.count.replace(/,/g, ''), 10)
}
