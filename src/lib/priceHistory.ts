const STORAGE_KEY = 'game-deals-price-history'
const MAX_POINTS_PER_GAME = 200
const MAX_TRACKED_GAMES = 300

export interface PricePoint {
  t: number
  price: number
  retail: number
}

interface GameHistory {
  title: string
  lastSeen: number
  points: PricePoint[]
}

type HistoryStore = Record<string, GameHistory>

function readStore(): HistoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as HistoryStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: HistoryStore) {
  const entries = Object.entries(store)
  if (entries.length > MAX_TRACKED_GAMES) {
    entries.sort((a, b) => b[1].lastSeen - a[1].lastSeen)
    store = Object.fromEntries(entries.slice(0, MAX_TRACKED_GAMES))
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // storage full or unavailable — tracking is best-effort, safe to drop
  }
}

interface SnapshotEntry {
  gameID: string
  title: string
  price: number
  retail: number
}

export function recordPriceSnapshots(entries: SnapshotEntry[], now: number) {
  if (entries.length === 0) return
  const store = readStore()

  const cheapestByGame = new Map<string, SnapshotEntry>()
  for (const entry of entries) {
    const existing = cheapestByGame.get(entry.gameID)
    if (!existing || entry.price < existing.price) cheapestByGame.set(entry.gameID, entry)
  }

  for (const [gameID, entry] of cheapestByGame) {
    const existing = store[gameID]
    if (!existing) {
      store[gameID] = { title: entry.title, lastSeen: now, points: [{ t: now, price: entry.price, retail: entry.retail }] }
      continue
    }
    existing.lastSeen = now
    existing.title = entry.title
    const lastPoint = existing.points[existing.points.length - 1]
    if (!lastPoint || lastPoint.price !== entry.price || lastPoint.retail !== entry.retail) {
      existing.points.push({ t: now, price: entry.price, retail: entry.retail })
      if (existing.points.length > MAX_POINTS_PER_GAME) {
        existing.points = existing.points.slice(existing.points.length - MAX_POINTS_PER_GAME)
      }
    }
  }

  writeStore(store)
}

export function getPriceHistory(gameID: string): PricePoint[] {
  const store = readStore()
  return store[gameID]?.points ?? []
}

export type DealQuality = 'best-price' | 'price-hiked'

export function getDealQuality(gameID: string, currentSale: number, currentRetail: number): DealQuality | null {
  const points = getPriceHistory(gameID)
  if (points.length < 2) return null
  const previous = points.slice(0, -1)

  const prevLowestSale = Math.min(...previous.map((p) => p.price))
  if (currentSale <= prevLowestSale) return 'best-price'

  const hadLowerRetail = previous.some((p) => p.retail < currentRetail)
  if (hadLowerRetail) return 'price-hiked'

  return null
}
