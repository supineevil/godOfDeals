import type { Theme } from '../hooks/useTheme'
import { CURRENCIES, type CurrencyCode } from '../lib/currency'

interface HeaderProps {
  theme: Theme
  onToggleTheme: () => void
  onRefresh: () => void
  refreshing: boolean
  lastUpdated: Date | null
  currency: CurrencyCode
  onCurrencyChange: (currency: CurrencyCode) => void
  ratesLoading: boolean
  wishlistCount: number
  wishlistAlertCount: number
  onOpenWishlist: () => void
  visitorCount: number | null
}

function formatTime(date: Date | null) {
  if (!date) return '—'
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function Header({
  theme,
  onToggleTheme,
  onRefresh,
  refreshing,
  lastUpdated,
  currency,
  onCurrencyChange,
  ratesLoading,
  wishlistCount,
  wishlistAlertCount,
  onOpenWishlist,
  visitorCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-red-600 via-red-800 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
            <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5 text-amber-100" fill="currentColor">
              <path d="M12 1l1.6 2.4 1.6-2 1.2 2.6C19 5.3 20 7.9 20 11v2.6c-1.1-.8-2.4-1.3-3.8-1.5-.4 3.7-2.2 6.9-4.2 8.9-2-2-3.8-5.2-4.2-8.9-1.4.2-2.7.7-3.8 1.5V11c0-3.1 1-5.7 3.6-7l1.2-2.6 1.6 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-glow text-slate-900 dark:text-white leading-tight">
              God<span className="text-red-500">OfDeals</span>
            </h1>
            <p className="hidden sm:block text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 -mt-0.5">
              Live game deal radar
            </p>
          </div>
          {visitorCount !== null && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-300 ml-1">
              👀 {visitorCount.toLocaleString()} visitors · 30d
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              aria-label="Currency"
              className="appearance-none rounded-full border border-white/10 dark:border-white/10 bg-white/60 dark:bg-white/5 pl-2.5 pr-6 sm:pl-3 sm:pr-7 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-fuchsia-400/60 transition cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
            {ratesLoading ? (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-fuchsia-400/40 border-t-fuchsia-400 animate-spin" />
            ) : (
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <div className="hidden md:flex flex-col items-end text-xs text-slate-500 dark:text-slate-400 leading-tight">
            <span>Last updated</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{formatTime(lastUpdated)}</span>
          </div>

          <button
            onClick={onOpenWishlist}
            aria-label="Open wishlist"
            title="Wishlist"
            className="relative rounded-full border border-white/10 dark:border-white/10 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 transition shrink-0"
          >
            <svg className="h-4 w-4 sm:h-4.5 sm:w-4.5" viewBox="0 0 24 24" fill={wishlistCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
              <path d="M12 20.5s-7.5-4.6-9.8-9.2C.7 8.1 2 4.5 5.5 3.6c2-.5 3.9.3 5 1.9l1.5 2 1.5-2c1.1-1.6 3-2.4 5-1.9 3.5.9 4.8 4.5 3.3 7.7-2.3 4.6-9.8 9.2-9.8 9.2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {wishlistCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 flex h-4.5 min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${
                  wishlistAlertCount > 0 ? 'bg-emerald-500' : 'bg-fuchsia-500'
                }`}
              >
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh deals"
            title="Refresh"
            className="group flex items-center justify-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 h-8 w-8 sm:h-auto sm:w-auto sm:px-3.5 sm:py-2 text-sm font-medium text-cyan-600 dark:text-cyan-300 hover:bg-cyan-400/20 hover:border-cyan-400/70 transition disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : 'group-hover:rotate-90 transition-transform'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden sm:inline">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>

          <button
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="rounded-full border border-white/10 dark:border-white/10 h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-slate-600 dark:text-yellow-300 bg-white/60 dark:bg-white/5 hover:bg-white/90 dark:hover:bg-white/10 transition shrink-0"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4 sm:h-4.5 sm:w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4a1 1 0 011 1v1a1 1 0 11-2 0V5a1 1 0 011-1zm0 14a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm8-6a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM6 12a1 1 0 01-1 1H4a1 1 0 110-2h1a1 1 0 011 1zm11.657-6.657a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM8.464 16.95a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zm9.193 1.414a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zM7.05 7.464a1 1 0 01-1.414 0l-.707-.707A1 1 0 116.343 5.34l.707.707a1 1 0 010 1.414zM12 7a5 5 0 100 10 5 5 0 000-10z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-4.5 sm:w-4.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
