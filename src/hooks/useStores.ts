import { useEffect, useState } from 'react'
import { fetchStores, type Store } from '../lib/cheapshark'

// Curated set of the most recognizable storefronts, kept in a sensible order.
const FEATURED_STORE_IDS = ['1', '25', '7', '11', '15', '23', '30', '8']

export function useStores() {
  const [stores, setStores] = useState<Store[]>([])

  useEffect(() => {
    fetchStores()
      .then((all) => {
        const active = all.filter((s) => s.isActive)
        active.sort((a, b) => {
          const ai = FEATURED_STORE_IDS.indexOf(a.storeID)
          const bi = FEATURED_STORE_IDS.indexOf(b.storeID)
          if (ai === -1 && bi === -1) return a.storeName.localeCompare(b.storeName)
          if (ai === -1) return 1
          if (bi === -1) return -1
          return ai - bi
        })
        setStores(active)
      })
      .catch(() => setStores([]))
  }, [])

  return stores
}
