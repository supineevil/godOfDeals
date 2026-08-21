import { useEffect, useState } from 'react'
import type { Store } from '../lib/cheapshark'
import { storeIconUrl } from '../lib/cheapshark'
import { convert, formatCurrency, type CurrencyCode } from '../lib/currency'
import type { WishlistEntry } from '../lib/wishlist'
import type { WishlistLiveInfo } from '../hooks/useWishlist'

interface WishlistPanelProps {
  items: WishlistEntry[]
  live: Record<string, WishlistLiveInfo | 'loading' | 'error'>
  storeMap: Map<string, Store>
  currency: CurrencyCode
  rates: Record<string, number>
  onRemove: (gameID: string) => void
  onSetTarget: (gameID: string, targetPrice: number) => void
  onClose: () => void
}

function currencySymbol(currency: CurrencyCode): string {
  const parts = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  }).formatToParts(0)
  return parts.find((p) => p.type === 'currency')?.value ?? currency
}

function TargetInput({
  gameID,
  targetPriceUsd,
  currency,
  rates,
  onSetTarget,
}: {
  gameID: string
  targetPriceUsd: number
  currency: CurrencyCode
  rates: Record<string, number>
  onSetTarget: (gameID: string, targetPrice: number) => void
}) {
  const displayValue = convert(targetPriceUsd, currency, rates)
  const [value, setValue] = useState(displayValue.toFixed(2))

  useEffect(() => {
    setValue(displayValue.toFixed(2))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPriceUsd, currency])

  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        const num = parseFloat(value)
        if (!Number.isNaN(num) && num >= 0) {
          const rate = rates[currency] ?? 1
          onSetTarget(gameID, num / rate)
        } else {
          setValue(displayValue.toFixed(2))
        }
      }}
      className="w-20 rounded-lg border border-white/10 bg-white/60 dark:bg-white/5 px-2 py-1 text-sm text-slate-800 dark:text-white outline-none focus:border-fuchsia-400/60 transition"
    />
  )
}

export function WishlistPanel({ items, live, storeMap, currency, rates, onRemove, onSetTarget, onClose }: WishlistPanelProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
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

        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 pr-8">❤️ Wishlist</h2>

        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tap the heart on any deal to track it here and get notified when it drops to your target price.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => {
              const info = live[item.gameID]
              const resolved = typeof info === 'object' ? info : null
              const belowTarget = resolved ? resolved.cheapest <= item.targetPrice : false
              const store = resolved ? storeMap.get(resolved.storeID) : undefined
              return (
                <div
                  key={item.gameID}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                    belowTarget
                      ? 'border-emerald-400/50 bg-emerald-400/5'
                      : 'border-white/10 bg-white/40 dark:bg-white/5'
                  }`}
                >
                  <img src={item.thumb} alt={item.title} className="h-10 w-auto rounded-md shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate" title={item.title}>
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {info === 'loading' && <span>Checking price…</span>}
                      {info === 'error' && <span className="text-rose-400">Couldn't check price</span>}
                      {resolved && (
                        <>
                          {store && <img src={storeIconUrl(store)} alt="" className="h-3 w-3 rounded-sm" />}
                          <span>Now {formatCurrency(convert(resolved.cheapest, currency, rates), currency)}</span>
                          {belowTarget && <span className="font-semibold text-emerald-500">🔔 below target</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div
                      className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400"
                      title={
                        currency !== 'USD'
                          ? "Shown in your selected currency — matched against CheapShark's underlying USD price"
                          : undefined
                      }
                    >
                      <span>Alert at {currencySymbol(currency)}</span>
                      <TargetInput
                        gameID={item.gameID}
                        targetPriceUsd={item.targetPrice}
                        currency={currency}
                        rates={rates}
                        onSetTarget={onSetTarget}
                      />
                    </div>
                    <button
                      onClick={() => onRemove(item.gameID)}
                      className="text-[11px] font-medium text-rose-400 hover:text-rose-300 transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
