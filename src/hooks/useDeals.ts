import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDeals, type Deal, type DealsQuery, type SortBy } from '../lib/cheapshark'
import { recordPriceSnapshots } from '../lib/priceHistory'
import { groupDeals, type DealGroup } from '../lib/groupDeals'

const AUTO_REFRESH_MS = 5 * 60 * 1000
const PAGE_SIZE = 24
const BIG_DEAL_THRESHOLD = 80
const RATING_THRESHOLD = 75
// CheapShark silently caps pageSize at 60 server-side regardless of what's
// requested — using a higher value here would make every real (60-row)
// response look artificially "short" and falsely signal end-of-results.
const FETCH_PAGE_SIZE = 60
const BIG_DEAL_MAX_FETCH_PAGES = 8
const RATING_MAX_FETCH_PAGES = 6
const PLAIN_MAX_FETCH_PAGES = 6

export interface DealFilters {
  title: string
  storeIDs: string[]
  sortBy: NonNullable<DealsQuery['sortBy']>
  upperPrice?: number
  bigDealsOnly: boolean
  highRatedOnly: boolean
}

function isHighlyRated(deal: Deal): boolean {
  const metacritic = parseInt(deal.metacriticScore, 10)
  const steam = parseInt(deal.steamRatingPercent, 10)
  return (!Number.isNaN(metacritic) && metacritic >= RATING_THRESHOLD) || (!Number.isNaN(steam) && steam >= RATING_THRESHOLD)
}

function snapshotDeals(deals: Deal[]) {
  recordPriceSnapshots(
    deals.map((d) => ({
      gameID: d.gameID,
      title: d.title,
      price: parseFloat(d.salePrice),
      retail: parseFloat(d.normalPrice),
    })),
    Date.now(),
  )
}

interface FetchGroupedOpts {
  sortBy: SortBy
  desc: boolean
  targetGroupCount: number
  maxPages: number
  earlyExit?: (pageDeals: Deal[]) => boolean
}

// Pagination in the UI operates on grouped cards (editions/store-duplicates
// collapsed into one card), but CheapShark paginates raw per-store deal rows.
// Grouping a fixed-size raw window independently per display page produces
// uneven card counts (a window with more collapsible duplicates yields fewer
// cards). So instead we accumulate raw deals until we have enough *groups*
// to cover the requested page, then group once and slice the group list.
interface FetchGroupedResult {
  groups: DealGroup[]
  // We ran out of raw pages on our own (CheapShark returned a short page) —
  // `groups` is the exact, complete result set.
  exhausted: boolean
  // We hit the safety cap before exhausting or satisfying the target — more
  // results likely exist, but we've deliberately given up looking further.
  truncated: boolean
}

async function fetchGroupedPage(
  baseQuery: DealsQuery,
  predicate: (d: Deal) => boolean,
  opts: FetchGroupedOpts,
): Promise<FetchGroupedResult> {
  const collected: Deal[] = []

  for (let page = 0; page <= opts.maxPages; page++) {
    const { deals } = await fetchDeals({
      ...baseQuery,
      sortBy: opts.sortBy,
      desc: opts.desc,
      pageSize: FETCH_PAGE_SIZE,
      pageNumber: page,
    })
    snapshotDeals(deals)
    collected.push(...deals.filter(predicate))

    const groups = groupDeals(collected)
    const ended = deals.length < FETCH_PAGE_SIZE
    const haveEnough = groups.length >= opts.targetGroupCount
    const exit = opts.earlyExit?.(deals) ?? false

    if (ended) return { groups, exhausted: true, truncated: false }
    if (haveEnough || exit) return { groups, exhausted: false, truncated: false }
    if (page === opts.maxPages) return { groups, exhausted: false, truncated: true }
  }

  return { groups: groupDeals(collected), exhausted: false, truncated: true }
}

