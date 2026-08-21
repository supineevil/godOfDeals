import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Filters } from './components/Filters'
import { DealsGrid } from './components/DealsGrid'
import { GameModal } from './components/GameModal'
import { WishlistPanel } from './components/WishlistPanel'
import { useTheme } from './hooks/useTheme'
import { useDeals, type DealFilters } from './hooks/useDeals'
import { useStores } from './hooks/useStores'
import { useCurrency } from './hooks/useCurrency'
import { useWishlist } from './hooks/useWishlist'
import { useVisitorCount } from './hooks/useVisitorCount'
import type { Deal } from './lib/cheapshark'

const DEFAULT_FILTERS: DealFilters = {
  title: '',
  storeIDs: [],
  sortBy: 'Deal Rating',
  upperPrice: undefined,
  bigDealsOnly: false,
  highRatedOnly: false,
}

function App() {
  const { theme, toggleTheme } = useTheme()
  const stores = useStores()
  const { currency, setCurrency, rates, ratesLoading } = useCurrency()
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<DealFilters>(DEFAULT_FILTERS)
  const [openDeal, setOpenDeal] = useState<Deal | null>(null)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const wishlist = useWishlist()
  const visitorCount = useVisitorCount()

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilters((prev) => (prev.title === searchInput ? prev : { ...prev, title: searchInput }))
    }, 400)
    return () => clearTimeout(handle)
  }, [searchInput])

  const { groups, loading, error, lastUpdated, page, totalPages, truncated, goToPage, refresh } = useDeals(filters)

  const storeMap = useMemo(() => new Map(stores.map((s) => [s.storeID, s])), [stores])

  return (
    <div className="min-h-screen bg-grid text-slate-900 dark:text-slate-100">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={refresh}
        refreshing={loading}
        lastUpdated={lastUpdated}
        currency={currency}
        onCurrencyChange={setCurrency}
        ratesLoading={ratesLoading}
        wishlistCount={wishlist.items.length}
        wishlistAlertCount={wishlist.alertCount}
        onOpenWishlist={() => setWishlistOpen(true)}
        visitorCount={visitorCount}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col gap-6">
        <Filters
          stores={stores}
          filters={filters}
          onChange={setFilters}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          currency={currency}
          rates={rates}
        />

        <DealsGrid
          groups={groups}
          storeMap={storeMap}
          loading={loading}
          error={error}
          page={page}
          totalPages={totalPages}
          truncated={truncated}
          onPageChange={goToPage}
          onOpenGame={setOpenDeal}
          currency={currency}
          rates={rates}
          isWishlisted={wishlist.isWishlisted}
          onToggleWishlist={wishlist.toggle}
        />
      </main>

      {openDeal && (
        <GameModal
          deal={openDeal}
          storeMap={storeMap}
          currency={currency}
          rates={rates}
          onClose={() => setOpenDeal(null)}
          isWishlisted={wishlist.isWishlisted}
          onToggleWishlist={wishlist.toggle}
        />
      )}

      {wishlistOpen && (
        <WishlistPanel
          items={wishlist.items}
          live={wishlist.live}
          storeMap={storeMap}
          currency={currency}
          rates={rates}
          onRemove={wishlist.remove}
          onSetTarget={wishlist.setTarget}
          onClose={() => setWishlistOpen(false)}
        />
      )}

      <footer className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-center text-xs text-slate-500 dark:text-slate-500">
        Deal data provided by{' '}
        <a
          href="https://www.cheapshark.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-fuchsia-500"
        >
          CheapShark
        </a>
        . Prices refresh automatically every 5 minutes. This site is not affiliated with any store listed.
        {currency !== 'USD' && (
          <>
            {' '}All prices are sourced in USD and converted to other currencies at today's exchange rate for
            reference only — the store may show a different, independently-set regional price after you click
            through.
          </>
        )}
        <div className="mt-1">
          Created by{' '}
          <a
            href="https://raunak-one.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-fuchsia-500"
          >
            Raunak Ghosh
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
