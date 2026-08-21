const STORAGE_KEY = 'game-deals-wishlist'

export interface WishlistEntry {
  gameID: string
  title: string
  thumb: string
  targetPrice: number
  addedAt: number
  lastAlertPrice: number | null
}

type WishlistStore = Record<string, WishlistEntry>

function readStore(): WishlistStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as WishlistStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: WishlistStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // storage full or unavailable — wishlist is best-effort, safe to drop
  }
}

export function getWishlist(): WishlistEntry[] {
  const store = readStore()
  return Object.values(store).sort((a, b) => b.addedAt - a.addedAt)
}

export function isWishlisted(gameID: string): boolean {
  const store = readStore()
  return Boolean(store[gameID])
}

export function addToWishlist(entry: { gameID: string; title: string; thumb: string; targetPrice: number }): void {
  const store = readStore()
  store[entry.gameID] = {
    gameID: entry.gameID,
    title: entry.title,
    thumb: entry.thumb,
    targetPrice: entry.targetPrice,
    addedAt: Date.now(),
    lastAlertPrice: null,
  }
  writeStore(store)
}

export function removeFromWishlist(gameID: string): void {
  const store = readStore()
  if (!(gameID in store)) return
  delete store[gameID]
  writeStore(store)
}

export function updateTargetPrice(gameID: string, targetPrice: number): void {
  const store = readStore()
  const existing = store[gameID]
  if (!existing) return
  existing.targetPrice = targetPrice
  writeStore(store)
}

export function checkPriceAlerts(prices: { gameID: string; price: number }[]): WishlistEntry[] {
  const store = readStore()
  const priceByGame = new Map(prices.map((p) => [p.gameID, p.price]))
  const alerted: WishlistEntry[] = []
  let changed = false

  for (const entry of Object.values(store)) {
    const price = priceByGame.get(entry.gameID)
    if (price === undefined) continue
    if (price > entry.targetPrice) continue
    if (entry.lastAlertPrice !== null && price >= entry.lastAlertPrice) continue

    entry.lastAlertPrice = price
    changed = true
    alerted.push({ ...entry })
  }

  if (changed) writeStore(store)
  return alerted
}
