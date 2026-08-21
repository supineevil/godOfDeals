import type { Store } from '../lib/cheapshark'
import type { DealFilters } from '../hooks/useDeals'
import { storeIconUrl } from '../lib/cheapshark'
import { convert, formatCurrency, type CurrencyCode } from '../lib/currency'

interface FiltersProps {
  stores: Store[]
  filters: DealFilters
  onChange: (next: DealFilters) => void
  searchInput: string
  onSearchInputChange: (value: string) => void
  currency: CurrencyCode
  rates: Record<string, number>
}

const SORT_OPTIONS: { value: NonNullable<DealFilters['sortBy']>; label: string }[] = [
  { value: 'Deal Rating', label: 'Best deal rating' },
  { value: 'Savings', label: 'Biggest discount' },
  { value: 'Price', label: 'Lowest price' },
  { value: 'Recent', label: 'Recently updated' },
  { value: 'Metacritic', label: 'Metacritic score' },
  { value: 'Reviews', label: 'Steam reviews' },
  { value: 'Title', label: 'Title (A-Z)' },
]

// upperPrice is always sent to CheapShark in USD (that's the only unit it filters on);
// the label is converted to the display currency just so it isn't misleading.
const PRICE_USD_THRESHOLDS = [5, 10, 20, 30]

export function Filters({ stores, filters, onChange, searchInput, onSearchInputChange, currency, rates }: FiltersProps) {
  const toggleStore = (storeID: string) => {
    const active = filters.storeIDs.includes(storeID)
    onChange({
      ...filters,
      storeIDs: active ? filters.storeIDs.filter((id) => id !== storeID) : [...filters.storeIDs, storeID],
    })
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Search for a game…"
            className="w-full rounded-xl border border-white/10 dark:border-white/10 bg-white/70 dark:bg-white/5 py-2.5 pl-9 pr-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none focus:border-fuchsia-400/60 focus:ring-2 focus:ring-fuchsia-400/20 transition"
          />
        </div>

        <select
          value={filters.bigDealsOnly ? 'Savings' : filters.sortBy}
          disabled={filters.bigDealsOnly}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as DealFilters['sortBy'] })}
          title={filters.bigDealsOnly ? 'Sorted by biggest discount while Big Deals is active' : undefined}
          className="rounded-xl border border-white/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-fuchsia-400/60 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.upperPrice ?? ''}
          onChange={(e) =>
            onChange({ ...filters, upperPrice: e.target.value ? Number(e.target.value) : undefined })
          }
          className="rounded-xl border border-white/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2.5 text-sm text-slate-800 dark:text-white outline-none focus:border-fuchsia-400/60 transition"
        >
          <option value="">Any price</option>
          {PRICE_USD_THRESHOLDS.map((usd) => (
            <option key={usd} value={usd}>
              Under {formatCurrency(convert(usd, currency, rates), currency)}
            </option>
          ))}
        </select>

        <label
          title="Only show deals with 80% or more off"
          className="flex items-center gap-2 rounded-xl border border-white/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 cursor-pointer select-none whitespace-nowrap"
        >
          <input
            type="checkbox"
            checked={filters.bigDealsOnly}
            onChange={(e) => onChange({ ...filters, bigDealsOnly: e.target.checked })}
            className="h-4 w-4 rounded accent-fuchsia-500"
          />
          🔥 Big Deals (80%+ off)
        </label>

        <label
          title="Only show deals with Metacritic or Steam rating of 75+"
          className="flex items-center gap-2 rounded-xl border border-white/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 cursor-pointer select-none whitespace-nowrap"
        >
          <input
            type="checkbox"
            checked={filters.highRatedOnly}
            onChange={(e) => onChange({ ...filters, highRatedOnly: e.target.checked })}
            className="h-4 w-4 rounded accent-fuchsia-500"
          />
          ⭐ Highly Rated (75+)
        </label>
      </div>

      {stores.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => onChange({ ...filters, storeIDs: [] })}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition ${
              filters.storeIDs.length === 0
                ? 'bg-fuchsia-500/20 border-fuchsia-400/60 text-fuchsia-600 dark:text-fuchsia-300'
                : 'border-white/10 text-slate-500 dark:text-slate-400 hover:border-white/30'
            }`}
          >
            All stores
          </button>
          {stores.map((store) => {
            const active = filters.storeIDs.includes(store.storeID)
            return (
              <button
                key={store.storeID}
                onClick={() => toggleStore(store.storeID)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                  active
                    ? 'bg-cyan-400/20 border-cyan-400/60 text-cyan-700 dark:text-cyan-300'
                    : 'border-white/10 text-slate-500 dark:text-slate-400 hover:border-white/30'
                }`}
              >
                <img src={storeIconUrl(store)} alt="" className="h-3.5 w-3.5 rounded-sm" />
                {store.storeName}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
