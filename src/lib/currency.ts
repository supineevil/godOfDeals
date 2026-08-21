const RATES_URL = 'https://api.frankfurter.dev/v1/latest?base=USD'
const CACHE_KEY = 'game-deals-fx-rates'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000

export const CURRENCIES = [
  { code: 'USD', label: 'US Dollar' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'EUR', label: 'Euro' },
  { code: 'GBP', label: 'British Pound' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'BRL', label: 'Brazilian Real' },
  { code: 'SGD', label: 'Singapore Dollar' },
  { code: 'MXN', label: 'Mexican Peso' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']

interface RatesCache {
  base: 'USD'
  rates: Record<string, number>
  fetchedAt: number
}

function readCache(): RatesCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as RatesCache
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

export async function getExchangeRates(): Promise<Record<string, number>> {
  const cached = readCache()
  if (cached) return cached.rates

  const symbols = CURRENCIES.filter((c) => c.code !== 'USD')
    .map((c) => c.code)
    .join(',')
  const res = await fetch(`${RATES_URL}&symbols=${symbols}`)
  if (!res.ok) throw new Error('Failed to fetch exchange rates')
  const data = await res.json()
  const rates: Record<string, number> = { USD: 1, ...data.rates }

  localStorage.setItem(CACHE_KEY, JSON.stringify({ base: 'USD', rates, fetchedAt: Date.now() } satisfies RatesCache))
  return rates
}

export function convert(usdAmount: number, currency: CurrencyCode, rates: Record<string, number>): number {
  const rate = rates[currency] ?? 1
  return usdAmount * rate
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount)
}
