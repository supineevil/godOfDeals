const BASE_URL = 'https://www.cheapshark.com/api/1.0'

export interface Deal {
  internalName: string
  title: string
  metacriticLink: string | null
  dealID: string
  storeID: string
  gameID: string
  salePrice: string
  normalPrice: string
  isOnSale: string
  savings: string
  metacriticScore: string
  steamRatingText: string | null
  steamRatingPercent: string
  steamRatingCount: string
  steamAppID: string | null
  releaseDate: number
  lastChange: number
  dealRating: string
  thumb: string
}

export interface Store {
  storeID: string
  storeName: string
  isActive: number
  images: {
    banner: string
    logo: string
    icon: string
  }
}

export interface GameSearchResult {
  gameID: string
  steamAppID: string | null
  cheapest: string
  cheapestDealID: string
  external: string
  internalName: string
  thumb: string
}

export type SortBy =
  | 'Deal Rating'
  | 'Title'
  | 'Savings'
  | 'Price'
  | 'Metacritic'
  | 'Reviews'
  | 'Release'
  | 'Store'
  | 'Recent'

export interface DealsQuery {
  storeID?: string
  title?: string
  upperPrice?: number
  lowerPrice?: number
  onSale?: boolean
  sortBy?: SortBy
  desc?: boolean
  pageSize?: number
  pageNumber?: number
  aaa?: boolean
}

export interface DealsPage {
  deals: Deal[]
  totalPages: number
}

export interface GameDetail {
  info: {
    title: string
    steamAppID: string | null
    thumb: string
  }
  cheapestPriceEver: {
    price: string
    date: number
  }
  deals: {
    storeID: string
    dealID: string
    price: string
    retailPrice: string
    savings: string
  }[]
}

// CheapShark hard-caps how deep pagination can go; past this it returns a
// plain-text "Too Many Results" error instead of JSON.
export const MAX_PAGE_INDEX = 125

const UA = 'GameDealsFinder/1.0 (contact@example.com)'

function buildUrl(path: string, params: Record<string, string | number | boolean | undefined>): URL {
  const url = new URL(`${BASE_URL}${path}`)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    url.searchParams.set(key, String(typeof value === 'boolean' ? (value ? 1 : 0) : value))
  }
  return url
}

async function apiGet<T>(path: string, params: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = buildUrl(path, params)
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (/too many results/i.test(body)) {
      throw new Error('Too many results for this page — try narrowing your filters.')
    }
    throw new Error(`CheapShark request failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function fetchDeals(query: DealsQuery): Promise<DealsPage> {
  const url = buildUrl('/deals', {
    storeID: query.storeID,
    title: query.title,
    upperPrice: query.upperPrice,
    lowerPrice: query.lowerPrice,
    onSale: query.onSale,
    sortBy: query.sortBy,
    desc: query.desc,
    pageSize: query.pageSize ?? 24,
    pageNumber: Math.min(query.pageNumber ?? 0, MAX_PAGE_INDEX),
    AAA: query.aaa,
  })
  const res = await fetch(url.toString(), { headers: { 'User-Agent': UA } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (/too many results/i.test(body)) {
      throw new Error('Too many results for this page — try narrowing your filters.')
    }
    throw new Error(`CheapShark request failed: ${res.status} ${res.statusText}`)
  }
  const deals = (await res.json()) as Deal[]
  const totalPages = Number(res.headers.get('X-Total-Page-Count') ?? '1') || 1
  return { deals, totalPages: Math.min(totalPages, MAX_PAGE_INDEX + 1) }
}

export function fetchStores(): Promise<Store[]> {
  return apiGet<Store[]>('/stores', {})
}

export function searchGames(title: string, limit = 10): Promise<GameSearchResult[]> {
  return apiGet<GameSearchResult[]>('/games', { title, limit })
}

export function fetchGameDetail(gameID: string): Promise<GameDetail> {
  return apiGet<GameDetail>('/games', { id: gameID })
}

export function storeIconUrl(store: Store): string {
  return `https://www.cheapshark.com${store.images.icon}`
}

export function storeLogoUrl(store: Store): string {
  return `https://www.cheapshark.com${store.images.logo}`
}

export function dealRedirectUrl(dealID: string): string {
  return `https://www.cheapshark.com/redirect?dealID=${dealID}`
}
