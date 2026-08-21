import { useState } from 'react'
import type { Deal, Store } from '../lib/cheapshark'
import { dealRedirectUrl, storeIconUrl } from '../lib/cheapshark'
import { convert, formatCurrency, type CurrencyCode } from '../lib/currency'
import type { DealGroup } from '../lib/groupDeals'
import { getDealQuality } from '../lib/priceHistory'

interface DealCardProps {
  group: DealGroup
  storeMap: Map<string, Store>
  currency: CurrencyCode
  rates: Record<string, number>
  onOpen: (deal: Deal) => void
  isWishlisted: (gameID: string) => boolean
  onToggleWishlist: (deal: Deal) => void
}

function ratingColor(rating: number) {
  if (rating >= 8) return 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10'
  if (rating >= 5) return 'text-amber-400 border-amber-400/40 bg-amber-400/10'
  return 'text-slate-400 border-slate-400/30 bg-slate-400/10'
}

export function DealCard({ group, storeMap, currency, rates, onOpen, isWishlisted, onToggleWishlist }: DealCardProps) {
  const hasEditions = group.editions.length > 1
  const [activeGameID, setActiveGameID] = useState(group.key)

  const active = hasEditions
    ? group.editions.find((e) => e.gameID === activeGameID) ?? group.editions[0]
    : { deal: group.deal, storeCount: group.storeCount }

  const deal = active.deal
  const store = storeMap.get(deal.storeID)
  const savings = Math.round(parseFloat(deal.savings))
  const saleUsd = parseFloat(deal.salePrice)
  const normalUsd = parseFloat(deal.normalPrice)
  const sale = convert(saleUsd, currency, rates)
  const normal = convert(normalUsd, currency, rates)
  const rating = parseFloat(deal.dealRating)
  const metacritic = parseInt(deal.metacriticScore, 10)
  const quality = getDealQuality(deal.gameID, saleUsd, normalUsd)
  const wishlisted = isWishlisted(deal.gameID)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(deal)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen(deal)
      }}
      className="card-glow glass group relative flex flex-col overflow-hidden rounded-2xl cursor-pointer"
    >
      <div className="relative aspect-[231/87] w-full overflow-hidden bg-slate-900">
        <img
          src={deal.thumb}
          alt={deal.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleWishlist(deal)
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-sm hover:bg-black/80 transition"
        >
          {wishlisted ? '❤️' : '🤍'}
        </button>

        {savings > 0 && (
          <div className="absolute top-2 right-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-lg shadow-fuchsia-900/40">
            -{savings}%
          </div>
        )}
        {store && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 backdrop-blur-sm">
            <img src={storeIconUrl(store)} alt={store.storeName} className="h-3.5 w-3.5 rounded-sm" />
            <span className="text-[11px] font-medium text-white">{store.storeName}</span>
            {active.storeCount > 1 && (
              <span className="text-[11px] font-medium text-white/70">+{active.storeCount - 1} more</span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <h3
          className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-fuchsia-500 dark:group-hover:text-fuchsia-400 transition-colors"
          title={deal.title}
        >
          {deal.title}
        </h3>

        {hasEditions && (
          <div className="flex items-center gap-1 flex-wrap">
            {group.editions.map((edition) => (
              <button
                key={edition.gameID}
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveGameID(edition.gameID)
                }}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium border transition ${
                  edition.gameID === active.deal.gameID
                    ? 'bg-fuchsia-500/20 border-fuchsia-400/60 text-fuchsia-600 dark:text-fuchsia-300'
                    : 'border-white/10 text-slate-500 dark:text-slate-400 hover:border-white/30'
                }`}
              >
                {edition.label}
              </button>
            ))}
          </div>
        )}

        {quality === 'best-price' && (
          <span className="inline-flex items-center gap-1 self-start rounded-md bg-emerald-400/10 border border-emerald-400/30 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-500">
            📉 Best price we've tracked
          </span>
        )}
        {quality === 'price-hiked' && (
          <span
            title="This game's listed price was lower the last time we checked — the discount may look bigger than it is."
            className="inline-flex items-center gap-1 self-start rounded-md bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500"
          >
            ⚠️ List price went up recently
          </span>
        )}

        <div className="flex items-end justify-between gap-2 mt-auto">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span
                className="text-lg font-bold text-slate-900 dark:text-white"
                title={
                  currency !== 'USD'
                    ? `Estimated from $${saleUsd.toFixed(2)} USD at today's exchange rate. The store's own regional price (after clicking through) may differ.`
                    : undefined
                }
              >
                {currency !== 'USD' && '≈ '}
                {formatCurrency(sale, currency)}
              </span>
              {normal > sale && (
                <span className="text-xs text-slate-400 line-through">{formatCurrency(normal, currency)}</span>
              )}
            </div>
            {currency !== 'USD' && (
              <span className="text-[10px] text-slate-500 dark:text-slate-500">
                ${saleUsd.toFixed(2)} USD · store price may vary
              </span>
            )}
          </div>

          {!Number.isNaN(rating) && (
            <span className={`rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${ratingColor(rating)}`}>
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1.5 border-t border-white/5 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
          {!Number.isNaN(metacritic) && metacritic > 0 && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-500" />
              Metacritic {metacritic}
            </span>
          )}
          {deal.steamRatingText && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
              {deal.steamRatingText} ({deal.steamRatingPercent}%)
            </span>
          )}
          <a
            href={dealRedirectUrl(deal.dealID)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto shrink-0 font-medium text-fuchsia-500 hover:text-fuchsia-400 transition-colors"
          >
            Go to store ↗
          </a>
        </div>
      </div>
    </div>
  )
}
