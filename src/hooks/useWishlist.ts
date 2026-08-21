import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchGameDetail, type Deal } from '../lib/cheapshark'
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  updateTargetPrice,
  type WishlistEntry,
} from '../lib/wishlist'

export interface WishlistLiveInfo {
  cheapest: number
  storeID: string
  allTimeLow: number
}

type LiveState = Record<string, WishlistLiveInfo | 'loading' | 'error'>

export function useWishlist() {
  const [items, setItems] = useState<WishlistEntry[]>(() => getWishlist())
  const [live, setLive] = useState<LiveState>({})

  const refreshLive = useCallback(async (targets?: WishlistEntry[]) => {
    const list = targets ?? items
    if (list.length === 0) return
    setLive((prev) => {
      const next = { ...prev }
      for (const item of list) next[item.gameID] = 'loading'
      return next
    })
    await Promise.all(
      list.map(async (item) => {
        try {
          const detail = await fetchGameDetail(item.gameID)
          const cheapest = detail.deals.reduce((min, d) => Math.min(min, parseFloat(d.price)), Infinity)
          const cheapestDeal = detail.deals.find((d) => parseFloat(d.price) === cheapest)
          setLive((prev) => ({
            ...prev,
            [item.gameID]: {
              cheapest,
              storeID: cheapestDeal?.storeID ?? '',
              allTimeLow: parseFloat(detail.cheapestPriceEver.price),
            },
          }))
        } catch {
          setLive((prev) => ({ ...prev, [item.gameID]: 'error' }))
        }
      }),
    )
  }, [items])

  useEffect(() => {
    if (items.length > 0) refreshLive(items)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isWishlisted = useCallback((gameID: string) => items.some((i) => i.gameID === gameID), [items])

  const toggle = useCallback(
    (deal: Deal) => {
      if (items.some((i) => i.gameID === deal.gameID)) {
        removeFromWishlist(deal.gameID)
        setItems(getWishlist())
        return
      }
      addToWishlist({
        gameID: deal.gameID,
        title: deal.title,
        thumb: deal.thumb,
        targetPrice: parseFloat(deal.salePrice),
      })
      const next = getWishlist()
      setItems(next)
      refreshLive(next.filter((i) => i.gameID === deal.gameID))
    },
    [items, refreshLive],
  )

  const remove = useCallback((gameID: string) => {
    removeFromWishlist(gameID)
    setItems(getWishlist())
  }, [])

  const setTarget = useCallback((gameID: string, targetPrice: number) => {
    updateTargetPrice(gameID, targetPrice)
    setItems(getWishlist())
  }, [])

  const alertCount = useMemo(
    () =>
      items.filter((item) => {
        const info = live[item.gameID]
        return typeof info === 'object' && info.cheapest <= item.targetPrice
      }).length,
    [items, live],
  )

  return { items, live, isWishlisted, toggle, remove, setTarget, refreshLive, alertCount }
}
