import { useEffect, useState } from 'react'
import type { Deal, GameDetail, Store } from '../lib/cheapshark'
import { dealRedirectUrl, fetchGameDetail, storeIconUrl } from '../lib/cheapshark'
import { convert, formatCurrency, type CurrencyCode } from '../lib/currency'
import { getPriceHistory, type PricePoint } from '../lib/priceHistory'

interface GameModalProps {
  deal: Deal
  storeMap: Map<string, Store>
  currency: CurrencyCode
  rates: Record<string, number>
  onClose: () => void
  isWishlisted: (gameID: string) => boolean
  onToggleWishlist: (deal: Deal) => void
}

function PriceHistoryChart({ points, currency, rates }: { points: PricePoint[]; currency: CurrencyCode; rates: Record<string, number> }) {
  const width = 320
  const height = 100
  const pad = 8
  const prices = points.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const toX = (i: number) => pad + (i / (points.length - 1)) * (width - pad * 2)
  const toY = (price: number) => height - pad - ((price - min) / range) * (height - pad * 2)

  const stepPath = points
    .map((p, i) => {
      if (i === 0) return `M ${toX(i)} ${toY(p.price)}`
      return `L ${toX(i)} ${toY(points[i - 1].price)} L ${toX(i)} ${toY(p.price)}`
    })
    .join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
      <path d={stepPath} fill="none" stroke="currentColor" className="text-fuchsia-400" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1].price)} r="3" className="fill-fuchsia-400" />
      <text x={pad} y={12} className="fill-slate-400 text-[9px]">
        {formatCurrency(convert(max, currency, rates), currency)}
      </text>
      <text x={pad} y={height - 2} className="fill-slate-400 text-[9px]">
        {formatCurrency(convert(min, currency, rates), currency)}
      </text>
    </svg>
  )
}

export function GameModal({ deal, storeMap, currency, rates, onClose, isWishlisted, onToggleWishlist }: GameModalProps) {
  const [detail, setDetail] = useState<GameDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const history = getPriceHistory(deal.gameID)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchGameDetail(deal.gameID)
      .then((result) => {
        if (!cancelled) setDetail(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load game details')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [deal.gameID])

  const allTimeLow = detail ? parseFloat(detail.cheapestPriceEver.price) : undefined
  const currentLow = detail
    ? Math.min(...detail.deals.map((d) => parseFloat(d.price)))
    : parseFloat(deal.salePrice)
  const currentHigh = detail
    ? Math.max(...detail.deals.map((d) => parseFloat(d.retailPrice)))
    : parseFloat(deal.normalPrice)

  const sortedStoreDeals = detail
    ? [...detail.deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass relative w-full max-w-lg rounded-2xl p-5 max-h-[85vh] overflow-y-auto flex flex-col gap-4"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full h-8 w-8 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-white/10 transition"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 pr-8">
          <img src={deal.thumb} alt={deal.title} className="h-14 w-auto rounded-lg" />
          <h2 className="flex-1 text-lg font-semibold text-slate-800 dark:text-slate-100">{deal.title}</h2>
          <button
            onClick={() => onToggleWishlist(deal)}
            aria-label={isWishlisted(deal.gameID) ? 'Remove from wishlist' : 'Add to wishlist'}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 transition text-lg"
          >
            {isWishlisted(deal.gameID) ? '❤️' : '🤍'}
          </button>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        {loading ? (
          <div className="animate-pulse flex flex-col gap-3">
            <div className="h-20 rounded-xl bg-slate-500/10" />
            <div className="h-24 rounded-xl bg-slate-500/10" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/50 dark:bg-white/5 p-3 flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">All-time low</span>
                <span className="text-lg font-bold text-emerald-500">
                  {allTimeLow !== undefined ? formatCurrency(convert(allTimeLow, currency, rates), currency) : '—'}
                </span>
                {detail && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-500">
                    {new Date(detail.cheapestPriceEver.date * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="rounded-xl bg-white/50 dark:bg-white/5 p-3 flex flex-col gap-0.5">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Now: low – high</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(convert(currentLow, currency, rates), currency)}
                  <span className="text-xs font-normal text-slate-400"> – {formatCurrency(convert(currentHigh, currency, rates), currency)}</span>
                </span>
              </div>
            </div>

            {history.length >= 2 ? (
              <div className="rounded-xl bg-white/50 dark:bg-white/5 p-3">
                <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Price since you started tracking
                </span>
                <PriceHistoryChart points={history} currency={currency} rates={rates} />
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live tracking started — check back after this game's price changes a few times to see a trend
                here. Full historical charts aren't available from the API, only the all-time-low above.
              </p>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Prices by store</span>
              {sortedStoreDeals.map((sd) => {
                const store = storeMap.get(sd.storeID)
                const price = parseFloat(sd.price)
                const retail = parseFloat(sd.retailPrice)
                const savings = Math.round(parseFloat(sd.savings))
                return (
                  <a
                    key={sd.dealID}
                    href={dealRedirectUrl(sd.dealID)}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/40 dark:bg-white/5 px-3 py-2 text-sm hover:border-fuchsia-400/50 transition"
                  >
                    {store && <img src={storeIconUrl(store)} alt="" className="h-4 w-4 rounded-sm" />}
                    <span className="flex-1 text-slate-700 dark:text-slate-200">{store?.storeName ?? `Store ${sd.storeID}`}</span>
                    {savings > 0 && retail > price && (
                      <span className="text-[11px] font-semibold text-fuchsia-500">-{savings}%</span>
                    )}
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {formatCurrency(convert(price, currency, rates), currency)}
                    </span>
                  </a>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
