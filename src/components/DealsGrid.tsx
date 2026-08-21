import type { Deal, Store } from '../lib/cheapshark'
import type { CurrencyCode } from '../lib/currency'
import type { DealGroup } from '../lib/groupDeals'
import { DealCard } from './DealCard'

interface DealsGridProps {
  groups: DealGroup[]
  storeMap: Map<string, Store>
  loading: boolean
  error: string | null
  page: number
  totalPages: number
  truncated: boolean
  onPageChange: (page: number) => void
  onOpenGame: (deal: Deal) => void
  currency: CurrencyCode
  rates: Record<string, number>
  isWishlisted: (gameID: string) => boolean
  onToggleWishlist: (deal: Deal) => void
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[231/87] w-full bg-slate-500/10" />
      <div className="p-3.5 flex flex-col gap-3">
        <div className="h-4 w-3/4 rounded bg-slate-500/10" />
        <div className="h-4 w-1/2 rounded bg-slate-500/10" />
        <div className="h-3 w-full rounded bg-slate-500/10" />
      </div>
    </div>
  )
}

function pageNumbersAround(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const end = Math.min(totalPages, Math.max(page + 2, 5))
  const pages: number[] = []
  for (let p = Math.max(1, start); p <= end; p++) pages.push(p)
  return pages
}

export function DealsGrid({
  groups,
  storeMap,
  loading,
  error,
  page,
  totalPages,
  truncated,
  onPageChange,
  onOpenGame,
  currency,
  rates,
  isWishlisted,
  onToggleWishlist,
}: DealsGridProps) {
  if (error) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <p className="text-rose-400 font-medium">Couldn't load deals</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
      </div>
    )
  }

  if (!loading && groups.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <p className="text-slate-600 dark:text-slate-300 font-medium">No deals match those filters</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try widening your price range or clearing store filters.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          : groups.map((group) => (
              <DealCard
                key={group.key}
                group={group}
                storeMap={storeMap}
                currency={currency}
                rates={rates}
                onOpen={onOpenGame}
                isWishlisted={isWishlisted}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:border-fuchsia-400/50 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              ← Prev
            </button>
            {pageNumbersAround(page, totalPages).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`h-9 w-9 rounded-full text-sm font-medium transition ${
                  p === page
                    ? 'bg-fuchsia-500/20 border border-fuchsia-400/60 text-fuchsia-600 dark:text-fuchsia-300'
                    : 'border border-white/10 text-slate-500 dark:text-slate-400 hover:border-white/30'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:border-fuchsia-400/50 transition disabled:opacity-40 disabled:pointer-events-none"
            >
              Next →
            </button>
          </div>
          {truncated && (
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              Showing the first {totalPages} pages of results — narrow your filters to see more precisely.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