export function useDeals(filters: DealFilters) {
  const [page, setPage] = useState(1)
  const [groups, setGroups] = useState<DealGroup[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [truncated, setTruncated] = useState(false)
  const requestId = useRef(0)
  const pageRef = useRef(page)
  pageRef.current = page
  const bagCache = useRef<{ key: string; groups: DealGroup[]; exhausted: boolean; truncated: boolean } | null>(null)

  const baseQuery: DealsQuery = {
    title: filters.title || undefined,
    storeID: filters.storeIDs.length ? filters.storeIDs.join(',') : undefined,
    sortBy: filters.sortBy,
    upperPrice: filters.upperPrice,
    // Searching by name should surface a game even if it's not currently
    // discounted anywhere (e.g. a brand-new release at full price) — only
    // the undirected browse grid is restricted to active deals.
    onSale: filters.title ? undefined : true,
  }
  const filterKey = JSON.stringify({ ...baseQuery, bigDealsOnly: filters.bigDealsOnly, highRatedOnly: filters.highRatedOnly })
  const prevFilterKey = useRef(filterKey)

  const load = useCallback(
    async (pageNumber: number, forceFresh: boolean) => {
      const id = ++requestId.current
      setLoading(true)
      setError(null)
      try {
        const targetGroupCount = pageNumber * PAGE_SIZE
        let bag = bagCache.current
        const canGrow = bag && !bag.exhausted && !bag.truncated
        if (!bag || bag.key !== filterKey || forceFresh || (canGrow && bag.groups.length < targetGroupCount)) {
          const predicate = (d: Deal) => {
            if (filters.bigDealsOnly && parseFloat(d.savings) < BIG_DEAL_THRESHOLD) return false
            if (filters.highRatedOnly && !isHighlyRated(d)) return false
            return true
          }
          const result = filters.bigDealsOnly
            ? await fetchGroupedPage(
                { ...baseQuery, onSale: true },
                predicate,
                {
                  // CheapShark's `desc` flag is inverted from its docs: desc=0/omitted
                  // returns highest-savings-first, desc=1 returns lowest-first.
                  sortBy: 'Savings',
                  desc: false,
                  targetGroupCount,
                  maxPages: BIG_DEAL_MAX_FETCH_PAGES,
                  earlyExit: (pageDeals) => {
                    const lowest = pageDeals.length ? parseFloat(pageDeals[pageDeals.length - 1].savings) : 0
                    return lowest < BIG_DEAL_THRESHOLD
                  },
                },
              )
            : filters.highRatedOnly
              ? await fetchGroupedPage({ ...baseQuery, onSale: true }, predicate, {
                  sortBy: filters.sortBy,
                  desc: false,
                  targetGroupCount,
                  maxPages: RATING_MAX_FETCH_PAGES,
                })
              : await fetchGroupedPage(baseQuery, predicate, {
                  sortBy: filters.sortBy,
                  desc: false,
                  targetGroupCount,
                  maxPages: PLAIN_MAX_FETCH_PAGES,
                })
          if (id !== requestId.current) return
          bag = { key: filterKey, groups: result.groups, exhausted: result.exhausted, truncated: result.truncated }
          bagCache.current = bag
        }
        const start = (pageNumber - 1) * PAGE_SIZE
        setGroups(bag.groups.slice(start, start + PAGE_SIZE))
        const knownPages = Math.ceil(bag.groups.length / PAGE_SIZE)
        // If we stopped early just because we had enough for the current
        // page (not because we hit the true end or the safety cap), keep at
        // least one more page reachable so "Next" stays clickable and can
        // trigger fetching further instead of getting stuck at a
        // prematurely-final page count.
        const totalPagesEstimate = bag.exhausted || bag.truncated ? knownPages : Math.max(knownPages, pageNumber + 1)
        setTotalPages(Math.max(1, totalPagesEstimate))
        setTruncated(bag.truncated)
        setLastUpdated(new Date())
      } catch (err) {
        if (id !== requestId.current) return
        setError(err instanceof Error ? err.message : 'Failed to load deals')
      } finally {
        if (id !== requestId.current) return
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterKey],
  )

  useEffect(() => {
    const filtersChanged = prevFilterKey.current !== filterKey
    prevFilterKey.current = filterKey
    if (filtersChanged) {
      bagCache.current = null
      if (page !== 1) {
        setPage(1)
        return
      }
    }
    load(page, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, page])

  useEffect(() => {
    const interval = setInterval(() => {
      bagCache.current = null
      load(pageRef.current, true)
    }, AUTO_REFRESH_MS)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  const refresh = useCallback(() => {
    bagCache.current = null
    load(pageRef.current, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load])

  const goToPage = useCallback(
    (next: number) => {
      setPage(Math.max(1, Math.min(next, totalPages)))
    },
    [totalPages],
  )

  return { groups, loading, error, lastUpdated, page, totalPages, truncated, goToPage, refresh }
}
